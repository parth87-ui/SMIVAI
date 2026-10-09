"""SMIVAI — who is calling, and which patients they may see.

The caller presents a bearer token issued by :mod:`app.auth`:

    Authorization: Bearer <token>

Every patient-scoped route runs through :func:`authorize_patient`, which
allows a patient only their own record, and a caregiver or doctor only a
patient they hold an **active care link** to — a link that can only be
created from the care code the patient reads out. An unauthorised request
returns **404, not 403**, so the API never confirms that a patient id exists.

The old header pair (``X-SMIVAI-Role`` / ``X-SMIVAI-Actor``) is accepted
only when ``SMIVAI_ALLOW_HEADER_AUTH=1`` is set, for local development
against the pre-auth prototype. It is off by default.
"""
from __future__ import annotations

import os

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from .auth import read_token
from .database import get_db
from .models import Account, CareLink, Patient

ALLOW_HEADER_AUTH = os.getenv("SMIVAI_ALLOW_HEADER_AUTH") == "1"

Role = str


class Actor:
    def __init__(self, role: Role, actor_id: str, account_id: str | None = None):
        self.role = role
        self.actor_id = actor_id
        self.account_id = account_id


def current_actor(
    authorization: str = Header(default=""),
    x_smivai_role: str = Header(default="", alias="X-SMIVAI-Role"),
    x_smivai_actor: str = Header(default="", alias="X-SMIVAI-Actor"),
    db: Session = Depends(get_db),
) -> Actor:
    token = authorization.removeprefix("Bearer ").strip() if authorization else ""
    if token:
        payload = read_token(token)
        if payload is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Your session has expired. Please sign in again.")
        account = db.get(Account, payload["sub"])
        if account is None:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Please sign in again.")
        return Actor(account.role, account.entity_id, account.account_id)

    if ALLOW_HEADER_AUTH and x_smivai_actor:
        if x_smivai_role not in ("patient", "caregiver", "doctor"):   # never staff/donor via headers
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown role")
        return Actor(x_smivai_role, x_smivai_actor)

    raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in to use the SMIVAI API")


def has_link(db: Session, role: str, actor_id: str, patient_id: str) -> bool:
    return (
        db.query(CareLink)
        .filter(
            CareLink.actor_role == role,
            CareLink.actor_id == actor_id,
            CareLink.patient_id == patient_id,
            CareLink.status == "active",
        )
        .first()
        is not None
    )


def authorize_patient(
    patient_id: str,
    actor: Actor = Depends(current_actor),
    db: Session = Depends(get_db),
) -> Patient:
    patient = db.get(Patient, patient_id)
    if patient is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")

    if actor.role == "patient":
        allowed = patient.patient_id == actor.actor_id
    else:
        allowed = has_link(db, actor.role, actor.actor_id, patient.patient_id)

    if not allowed:
        # 404 rather than 403: do not confirm that a patient id exists.
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")
    return patient


SCOPES = ("memories", "health", "activity")
CARE_TEAM_ROLES = ("caregiver", "doctor")


def require_roles(*roles: str):
    """Dependency: the signed-in caller, only if their role is one of `roles`.
    The role comes from the verified account, never from the client."""
    def dependency(actor: Actor = Depends(current_actor)) -> Actor:
        if actor.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Your account cannot use this")
        return actor
    return dependency


def shares(db: Session, actor: Actor, patient_id: str, scope: str) -> bool:
    """Has the patient shared this kind of record with this caller?

    A patient always sees their own records. For a caregiver or doctor the
    link's ``scopes`` decide; a scope that is missing (links made before
    Phase 7) counts as shared. Mirrors S.Links.allows in js/core/plans.js.
    """
    if actor.role == "patient":
        return actor.actor_id == patient_id
    link = (
        db.query(CareLink)
        .filter(CareLink.actor_role == actor.role, CareLink.actor_id == actor.actor_id,
                CareLink.patient_id == patient_id, CareLink.status == "active")
        .first()
    )
    return link is not None and (link.scopes or {}).get(scope, True) is not False


def authorize_scope(scope: str):
    """Dependency: the patient, reachable by the caller *and* shared for `scope`.

    Unreachable → 404 (as authorize_patient). Reachable but not shared →
    403, which reveals nothing new: the caller already knows the patient.
    """
    def dependency(
        patient_id: str,
        actor: Actor = Depends(current_actor),
        db: Session = Depends(get_db),
    ) -> Patient:
        patient = authorize_patient(patient_id, actor, db)
        if not shares(db, actor, patient.patient_id, scope):
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"{patient.name.split(' ')[0]} has not shared this with you")
        return patient
    return dependency


def visible_patients(actor: Actor, db: Session) -> list[Patient]:
    if actor.role == "patient":
        row = db.get(Patient, actor.actor_id)
        return [row] if row else []
    ids = [
        l.patient_id
        for l in db.query(CareLink)
        .filter(CareLink.actor_role == actor.role, CareLink.actor_id == actor.actor_id, CareLink.status == "active")
        .all()
    ]
    if not ids:
        return []
    return db.query(Patient).filter(Patient.patient_id.in_(ids)).order_by(Patient.name).all()
