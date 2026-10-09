"""SMIVAI — request/response schemas."""
from __future__ import annotations

import datetime as dt
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class SyncRecord(BaseModel):
    table: str
    op: Literal["insert", "update", "delete"]
    pk: str
    payload: dict[str, Any] = Field(default_factory=dict)
    queued_at: dt.datetime | None = None


class SyncPushRequest(BaseModel):
    device_id: str
    records: list[SyncRecord]


class SyncResult(BaseModel):
    """What happened to one pushed record, in the same position as the request."""
    table: str
    pk: str
    ok: bool
    error: str | None = None


class SyncPushResponse(BaseModel):
    accepted: int
    rejected: int = 0
    errors: list[str] = Field(default_factory=list)
    results: list[SyncResult] = Field(default_factory=list)
    server_time: dt.datetime


class PatientOut(BaseModel):
    patient_id: str
    name: str
    age: int | None = None
    language: str = "en"
    district: str | None = None
    caregiver_id: str | None = None
    doctor_id: str | None = None

    class Config:
        from_attributes = True


class SessionOut(BaseModel):
    session_id: str
    patient_id: str
    game_type: str
    difficulty: str
    score: int
    accuracy: float
    response_time: float
    mistakes: int
    attempts: int
    completion_status: str
    session_date: dt.date

    class Config:
        from_attributes = True


HHMM = r"^([01]\d|2[0-3]):[0-5]\d$"


class ReminderIn(BaseModel):
    patient_id: str
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default="", max_length=2000)
    category: str = Field(default="custom", max_length=40)
    reminder_date: dt.date
    reminder_time: str = Field(pattern=HHMM)
    repeat_rule: str = Field(default="once", max_length=40)
    repeat_days: list[int] = Field(default_factory=list)
    priority: str = Field(default="normal", max_length=20)
    voice_enabled: bool = True


class ReminderPatch(BaseModel):
    """The fields of a reminder that may be edited. Owner and author are not here."""
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    category: str | None = Field(default=None, max_length=40)
    reminder_date: dt.date | None = None
    reminder_time: str | None = Field(default=None, pattern=HHMM)
    repeat_rule: str | None = Field(default=None, max_length=40)
    repeat_days: list[int] | None = None
    priority: str | None = Field(default=None, max_length=20)
    status: Literal["active", "paused"] | None = None   # same values as js/core/models.js
    voice_enabled: bool | None = None


class ReminderOut(ReminderIn):
    reminder_id: str
    status: str
    created_by_role: str
    created_by_id: str
    created_by_name: str | None = None

    class Config:
        from_attributes = True


class CognitiveScoreOut(BaseModel):
    score_date: dt.date
    score: int
    trend: str

    class Config:
        from_attributes = True


class PatientInsights(BaseModel):
    """Activity and performance summary. Explicitly not a clinical output."""
    patient_id: str
    name: str
    cognitive_activity_score: int
    trend: Literal["improving", "stable", "lower"]
    delta_from_recent_average: int
    average_accuracy: float
    average_response_time: float
    sessions_counted: int
    reminder_adherence_percent: int
    disclaimer: str = (
        "SMIVAI provides cognitive activity and performance insights. "
        "It does not replace professional medical diagnosis."
    )


# ------------------------------------------------------------------
# v2: care links, plans, sessions, alerts
# ------------------------------------------------------------------
class LinkIn(BaseModel):
    share_code: str


class ScopesIn(BaseModel):
    """What a patient shares with one care-team member (deps.SCOPES)."""
    model_config = ConfigDict(extra="forbid")
    memories: bool = True
    health: bool = True
    activity: bool = True


class UpgradeIn(BaseModel):
    plan: str = "premium"
    method: str | None = None


class SessionIn(BaseModel):
    game_type: str
    difficulty: str = "medium"
    score: int = 0
    accuracy: float = 0.0
    response_time: float = 0.0
    mistakes: int = 0
    attempts: int = 0
    completion_status: str = "completed"
    duration_seconds: int = 0
    content_level: int = 1
    source: str = "patient_app"
    session_date: dt.date | None = None


class AlertIn(BaseModel):
    kind: str = "sos"
    severity: str = "critical"
    title: str | None = None
    body: str | None = None
