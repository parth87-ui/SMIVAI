"""SMIVAI — Free / Premium entitlements, server side.

A deliberate mirror of ``js/core/plans.js``: same free game list, same
caregiver, patient and doctor limits, same prices. The device enforces
these so the interface stays honest offline; the service enforces them so
a hand-made request cannot walk past them. If you change one, change both.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from . import models

FREE_GAMES = ["picture_matching", "memory_pairs", "picture_bingo", "category_sorting"]
ALL_GAMES = FREE_GAMES + ["jigsaw", "my_memories", "pattern", "word_hustle"]

LIMITS = {
    "patient": {"free": {"max_caregivers": 2}, "premium": {"max_caregivers": 6}},
    "caregiver": {"free": {"max_patients": 2}, "premium": {"max_patients": 6}},
    "doctor": {"free": {"max_patients": 100}, "premium": {"max_patients": 500}},
}
PRICE_INR = {"patient": 149, "caregiver": 199, "doctor": 1499}

_TABLE = {"patient": (models.Patient, "patient_id"),
          "caregiver": (models.Caregiver, "caregiver_id"),
          "doctor": (models.Doctor, "doctor_id")}


def entity(db: Session, role: str, actor_id: str):
    model, _ = _TABLE[role]
    return db.get(model, actor_id)


def plan_of(db: Session, role: str, actor_id: str) -> str:
    row = entity(db, role, actor_id)
    return "premium" if row is not None and row.plan == "premium" else "free"


def games_for(plan: str) -> list[str]:
    return ALL_GAMES if plan == "premium" else FREE_GAMES


def can_play(db: Session, patient_id: str, game_type: str) -> bool:
    """Game access follows the patient's plan, whoever is holding the device."""
    if game_type in FREE_GAMES:
        return True
    return plan_of(db, "patient", patient_id) == "premium"


def link_limit(db: Session, role: str, actor_id: str) -> int:
    plan = plan_of(db, role, actor_id)
    key = "max_caregivers" if role == "patient" else "max_patients"
    return LIMITS[role][plan][key]


def link_count(db: Session, role: str, actor_id: str) -> int:
    return (
        db.query(models.CareLink)
        .filter(models.CareLink.actor_role == role,
                models.CareLink.actor_id == actor_id,
                models.CareLink.status == "active")
        .count()
    )


def caregivers_of(db: Session, patient_id: str) -> int:
    return (
        db.query(models.CareLink)
        .filter(models.CareLink.patient_id == patient_id,
                models.CareLink.actor_role == "caregiver",
                models.CareLink.status == "active")
        .count()
    )


def check_link(db: Session, role: str, actor_id: str, patient: models.Patient) -> tuple[bool, str]:
    """Every reason a care link can be refused, in one place."""
    existing = (
        db.query(models.CareLink)
        .filter(models.CareLink.actor_role == role,
                models.CareLink.actor_id == actor_id,
                models.CareLink.patient_id == patient.patient_id,
                models.CareLink.status == "active")
        .first()
    )
    if existing is not None:
        return False, f"{patient.name} is already in your list."

    limit = link_limit(db, role, actor_id)
    if link_count(db, role, actor_id) >= limit:
        plan = plan_of(db, role, actor_id).title()
        noun = "patients" if role == "doctor" else "people"
        return False, f"Your {plan} plan covers up to {limit} {noun}."

    if role == "caregiver":
        theirs = caregivers_of(db, patient.patient_id)
        their_limit = link_limit(db, "patient", patient.patient_id)
        if theirs >= their_limit:
            return False, f"{patient.name} already has {theirs} caregivers, the most their plan allows."
    return True, ""


def summary(db: Session, role: str, actor_id: str) -> dict:
    plan = plan_of(db, role, actor_id)
    body = {
        "role": role,
        "plan": plan,
        "price_inr_per_month": PRICE_INR[role],
        "limit": link_limit(db, role, actor_id),
        "used": link_count(db, role, actor_id) if role != "patient" else caregivers_of(db, actor_id),
        "note": "Demo mode — there is no payment gateway; nothing is charged.",
    }
    if role == "patient":
        body["games"] = games_for(plan)
        body["locked_games"] = [g for g in ALL_GAMES if g not in games_for(plan)]
        body["ai"] = "advanced" if plan == "premium" else "basic"
    return body
