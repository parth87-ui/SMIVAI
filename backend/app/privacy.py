"""SMIVAI — the signed-in person's data rights on the server.

    GET  /me/export     a copy of your own records (no identity hash)
    GET  /me/consents   what you agreed to, and when
    POST /me/erase      delete your account and records — {"confirm": "DELETE"}

Erasure runs in one transaction. For a patient it removes every row keyed by
their patient id (reminders, memories, sessions, answers, appointments,
orders, readings, notes, alerts, care links…), notifications about them, their
profile, account and consent records. For a caregiver or doctor it removes
their care links, their notifications, profile, account and consents; the
patients' own records stay with the patients.

This is the technical mechanism only. Whether some records must be kept for
a legal reason (for example medical record-keeping duties) is a question
for legal review — see docs/PRIVACY.md.
"""
from __future__ import annotations

import datetime as dt
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from . import models
from .database import Base, get_db
from .deps import Actor, current_actor

router = APIRouter(prefix="/me", tags=["privacy"])
log = logging.getLogger("smivai.privacy")

_ENTITY = {"patient": models.Patient, "caregiver": models.Caregiver, "doctor": models.Doctor,
           "donor": models.Donor, "admin": models.Staff, "charity_partner": models.Staff}
_SKIP = {"accounts", "sync_log", "consents", "patients"}


def _patient_tables():
    """Every mapped table with a patient_id column — found, not listed, so a
    table added later is covered by erasure and export automatically."""
    for mapper in Base.registry.mappers:
        cls = mapper.class_
        if cls.__tablename__ not in _SKIP and "patient_id" in cls.__table__.columns:
            yield cls


def _row(obj) -> dict:
    out = {}
    for c in obj.__table__.columns:
        v = getattr(obj, c.key)
        out[c.key] = v.isoformat() if isinstance(v, (dt.date, dt.datetime)) else v
    out.pop("id_hash", None)
    return out


def _account(db: Session, actor: Actor):
    return db.get(models.Account, actor.account_id) if actor.account_id else None


@router.get("/export")
def export_mine(actor: Actor = Depends(current_actor), db: Session = Depends(get_db)):
    records: dict[str, list] = {}
    ent = db.get(_ENTITY[actor.role], actor.actor_id)
    records[_ENTITY[actor.role].__tablename__] = [_row(ent)] if ent else []
    acct = _account(db, actor)
    records["accounts"] = [_row(acct)] if acct else []
    if acct:
        records["consents"] = [_row(c) for c in db.query(models.Consent).filter(models.Consent.account_id == acct.account_id)]
    if actor.role == "patient":
        for cls in _patient_tables():
            rows = db.query(cls).filter(cls.patient_id == actor.actor_id).all()
            records[cls.__tablename__] = [_row(r) for r in rows]
    else:
        records["care_links"] = [_row(r) for r in db.query(models.CareLink).filter(
            models.CareLink.actor_role == actor.role, models.CareLink.actor_id == actor.actor_id)]
        records["notifications"] = [_row(r) for r in db.query(models.Notification).filter(
            models.Notification.recipient_role == actor.role, models.Notification.recipient_id == actor.actor_id)]
    return {"exported_at": dt.datetime.now(dt.timezone.utc).isoformat(), "role": actor.role, "records": records}


@router.get("/profile")
def my_profile(actor: Actor = Depends(current_actor), db: Session = Depends(get_db)):
    """Your own profile row as the device stores it — so a device you sign in
    on has your profile even though it was created on the server. Includes
    your care code and plan (yours to see); never an identity hash."""
    ent = db.get(_ENTITY[actor.role], actor.actor_id)
    if ent is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found")
    row = _row(ent)
    if actor.role == "patient":
        # Device field names for the per-game choices.
        row["ability"] = ent.ability or {}
        row["difficulty"] = ent.difficulty or {}
        row["level_lock"] = ent.level_lock or {}
    return {"role": actor.role, "profile": row}


@router.get("/consents")
def my_consents(actor: Actor = Depends(current_actor), db: Session = Depends(get_db)):
    acct = _account(db, actor)
    rows = db.query(models.Consent).filter(models.Consent.account_id == acct.account_id).all() if acct else []
    return [_row(r) for r in rows]


class EraseIn(BaseModel):
    confirm: str


@router.post("/erase")
def erase_me(body: EraseIn, actor: Actor = Depends(current_actor), db: Session = Depends(get_db)):
    if body.confirm != "DELETE":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, 'To delete your account, send {"confirm": "DELETE"}.')
    if actor.account_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Sign in with an account to delete it.")
    if actor.role in ("admin", "charity_partner"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Staff accounts are removed by an administrator.")
    removed: dict[str, int] = {}
    try:
        if actor.role == "patient":
            for cls in _patient_tables():
                n = db.query(cls).filter(cls.patient_id == actor.actor_id).delete(synchronize_session=False)
                if n:
                    removed[cls.__tablename__] = n
        else:
            removed["care_links"] = db.query(models.CareLink).filter(
                models.CareLink.actor_role == actor.role, models.CareLink.actor_id == actor.actor_id
            ).delete(synchronize_session=False)
        removed["notifications_to_you"] = db.query(models.Notification).filter(
            models.Notification.recipient_role == actor.role, models.Notification.recipient_id == actor.actor_id
        ).delete(synchronize_session=False)
        removed["consents"] = db.query(models.Consent).filter(
            models.Consent.account_id == actor.account_id).delete(synchronize_session=False)
        ent = db.get(_ENTITY[actor.role], actor.actor_id)
        if ent is not None:
            db.delete(ent)
            removed["profile"] = 1
        acct = db.get(models.Account, actor.account_id)
        if acct is not None:
            db.delete(acct)
            removed["account"] = 1
        db.commit()
    except Exception:
        db.rollback()
        log.exception("erase failed for %s", actor.role)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Nothing was deleted. Please try again.")
    log.info("account erased: role=%s rows=%s", actor.role, sum(removed.values()))
    return {"erased": True, "removed": removed}
