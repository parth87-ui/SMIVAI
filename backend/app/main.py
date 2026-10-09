"""SMIVAI — FastAPI service.

Endpoints the device app talks to:

    POST /sync/push                       drain the device queue
    GET  /patients                        patients visible to the caller
    GET  /patients/{id}                   one patient
    GET  /patients/{id}/sessions          activity history
    GET  /patients/{id}/insights          activity + performance summary
    GET  /patients/{id}/scores            daily Cognitive Activity Score
    GET  /patients/{id}/reminders         reminder rules
    POST /patients/{id}/reminders         create (caregiver or doctor)
    PATCH/DELETE /reminders/{id}          manage
    GET  /patients/{id}/memories          Memory Bank
    GET  /patients/{id}/notes             care notes

Run it:
    uvicorn app.main:app --reload --port 8000

Then point the web app at it by setting, in the browser console:
    S.CONFIG.apiBase = 'http://localhost:8000'
The sync engine switches from the local mirror to this service with no
other change.
"""
from __future__ import annotations

import datetime as dt
import logging
import os
import uuid

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import ai, auth, charity, donations, language, migrations, models, plans, privacy, schemas, scoring
from .database import ACTIVE_URL, Base, engine, get_db
from .deps import (CARE_TEAM_ROLES, SCOPES, Actor, authorize_patient, authorize_scope, current_actor, has_link,
                   require_roles, shares, visible_patients)

log = logging.getLogger("smivai.api")

app = FastAPI(
    title="SMIVAI API",
    version="1.0.0",
    description=(
        "Cognitive activity and memory assistance platform for elderly users. "
        "Provides activity and performance insights only — not a diagnostic service."
    ),
)

# Only the local web app may call this API from a browser. Add origins with
# SMIVAI_CORS_ORIGINS (comma-separated) if the app is served from elsewhere.
CORS_ORIGINS = [o.strip() for o in os.getenv(
    "SMIVAI_CORS_ORIGINS", "http://localhost:8123,http://127.0.0.1:8123"
).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    # The X-SMIVAI-* pair only matters when SMIVAI_ALLOW_HEADER_AUTH=1 (deps.py).
    allow_headers=["Authorization", "Content-Type", "X-SMIVAI-Role", "X-SMIVAI-Actor"],
)

Base.metadata.create_all(bind=engine)     # new tables only — never alters existing ones
migrations.run(engine)                    # additive column changes, backed up first (app/migrations.py)

# Bhashini / AI4Bharat proxy — keeps ULCA credentials off the device.
app.include_router(language.router)
# Sign-in, plan limits and the Premium conversation endpoint.
app.include_router(auth.router)
app.include_router(ai.router)
# The signed-in person's own data: export, consents, erase.
app.include_router(privacy.router)
# Charity assistance applications, dual approval, covered visits and the fund ledger.
app.include_router(charity.router)
app.include_router(donations.router)


@app.middleware("http")
async def security_headers(request, call_next):
    """Plain hardening for an API that carries health-related data."""
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    if request.url.path not in ("/docs", "/redoc", "/openapi.json"):
        response.headers.setdefault("Cache-Control", "no-store")
    return response

DISCLAIMER = (
    "SMIVAI provides cognitive activity and performance insights. "
    "It does not replace professional medical diagnosis."
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "database": ACTIVE_URL.split("://")[0],
        "server_time": dt.datetime.now(dt.timezone.utc),
        "auth": "bearer token (POST /auth/start → /auth/verify)",
        "advanced_ai": ai._client() is not None,
        "disclaimer": DISCLAIMER,
    }


# ------------------------------------------------------------------
# Sync
# ------------------------------------------------------------------
def _coerce(column, value):
    """The device sends ISO strings; Date/DateTime columns need real objects.

    PostgreSQL's driver would coerce most of these itself, but SQLite will not
    and relying on driver behaviour is fragile either way — so normalise here.
    """
    if value is None:
        return None
    py_type = getattr(column.type, "python_type", None)
    try:
        py_type = py_type if isinstance(py_type, type) else None
    except NotImplementedError:
        py_type = None

    if py_type is dt.datetime and isinstance(value, str):
        return dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    if py_type is dt.date and isinstance(value, str):
        return dt.date.fromisoformat(value[:10])
    if py_type is bool and isinstance(value, str):
        return value.lower() in ("1", "true", "yes")
    return value


class SyncRejected(Exception):
    """A pushed row the caller may not write. The message is safe to return."""


# Care links are created only from a care code (POST /links), never pushed.
SERVER_ONLY_TABLES = {"links"}
# Profile tables: the row's own id is its scope, and sync never deletes one.
ENTITY_ROLES = {"patients": "patient", "caregivers": "caregiver", "doctors": "doctor"}
# Columns only the service sets. A pushed value for them is ignored, so a
# device cannot grant itself Premium or rewrite a patient's care code.
PROTECTED_FIELDS = {
    "patients": {"plan", "share_code", "created_at"},
    "caregivers": {"plan"},
    "doctors": {"plan", "license_verified", "license_last4"},
}


# Which shared scope a care-team member needs to write each kind of record.
TABLE_SCOPE = {
    "memory_bank": "memories",
    "vitals": "health", "orders": "health",
    "game_sessions": "activity", "item_responses": "activity", "cognitive_scores": "activity",
    "moods": "activity", "activity_log": "activity",
}


def _reaches(db: Session, actor: Actor, table: str, patient_id: str) -> bool:
    if table in models.PRIVATE_TABLES:
        # A patient's own notepad: a care link does not reach it.
        return actor.role == "patient" and patient_id == actor.actor_id
    if actor.role == "patient":
        return patient_id == actor.actor_id
    if not has_link(db, actor.role, actor.actor_id, patient_id):
        return False
    scope = TABLE_SCOPE.get(table)
    return scope is None or shares(db, actor, patient_id, scope)


def _check_write(db: Session, actor: Actor, rec: schemas.SyncRecord, existing) -> None:
    """Raise SyncRejected unless the caller may apply this row.

    Ownership is judged on the row as it is stored, not only on what the
    device claims in its payload: a pushed row can neither reach into
    another patient's record nor move a record to a different patient.
    """
    if rec.table in SERVER_ONLY_TABLES:
        # Created only from a care code (POST /links). The patient may still
        # change what an existing link shares, or end it, from their device.
        if (rec.op == "update" and existing is not None and actor.role == "patient"
                and existing.patient_id == actor.actor_id):
            return
        raise SyncRejected("care links are created with a care code, not through sync")

    if rec.table in ENTITY_ROLES:
        if rec.op == "delete":
            raise SyncRejected("profiles cannot be deleted through sync")
        if rec.table == "patients":
            if existing is None and not (actor.role == "patient" and rec.pk == actor.actor_id):
                raise SyncRejected("not your record")
            if existing is not None and not _reaches(db, actor, rec.table, rec.pk):
                raise SyncRejected("not your record")
        elif not (actor.role == ENTITY_ROLES[rec.table] and rec.pk == actor.actor_id):
            raise SyncRejected("not your record")
        return

    claimed = rec.payload.get("patient_id")
    if existing is not None:
        owner = existing.patient_id
        if owner is None or not _reaches(db, actor, rec.table, owner):
            raise SyncRejected("not your record")
        if claimed is not None and claimed != owner:
            raise SyncRejected("a record cannot move to another patient")
        return

    if rec.op == "delete":
        return  # nothing stored under that id — deleting it is a no-op
    if claimed is None:
        raise SyncRejected("patient_id is required")
    if not _reaches(db, actor, rec.table, claimed):
        raise SyncRejected("not your record")


DEVICE_ORDER_STATUSES = ("demo", "placed", "cancelled")   # "placed": older devices


def _check_order(rec: schemas.SyncRecord, existing) -> None:
    """No pharmacy is connected, so no device may claim progress only a
    pharmacy could report (dispatched, delivered…), and an order must carry
    a prescription reference — the photo itself stays on the device."""
    if rec.op == "delete":
        return
    status_now = rec.payload.get("status", existing.status if existing is not None else "demo")
    if status_now not in DEVICE_ORDER_STATUSES:
        raise SyncRejected("order progress can only come from a pharmacy")
    if existing is None and not rec.payload.get("prescription_media"):
        raise SyncRejected("an order needs a prescription")


def duplicate_reminder(db: Session, patient_id: str, title: str, time_: str, repeat: str,
                       date: dt.date | None, exclude_id: str | None = None):
    """An active reminder with the same title (any case), time and repeat —
    and the same day for a one-off. Mirrors Reminders.findDuplicate (device)."""
    q = db.query(models.Reminder).filter(
        models.Reminder.patient_id == patient_id, models.Reminder.status == "active",
        models.Reminder.reminder_time == time_, models.Reminder.repeat_rule == (repeat or "once"))
    if exclude_id:
        q = q.filter(models.Reminder.reminder_id != exclude_id)
    want = (title or "").strip().lower()
    for r in q.all():
        if (r.title or "").strip().lower() == want and ((repeat or "once") != "once" or r.reminder_date == date):
            return r
    return None


def _check_review(db: Session, actor: Actor, rec: schemas.SyncRecord, existing) -> None:
    """A rating must come from the patient, for their own completed visit, once."""
    if rec.op == "delete":
        return
    if existing is not None:
        raise SyncRejected("a review cannot be changed once given")
    if actor.role != "patient":
        raise SyncRejected("only the patient can rate their visit")
    p = rec.payload
    appt = db.get(models.Appointment, p.get("appointment_id") or "")
    if appt is None or appt.patient_id != actor.actor_id or appt.status != "completed":
        raise SyncRejected("only a completed visit of your own can be rated")
    if p.get("doctor_id") != appt.doctor_id:
        raise SyncRejected("the review must name the visit's doctor")
    stars = p.get("stars")
    if not isinstance(stars, int) or not 1 <= stars <= 5:
        raise SyncRejected("stars must be 1 to 5")
    if db.query(models.DoctorReview).filter(models.DoctorReview.appointment_id == appt.appointment_id).first():
        raise SyncRejected("this visit has already been rated")


def _check_reminder(db: Session, rec: schemas.SyncRecord, existing) -> None:
    if rec.op != "insert" or existing is not None:
        return
    p = rec.payload
    date_raw = p.get("date", p.get("reminder_date"))
    date = dt.date.fromisoformat(str(date_raw)[:10]) if date_raw else None
    if duplicate_reminder(db, p.get("patient_id"), p.get("title", ""), p.get("time", p.get("reminder_time")),
                          p.get("repeat", p.get("repeat_rule", "once")), date):
        raise SyncRejected("this reminder already exists")


OPEN_APPOINTMENT = ("scheduled", "confirmed")


def _check_appointment(db: Session, actor: Actor, rec: schemas.SyncRecord, existing) -> None:
    """Booking rules the device cannot be trusted to keep.

    * Only the appointment's own doctor may confirm it — a patient or
      caregiver marking it "confirmed" would be a claim nobody made.
    * One open booking per doctor and time: a slot cannot be double-booked.
    """
    if rec.op == "delete":
        return
    p = rec.payload
    status_now = p.get("status", existing.status if existing is not None else "scheduled")
    doctor_id = p.get("doctor_id", existing.doctor_id if existing is not None else None)
    was_confirmed = existing is not None and existing.status == "confirmed"
    if status_now == "confirmed" and not was_confirmed and not (actor.role == "doctor" and actor.actor_id == doctor_id):
        raise SyncRejected("only the doctor can confirm an appointment")

    if status_now in OPEN_APPOINTMENT:
        date_raw = p.get("date", p.get("appointment_date"))
        when = (dt.date.fromisoformat(str(date_raw)[:10]) if date_raw
                else existing.appointment_date if existing is not None else None)
        time_ = p.get("time", p.get("appointment_time", existing.appointment_time if existing is not None else None))
        clash = (
            db.query(models.Appointment)
            .filter(models.Appointment.doctor_id == doctor_id, models.Appointment.appointment_date == when,
                    models.Appointment.appointment_time == time_,
                    models.Appointment.status.in_(OPEN_APPOINTMENT),
                    models.Appointment.appointment_id != rec.pk)
            .first()
        )
        if clash is not None:
            raise SyncRejected("that time is already booked")


def _apply_record(db: Session, device_id: str, actor: Actor, rec: schemas.SyncRecord) -> None:
    entry = models.TABLE_MAP.get(rec.table)
    if entry is None:
        raise SyncRejected(f"unknown table '{rec.table}'")
    model, pk_field = entry
    existing = db.get(model, rec.pk)
    _check_write(db, actor, rec, existing)
    if rec.table == "appointments":
        _check_appointment(db, actor, rec, existing)
    elif rec.table == "orders":
        _check_order(rec, existing)
    elif rec.table == "reminders":
        _check_reminder(db, rec, existing)
    elif rec.table == "doctor_reviews":
        _check_review(db, actor, rec, existing)

    if rec.op == "delete":
        if existing is not None:
            db.delete(existing)
    elif rec.table == "links":
        # A patient's update to their own link: what it shares, or ending it.
        if "scopes" in rec.payload:
            raw = rec.payload.get("scopes") or {}
            existing.scopes = {k: raw.get(k) is not False for k in SCOPES}
        if rec.payload.get("status") == "removed" and existing.status != "removed":
            existing.status = "removed"
            existing.removed_at = dt.datetime.now(dt.timezone.utc)
    else:
        aliases = models.FIELD_ALIASES.get(rec.table, {})
        protected = PROTECTED_FIELDS.get(rec.table, set())
        columns = {c.key: c for c in model.__table__.columns}
        data = {}
        for key, value in rec.payload.items():
            name = aliases.get(key, key)
            column = columns.get(name)
            if column is not None and name not in protected and name != pk_field:
                data[name] = _coerce(column, value)

        if existing is None:
            data[pk_field] = rec.pk
            db.add(model(**data))
        else:
            for key, value in data.items():
                setattr(existing, key, value)

    db.add(models.SyncLog(
        device_id=device_id, table_name=rec.table, op=rec.op,
        pk=rec.pk, queued_at=rec.queued_at,
    ))


@app.post("/sync/push", response_model=schemas.SyncPushResponse)
def sync_push(
    body: schemas.SyncPushRequest,
    actor: Actor = Depends(current_actor),
    db: Session = Depends(get_db),
):
    """Drain a device queue. Records are applied in the order they were queued.

    Each record is committed on its own, so one refused or malformed row
    never undoes the rows before it. ``results`` lines up with ``records``
    by position, so the device knows exactly which rows to keep retrying.
    """
    results: list[schemas.SyncResult] = []
    for rec in body.records:
        try:
            _apply_record(db, body.device_id, actor, rec)
            db.commit()
            results.append(schemas.SyncResult(table=rec.table, pk=rec.pk, ok=True))
        except SyncRejected as exc:
            db.rollback()
            results.append(schemas.SyncResult(table=rec.table, pk=rec.pk, ok=False, error=str(exc)))
        except Exception:  # noqa: BLE001 — one bad row must not lose the batch
            db.rollback()
            log.exception("sync: could not apply %s/%s", rec.table, rec.pk)
            results.append(schemas.SyncResult(table=rec.table, pk=rec.pk, ok=False,
                                              error="this record could not be saved"))
    errors = [f"{r.table}/{r.pk}: {r.error}" for r in results if not r.ok]
    return schemas.SyncPushResponse(
        accepted=sum(1 for r in results if r.ok),
        rejected=len(errors),
        errors=errors,
        results=results,
        server_time=dt.datetime.now(dt.timezone.utc),
    )


# ------------------------------------------------------------------
# Patients
# ------------------------------------------------------------------
@app.get("/patients", response_model=list[schemas.PatientOut])
def list_patients(actor: Actor = Depends(current_actor), db: Session = Depends(get_db)):
    return visible_patients(actor, db)


@app.get("/patients/{patient_id}", response_model=schemas.PatientOut)
def get_patient(patient: models.Patient = Depends(authorize_patient)):
    return patient


@app.get("/patients/{patient_id}/sessions", response_model=list[schemas.SessionOut])
def get_sessions(
    limit: int = 50,
    patient: models.Patient = Depends(authorize_scope("activity")),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.GameSession)
        .filter(models.GameSession.patient_id == patient.patient_id)
        .order_by(models.GameSession.timestamp.desc())
        .limit(limit)
        .all()
    )


@app.get("/patients/{patient_id}/scores", response_model=list[schemas.CognitiveScoreOut])
def get_scores(
    patient: models.Patient = Depends(authorize_scope("activity")),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.CognitiveScore)
        .filter(models.CognitiveScore.patient_id == patient.patient_id)
        .order_by(models.CognitiveScore.score_date)
        .all()
    )


def _adherence(db: Session, patient_id: str, days: int = 14) -> int:
    since = dt.date.today() - dt.timedelta(days=days)
    events = (
        db.query(models.ReminderEvent)
        .filter(
            models.ReminderEvent.patient_id == patient_id,
            models.ReminderEvent.event_date >= since,
        )
        .all()
    )
    if not events:
        return 100
    completed = sum(1 for e in events if e.status == "completed")
    return round(100 * completed / len(events))


@app.get("/patients/{patient_id}/insights", response_model=schemas.PatientInsights)
def get_insights(
    patient: models.Patient = Depends(authorize_scope("activity")),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(models.GameSession)
        .filter(models.GameSession.patient_id == patient.patient_id)
        .order_by(models.GameSession.timestamp)
        .all()
    )
    cas = scoring.cognitive_activity_score(sessions)
    return schemas.PatientInsights(
        patient_id=patient.patient_id,
        name=patient.name,
        cognitive_activity_score=cas.score,
        trend=cas.trend,
        delta_from_recent_average=cas.delta,
        average_accuracy=cas.accuracy,
        average_response_time=cas.response_time,
        sessions_counted=cas.sessions,
        reminder_adherence_percent=_adherence(db, patient.patient_id),
    )


PROGRESS_DISCLAIMER = "This is a progress-tracking aid, not a medical diagnosis."


@app.get("/patients/{patient_id}/ability")
def get_ability(
    patient: models.Patient = Depends(authorize_scope("activity")),
    db: Session = Depends(get_db),
):
    """Rasch (1PL) ability per activity: MAP over the last games, with its error."""
    sessions = (
        db.query(models.GameSession)
        .filter(models.GameSession.patient_id == patient.patient_id)
        .order_by(models.GameSession.timestamp)
        .all()
    )
    by_game: dict[str, list] = {}
    for s in sessions:
        by_game.setdefault(s.game_type, []).append(s)
    served = patient.difficulty or {}
    activities = []
    for game in plans.ALL_GAMES:
        rows = by_game.get(game, [])
        est = scoring.ability_from_sessions(rows)
        current = served.get(game) or "easy"
        nxt = scoring.next_level(
            [(s.difficulty, round(scoring.clamp(s.accuracy or 0, 0, 1) * max(0, round(s.attempts or 0))),
              max(0, round(s.attempts or 0))) for s in rows],
            current,
        )
        activities.append({
            "next_level": nxt["level"],
            "next_level_reason": nxt["reason"],
            "answers_at_level": nxt["answers_at_level"],
            "game_type": game,
            "plays": len(rows),
            "theta": round(est.theta, 3) if rows else None,
            "se": round(est.se, 3) if rows else None,
            "answers": est.answers,
            "provisional": est.provisional,
            "level": served.get(game) or "easy",
        })
    return {
        "patient_id": patient.patient_id,
        "method": f"MAP, normal prior (mean {scoring.PRIOR_MEAN}, sd {scoring.PRIOR_SD}), "
                  f"last {scoring.WINDOW} games per activity; level difficulties are design values",
        "activities": activities,
        "disclaimer": PROGRESS_DISCLAIMER,
    }


@app.get("/doctors/{doctor_id}/rating")
def doctor_rating(doctor_id: str, _: Actor = Depends(current_actor), db: Session = Depends(get_db)):
    """Average of verified reviews; {average: null, count: 0} when there are none."""
    rows = db.query(models.DoctorReview.stars).filter(models.DoctorReview.doctor_id == doctor_id).all()
    if not rows:
        return {"doctor_id": doctor_id, "average": None, "count": 0}
    return {"doctor_id": doctor_id, "average": round(sum(r[0] for r in rows) / len(rows), 1), "count": len(rows)}


@app.get("/calibration")
def get_calibration(actor: Actor = Depends(current_actor), db: Session = Depends(get_db)):
    """Level difficulties estimated from everyone's answers (aggregate only).

    Doctors only. Returns per-level difficulty and counts — never a person's
    answers or ability.
    """
    if actor.role != "doctor":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Calibration is available to doctors")
    rows = db.query(models.ItemResponse.patient_id, models.ItemResponse.game_type,
                    models.ItemResponse.level, models.ItemResponse.correct).all()
    items = scoring.calibrate_items([(r[0], r[1], r[2], bool(r[3])) for r in rows])
    return {
        "items": [
            {"game_type": i.game_type, "level": i.level, "design_b": i.design_b,
             "estimated_b": i.estimated_b, "se": i.se, "b": i.b,
             "responses": i.responses, "persons": i.persons, "calibrated": i.calibrated}
            for i in items
        ],
        "rule": f"calibrated only with at least {scoring.CALIBRATION_MIN_RESPONSES} answers "
                f"from {scoring.CALIBRATION_MIN_PERSONS} people; otherwise the design value is used",
        "note": "Devices do not use calibrated values yet. Not a validated psychometric calibration.",
        "disclaimer": PROGRESS_DISCLAIMER,
    }


# ------------------------------------------------------------------
# Reminders
# ------------------------------------------------------------------
@app.get("/patients/{patient_id}/reminders", response_model=list[schemas.ReminderOut])
def list_reminders(
    patient: models.Patient = Depends(authorize_patient),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Reminder)
        .filter(models.Reminder.patient_id == patient.patient_id)
        .order_by(models.Reminder.reminder_time)
        .all()
    )


@app.post("/patients/{patient_id}/reminders", response_model=schemas.ReminderOut, status_code=201)
def create_reminder(
    body: schemas.ReminderIn,
    patient: models.Patient = Depends(authorize_patient),
    actor: Actor = Depends(current_actor),
    db: Session = Depends(get_db),
):
    if actor.role == "patient":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Patients can view reminders but not create them")
    if duplicate_reminder(db, patient.patient_id, body.title, body.reminder_time, body.repeat_rule, body.reminder_date):
        raise HTTPException(status.HTTP_409_CONFLICT, "This reminder already exists")
    row = models.Reminder(
        reminder_id=f"rem_{uuid.uuid4().hex[:12]}",
        patient_id=patient.patient_id,
        title=body.title,
        description=body.description,
        category=body.category,
        reminder_date=body.reminder_date,
        reminder_time=body.reminder_time,
        repeat_rule=body.repeat_rule,
        repeat_days=body.repeat_days,
        priority=body.priority,
        status="active",
        created_by_role=actor.role,
        created_by_id=actor.actor_id,
        created_by_name=actor.actor_id,
        voice_enabled=body.voice_enabled,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.patch("/reminders/{reminder_id}", response_model=schemas.ReminderOut)
def update_reminder(
    reminder_id: str,
    patch: schemas.ReminderPatch,
    actor: Actor = Depends(current_actor),
    db: Session = Depends(get_db),
):
    row = db.get(models.Reminder, reminder_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reminder not found")
    authorize_patient(row.patient_id, actor, db)
    # Only the fields ReminderPatch declares can change — never the owner.
    for key, value in patch.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row


@app.delete("/reminders/{reminder_id}", status_code=204)
def delete_reminder(
    reminder_id: str,
    actor: Actor = Depends(current_actor),
    db: Session = Depends(get_db),
):
    row = db.get(models.Reminder, reminder_id)
    if row is None:
        return
    authorize_patient(row.patient_id, actor, db)
    db.delete(row)
    db.commit()


# ------------------------------------------------------------------
# Memory bank / notes
# ------------------------------------------------------------------
@app.get("/patients/{patient_id}/memories")
def list_memories(
    patient: models.Patient = Depends(authorize_scope("memories")),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(models.Memory)
        .filter(models.Memory.patient_id == patient.patient_id)
        .order_by(models.Memory.category)
        .all()
    )
    return [
        {
            "memory_id": r.memory_id, "category": r.category, "title": r.title,
            "content": r.content, "icon": r.icon,
        }
        for r in rows
    ]


@app.get("/patients/{patient_id}/notes")
def list_notes(
    patient: models.Patient = Depends(authorize_patient),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(models.CareNote)
        .filter(models.CareNote.patient_id == patient.patient_id)
        .order_by(models.CareNote.timestamp.desc())
        .all()
    )
    return [
        {
            "note_id": r.note_id, "created_by": r.created_by,
            "created_by_name": r.created_by_name, "content": r.content,
            "timestamp": r.timestamp,
        }
        for r in rows
    ]


# ------------------------------------------------------------------
# Care links — the only way a caregiver or doctor gains access
# ------------------------------------------------------------------
@app.get("/links")
def list_links(actor: Actor = Depends(current_actor), db: Session = Depends(get_db)):
    if actor.role == "patient":
        rows = (
            db.query(models.CareLink)
            .filter(models.CareLink.patient_id == actor.actor_id, models.CareLink.status == "active")
            .all()
        )
    else:
        rows = (
            db.query(models.CareLink)
            .filter(
                models.CareLink.actor_role == actor.role,
                models.CareLink.actor_id == actor.actor_id,
                models.CareLink.status == "active",
            )
            .all()
        )
    return [
        {
            "link_id": r.link_id, "patient_id": r.patient_id,
            "actor_role": r.actor_role, "actor_id": r.actor_id, "created_at": r.created_at,
            "scopes": {k: (r.scopes or {}).get(k, True) is not False for k in SCOPES},
        }
        for r in rows
    ]


@app.post("/links", status_code=201)
def create_link(body: schemas.LinkIn, actor: Actor = Depends(current_actor), db: Session = Depends(get_db)):
    """Join a patient's care team with the code they read out to you."""
    if actor.role == "patient":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Share your care code instead")
    if actor.role not in CARE_TEAM_ROLES:
        # Donors and staff never join a care team, whatever code they hold.
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only caregivers and doctors can join a care team")

    code = body.share_code.strip().upper()
    patient = db.query(models.Patient).filter(models.Patient.share_code == code).first()
    if patient is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No SMIVAI member has that care code")

    ok, reason = plans.check_link(db, actor.role, actor.actor_id, patient)
    if not ok:
        raise HTTPException(status.HTTP_409_CONFLICT, reason)

    row = models.CareLink(
        link_id=f"lnk_{uuid.uuid4().hex[:12]}", patient_id=patient.patient_id,
        actor_role=actor.role, actor_id=actor.actor_id, status="active",
    )
    db.add(row)
    db.add(models.Notification(
        notification_id=f"ntf_{uuid.uuid4().hex[:12]}", recipient_role="patient",
        recipient_id=patient.patient_id, patient_id=patient.patient_id, kind="link",
        title="Someone joined your care team",
        body=f"A {actor.role} can now see your SMIVAI activity.",
    ))
    db.commit()
    return {"link_id": row.link_id, "patient_id": patient.patient_id, "patient_name": patient.name}


@app.patch("/links/{link_id}/scopes")
def set_link_scopes(link_id: str, body: schemas.ScopesIn, actor: Actor = Depends(current_actor),
                    db: Session = Depends(get_db)):
    """The patient chooses what one caregiver or doctor may see."""
    row = db.get(models.CareLink, link_id)
    if row is None or actor.role != "patient" or row.patient_id != actor.actor_id or row.status != "active":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    row.scopes = body.model_dump()
    db.commit()
    return {"link_id": row.link_id, "scopes": row.scopes}


@app.delete("/links/{link_id}", status_code=204)
def remove_link(link_id: str, actor: Actor = Depends(current_actor), db: Session = Depends(get_db)):
    row = db.get(models.CareLink, link_id)
    if row is None:
        return
    mine = (
        (actor.role == "patient" and row.patient_id == actor.actor_id)
        or (row.actor_role == actor.role and row.actor_id == actor.actor_id)
    )
    if not mine:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    row.status = "removed"
    row.removed_at = dt.datetime.now(dt.timezone.utc)
    db.commit()


# ------------------------------------------------------------------
# Plans — the same numbers the device enforces
# ------------------------------------------------------------------
@app.get("/plan")
def my_plan(actor: Actor = Depends(require_roles("patient", "caregiver", "doctor")), db: Session = Depends(get_db)):
    return plans.summary(db, actor.role, actor.actor_id)


@app.post("/plan/upgrade")
def upgrade_plan(body: schemas.UpgradeIn, actor: Actor = Depends(require_roles("patient", "caregiver", "doctor")),
                 db: Session = Depends(get_db)):
    """Demo upgrade: no payment gateway is called and no money moves."""
    row = plans.entity(db, actor.role, actor.actor_id)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Account not found")
    row.plan = "premium" if body.plan == "premium" else "free"
    db.commit()
    body_out = plans.summary(db, actor.role, actor.actor_id)
    body_out["payment"] = "Demo payment — no money was charged"
    return body_out


@app.get("/patients/{patient_id}/games")
def patient_games(patient: models.Patient = Depends(authorize_patient), db: Session = Depends(get_db)):
    plan = plans.plan_of(db, "patient", patient.patient_id)
    return {
        "plan": plan,
        "playable": plans.games_for(plan),
        "locked": [g for g in plans.ALL_GAMES if g not in plans.games_for(plan)],
    }


@app.post("/patients/{patient_id}/sessions", status_code=201)
def create_session(
    body: schemas.SessionIn,
    patient: models.Patient = Depends(authorize_scope("activity")),
    db: Session = Depends(get_db),
):
    """Record a completed activity — refused if the plan does not include it."""
    if not plans.can_play(db, patient.patient_id, body.game_type):
        raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, f"{body.game_type} needs SMIVAI Premium")
    row = models.GameSession(
        session_id=f"ses_{uuid.uuid4().hex[:12]}", patient_id=patient.patient_id,
        game_type=body.game_type, difficulty=body.difficulty, score=body.score,
        accuracy=body.accuracy, response_time=body.response_time, mistakes=body.mistakes,
        attempts=body.attempts, completion_status=body.completion_status,
        duration_seconds=body.duration_seconds, content_level=body.content_level,
        source=body.source, session_date=body.session_date or dt.date.today(),
    )
    db.add(row)
    db.commit()
    return {"session_id": row.session_id}


# ------------------------------------------------------------------
# Everyday records
# ------------------------------------------------------------------
@app.get("/patients/{patient_id}/appointments")
def list_appointments(patient: models.Patient = Depends(authorize_patient), db: Session = Depends(get_db)):
    rows = (
        db.query(models.Appointment)
        .filter(models.Appointment.patient_id == patient.patient_id)
        .order_by(models.Appointment.appointment_date)
        .all()
    )
    return [
        {
            "appointment_id": r.appointment_id, "doctor_id": r.doctor_id, "doctor_name": r.doctor_name,
            "speciality": r.speciality, "date": r.appointment_date, "time": r.appointment_time,
            "mode": r.mode, "status": r.status, "reason": r.reason,
        }
        for r in rows
    ]


@app.get("/patients/{patient_id}/vitals")
def list_vitals(
    kind: str | None = None,
    patient: models.Patient = Depends(authorize_scope("health")),
    db: Session = Depends(get_db),
):
    q = db.query(models.Vital).filter(models.Vital.patient_id == patient.patient_id)
    if kind:
        q = q.filter(models.Vital.kind == kind)
    rows = q.order_by(models.Vital.recorded_at.desc()).limit(200).all()
    return [
        {
            "vital_id": r.vital_id, "kind": r.kind, "value": r.value, "systolic": r.systolic,
            "diastolic": r.diastolic, "unit": r.unit, "recorded_at": r.recorded_at, "source": r.source,
        }
        for r in rows
    ]


@app.get("/patients/{patient_id}/alerts")
def list_alerts(patient: models.Patient = Depends(authorize_patient), db: Session = Depends(get_db)):
    rows = (
        db.query(models.Alert)
        .filter(models.Alert.patient_id == patient.patient_id)
        .order_by(models.Alert.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {"alert_id": r.alert_id, "kind": r.kind, "title": r.title, "body": r.body,
         "status": r.status, "created_at": r.created_at}
        for r in rows
    ]


@app.post("/patients/{patient_id}/alerts", status_code=201)
def raise_alert(
    body: schemas.AlertIn,
    patient: models.Patient = Depends(authorize_patient),
    actor: Actor = Depends(current_actor),
    db: Session = Depends(get_db),
):
    """Raise an SOS. SMIVAI alerts the care team; it does not call emergency services."""
    row = models.Alert(
        alert_id=f"alert_{uuid.uuid4().hex[:12]}", patient_id=patient.patient_id,
        kind=body.kind, severity=body.severity, title=body.title or f"{patient.name} pressed SOS",
        body=body.body or "Needs help now.", status="open",
    )
    db.add(row)
    for link in (
        db.query(models.CareLink)
        .filter(models.CareLink.patient_id == patient.patient_id,
                models.CareLink.actor_role == "caregiver",
                models.CareLink.status == "active")
        .all()
    ):
        db.add(models.Notification(
            notification_id=f"ntf_{uuid.uuid4().hex[:12]}", recipient_role="caregiver",
            recipient_id=link.actor_id, patient_id=patient.patient_id, kind="sos",
            title=f"SOS from {patient.name}", body=row.body, link="#/caregiver/alerts",
        ))
    db.commit()
    return {
        "alert_id": row.alert_id,
        "notified_caregivers": plans.caregivers_of(db, patient.patient_id),
        "note": "SMIVAI alerts caregivers in the app. It does not contact emergency services.",
    }


@app.get("/notifications")
def my_notifications(actor: Actor = Depends(current_actor), db: Session = Depends(get_db)):
    rows = (
        db.query(models.Notification)
        .filter(models.Notification.recipient_role == actor.role,
                models.Notification.recipient_id == actor.actor_id)
        .order_by(models.Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {"notification_id": r.notification_id, "kind": r.kind, "title": r.title, "body": r.body,
         "link": r.link, "read": r.read, "created_at": r.created_at}
        for r in rows
    ]
