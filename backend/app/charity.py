"""SMIVAI — charity assistance: applications, dual approval, covered visits, fund.

Two separate journeys share nothing but the fund:
  * a patient (or a caregiver they have linked) APPLIES for assistance;
  * donors give money (app/donations.py), which enters the same ledger.

Policy, all on the server and configurable — never trusted from a device:
  * strictly BELOW the annual family income limit (default ₹1,50,000) may be
    submitted for review; at or above it cannot be submitted. Being below
    the limit is one condition, not approval.
  * BOTH a Smivai administrator AND an authorised charity partner must
    approve; either may reject or ask for more information. Assistance is
    activated only by an administrator after both approvals.
  * an active application covers the full consultation fee of up to five
    completed visits with a participating doctor, while the fund has the
    money — each visit at most once, recorded in an add-only ledger, inside
    a database transaction. When funds are short, the visit is recorded as
    "awaiting funds": coverage is never claimed without the money.

No real charity partner is connected: every application is marked `demo`
and the interface says so. Document uploads are checked (type by content,
size), stored outside the web folder, and served only to the applicant and
reviewers — never to donors.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import os
import threading
import uuid
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models
from .database import get_db
from .deps import Actor, current_actor, has_link, require_roles, shares

router = APIRouter(prefix="/charity", tags=["charity"])

# ------------------------------------------------------------------ policy
INCOME_LIMIT_PAISE = int(os.getenv("SMIVAI_CHARITY_INCOME_LIMIT_RUPEES", "150000")) * 100
COVERED_VISITS = int(os.getenv("SMIVAI_CHARITY_COVERED_VISITS", "5"))
DOC_TYPES = {
    "income_certificate": "Income certificate issued by a competent authority (e.g. Tehsildar, SDO, Circle Officer)",
    "bpl_card": "BPL ration card",
    "antyodaya_card": "Antyodaya Anna Yojana (AAY) ration card",
    "other_approved": "Other proof of household income accepted by the charity partner",
}
MAX_DOC_BYTES = 5 * 1024 * 1024
ALLOWED_MIME = {"application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png"}
UPLOAD_DIR = Path(os.getenv("SMIVAI_UPLOAD_DIR") or Path(__file__).resolve().parent.parent / "private_uploads")
DEMO = True   # no real charity partner is connected

REVIEWERS = ("admin", "charity_partner")

# Every change to the fund (claims, adjustments, verified donations) holds
# this lock, so a balance check and the entry it allows cannot interleave
# with another one. It covers one server process; several worker processes
# would need a database row lock (SELECT … FOR UPDATE on PostgreSQL) — see
# docs/CHARITY.md.
FUND_LOCK = threading.Lock()
EDITABLE = ("draft", "info_requested")


def inr(rupees: int) -> str:
    """Indian digit grouping: 150000 → '1,50,000'."""
    s = str(int(rupees))
    if len(s) <= 3:
        return s
    head, tail = s[:-3], s[-3:]
    groups = []
    while len(head) > 2:
        groups.insert(0, head[-2:])
        head = head[:-2]
    return ",".join(([head] if head else []) + groups) + "," + tail


def _now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def _id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def _event(db: Session, app_id: str, actor: Actor, action: str, note: str | None = None) -> None:
    db.add(models.CharityEvent(event_id=_id("cev"), application_id=app_id, actor_role=actor.role,
                               actor_id=actor.actor_id, action=action, note=note))


def _notify(db: Session, app: models.CharityApplication, title: str, body: str) -> None:
    db.add(models.Notification(notification_id=_id("ntf"), recipient_role="patient", recipient_id=app.patient_id,
                               patient_id=app.patient_id, kind="charity", title=title, body=body,
                               link="#/patient/support"))


def _may_apply_for(db: Session, actor: Actor, patient_id: str) -> bool:
    """The patient themself, or a caregiver they linked who may see health records."""
    if actor.role == "patient":
        return actor.actor_id == patient_id
    if actor.role == "caregiver":
        return has_link(db, "caregiver", actor.actor_id, patient_id) and shares(db, actor, patient_id, "health")
    return False


def _load(db: Session, actor: Actor, application_id: str) -> models.CharityApplication:
    app = db.get(models.CharityApplication, application_id)
    if app is None or not (actor.role in REVIEWERS or _may_apply_for(db, actor, app.patient_id)):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")
    return app


def _view(db: Session, app: models.CharityApplication, actor: Actor) -> dict:
    docs = db.query(models.CharityDocument).filter(models.CharityDocument.application_id == app.application_id).all()
    used = db.query(models.CoveredVisit).filter(models.CoveredVisit.application_id == app.application_id,
                                                models.CoveredVisit.status == "covered").count()
    out = {c.key: getattr(app, c.key) for c in app.__table__.columns}
    out["annual_income_rupees"] = None if app.annual_income_paise is None else app.annual_income_paise // 100
    out.pop("annual_income_paise", None)
    out["documents"] = [{"document_id": d.document_id, "doc_type": d.doc_type, "label": DOC_TYPES.get(d.doc_type),
                         "mime": d.mime, "size_bytes": d.size_bytes, "review_status": d.review_status,
                         "uploaded_at": d.uploaded_at} for d in docs]
    out["visits_used"] = used
    out["visits_remaining"] = max(0, app.visits_allowed - used) if app.status in ("active", "completed") else None
    out["below_income_limit"] = app.annual_income_paise is not None and app.annual_income_paise < INCOME_LIMIT_PAISE
    if actor.role in REVIEWERS:
        out["events"] = [{"actor_role": e.actor_role, "action": e.action, "note": e.note, "at": e.at}
                         for e in db.query(models.CharityEvent).filter(
                             models.CharityEvent.application_id == app.application_id).order_by(models.CharityEvent.at)]
    return out


# ------------------------------------------------------------------ policy endpoint
@router.get("/policy")
def policy(_: Actor = Depends(current_actor)):
    return {
        "income_limit_rupees": INCOME_LIMIT_PAISE // 100,
        "rule": f"Annual family income must be below ₹{inr(INCOME_LIMIT_PAISE // 100)}. "
                "Being below the limit lets an application be reviewed; it is not an approval.",
        "approval": "A Smivai administrator and the charity partner must both approve, after checking documents "
                    "and the funds available.",
        "benefit": f"Full consultation fee for up to {COVERED_VISITS} completed visits with a participating doctor, "
                   "while the fund has money. Cancelled or unfinished visits are not covered.",
        "documents": DOC_TYPES,
        "documents_note": "Upload one document that shows household income. Not every document exists in every state; "
                          "the charity partner decides which alternatives it accepts. Do not upload an Aadhaar card.",
        "demo": DEMO,
        "demo_note": "Demo mode: no real charity partner is connected yet, so no real assistance can be approved.",
    }


# ------------------------------------------------------------------ applicant
class ApplicationIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    patient_id: str = Field(max_length=64)
    contact_phone: str | None = Field(default=None, max_length=20)
    caregiver_name: str | None = Field(default=None, max_length=80)
    annual_income_rupees: int | None = Field(default=None, ge=0, le=100_000_000)
    household_size: int | None = Field(default=None, ge=1, le=30)
    circumstances: str | None = Field(default=None, max_length=1000)
    assistance_requested: str | None = Field(default=None, max_length=500)
    declaration: bool = False
    consent: bool = False


class ApplicationPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    contact_phone: str | None = Field(default=None, max_length=20)
    caregiver_name: str | None = Field(default=None, max_length=80)
    annual_income_rupees: int | None = Field(default=None, ge=0, le=100_000_000)
    household_size: int | None = Field(default=None, ge=1, le=30)
    circumstances: str | None = Field(default=None, max_length=1000)
    assistance_requested: str | None = Field(default=None, max_length=500)
    declaration: bool | None = None
    consent: bool | None = None


@router.post("/applications", status_code=201)
def create_application(body: ApplicationIn, actor: Actor = Depends(require_roles("patient", "caregiver")),
                       db: Session = Depends(get_db)):
    if not _may_apply_for(db, actor, body.patient_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")
    patient = db.get(models.Patient, body.patient_id)
    open_app = db.query(models.CharityApplication).filter(
        models.CharityApplication.patient_id == body.patient_id,
        models.CharityApplication.status.notin_(["rejected", "completed"])).first()
    if open_app is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "There is already an open application for this person")
    data = body.model_dump()
    income = data.pop("annual_income_rupees")
    app = models.CharityApplication(
        application_id=_id("app"), submitted_by_role=actor.role, submitted_by_id=actor.actor_id,
        applicant_name=patient.name,                     # reused from the profile, not re-entered
        annual_income_paise=None if income is None else income * 100,
        visits_allowed=COVERED_VISITS, demo=DEMO, **data,
    )
    db.add(app)
    _event(db, app.application_id, actor, "created")
    db.commit()
    return _view(db, app, actor)


@router.get("/applications")
def list_applications(actor: Actor = Depends(current_actor), db: Session = Depends(get_db),
                      status_filter: str | None = None):
    q = db.query(models.CharityApplication)
    if actor.role in REVIEWERS:
        q = q.filter(models.CharityApplication.status != "draft")       # drafts stay private
        if status_filter:
            q = q.filter(models.CharityApplication.status == status_filter)
    elif actor.role in ("patient", "caregiver"):
        mine = [a for a in q.all() if _may_apply_for(db, actor, a.patient_id)]
        return [_view(db, a, actor) for a in mine]
    else:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Your account cannot see applications")
    return [_view(db, a, actor) for a in q.order_by(models.CharityApplication.created_at).all()]


@router.get("/applications/{application_id}")
def get_application(application_id: str, actor: Actor = Depends(current_actor), db: Session = Depends(get_db)):
    app = _load(db, actor, application_id)
    if actor.role in REVIEWERS and app.status == "draft":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")
    return _view(db, app, actor)


@router.patch("/applications/{application_id}")
def edit_application(application_id: str, body: ApplicationPatch,
                     actor: Actor = Depends(require_roles("patient", "caregiver")), db: Session = Depends(get_db)):
    app = _load(db, actor, application_id)
    if app.status not in EDITABLE:
        raise HTTPException(status.HTTP_409_CONFLICT, "This application can no longer be changed")
    for k, v in body.model_dump(exclude_unset=True).items():
        if k == "annual_income_rupees":
            app.annual_income_paise = None if v is None else v * 100
        else:
            setattr(app, k, v)
    _event(db, app.application_id, actor, "edited")
    db.commit()
    return _view(db, app, actor)


def _sniff(head: bytes) -> str | None:
    """The real type from the first bytes — not the name or the browser's claim."""
    if head.startswith(b"%PDF-"):
        return "application/pdf"
    if head.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    return None


@router.post("/applications/{application_id}/documents", status_code=201)
async def upload_document(application_id: str, doc_type: str = Form(...), file: UploadFile = File(...),
                          actor: Actor = Depends(require_roles("patient", "caregiver")), db: Session = Depends(get_db)):
    app = _load(db, actor, application_id)
    if app.status not in EDITABLE:
        raise HTTPException(status.HTTP_409_CONFLICT, "Documents can be added only while the application is open for changes")
    if doc_type not in DOC_TYPES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown document type")
    data = await file.read(MAX_DOC_BYTES + 1)
    if len(data) > MAX_DOC_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "The file is larger than 5 MB")
    if not data:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "The file is empty")
    mime = _sniff(data[:16])
    if mime is None:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Please upload a PDF, JPG or PNG file")
    doc_id = _id("doc")
    storage = f"{doc_id}.{ALLOWED_MIME[mime]}"            # never the uploader's file name
    folder = UPLOAD_DIR / application_id
    folder.mkdir(parents=True, exist_ok=True)
    (folder / storage).write_bytes(data)
    db.add(models.CharityDocument(document_id=doc_id, application_id=application_id, doc_type=doc_type, mime=mime,
                                  size_bytes=len(data), sha256=hashlib.sha256(data).hexdigest(),
                                  storage_name=storage, uploaded_by=actor.actor_id))
    _event(db, application_id, actor, "document_added", doc_type)
    db.commit()
    return {"document_id": doc_id, "doc_type": doc_type, "mime": mime, "size_bytes": len(data),
            "review_status": "not_reviewed", "note": "Uploaded. A reviewer will check it; uploading is not verification."}


@router.get("/documents/{document_id}")
def download_document(document_id: str, actor: Actor = Depends(current_actor), db: Session = Depends(get_db)):
    doc = db.get(models.CharityDocument, document_id)
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    app = _load(db, actor, doc.application_id)          # applicant or reviewer only — never donors
    if actor.role in REVIEWERS and app.status == "draft":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    path = UPLOAD_DIR / doc.application_id / doc.storage_name
    if not path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "The file is no longer stored")
    _event(db, app.application_id, actor, "document_viewed", document_id)
    db.commit()
    return FileResponse(path, media_type=doc.mime, filename=f"{doc.doc_type}.{doc.storage_name.rsplit('.', 1)[1]}",
                        headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"})


@router.delete("/documents/{document_id}", status_code=204)
def delete_document(document_id: str, actor: Actor = Depends(require_roles("patient", "caregiver")),
                    db: Session = Depends(get_db)):
    doc = db.get(models.CharityDocument, document_id)
    if doc is None:
        return
    app = _load(db, actor, doc.application_id)
    if app.status not in EDITABLE:
        raise HTTPException(status.HTTP_409_CONFLICT, "Documents can be removed only while the application is open for changes")
    (UPLOAD_DIR / doc.application_id / doc.storage_name).unlink(missing_ok=True)
    db.delete(doc)
    _event(db, app.application_id, actor, "document_removed", doc.doc_type)
    db.commit()


@router.post("/applications/{application_id}/submit")
def submit_application(application_id: str, actor: Actor = Depends(require_roles("patient", "caregiver")),
                       db: Session = Depends(get_db)):
    app = _load(db, actor, application_id)
    if app.status not in EDITABLE:
        raise HTTPException(status.HTTP_409_CONFLICT, "This application has already been submitted")
    problems = []
    if app.annual_income_paise is None:
        problems.append("Please enter the annual family income.")
    elif app.annual_income_paise >= INCOME_LIMIT_PAISE:
        problems.append(f"This program is for families with an annual income below ₹{inr(INCOME_LIMIT_PAISE // 100)}. "
                        "An income of that amount or more cannot be submitted.")
    if not app.declaration:
        problems.append("Please confirm that the information is true.")
    if not app.consent:
        problems.append("Please agree that reviewers may see the application and documents.")
    if not db.query(models.CharityDocument).filter(models.CharityDocument.application_id == app.application_id).count():
        problems.append("Please upload at least one document showing household income.")
    if problems:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, " ".join(problems))
    was = app.status
    app.status = "submitted"
    app.submitted_at = _now()
    app.info_request = None
    _event(db, app.application_id, actor, "resubmitted" if was == "info_requested" else "submitted")
    _notify(db, app, "Charity application received",
            "It will be reviewed by Smivai and the charity partner. Submitting is not an approval.")
    db.commit()
    return _view(db, app, actor)


# ------------------------------------------------------------------ reviewers
class ReviewIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    action: Literal["start_review", "request_info", "approve", "reject"]
    note: str | None = Field(default=None, max_length=1000)


@router.post("/applications/{application_id}/review")
def review(application_id: str, body: ReviewIn, actor: Actor = Depends(require_roles(*REVIEWERS)),
           db: Session = Depends(get_db)):
    app = _load(db, actor, application_id)
    if body.action == "start_review":
        if app.status != "submitted":
            raise HTTPException(status.HTTP_409_CONFLICT, "Only a submitted application can be taken into review")
        app.status = "under_review"
        _notify(db, app, "Your charity application is being reviewed", "We will tell you when there is a decision.")
    elif body.action == "request_info":
        if app.status not in ("submitted", "under_review"):
            raise HTTPException(status.HTTP_409_CONFLICT, "Information can be requested only during review")
        if not body.note:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Say what information is needed")
        app.status, app.info_request = "info_requested", body.note
        app.admin_decision = app.partner_decision = None           # a changed application is decided afresh
        _notify(db, app, "More information is needed for your charity application", body.note)
    elif body.action == "reject":
        if app.status not in ("submitted", "under_review", "info_requested"):
            raise HTTPException(status.HTTP_409_CONFLICT, "This application cannot be rejected now")
        if not body.note:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Give a reason for the rejection")
        app.status, app.rejection_reason = "rejected", body.note
        _record(app, actor, "rejected")
        _notify(db, app, "Your charity application was not approved", body.note)
    else:  # approve
        if app.status != "under_review":
            raise HTTPException(status.HTTP_409_CONFLICT, "An application must be under review to be approved")
        _record(app, actor, "approved")
        if app.admin_decision == "approved" and app.partner_decision == "approved":
            app.status = "approved"
            _notify(db, app, "Your charity application was approved",
                    "An administrator will activate the assistance. "
                    + ("Demo mode: no real charity partner is connected." if app.demo else ""))
    _event(db, app.application_id, actor, body.action, body.note)
    db.commit()
    return _view(db, app, actor)


def _record(app: models.CharityApplication, actor: Actor, decision: str) -> None:
    if actor.role == "admin":
        app.admin_decision, app.admin_id, app.admin_at = decision, actor.actor_id, _now()
    else:
        app.partner_decision, app.partner_id, app.partner_at = decision, actor.actor_id, _now()


@router.post("/applications/{application_id}/activate")
def activate(application_id: str, actor: Actor = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    app = _load(db, actor, application_id)
    if not (app.status == "approved" and app.admin_decision == "approved" and app.partner_decision == "approved"):
        raise HTTPException(status.HTTP_409_CONFLICT, "Both the administrator and the charity partner must approve first")
    app.status, app.activated_at = "active", _now()
    _event(db, app.application_id, actor, "activated")
    _notify(db, app, "Charity assistance is active",
            f"Up to {app.visits_allowed} completed visits with a participating doctor can be covered while the fund has money.")
    db.commit()
    return _view(db, app, actor)


# ------------------------------------------------------------------ fund & ledger
def fund_balance(db: Session) -> dict:
    """Totals computed from the ledger on the server — never from a device."""
    def total(direction: str) -> int:
        return int(db.query(func.coalesce(func.sum(models.LedgerEntry.amount_paise), 0))
                   .filter(models.LedgerEntry.direction == direction).scalar() or 0)
    received = int(db.query(func.coalesce(func.sum(models.LedgerEntry.amount_paise), 0))
                   .filter(models.LedgerEntry.kind == "donation").scalar() or 0)
    spent = int(db.query(func.coalesce(func.sum(models.LedgerEntry.amount_paise), 0))
                .filter(models.LedgerEntry.kind == "consultation_payment").scalar() or 0)
    return {"available_paise": total("in") - total("out"), "donations_paise": received, "consultations_paise": spent}


def add_ledger(db: Session, *, kind: str, direction: str, amount_paise: int, key: str, actor_role: str, actor_id: str,
               note: str | None = None, **links) -> models.LedgerEntry:
    if amount_paise <= 0:
        raise ValueError("ledger amounts are positive; direction says in or out")
    entry = models.LedgerEntry(entry_id=_id("led"), kind=kind, direction=direction, amount_paise=amount_paise,
                               idempotency_key=key, created_by_role=actor_role, created_by_id=actor_id, note=note, **links)
    db.add(entry)
    return entry


@router.get("/fund")
def fund(actor: Actor = Depends(require_roles("admin", "charity_partner", "donor")), db: Session = Depends(get_db)):
    bal = fund_balance(db)
    out = {k.replace("_paise", "_rupees"): v / 100 for k, v in bal.items()}
    if actor.role in REVIEWERS:
        out["applications_active"] = db.query(models.CharityApplication).filter(
            models.CharityApplication.status == "active").count()
        out["visits_covered"] = db.query(models.CoveredVisit).filter(models.CoveredVisit.status == "covered").count()
    return out


class AdjustmentIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    direction: Literal["in", "out"]
    amount_rupees: int = Field(gt=0, le=10_000_000)
    reason: str = Field(min_length=5, max_length=500)
    reference: str = Field(min_length=3, max_length=100)


@router.post("/ledger/adjustments", status_code=201)
def adjustment(body: AdjustmentIn, actor: Actor = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    """An authorised correction. Needs a reason and an external reference;
    the same reference cannot be applied twice."""
    with FUND_LOCK:
        if body.direction == "out" and fund_balance(db)["available_paise"] < body.amount_rupees * 100:
            raise HTTPException(status.HTTP_409_CONFLICT, "Not enough funds for that adjustment")
        try:
            add_ledger(db, kind="adjustment", direction=body.direction, amount_paise=body.amount_rupees * 100,
                       key=f"adj:{body.reference}", actor_role=actor.role, actor_id=actor.actor_id,
                       note=body.reason, reference=body.reference)
            db.commit()
        except Exception:
            db.rollback()
            raise HTTPException(status.HTTP_409_CONFLICT, "That reference was already used")
        return fund_balance(db)


# ------------------------------------------------------------------ providers & covered visits
class ProviderIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    doctor_id: str = Field(max_length=64)
    terms: str = Field(min_length=10, max_length=1000)


@router.post("/providers", status_code=201)
def add_provider(body: ProviderIn, actor: Actor = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    """Record that a doctor has agreed how charity-covered consultations are settled."""
    if db.get(models.Doctor, body.doctor_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Doctor not found")
    if db.get(models.ParticipatingProvider, body.doctor_id) is None:
        db.add(models.ParticipatingProvider(doctor_id=body.doctor_id, agreed_by_admin=actor.actor_id, terms=body.terms))
        db.commit()
    return {"doctor_id": body.doctor_id, "participating": True}


class ClaimIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    appointment_id: str = Field(max_length=64)


@router.post("/applications/{application_id}/claims", status_code=201)
def claim_visit(application_id: str, body: ClaimIn, actor: Actor = Depends(require_roles("admin", "doctor")),
                db: Session = Depends(get_db)):
    """Cover one completed consultation — at most once per appointment and
    COVERED_VISITS per application, and only with money in the fund."""
    app = db.get(models.CharityApplication, application_id)
    appt = db.get(models.Appointment, body.appointment_id)
    if app is None or appt is None or appt.patient_id != app.patient_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    if actor.role == "doctor" and appt.doctor_id != actor.actor_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    if app.status != "active":
        raise HTTPException(status.HTTP_409_CONFLICT, "Assistance is not active for this application")
    if appt.status != "completed":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only a completed consultation can be covered")
    if db.get(models.ParticipatingProvider, appt.doctor_id) is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "This doctor has not agreed to the charity arrangement")
    if not appt.fee or appt.fee <= 0:
        raise HTTPException(status.HTTP_409_CONFLICT, "The consultation has no recorded fee to cover")
    existing = db.query(models.CoveredVisit).filter(models.CoveredVisit.appointment_id == appt.appointment_id).first()
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "This consultation has already been claimed")
    used = db.query(models.CoveredVisit).filter(models.CoveredVisit.application_id == app.application_id,
                                                models.CoveredVisit.status == "covered").count()
    if used >= app.visits_allowed:
        raise HTTPException(status.HTTP_409_CONFLICT, f"All {app.visits_allowed} covered visits have been used")

    fee = int(appt.fee) * 100
    claim = models.CoveredVisit(claim_id=_id("clm"), application_id=app.application_id, appointment_id=appt.appointment_id,
                                patient_id=app.patient_id, doctor_id=appt.doctor_id, fee_paise=fee)
    FUND_LOCK.acquire()
    try:
        # One transaction under the fund lock: the balance check and the
        # payment entry together.
        # The unique keys on covered_visits.appointment_id and the ledger's
        # idempotency_key stop a concurrent duplicate from being written twice.
        if fund_balance(db)["available_paise"] >= fee:
            entry = add_ledger(db, kind="consultation_payment", direction="out", amount_paise=fee,
                               key=f"visit:{appt.appointment_id}", actor_role=actor.role, actor_id=actor.actor_id,
                               application_id=app.application_id, appointment_id=appt.appointment_id,
                               note="Full consultation fee, settled with the participating doctor")
            claim.status, claim.covered_paise, claim.ledger_entry_id = "covered", fee, entry.entry_id
        else:
            claim.status, claim.covered_paise = "awaiting_funds", 0
        db.add(claim)
        _event(db, app.application_id, actor, "visit_" + claim.status, appt.appointment_id)
        if claim.status == "covered" and used + 1 >= app.visits_allowed:
            app.status = "completed"
            _event(db, app.application_id, actor, "completed")
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "This consultation has already been claimed")
    finally:
        FUND_LOCK.release()
    return {"claim_id": claim.claim_id, "status": claim.status, "fee_rupees": fee / 100,
            "covered_rupees": claim.covered_paise / 100,
            "visits_used": used + (1 if claim.status == "covered" else 0), "visits_allowed": app.visits_allowed,
            "note": None if claim.status == "covered" else
            "The fund does not have enough money for this fee right now. It is recorded and not yet covered."}


class ReverseIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reason: str = Field(min_length=5, max_length=500)


@router.post("/claims/{claim_id}/reverse")
def reverse_claim(claim_id: str, body: ReverseIn, actor: Actor = Depends(require_roles("admin")),
                  db: Session = Depends(get_db)):
    """Undo a coverage (e.g. a visit recorded in error): money back to the
    fund, and the visit no longer counts."""
    claim = db.get(models.CoveredVisit, claim_id)
    if claim is None or claim.status != "covered":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only a covered visit can be reversed")
    with FUND_LOCK:
        add_ledger(db, kind="reversal", direction="in", amount_paise=claim.covered_paise, key=f"reverse:{claim_id}",
                   actor_role=actor.role, actor_id=actor.actor_id, application_id=claim.application_id,
                   appointment_id=claim.appointment_id, note=body.reason)
        claim.status = "reversed"
        app = db.get(models.CharityApplication, claim.application_id)
        if app.status == "completed":
            app.status = "active"
        _event(db, claim.application_id, actor, "visit_reversed", body.reason)
        db.commit()
    return {"claim_id": claim_id, "status": "reversed"}


# ------------------------------------------------------------------ reviewer read-outs
@router.get("/ledger")
def ledger(actor: Actor = Depends(require_roles(*REVIEWERS)), db: Session = Depends(get_db), limit: int = 200):
    """The add-only ledger, newest first. Reviewers only — donors see totals."""
    rows = db.query(models.LedgerEntry).order_by(models.LedgerEntry.created_at.desc()).limit(max(1, min(limit, 500))).all()
    return [{"entry_id": e.entry_id, "kind": e.kind, "direction": e.direction, "amount_rupees": e.amount_paise / 100,
             "application_id": e.application_id, "appointment_id": e.appointment_id, "donation_id": e.donation_id,
             "reference": e.reference, "note": e.note, "demo": e.demo, "created_by_role": e.created_by_role,
             "created_at": e.created_at} for e in rows]


@router.get("/applications/{application_id}/claims")
def list_claims(application_id: str, actor: Actor = Depends(require_roles(*REVIEWERS)), db: Session = Depends(get_db)):
    app = _load(db, actor, application_id)
    rows = db.query(models.CoveredVisit).filter(models.CoveredVisit.application_id == app.application_id).all()
    return [{"claim_id": c.claim_id, "appointment_id": c.appointment_id, "doctor_id": c.doctor_id, "status": c.status,
             "fee_rupees": c.fee_paise / 100, "covered_rupees": (c.covered_paise or 0) / 100} for c in rows]
