"""SMIVAI — SQLAlchemy models.

Column names match backend/schema.sql and the on-device tables in
js/core/db.js, so a synced record maps straight through.
"""
from __future__ import annotations

import datetime as dt

from sqlalchemy import (
    Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from .database import Base


def _now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


class Caregiver(Base):
    __tablename__ = "caregivers"
    caregiver_id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str | None] = mapped_column(String)
    relation: Mapped[str | None] = mapped_column(String)
    plan: Mapped[str] = mapped_column(String, default="free")


class Doctor(Base):
    __tablename__ = "doctors"
    doctor_id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    speciality: Mapped[str | None] = mapped_column(String)
    license_last4: Mapped[str | None] = mapped_column(String)
    # "prototype" until a real council register is wired in — never claim more.
    license_verified: Mapped[str] = mapped_column(String, default="prototype")
    plan: Mapped[str] = mapped_column(String, default="free")


class Account(Base):
    """A sign-in. Holds a salted hash of the identity number, never the number."""
    __tablename__ = "accounts"
    account_id: Mapped[str] = mapped_column(String, primary_key=True)
    role: Mapped[str] = mapped_column(String, index=True)
    entity_id: Mapped[str] = mapped_column(String, index=True)
    name: Mapped[str] = mapped_column(String)
    id_type: Mapped[str] = mapped_column(String)
    id_hash: Mapped[str] = mapped_column(String, index=True)
    id_last4: Mapped[str | None] = mapped_column(String)
    phone_tail: Mapped[str | None] = mapped_column(String)
    verification: Mapped[str] = mapped_column(String, default="prototype")
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)
    last_login_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


class Consent(Base):
    """What a person agreed to, and when — so consent can be shown and withdrawn.

    A new table (created by create_all; no existing table changes).
    """
    __tablename__ = "consents"
    consent_id: Mapped[str] = mapped_column(String, primary_key=True)
    account_id: Mapped[str] = mapped_column(String, index=True)
    purpose: Mapped[str] = mapped_column(String)            # e.g. "smivai_service"
    notice_version: Mapped[str] = mapped_column(String)
    given_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)
    withdrawn_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


class CareLink(Base):
    """Who may see a patient. Created only from the patient's own care code."""
    __tablename__ = "care_links"
    __table_args__ = (UniqueConstraint("patient_id", "actor_role", "actor_id", name="uq_care_link"),)
    link_id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    actor_role: Mapped[str] = mapped_column(String)
    actor_id: Mapped[str] = mapped_column(String, index=True)
    status: Mapped[str] = mapped_column(String, default="active")
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)
    removed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    # What the patient shares with this person: {"memories": bool, "health": bool,
    # "activity": bool}. Missing or null means shared (links made before
    # Phase 7). Added to existing databases by migration v1.
    scopes: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class Patient(Base):
    __tablename__ = "patients"
    patient_id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    age: Mapped[int | None] = mapped_column(Integer)
    language: Mapped[str] = mapped_column(String, default="en")
    district: Mapped[str | None] = mapped_column(String)
    caregiver_id: Mapped[str | None] = mapped_column(ForeignKey("caregivers.caregiver_id"))
    doctor_id: Mapped[str | None] = mapped_column(ForeignKey("doctors.doctor_id"))
    gender: Mapped[str | None] = mapped_column(String)
    plan: Mapped[str] = mapped_column(String, default="free")
    share_code: Mapped[str | None] = mapped_column(String, index=True)
    ability: Mapped[dict] = mapped_column(JSON, default=dict)
    difficulty: Mapped[dict] = mapped_column(JSON, default=dict)
    # "Always use this level" per game (accessibility choice). Migration v2.
    level_lock: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class GameSession(Base):
    __tablename__ = "game_sessions"
    session_id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    game_type: Mapped[str] = mapped_column(String, nullable=False)
    difficulty: Mapped[str] = mapped_column(String, nullable=False)
    score: Mapped[int] = mapped_column(Integer, default=0)
    accuracy: Mapped[float] = mapped_column(Float, default=0.0)
    response_time: Mapped[float] = mapped_column(Float, default=0.0)
    mistakes: Mapped[int] = mapped_column(Integer, default=0)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    completion_status: Mapped[str] = mapped_column(String, default="completed")
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    content_level: Mapped[int] = mapped_column(Integer, default=1)
    source: Mapped[str] = mapped_column(String, default="patient_app")
    session_date: Mapped[dt.date] = mapped_column(Date, index=True)
    timestamp: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)
    # The level the adaptive engine chose after this game, and whether the game
    # was played at the automatic level, a hand-picked one, or a fixed one.
    # Added to existing databases by migrations v3/v4.
    next_level: Mapped[str | None] = mapped_column(String, nullable=True)
    level_source: Mapped[str | None] = mapped_column(String, nullable=True)


class ItemResponse(Base):
    """One judged answer in a game — the response data a Rasch calibration needs.

    The "item" is a game at a difficulty level; `b` is the difficulty (logits)
    the device used when it was played. A new table: create_all adds it to an
    existing database without touching the other tables.
    """
    __tablename__ = "item_responses"
    response_id: Mapped[str] = mapped_column(String, primary_key=True)
    session_id: Mapped[str] = mapped_column(String, index=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    game_type: Mapped[str] = mapped_column(String, index=True)
    level: Mapped[str] = mapped_column(String)
    b: Mapped[float | None] = mapped_column(Float)
    level_source: Mapped[str] = mapped_column(String, default="auto")
    seq: Mapped[int | None] = mapped_column(Integer)
    correct: Mapped[bool] = mapped_column(Boolean)
    response_ms: Mapped[int | None] = mapped_column(Integer)
    item_ref: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Reminder(Base):
    __tablename__ = "reminders"
    reminder_id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String, default="custom")
    reminder_date: Mapped[dt.date] = mapped_column(Date)
    reminder_time: Mapped[str] = mapped_column(String)          # "HH:MM"
    repeat_rule: Mapped[str] = mapped_column(String, default="once")
    repeat_days: Mapped[list] = mapped_column(JSON, default=list)
    priority: Mapped[str] = mapped_column(String, default="normal")
    status: Mapped[str] = mapped_column(String, default="active")
    created_by_role: Mapped[str] = mapped_column(String)
    created_by_id: Mapped[str] = mapped_column(String)
    created_by_name: Mapped[str | None] = mapped_column(String)
    voice_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class ReminderEvent(Base):
    __tablename__ = "reminder_events"
    __table_args__ = (UniqueConstraint("reminder_id", "event_date", name="uq_reminder_day"),)
    event_id: Mapped[str] = mapped_column(String, primary_key=True)
    reminder_id: Mapped[str] = mapped_column(ForeignKey("reminders.reminder_id"), index=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    event_date: Mapped[dt.date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String)
    marked_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    marked_by: Mapped[str | None] = mapped_column(String)


class Memory(Base):
    __tablename__ = "memory_bank"
    memory_id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    category: Mapped[str] = mapped_column(String)
    memory_group: Mapped[str | None] = mapped_column(String)
    title: Mapped[str] = mapped_column(String)
    content: Mapped[str | None] = mapped_column(Text)
    icon: Mapped[str | None] = mapped_column(String)
    memory_date: Mapped[dt.date | None] = mapped_column(Date)
    people: Mapped[str | None] = mapped_column(String)
    place: Mapped[str | None] = mapped_column(String)
    event: Mapped[str | None] = mapped_column(String)
    # The photograph itself stays on the device; only the reference syncs.
    photo_media: Mapped[str | None] = mapped_column(String)
    photo_scene: Mapped[str | None] = mapped_column(String)
    created_by: Mapped[str | None] = mapped_column(String)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class CognitiveScore(Base):
    __tablename__ = "cognitive_scores"
    __table_args__ = (UniqueConstraint("patient_id", "score_date", name="uq_score_day"),)
    score_id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    score_date: Mapped[dt.date] = mapped_column(Date)
    score: Mapped[int] = mapped_column(Integer)
    trend: Mapped[str] = mapped_column(String, default="stable")
    sessions_counted: Mapped[int] = mapped_column(Integer, default=0)


class Mood(Base):
    __tablename__ = "moods"
    __table_args__ = (UniqueConstraint("patient_id", "mood_date", name="uq_mood_day"),)
    mood_id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    mood_date: Mapped[dt.date] = mapped_column(Date)
    mood: Mapped[str] = mapped_column(String)


class CareNote(Base):
    __tablename__ = "care_notes"
    note_id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    created_by: Mapped[str] = mapped_column(String)
    created_by_name: Mapped[str | None] = mapped_column(String)
    content: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class PatientNote(Base):
    """A patient's own notepad. Unlike care_notes, nobody else writes it."""
    __tablename__ = "patient_notes"
    note_id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Contact(Base):
    __tablename__ = "contacts"
    contact_id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    name: Mapped[str] = mapped_column(String)
    relation: Mapped[str | None] = mapped_column(String)
    phone: Mapped[str | None] = mapped_column(String)
    is_emergency: Mapped[bool] = mapped_column(Boolean, default=False)


class Routine(Base):
    __tablename__ = "routines"
    routine_id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    routine_time: Mapped[str] = mapped_column(String)
    title: Mapped[str] = mapped_column(String)
    icon: Mapped[str | None] = mapped_column(String)


class Appointment(Base):
    __tablename__ = "appointments"
    appointment_id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    doctor_id: Mapped[str] = mapped_column(String, index=True)
    doctor_name: Mapped[str] = mapped_column(String)
    speciality: Mapped[str | None] = mapped_column(String)
    appointment_date: Mapped[dt.date] = mapped_column(Date, index=True)
    appointment_time: Mapped[str] = mapped_column(String)
    mode: Mapped[str] = mapped_column(String, default="video")
    status: Mapped[str] = mapped_column(String, default="scheduled")
    reason: Mapped[str | None] = mapped_column(Text)
    fee: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class DoctorReview(Base):
    """A verified patient review: one per the patient's own completed appointment."""
    __tablename__ = "doctor_reviews"
    review_id: Mapped[str] = mapped_column(String, primary_key=True)
    appointment_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    doctor_id: Mapped[str] = mapped_column(String, index=True)
    stars: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Vital(Base):
    """Self-reported readings and photographed reports. Never interpreted here."""
    __tablename__ = "vitals"
    vital_id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    kind: Mapped[str] = mapped_column(String, index=True)
    value: Mapped[float | None] = mapped_column(Float)
    systolic: Mapped[int | None] = mapped_column(Integer)
    diastolic: Mapped[int | None] = mapped_column(Integer)
    unit: Mapped[str | None] = mapped_column(String)
    label: Mapped[str | None] = mapped_column(String)
    media_id: Mapped[str | None] = mapped_column(String)
    source: Mapped[str] = mapped_column(String, default="self")
    recorded_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Alert(Base):
    __tablename__ = "alerts"
    alert_id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    kind: Mapped[str] = mapped_column(String, default="sos")
    severity: Mapped[str] = mapped_column(String, default="critical")
    title: Mapped[str] = mapped_column(String)
    body: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, default="open", index=True)
    resolved_by: Mapped[str | None] = mapped_column(String)
    resolved_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Notification(Base):
    __tablename__ = "notifications"
    notification_id: Mapped[str] = mapped_column(String, primary_key=True)
    recipient_role: Mapped[str] = mapped_column(String, index=True)
    recipient_id: Mapped[str] = mapped_column(String, index=True)
    patient_id: Mapped[str | None] = mapped_column(String, index=True)
    kind: Mapped[str] = mapped_column(String, default="info")
    title: Mapped[str] = mapped_column(String)
    body: Mapped[str | None] = mapped_column(Text)
    link: Mapped[str | None] = mapped_column(String)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Order(Base):
    """A demo pharmacy order: no real pharmacy is contacted."""
    __tablename__ = "orders"
    order_id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    items: Mapped[list] = mapped_column(JSON, default=list)
    address: Mapped[str | None] = mapped_column(Text)
    payment: Mapped[str | None] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="placed")
    reference: Mapped[str | None] = mapped_column(String)
    eta: Mapped[str | None] = mapped_column(String)
    prescription_media: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class CareRequest(Base):
    __tablename__ = "care_requests"
    request_id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    service: Mapped[str] = mapped_column(String)
    request_date: Mapped[dt.date] = mapped_column(Date)
    request_time: Mapped[str] = mapped_column(String)
    note: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, default="open")
    accepted_by: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class ActivityLog(Base):
    """Small daily engagements (daily fact read, skill finished) — feeds streaks."""
    __tablename__ = "activity_log"
    activity_id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    kind: Mapped[str] = mapped_column(String)
    ref: Mapped[str | None] = mapped_column(String)
    activity_date: Mapped[dt.date] = mapped_column(Date, index=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class SyncLog(Base):
    __tablename__ = "sync_log"
    log_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    device_id: Mapped[str] = mapped_column(String, index=True)
    table_name: Mapped[str] = mapped_column(String)
    op: Mapped[str] = mapped_column(String)
    pk: Mapped[str] = mapped_column(String)
    queued_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    applied_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


# ------------------------------------------------------------------
# Donors, staff, charity assistance and the fund ledger (new tables).
# All money is in paise (integer), never floats. Nothing here is synced
# from devices: it is only written through the /charity and /donations APIs.
# ------------------------------------------------------------------
class Donor(Base):
    __tablename__ = "donors"
    donor_id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Staff(Base):
    """A Smivai administrator or an authorised charity-partner reviewer.
    Created only by `python -m app.manage create-staff`, never by sign-up."""
    __tablename__ = "staff"
    staff_id: Mapped[str] = mapped_column(String, primary_key=True)
    role: Mapped[str] = mapped_column(String)               # admin · charity_partner
    name: Mapped[str] = mapped_column(String)
    organisation: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class CharityApplication(Base):
    __tablename__ = "charity_applications"
    application_id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.patient_id"), index=True)
    submitted_by_role: Mapped[str] = mapped_column(String)
    submitted_by_id: Mapped[str] = mapped_column(String)
    applicant_name: Mapped[str] = mapped_column(String)
    contact_phone: Mapped[str | None] = mapped_column(String)
    caregiver_name: Mapped[str | None] = mapped_column(String)
    annual_income_paise: Mapped[int | None] = mapped_column(Integer)
    household_size: Mapped[int | None] = mapped_column(Integer)
    circumstances: Mapped[str | None] = mapped_column(Text)
    assistance_requested: Mapped[str | None] = mapped_column(Text)
    declaration: Mapped[bool] = mapped_column(Boolean, default=False)
    consent: Mapped[bool] = mapped_column(Boolean, default=False)
    # draft · submitted · under_review · info_requested · rejected · approved · active · completed
    status: Mapped[str] = mapped_column(String, default="draft", index=True)
    info_request: Mapped[str | None] = mapped_column(Text)
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    admin_decision: Mapped[str | None] = mapped_column(String)          # approved · rejected
    admin_id: Mapped[str | None] = mapped_column(String)
    admin_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    partner_decision: Mapped[str | None] = mapped_column(String)
    partner_id: Mapped[str | None] = mapped_column(String)
    partner_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    visits_allowed: Mapped[int] = mapped_column(Integer, default=5)
    demo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)
    submitted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    activated_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))


class CharityDocument(Base):
    """A supporting document. The file lives in a private folder, never a public URL."""
    __tablename__ = "charity_documents"
    document_id: Mapped[str] = mapped_column(String, primary_key=True)
    application_id: Mapped[str] = mapped_column(ForeignKey("charity_applications.application_id"), index=True)
    doc_type: Mapped[str] = mapped_column(String)
    mime: Mapped[str] = mapped_column(String)
    size_bytes: Mapped[int] = mapped_column(Integer)
    sha256: Mapped[str] = mapped_column(String)
    storage_name: Mapped[str] = mapped_column(String)            # file name inside the private folder
    uploaded_by: Mapped[str] = mapped_column(String)
    review_status: Mapped[str] = mapped_column(String, default="not_reviewed")  # not_reviewed · accepted · not_accepted
    uploaded_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class CharityEvent(Base):
    """Audit trail: who did what to an application, and when."""
    __tablename__ = "charity_events"
    event_id: Mapped[str] = mapped_column(String, primary_key=True)
    application_id: Mapped[str] = mapped_column(String, index=True)
    actor_role: Mapped[str] = mapped_column(String)
    actor_id: Mapped[str] = mapped_column(String)
    action: Mapped[str] = mapped_column(String)
    note: Mapped[str | None] = mapped_column(Text)
    at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class ParticipatingProvider(Base):
    """A doctor who has agreed how charity-covered consultations are settled."""
    __tablename__ = "participating_providers"
    doctor_id: Mapped[str] = mapped_column(String, primary_key=True)
    agreed_by_admin: Mapped[str] = mapped_column(String)
    terms: Mapped[str] = mapped_column(Text)
    agreed_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class LedgerEntry(Base):
    """Add-only fund ledger. kind: donation · consultation_payment · reversal ·
    refund · adjustment. direction: in (adds funds) · out (spends funds)."""
    __tablename__ = "ledger_entries"
    entry_id: Mapped[str] = mapped_column(String, primary_key=True)
    kind: Mapped[str] = mapped_column(String, index=True)
    direction: Mapped[str] = mapped_column(String)
    amount_paise: Mapped[int] = mapped_column(Integer)
    application_id: Mapped[str | None] = mapped_column(String, index=True)
    appointment_id: Mapped[str | None] = mapped_column(String)
    donation_id: Mapped[str | None] = mapped_column(String, index=True)
    reference: Mapped[str | None] = mapped_column(String)
    idempotency_key: Mapped[str] = mapped_column(String, unique=True)
    created_by_role: Mapped[str] = mapped_column(String)
    created_by_id: Mapped[str] = mapped_column(String)
    note: Mapped[str | None] = mapped_column(Text)
    demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class CoveredVisit(Base):
    """One charity-covered consultation. One row per appointment, ever."""
    __tablename__ = "covered_visits"
    claim_id: Mapped[str] = mapped_column(String, primary_key=True)
    application_id: Mapped[str] = mapped_column(String, index=True)
    appointment_id: Mapped[str] = mapped_column(String, unique=True)
    patient_id: Mapped[str] = mapped_column(String, index=True)
    doctor_id: Mapped[str] = mapped_column(String)
    fee_paise: Mapped[int] = mapped_column(Integer)
    covered_paise: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String)          # covered · awaiting_funds · reversed
    ledger_entry_id: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Donation(Base):
    """A donor's contribution. Funds count only after the payment is verified."""
    __tablename__ = "donations"
    donation_id: Mapped[str] = mapped_column(String, primary_key=True)
    donor_id: Mapped[str] = mapped_column(String, index=True)
    amount_paise: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String, default="INR")
    provider: Mapped[str] = mapped_column(String)                 # razorpay · demo
    provider_order_id: Mapped[str | None] = mapped_column(String, unique=True)
    provider_payment_id: Mapped[str | None] = mapped_column(String)
    # created · pending · paid · failed · cancelled · refunded
    status: Mapped[str] = mapped_column(String, default="created", index=True)
    receipt: Mapped[str] = mapped_column(String, unique=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class PaymentEvent(Base):
    """Each verified webhook event, once — duplicates are recognised by id."""
    __tablename__ = "payment_events"
    event_id: Mapped[str] = mapped_column(String, primary_key=True)
    event_type: Mapped[str] = mapped_column(String)
    donation_id: Mapped[str | None] = mapped_column(String)
    received_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=_now)


# Maps the client table name → (model, primary key attribute).
TABLE_MAP = {
    "patients": (Patient, "patient_id"),
    "caregivers": (Caregiver, "caregiver_id"),
    "doctors": (Doctor, "doctor_id"),
    "links": (CareLink, "link_id"),
    "appointments": (Appointment, "appointment_id"),
    "doctor_reviews": (DoctorReview, "review_id"),
    "vitals": (Vital, "vital_id"),
    "alerts": (Alert, "alert_id"),
    "notifications": (Notification, "notification_id"),
    "orders": (Order, "order_id"),
    "care_requests": (CareRequest, "request_id"),
    "activity_log": (ActivityLog, "activity_id"),
    "game_sessions": (GameSession, "session_id"),
    "item_responses": (ItemResponse, "response_id"),
    "reminders": (Reminder, "reminder_id"),
    "reminder_events": (ReminderEvent, "event_id"),
    "memory_bank": (Memory, "memory_id"),
    "cognitive_scores": (CognitiveScore, "score_id"),
    "moods": (Mood, "mood_id"),
    "care_notes": (CareNote, "note_id"),
    "patient_notes": (PatientNote, "note_id"),
    "contacts": (Contact, "contact_id"),
    "routines": (Routine, "routine_id"),
}

# Tables only the patient themself may write, whatever care links exist.
# No read endpoint serves them either: they stay on the patient's devices
# and in their own row of the central store.
PRIVATE_TABLES = {"patient_notes"}

# Client field name → column name, where the two differ.
FIELD_ALIASES = {
    "game_sessions": {"date": "session_date"},
    "memory_bank": {"group": "memory_group"},
    "appointments": {"date": "appointment_date", "time": "appointment_time"},
    "care_requests": {"date": "request_date", "time": "request_time"},
    "activity_log": {"date": "activity_date"},
    "reminders": {"date": "reminder_date", "time": "reminder_time", "repeat": "repeat_rule"},
    "reminder_events": {"date": "event_date"},
    "cognitive_scores": {"date": "score_date"},
    "moods": {"date": "mood_date"},
    "routines": {"time": "routine_time"},
}
