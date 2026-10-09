"""Batch 6: donations in Razorpay test mode. Razorpay itself is never called —
`donations._razorpay` is replaced by a fake that behaves like the documented API."""
import hashlib
import hmac
import json
import uuid

import pytest

from app import charity, donations, models

KEY, SECRET, HOOK = "rzp_test_FAKEKEY123", "test_key_secret", "test_webhook_secret"


class FakeRazorpay:
    def __init__(self):
        self.orders, self.payments = {}, {}

    def __call__(self, method, path, cfg, body=None):
        assert cfg["key_id"] == KEY and cfg["secret"] == SECRET          # server side, Basic-auth credentials
        if method == "POST" and path == "/orders":
            oid = "order_" + uuid.uuid4().hex[:14]
            self.orders[oid] = dict(body, id=oid, status="created")
            return self.orders[oid]
        if method == "GET" and path.startswith("/payments/"):
            return self.payments[path.split("/")[-1]]
        raise AssertionError(path)

    def pay(self, order_id, status="captured", amount=None):
        pid = "pay_" + uuid.uuid4().hex[:14]
        self.payments[pid] = {"id": pid, "order_id": order_id, "status": status,
                              "amount": self.orders[order_id]["amount"] if amount is None else amount}
        sig = hmac.new(SECRET.encode(), f"{order_id}|{pid}".encode(), hashlib.sha256).hexdigest()
        return {"razorpay_order_id": order_id, "razorpay_payment_id": pid, "razorpay_signature": sig}


@pytest.fixture
def rzp(monkeypatch):
    monkeypatch.setenv("RAZORPAY_KEY_ID", KEY)
    monkeypatch.setenv("RAZORPAY_KEY_SECRET", SECRET)
    monkeypatch.setenv("RAZORPAY_WEBHOOK_SECRET", HOOK)
    fake = FakeRazorpay()
    monkeypatch.setattr(donations, "_razorpay", fake)
    return fake


def _ledger(db, donation_id):
    db.expire_all()
    return db.query(models.LedgerEntry).filter(models.LedgerEntry.donation_id == donation_id).all()


def _start(client, donor, rupees=500):
    r = client.post("/donations", headers=donor.h, json={"amount_rupees": rupees})
    assert r.status_code == 201, r.text
    return r.json()


def _hook(client, body: dict, event_id=None, secret=HOOK, sig=None):
    raw = json.dumps(body).encode()
    return client.post("/payments/razorpay/webhook", content=raw, headers={
        "Content-Type": "application/json", "x-razorpay-event-id": event_id or ("evt_" + uuid.uuid4().hex[:10]),
        "x-razorpay-signature": hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest() if sig is None else sig})


def _captured(order_id, pid, amount):
    return {"event": "payment.captured", "payload": {"payment": {"entity": {
        "id": pid, "order_id": order_id, "amount": amount, "status": "captured"}}}}


# ------------------------------------------------------------------ modes
def test_without_keys_it_is_demo_and_nothing_can_be_paid(client, signup, monkeypatch):
    for k in ("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"):
        monkeypatch.delenv(k, raising=False)
    donor = signup("donor", "Demo Donor")
    cfg = client.get("/donations/config", headers=donor.h).json()
    assert cfg["mode"] == "demo" and cfg["key_id"] is None and "Demo mode" in cfg["note"]
    assert client.post("/donations", headers=donor.h, json={"amount_rupees": 500}).status_code == 503
    assert client.get("/donations", headers=donor.h).json() == []


def test_live_keys_are_refused(client, signup, monkeypatch):
    monkeypatch.setenv("RAZORPAY_KEY_ID", "rzp_live_REALKEY")
    monkeypatch.setenv("RAZORPAY_KEY_SECRET", "x")
    donor = signup("donor", "Live Donor")
    assert client.get("/donations/config", headers=donor.h).json()["mode"] == "live_blocked"
    assert client.post("/donations", headers=donor.h, json={"amount_rupees": 500}).status_code == 503


def test_key_secret_is_never_sent_to_the_browser(client, signup, rzp):
    donor = signup("donor", "Careful Donor")
    cfg = client.get("/donations/config", headers=donor.h)
    order = client.post("/donations", headers=donor.h, json={"amount_rupees": 500})
    for r in (cfg, order):
        assert SECRET not in r.text and HOOK not in r.text
    assert cfg.json()["key_id"] == KEY


# ------------------------------------------------------------------ permissions
def test_only_donors_donate_and_each_sees_only_their_own(client, signup, rzp):
    a, b = signup("donor", "Donor A"), signup("donor", "Donor B")
    patient = signup(name="Not A Donor")
    assert client.post("/donations", headers=patient.h, json={"amount_rupees": 500}).status_code == 403
    d = _start(client, a)
    assert [x["donation_id"] for x in client.get("/donations", headers=b.h).json()] == []
    assert client.post(f"/donations/{d['donation_id']}/verify", headers=b.h,
                       json=rzp.pay(d["order_id"])).status_code == 404


@pytest.mark.parametrize("amount", [0, 9, 100_001])
def test_amount_limits(client, signup, rzp, amount):
    donor = signup("donor", "Limit Donor")
    assert client.post("/donations", headers=donor.h, json={"amount_rupees": amount}).status_code == 422


# ------------------------------------------------------------------ verification
def test_valid_payment_is_recorded_once(client, signup, rzp, db):
    donor = signup("donor", "Good Donor")
    before = charity.fund_balance(db)["donations_paise"]
    d = _start(client, donor, 750)
    proof = rzp.pay(d["order_id"])
    r = client.post(f"/donations/{d['donation_id']}/verify", headers=donor.h, json=proof)
    assert r.status_code == 200 and r.json()["status"] == "paid" and r.json()["test_mode"] is True
    assert client.post(f"/donations/{d['donation_id']}/verify", headers=donor.h, json=proof).json()["status"] == "paid"
    # the webhook for the same payment adds nothing more
    assert _hook(client, _captured(d["order_id"], proof["razorpay_payment_id"], 75000)).status_code == 200
    rows = _ledger(db, d["donation_id"])
    assert len(rows) == 1 and rows[0].amount_paise == 75000 and rows[0].direction == "in" and rows[0].demo is True
    assert charity.fund_balance(db)["donations_paise"] - before == 75000


def test_forged_signature_records_nothing(client, signup, rzp, db):
    donor = signup("donor", "Forger")
    d = _start(client, donor)
    proof = rzp.pay(d["order_id"])
    for bad in (dict(proof, razorpay_signature="0" * 64),
                dict(proof, razorpay_signature=hmac.new(b"wrong", proof["razorpay_signature"].encode(), hashlib.sha256).hexdigest()),
                dict(proof, razorpay_order_id="order_someoneelse")):
        r = client.post(f"/donations/{d['donation_id']}/verify", headers=donor.h, json=bad)
        assert r.status_code == 400
    assert _ledger(db, d["donation_id"]) == []
    assert client.get("/donations", headers=donor.h).json()[0]["status"] == "created"


def test_amount_mismatch_or_uncaptured_payment_is_not_counted(client, signup, rzp, db):
    donor = signup("donor", "Partial Donor")
    d = _start(client, donor, 1000)
    r = client.post(f"/donations/{d['donation_id']}/verify", headers=donor.h, json=rzp.pay(d["order_id"], amount=100))
    assert r.status_code == 400
    r = client.post(f"/donations/{d['donation_id']}/verify", headers=donor.h, json=rzp.pay(d["order_id"], status="authorized"))
    assert r.json()["status"] == "pending"
    assert _ledger(db, d["donation_id"]) == []


def test_failed_and_cancelled_payments(client, signup, rzp, db):
    donor = signup("donor", "Unlucky Donor")
    d = _start(client, donor)
    r = client.post(f"/donations/{d['donation_id']}/verify", headers=donor.h, json=rzp.pay(d["order_id"], status="failed"))
    assert r.json()["status"] == "failed"
    d2 = _start(client, donor)
    assert client.post(f"/donations/{d2['donation_id']}/cancel", headers=donor.h).json()["status"] == "cancelled"
    assert _ledger(db, d["donation_id"]) == [] and _ledger(db, d2["donation_id"]) == []


# ------------------------------------------------------------------ webhooks
def test_webhook_signature_is_required(client, signup, rzp, db):
    donor = signup("donor", "Hook Donor")
    d = _start(client, donor)
    body = _captured(d["order_id"], "pay_x", 50000)
    assert _hook(client, body, secret="not-the-secret").status_code == 400
    assert _hook(client, body, sig="").status_code == 400
    assert _ledger(db, d["donation_id"]) == []


def test_duplicate_webhooks_count_once(client, signup, rzp, db):
    donor = signup("donor", "Dup Donor")
    d = _start(client, donor)
    body = _captured(d["order_id"], "pay_dup1", 50000)
    assert _hook(client, body, event_id="evt_same").json().get("duplicate") is None
    assert _hook(client, body, event_id="evt_same").json()["duplicate"] is True
    assert _hook(client, body, event_id="evt_other").status_code == 200          # a retry with a new id
    assert len(_ledger(db, d["donation_id"])) == 1


def test_webhook_failure_and_refund(client, signup, rzp, db):
    donor = signup("donor", "Refund Donor")
    d = _start(client, donor)
    _hook(client, {"event": "payment.failed", "payload": {"payment": {"entity": {"id": "pay_f", "order_id": d["order_id"], "amount": 50000}}}})
    assert client.get("/donations", headers=donor.h).json()[0]["status"] == "failed"

    d = _start(client, donor)
    _hook(client, _captured(d["order_id"], "pay_r1", 50000))
    refund = {"event": "refund.processed", "payload": {"refund": {"entity": {"id": "rfnd_1", "payment_id": "pay_r1", "amount": 50000}}}}
    _hook(client, refund)
    _hook(client, refund)                                   # new event id, same refund: still once
    rows = sorted(_ledger(db, d["donation_id"]), key=lambda e: e.kind)
    assert [(e.kind, e.direction, e.amount_paise) for e in rows] == [("donation", "in", 50000), ("refund", "out", 50000)]
    assert [x for x in client.get("/donations", headers=donor.h).json() if x["donation_id"] == d["donation_id"]][0]["status"] == "refunded"


def test_webhooks_off_without_secret(client, monkeypatch):
    monkeypatch.delenv("RAZORPAY_WEBHOOK_SECRET", raising=False)
    assert client.post("/payments/razorpay/webhook", content=b"{}").status_code == 503


def test_impact_is_totals_only(client, signup, rzp):
    donor = signup("donor", "Impact Donor")
    assert set(client.get("/donations/impact", headers=donor.h).json()) == {"available_rupees", "donations_rupees", "consultations_rupees"}
