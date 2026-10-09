"""Donations to the Smivai charity fund — Razorpay **test mode** only.

Money is counted (a ledger entry) only after the server itself has checked
the payment: the Checkout signature (HMAC-SHA256 of ``order_id|payment_id``
with the key secret) *and* Razorpay saying the payment is captured, or a
signed ``payment.captured`` webhook. A success message from a browser is
never proof of payment.

Modes, from the environment (read on every request):
  razorpay_test  RAZORPAY_KEY_ID starts with ``rzp_test_`` and RAZORPAY_KEY_SECRET is set
  live_blocked   a live key is configured — refused until the legal and
                 operational approvals exist (see docs/CHARITY.md)
  demo           no keys: the flow can be shown, but nothing can be paid or recorded

Razorpay references (checked October 2026):
  https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
  https://razorpay.com/docs/webhooks/validate-test/
  https://razorpay.com/docs/webhooks/payloads/payments/  ·  /payloads/refunds/
"""
from __future__ import annotations

import datetime as dt
import hashlib
import hmac
import json
import os
import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import models
from .charity import FUND_LOCK, add_ledger, fund_balance
from .database import get_db
from .deps import Actor, require_roles

router = APIRouter(tags=["donations"])

RAZORPAY_API = "https://api.razorpay.com/v1"
MIN_RUPEES, MAX_RUPEES = 10, 100_000
PRESETS = [100, 500, 1000, 2500]


def _cfg() -> dict:
    key = os.environ.get("RAZORPAY_KEY_ID", "").strip()
    secret = os.environ.get("RAZORPAY_KEY_SECRET", "").strip()
    hook = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "").strip()
    if key.startswith("rzp_live_"):
        mode = "live_blocked"
    elif key.startswith("rzp_test_") and secret:
        mode = "razorpay_test"
    else:
        mode = "demo"
    return {"mode": mode, "key_id": key, "secret": secret, "webhook_secret": hook}


def _now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def _razorpay(method: str, path: str, cfg: dict, body: dict | None = None) -> dict:
    """One call to the Razorpay REST API (server side, Basic auth). Tests replace this."""
    try:
        r = httpx.request(method, RAZORPAY_API + path, json=body, auth=(cfg["key_id"], cfg["secret"]), timeout=20)
    except httpx.HTTPError:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "We could not reach the payment service. Nothing was charged.")
    if r.status_code >= 400:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "The payment service refused the request. Nothing was charged.")
    return r.json()


def _hmac_hex(secret: str, message: bytes) -> str:
    return hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()


def _view(d: models.Donation) -> dict:
    return {"donation_id": d.donation_id, "amount_rupees": d.amount_paise / 100, "currency": d.currency,
            "provider": d.provider, "status": d.status, "receipt": d.receipt,
            "test_mode": d.provider == "razorpay_test", "created_at": d.created_at, "updated_at": d.updated_at}


def _mark_paid(db: Session, d: models.Donation, payment_id: str) -> bool:
    """Record the verified money once. Returns True if this call recorded it."""
    with FUND_LOCK:
        db.refresh(d)
        if d.status == "paid" or d.status == "refunded":
            return False
        d.status, d.provider_payment_id = "paid", payment_id
        try:
            add_ledger(db, kind="donation", direction="in", amount_paise=d.amount_paise, key=f"donation:{d.donation_id}",
                       actor_role="system", actor_id="razorpay", donation_id=d.donation_id, reference=payment_id,
                       note="Donation (Razorpay test mode — not real money)" if d.provider == "razorpay_test" else "Donation",
                       demo=d.provider == "razorpay_test")
            db.commit()
        except IntegrityError:          # recorded by a concurrent request
            db.rollback()
            return False
        return True


# ------------------------------------------------------------------ donor endpoints
@router.get("/donations/config")
def donation_config(_: Actor = Depends(require_roles("donor"))):
    cfg = _cfg()
    notes = {
        "razorpay_test": "Razorpay test mode: use Razorpay's test cards or UPI test IDs. No real money moves.",
        "live_blocked": "Live payments are switched off until Smivai's legal and merchant approvals are in place.",
        "demo": "Demo mode: no payment service is connected, so no donation can be made or recorded.",
    }
    return {"mode": cfg["mode"], "key_id": cfg["key_id"] if cfg["mode"] == "razorpay_test" else None,
            "presets": PRESETS, "min_rupees": MIN_RUPEES, "max_rupees": MAX_RUPEES, "note": notes[cfg["mode"]]}


class DonationIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    amount_rupees: int = Field(ge=MIN_RUPEES, le=MAX_RUPEES)


@router.post("/donations", status_code=201)
def create_donation(body: DonationIn, actor: Actor = Depends(require_roles("donor")), db: Session = Depends(get_db)):
    cfg = _cfg()
    if cfg["mode"] != "razorpay_test":
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE,
                            "Live payments are switched off." if cfg["mode"] == "live_blocked"
                            else "Demo mode: no payment service is connected, so nothing can be paid.")
    donation_id = "don_" + uuid.uuid4().hex[:12]
    receipt = "smv_" + uuid.uuid4().hex[:20]                       # ≤ 40 characters, as Razorpay requires
    amount = body.amount_rupees * 100
    order = _razorpay("POST", "/orders", cfg, {"amount": amount, "currency": "INR", "receipt": receipt,
                                               "notes": {"donation_id": donation_id}})
    if order.get("amount") != amount or not order.get("id"):
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "The payment service returned an unexpected order. Nothing was charged.")
    d = models.Donation(donation_id=donation_id, donor_id=actor.actor_id, amount_paise=amount, currency="INR",
                        provider="razorpay_test", provider_order_id=order["id"], status="created", receipt=receipt)
    db.add(d)
    db.commit()
    out = _view(d)
    out.update({"order_id": order["id"], "key_id": cfg["key_id"], "amount_paise": amount, "name": "Smivai Care Fund"})
    return out


def _own(db: Session, actor: Actor, donation_id: str) -> models.Donation:
    d = db.get(models.Donation, donation_id)
    if d is None or d.donor_id != actor.actor_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Donation not found")
    return d


class VerifyIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    razorpay_order_id: str = Field(max_length=64)
    razorpay_payment_id: str = Field(max_length=64)
    razorpay_signature: str = Field(max_length=128)


@router.post("/donations/{donation_id}/verify")
def verify_donation(donation_id: str, body: VerifyIn, actor: Actor = Depends(require_roles("donor")),
                    db: Session = Depends(get_db)):
    """Check what Checkout handed the browser. The order id is ours, from the
    database — never the one the browser sends."""
    cfg = _cfg()
    d = _own(db, actor, donation_id)
    if d.status == "paid":
        return _view(d)
    if cfg["mode"] != "razorpay_test" or d.provider != "razorpay_test":
        raise HTTPException(status.HTTP_409_CONFLICT, "This donation cannot be verified")
    expected = _hmac_hex(cfg["secret"], f"{d.provider_order_id}|{body.razorpay_payment_id}".encode())
    if body.razorpay_order_id != d.provider_order_id or not hmac.compare_digest(expected, body.razorpay_signature):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The payment could not be verified. No donation was recorded.")
    # Signature is genuine. Ask Razorpay, server to server, whether the money was captured.
    pay = _razorpay("GET", f"/payments/{body.razorpay_payment_id}", cfg)
    if pay.get("order_id") != d.provider_order_id or pay.get("amount") != d.amount_paise:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The payment does not match this donation. No donation was recorded.")
    if pay.get("status") == "captured":
        _mark_paid(db, d, body.razorpay_payment_id)
    elif pay.get("status") == "failed":
        d.status = "failed"
        db.commit()
    else:                                   # authorised, not yet captured: the webhook finishes it
        d.status, d.provider_payment_id = "pending", body.razorpay_payment_id
        db.commit()
    db.refresh(d)
    return _view(d)


@router.post("/donations/{donation_id}/cancel")
def cancel_donation(donation_id: str, actor: Actor = Depends(require_roles("donor")), db: Session = Depends(get_db)):
    d = _own(db, actor, donation_id)
    if d.status == "created":
        d.status = "cancelled"
        db.commit()
    return _view(d)


@router.get("/donations")
def my_donations(actor: Actor = Depends(require_roles("donor")), db: Session = Depends(get_db)):
    rows = db.query(models.Donation).filter(models.Donation.donor_id == actor.actor_id) \
        .order_by(models.Donation.created_at.desc()).all()
    return [_view(d) for d in rows]


# ------------------------------------------------------------------ webhook
@router.post("/payments/razorpay/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    cfg = _cfg()
    if not cfg["webhook_secret"]:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Webhooks are not configured")
    raw = await request.body()                                     # the raw body, never re-serialised
    sig = request.headers.get("x-razorpay-signature", "")
    if not hmac.compare_digest(_hmac_hex(cfg["webhook_secret"], raw), sig):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid signature")
    event_id = request.headers.get("x-razorpay-event-id", "")
    if not event_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Missing event id")
    if db.get(models.PaymentEvent, event_id) is not None:
        return {"ok": True, "duplicate": True}
    try:
        payload = json.loads(raw)
    except ValueError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid body")
    event = payload.get("event", "")
    entity = ((payload.get("payload") or {}).get("payment") or {}).get("entity") or {}
    donation = None
    if event.startswith("payment.") and entity.get("order_id"):
        donation = db.query(models.Donation).filter(models.Donation.provider_order_id == entity["order_id"]).first()
    refund = ((payload.get("payload") or {}).get("refund") or {}).get("entity") or {}
    if event == "refund.processed" and refund.get("payment_id"):
        donation = db.query(models.Donation).filter(models.Donation.provider_payment_id == refund["payment_id"]).first()

    try:
        db.add(models.PaymentEvent(event_id=event_id, event_type=event, donation_id=donation.donation_id if donation else None))
        db.commit()
    except IntegrityError:                                          # the same event, arriving concurrently
        db.rollback()
        return {"ok": True, "duplicate": True}

    if donation is None:
        return {"ok": True, "ignored": True}
    if event == "payment.captured":
        if entity.get("amount") == donation.amount_paise:
            _mark_paid(db, donation, entity.get("id"))
    elif event == "payment.failed":
        if donation.status in ("created", "pending"):
            donation.status = "failed"
            db.commit()
    elif event == "refund.processed":
        amount = int(refund.get("amount") or 0)
        if donation.status == "paid" and amount > 0:
            with FUND_LOCK:
                add_ledger(db, kind="refund", direction="out", amount_paise=amount, key=f"refund:{refund.get('id')}",
                           actor_role="system", actor_id="razorpay", donation_id=donation.donation_id,
                           reference=refund.get("id"), note="Donation refunded", demo=donation.provider == "razorpay_test")
                if amount >= donation.amount_paise:
                    donation.status = "refunded"
                db.commit()
    return {"ok": True}


@router.get("/donations/impact")
def impact(_: Actor = Depends(require_roles("donor")), db: Session = Depends(get_db)):
    """Totals only — donors never see who was helped."""
    bal = fund_balance(db)
    return {k.replace("_paise", "_rupees"): v / 100 for k, v in bal.items()}
