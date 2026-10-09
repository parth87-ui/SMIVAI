"""Batch 5: charity applications, dual approval, covered visits and the ledger."""
import pytest

from app import charity, models
from conftest import push, rec

PDF = b"%PDF-1.4\n% test income certificate\n"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32


def _apply(client, user, patient_id, income=120000, **extra):
    body = {"patient_id": patient_id, "annual_income_rupees": income, "household_size": 4,
            "circumstances": "Pension only", "assistance_requested": "Doctor visits",
            "declaration": True, "consent": True, **extra}
    r = client.post("/charity/applications", headers=user.h, json=body)
    assert r.status_code == 201, r.text
    return r.json()["application_id"]


def _upload(client, user, app_id, data=PDF, name="cert.pdf", doc_type="income_certificate"):
    return client.post(f"/charity/applications/{app_id}/documents", headers=user.h,
                       data={"doc_type": doc_type}, files={"file": (name, data, "application/pdf")})


def _submitted(client, signup, income=120000):
    alice = signup(name="Aruna Devi")
    app_id = _apply(client, alice, alice.id, income)
    assert _upload(client, alice, app_id).status_code == 201
    return alice, app_id


def _review(client, who, app_id, action, note=None):
    return client.post(f"/charity/applications/{app_id}/review", headers=who.h, json={"action": action, "note": note})


# ------------------------------------------------------------------ eligibility
def test_policy_is_explained_and_configured_on_the_server(client, signup):
    alice = signup()
    p = client.get("/charity/policy", headers=alice.h).json()
    assert p["income_limit_rupees"] == 150000 and p["demo"] is True
    assert "income_certificate" in p["documents"] and "Aadhaar" in p["documents_note"]


def test_income_below_the_limit_can_be_submitted_for_review(client, signup):
    alice, app_id = _submitted(client, signup, income=149999)
    r = client.post(f"/charity/applications/{app_id}/submit", headers=alice.h)
    assert r.status_code == 200 and r.json()["status"] == "submitted"
    assert r.json()["admin_decision"] is None and r.json()["partner_decision"] is None   # not an approval


@pytest.mark.parametrize("income", [150000, 150001, 400000])
def test_income_at_or_above_the_limit_cannot_be_submitted(client, signup, income):
    alice, app_id = _submitted(client, signup, income=income)
    r = client.post(f"/charity/applications/{app_id}/submit", headers=alice.h)
    assert r.status_code == 422 and "below ₹1,50,000" in r.json()["detail"]


def test_submission_needs_declaration_consent_and_a_document(client, signup):
    alice = signup()
    app_id = _apply(client, alice, alice.id, declaration=False, consent=False)
    detail = client.post(f"/charity/applications/{app_id}/submit", headers=alice.h).json()["detail"]
    assert "true" in detail and "agree" in detail and "document" in detail


def test_profile_name_is_reused_and_only_one_open_application(client, signup):
    alice = signup(name="Aruna Devi")
    app_id = _apply(client, alice, alice.id)
    assert client.get(f"/charity/applications/{app_id}", headers=alice.h).json()["applicant_name"] == "Aruna Devi"
    r = client.post("/charity/applications", headers=alice.h, json={"patient_id": alice.id})
    assert r.status_code == 409


# ------------------------------------------------------------------ documents
def test_documents_are_checked_by_content_and_size(client, signup):
    alice = signup()
    app_id = _apply(client, alice, alice.id)
    assert _upload(client, alice, app_id, data=b"MZ\x90\x00 not a pdf", name="cert.pdf").status_code == 415
    assert _upload(client, alice, app_id, data=b"%PDF" + b"x" * (5 * 1024 * 1024), name="big.pdf").status_code == 413
    assert _upload(client, alice, app_id, doc_type="aadhaar_card").status_code == 422
    ok = _upload(client, alice, app_id, data=PNG, name="../../evil.png")
    assert ok.status_code == 201 and ok.json()["review_status"] == "not_reviewed"
    doc = ok.json()["document_id"]
    # stored under a server-made name inside the private folder, not the uploader's path
    stored = list((charity.UPLOAD_DIR / app_id).iterdir())
    assert [p.name for p in stored] == [f"{doc}.png"]


def test_documents_are_only_for_the_applicant_and_reviewers(client, signup, staff):
    alice, app_id = _submitted(client, signup)
    doc = client.get(f"/charity/applications/{app_id}", headers=alice.h).json()["documents"][0]["document_id"]
    bob = signup()
    donor = signup("donor", "A Donor")
    admin = staff("admin")
    assert client.get(f"/charity/documents/{doc}", headers=alice.h).status_code == 200
    assert client.get(f"/charity/documents/{doc}", headers=bob.h).status_code == 404
    assert client.get(f"/charity/documents/{doc}", headers=donor.h).status_code == 404
    # a draft is private even from reviewers
    assert client.get(f"/charity/documents/{doc}", headers=admin.h).status_code == 404
    client.post(f"/charity/applications/{app_id}/submit", headers=alice.h)
    r = client.get(f"/charity/documents/{doc}", headers=admin.h)
    assert r.status_code == 200 and r.content == PDF and r.headers["cache-control"] == "no-store"


def test_applicants_cannot_see_each_other(client, signup):
    alice, app_id = _submitted(client, signup)
    bob = signup()
    assert client.get(f"/charity/applications/{app_id}", headers=bob.h).status_code == 404
    assert client.get("/charity/applications", headers=bob.h).json() == []
    assert client.post(f"/charity/applications/{app_id}/submit", headers=bob.h).status_code == 404
    assert client.post("/charity/applications", headers=bob.h, json={"patient_id": alice.id}).status_code == 404


def test_a_linked_caregiver_with_health_sharing_can_apply(client, signup, link):
    alice = signup()
    carer = signup("caregiver", "Carer Apply")
    link(carer, alice)
    app_id = _apply(client, carer, alice.id)
    assert client.get(f"/charity/applications/{app_id}", headers=alice.h).status_code == 200
    lid = next(l for l in client.get("/links", headers=carer.h).json())["link_id"]
    client.patch(f"/links/{lid}/scopes", headers=alice.h, json={"memories": True, "health": False, "activity": True})
    assert client.get(f"/charity/applications/{app_id}", headers=carer.h).status_code == 404


# ------------------------------------------------------------------ dual approval
def _under_review(client, signup, staff):
    alice, app_id = _submitted(client, signup)
    client.post(f"/charity/applications/{app_id}/submit", headers=alice.h)
    admin, partner = staff("admin", "Admin One"), staff("charity_partner", "Partner One")
    assert _review(client, admin, app_id, "start_review").json()["status"] == "under_review"
    return alice, app_id, admin, partner


def test_admin_approval_alone_is_not_enough(client, signup, staff):
    alice, app_id, admin, partner = _under_review(client, signup, staff)
    r = _review(client, admin, app_id, "approve").json()
    assert r["status"] == "under_review" and r["admin_decision"] == "approved" and r["admin_id"] == admin.id
    assert client.post(f"/charity/applications/{app_id}/activate", headers=admin.h).status_code == 409


def test_partner_approval_alone_is_not_enough(client, signup, staff):
    alice, app_id, admin, partner = _under_review(client, signup, staff)
    r = _review(client, partner, app_id, "approve").json()
    assert r["status"] == "under_review" and r["partner_decision"] == "approved" and r["partner_id"] == partner.id
    assert client.post(f"/charity/applications/{app_id}/activate", headers=admin.h).status_code == 409


def test_both_approvals_are_recorded_then_activation(client, signup, staff):
    alice, app_id, admin, partner = _under_review(client, signup, staff)
    _review(client, admin, app_id, "approve")
    r = _review(client, partner, app_id, "approve").json()
    assert r["status"] == "approved" and r["admin_at"] and r["partner_at"]
    assert client.post(f"/charity/applications/{app_id}/activate", headers=partner.h).status_code == 403
    act = client.post(f"/charity/applications/{app_id}/activate", headers=admin.h).json()
    assert act["status"] == "active" and act["visits_remaining"] == 5
    actions = [e["action"] for e in act["events"]]
    assert actions[-4:] == ["start_review", "approve", "approve", "activated"]
    titles = [n["title"] for n in client.get("/notifications", headers=alice.h).json()]
    assert "Charity assistance is active" in titles


def test_reject_and_request_info_need_a_reason_and_reset_decisions(client, signup, staff):
    alice, app_id, admin, partner = _under_review(client, signup, staff)
    _review(client, admin, app_id, "approve")
    assert _review(client, partner, app_id, "request_info").status_code == 422
    r = _review(client, partner, app_id, "request_info", "Please add a BPL card").json()
    assert r["status"] == "info_requested" and r["admin_decision"] is None
    assert _upload(client, alice, app_id, doc_type="bpl_card").status_code == 201
    assert client.post(f"/charity/applications/{app_id}/submit", headers=alice.h).json()["status"] == "submitted"
    _review(client, admin, app_id, "start_review")
    assert _review(client, admin, app_id, "reject").status_code == 422
    rj = _review(client, admin, app_id, "reject", "Documents do not show the income").json()
    assert rj["status"] == "rejected" and rj["rejection_reason"]


def test_only_reviewers_can_review(client, signup, staff):
    alice, app_id, admin, partner = _under_review(client, signup, staff)
    doctor = signup("doctor", "Dr Nope")
    donor = signup("donor", "Donor Nope")
    for who in (alice, doctor, donor):
        assert _review(client, who, app_id, "approve").status_code == 403


def test_staff_cannot_sign_themselves_up(client):
    from conftest import valid_mobile
    r = client.post("/auth/start", json={"role": "admin", "id_type": "mobile", "id_number": valid_mobile()})
    assert r.status_code == 403
    r = client.post("/auth/start", json={"role": "patient", "id_type": "mobile", "id_number": valid_mobile()})
    assert r.status_code == 400, "a patient signs in with Aadhaar/ABHA, not a mobile number"


# ------------------------------------------------------------------ first five visits
def _active(client, signup, staff, link):
    alice, app_id, admin, partner = _under_review(client, signup, staff)
    _review(client, admin, app_id, "approve")
    _review(client, partner, app_id, "approve")
    client.post(f"/charity/applications/{app_id}/activate", headers=admin.h)
    doc = signup("doctor", "Dr Participating")
    link(doc, alice)
    return alice, app_id, admin, doc


def _visit(client, alice, doc, pk, fee=400, status="completed", time="10:00"):
    push(client, alice, rec("appointments", pk, patient_id=alice.id, doctor_id=doc.id, doctor_name="Dr P",
                            date="2026-10-20", time=time, mode="clinic", status="scheduled", fee=fee))
    if status in ("confirmed", "completed"):
        push(client, doc, rec("appointments", pk, op="update", status="confirmed"))
    if status == "completed":
        push(client, doc, rec("appointments", pk, op="update", status="completed"))
    if status == "cancelled":
        push(client, alice, rec("appointments", pk, op="update", status="cancelled"))


def _fund(client, admin, rupees, ref):
    return client.post("/charity/ledger/adjustments", headers=admin.h,
                       json={"direction": "in", "amount_rupees": rupees, "reason": "Opening test balance", "reference": ref})


def _claim(client, who, app_id, appt):
    return client.post(f"/charity/applications/{app_id}/claims", headers=who.h, json={"appointment_id": appt})


def test_only_participating_doctors_completed_visits_with_funds_are_covered(client, signup, staff, link):
    alice, app_id, admin, doc = _active(client, signup, staff, link)
    _visit(client, alice, doc, "v_np", fee=9_000_000)   # far more than the (shared) test fund holds
    assert _claim(client, admin, app_id, "v_np").status_code == 409            # doctor not participating yet
    client.post("/charity/providers", headers=admin.h, json={"doctor_id": doc.id, "terms": "Settled monthly by bank transfer"})
    _visit(client, alice, doc, "v_cancel", status="cancelled", time="11:00")
    assert _claim(client, admin, app_id, "v_cancel").status_code == 409        # cancelled is never counted
    _visit(client, alice, doc, "v_conf", status="confirmed", time="12:00")
    assert _claim(client, admin, app_id, "v_conf").status_code == 409          # not completed
    # not enough money: recorded honestly as awaiting funds, not covered
    r = _claim(client, admin, app_id, "v_np").json()
    assert r["status"] == "awaiting_funds" and r["covered_rupees"] == 0 and r["visits_used"] == 0


def test_five_visits_are_counted_once_each_with_the_real_fee(client, signup, staff, link, db):
    alice, app_id, admin, doc = _active(client, signup, staff, link)
    client.post("/charity/providers", headers=admin.h, json={"doctor_id": doc.id, "terms": "Settled monthly by bank transfer"})
    assert _fund(client, admin, 10000, "REF-OPEN-1").status_code == 201
    start = client.get("/charity/fund", headers=admin.h).json()
    for i in range(6):
        _visit(client, alice, doc, f"v{i}", fee=400 + i * 50, time=f"1{i}:00")
    first = _claim(client, doc, app_id, "v0").json()
    assert (first["status"], first["fee_rupees"], first["covered_rupees"]) == ("covered", 400, 400)
    assert _claim(client, doc, app_id, "v0").status_code == 409                 # the same visit twice: refused
    for i in range(1, 5):
        assert _claim(client, admin, app_id, f"v{i}").json()["status"] == "covered"
    assert _claim(client, admin, app_id, "v5").status_code == 409               # a sixth visit is not covered
    app = client.get(f"/charity/applications/{app_id}", headers=alice.h).json()
    assert app["status"] == "completed" and app["visits_used"] == 5 and app["visits_remaining"] == 0
    spent = 400 + 450 + 500 + 550 + 600
    fund = client.get("/charity/fund", headers=admin.h).json()
    assert fund["consultations_rupees"] - start["consultations_rupees"] == spent
    assert fund["available_rupees"] == start["available_rupees"] - spent
    assert db.query(models.LedgerEntry).filter(models.LedgerEntry.application_id == app_id,
                                               models.LedgerEntry.kind == "consultation_payment").count() == 5


def test_the_visit_counter_cannot_be_changed_from_a_device(client, signup, staff, link):
    alice, app_id, admin, doc = _active(client, signup, staff, link)
    # charity tables are not reachable through sync, and applicants cannot edit an active application
    assert push(client, alice, rec("covered_visits", "cv_fake", patient_id=alice.id))["rejected"] == 1
    assert push(client, alice, rec("ledger_entries", "le_fake", patient_id=alice.id))["rejected"] == 1
    r = client.patch(f"/charity/applications/{app_id}", headers=alice.h, json={"visits_allowed": 50})
    assert r.status_code == 422
    assert _claim(client, alice, app_id, "anything").status_code == 403


def test_reversal_returns_money_and_frees_the_visit(client, signup, staff, link):
    alice, app_id, admin, doc = _active(client, signup, staff, link)
    client.post("/charity/providers", headers=admin.h, json={"doctor_id": doc.id, "terms": "Settled monthly by bank transfer"})
    _fund(client, admin, 1000, "REF-OPEN-2")
    before = client.get("/charity/fund", headers=admin.h).json()["available_rupees"]
    _visit(client, alice, doc, "v_rev", fee=400)
    claim = _claim(client, admin, app_id, "v_rev").json()["claim_id"]
    r = client.post(f"/charity/claims/{claim}/reverse", headers=admin.h, json={"reason": "Visit recorded in error"})
    assert r.json()["status"] == "reversed"
    fund = client.get("/charity/fund", headers=admin.h).json()
    assert fund["available_rupees"] == before
    assert client.get(f"/charity/applications/{app_id}", headers=alice.h).json()["visits_used"] == 0


def test_adjustments_need_admin_reason_reference_and_cannot_overspend(client, signup, staff):
    admin, partner = staff("admin"), staff("charity_partner")
    donor = signup("donor", "Donor Adj")
    body = {"direction": "in", "amount_rupees": 500, "reason": "Opening balance", "reference": "REF-A"}
    assert client.post("/charity/ledger/adjustments", headers=partner.h, json=body).status_code == 403
    assert client.post("/charity/ledger/adjustments", headers=donor.h, json=body).status_code == 403
    assert client.post("/charity/ledger/adjustments", headers=admin.h, json=body).status_code == 201
    assert client.post("/charity/ledger/adjustments", headers=admin.h, json=body).status_code == 409   # same reference
    big_out = dict(body, direction="out", amount_rupees=10_000_000, reference="REF-B")
    assert client.post("/charity/ledger/adjustments", headers=admin.h, json=big_out).status_code == 409


def test_donors_never_see_applicants(client, signup, staff):
    alice, app_id = _submitted(client, signup)
    donor = signup("donor", "Curious Donor")
    assert client.get("/charity/applications", headers=donor.h).status_code == 403
    assert client.get(f"/charity/applications/{app_id}", headers=donor.h).status_code == 404
    fund = client.get("/charity/fund", headers=donor.h).json()
    assert set(fund) == {"available_rupees", "donations_rupees", "consultations_rupees"}   # totals only


def test_ledger_and_claims_are_for_reviewers_only(client, signup, staff, link):
    alice, app_id, admin, doc = _active(client, signup, staff, link)
    partner = staff("charity_partner")
    donor = signup("donor", "Ledger Donor")
    _fund(client, admin, 300, "REF-LEDGER")
    rows = client.get("/charity/ledger", headers=partner.h).json()
    assert any(r["reference"] == "REF-LEDGER" and r["amount_rupees"] == 300 and r["direction"] == "in" for r in rows)
    for who in (donor, alice, doc):
        assert client.get("/charity/ledger", headers=who.h).status_code == 403
        assert client.get(f"/charity/applications/{app_id}/claims", headers=who.h).status_code == 403
    assert client.get(f"/charity/applications/{app_id}/claims", headers=admin.h).json() == []


def test_mobile_sign_in_names_the_real_number(client):
    r = client.post("/auth/start", json={"role": "donor", "id_type": "mobile", "id_number": "98765 43210"})
    assert r.status_code == 200 and r.json()["mobile_tail"] == "3210"
