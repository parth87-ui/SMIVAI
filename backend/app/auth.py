"""SMIVAI — sign-in and session tokens.

Mirrors the device flow in ``js/core/auth.py``'s browser counterpart:

    role → identity check (mock) → OTP (mock) → signed session token

What is real here: the token. It is an HMAC-SHA256 signed, expiring bearer
token issued by this service and verified on every request, and no identity
number is stored — only a salted SHA-256 hash and the last four digits.

What is a mock, and is labelled as such in every response:
  * the Aadhaar / ABHA / medical-registration check (no UIDAI, ABDM or NMC
    connection exists),
  * the OTP delivery — no SMS is sent, and the code is returned in the
    response so the prototype can be driven end to end.

Set ``SMIVAI_AUTH_SECRET`` in any real deployment; a random per-process
secret is used otherwise, which invalidates tokens on restart by design.

No SMS provider is connected. The one-time code is therefore only usable when
``SMIVAI_DEMO_OTP=1`` is set, which makes ``/auth/start`` return it in the
response (labelled as demo). Without that flag sign-in answers 503 rather than
pretending a message was sent.

Every sign-in step is rate limited per client address and per identity.
"""
from __future__ import annotations

import base64
import datetime as dt
import hashlib
import hmac
import json
import logging
import os
import re
import secrets
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .database import get_db
from . import models
from .ratelimit import limiter

log = logging.getLogger("smivai.auth")

router = APIRouter(prefix="/auth", tags=["auth"])

# An unset *or empty* secret falls back to a random per-process one — never an
# empty HMAC key.
SECRET = (os.getenv("SMIVAI_AUTH_SECRET") or secrets.token_hex(32)).encode()
if not os.getenv("SMIVAI_AUTH_SECRET"):
    log.warning("SMIVAI_AUTH_SECRET is not set: using a random secret, so every "
                "session ends when this server restarts.")
DEMO_OTP = os.getenv("SMIVAI_DEMO_OTP") == "1"
ID_SALT = os.getenv("SMIVAI_ID_SALT", "smivai-device-v1")
TTL_SECONDS = {"patient": 30 * 24 * 3600, "caregiver": 24 * 3600, "doctor": 12 * 3600,
               "donor": 24 * 3600, "admin": 8 * 3600, "charity_partner": 8 * 3600}
# Which identity each role signs in with. Donors and staff use a mobile
# number — never an Aadhaar number, which they have no need to share.
ROLE_ID_TYPES = {"patient": {"aadhaar", "abha"}, "caregiver": {"aadhaar"}, "doctor": {"license"},
                 "donor": {"mobile"}, "admin": {"mobile"}, "charity_partner": {"mobile"}}
# Accounts nobody can create by signing up: made by `python -m app.manage`.
STAFF_ROLES = {"admin", "charity_partner"}
MOCK_MOBILE_LABEL = "Demo mode — the mobile number is not verified by SMS"
OTP_TTL = dt.timedelta(minutes=5)
OTP_MAX_ATTEMPTS = 3
RESEND_COOLDOWN = dt.timedelta(seconds=20)
MAX_CHALLENGES = 10_000

# Sign-in limits (per 10 minutes). Generous for a person, tight for a script.
_START_PER_IP = limiter(20, 600)
_START_PER_ID = limiter(5, 600)
_VERIFY_PER_IP = limiter(30, 600)
_PROFILE_PER_IP = limiter(10, 600)

MOCK_ID_LABEL = "Demo mode — identity is not verified with UIDAI or ABDM"
MOCK_LICENSE_LABEL = "Demo mode — not checked against the NMC register"
MOCK_OTP_LABEL = "Demo mode — no SMS is sent; the code is returned in this response"

# challenge_id -> {code, subject, expires, attempts}
_CHALLENGES: dict[str, dict] = {}


# ------------------------------------------------------------------ tokens
def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _unb64(txt: str) -> bytes:
    return base64.urlsafe_b64decode(txt + "=" * (-len(txt) % 4))


def issue_token(account: models.Account) -> tuple[str, dt.datetime]:
    expires = dt.datetime.now(dt.timezone.utc) + dt.timedelta(
        seconds=TTL_SECONDS.get(account.role, 24 * 3600)
    )
    payload = {
        "sub": account.account_id,
        "role": account.role,
        "actor": account.entity_id,
        "exp": int(expires.timestamp()),
        "jti": uuid.uuid4().hex[:12],
    }
    body = _b64(json.dumps(payload, separators=(",", ":")).encode())
    sig = _b64(hmac.new(SECRET, body.encode(), hashlib.sha256).digest())
    return f"{body}.{sig}", expires


def read_token(token: str) -> dict | None:
    try:
        body, sig = token.split(".", 1)
    except ValueError:
        return None
    expected = _b64(hmac.new(SECRET, body.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        payload = json.loads(_unb64(body))
    except Exception:  # noqa: BLE001 — a malformed token is simply invalid
        return None
    if payload.get("exp", 0) < dt.datetime.now(dt.timezone.utc).timestamp():
        return None
    return payload


def hash_identity(role: str, id_type: str, normalized: str) -> str:
    return hashlib.sha256(f"{ID_SALT}|{role}|{id_type}|{normalized}".encode()).hexdigest()


# ------------------------------------------- identity checks (prototype)
_VD = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],
       [4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],
       [8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]]
_VP = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],
       [9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]]


def verhoeff_valid(number: str) -> bool:
    c = 0
    for i, digit in enumerate(reversed(number)):
        c = _VD[c][_VP[i % 8][int(digit)]]
    return c == 0


def check_identity(id_type: str, raw: str) -> dict:
    """Returns {ok, normalized, last4, mobile_tail, label} or {ok: False, error}."""
    digits = "".join(ch for ch in raw if ch.isdigit())
    if id_type == "aadhaar":
        if len(digits) != 12:
            return {"ok": False, "error": "An Aadhaar number has 12 digits."}
        if digits[0] in "01":
            return {"ok": False, "error": "An Aadhaar number never starts with 0 or 1."}
        if not verhoeff_valid(digits):
            return {"ok": False, "error": "This number does not look right. Please check each digit."}
        norm, label = digits, MOCK_ID_LABEL
    elif id_type == "abha":
        if len(digits) != 14:
            return {"ok": False, "error": "An ABHA number has 14 digits."}
        norm, label = digits, MOCK_ID_LABEL
    elif id_type == "mobile":
        if digits.startswith("91") and len(digits) == 12:
            digits = digits[2:]
        if len(digits) != 10 or digits[0] not in "6789":
            return {"ok": False, "error": "Enter a 10-digit Indian mobile number."}
        norm, label = digits, MOCK_MOBILE_LABEL
    elif id_type == "license":
        norm = "".join(raw.split()).upper()
        if not re.fullmatch(r"[A-Z]{2,6}[-/]?(\d{4}[-/])?\d{4,7}", norm):
            return {"ok": False, "error": "Enter the registration number as printed, e.g. ASMC-45821."}
        label = MOCK_LICENSE_LABEL
    else:
        return {"ok": False, "error": "Unknown identity type."}

    # With a mobile number the code goes to that number; otherwise the linked
    # mobile is unknown here, so a stand-in tail is shown (demo only).
    tail = norm[-4:] if id_type == "mobile" else str(1000 + (int(hashlib.sha256(norm.encode()).hexdigest()[:8], 16) % 9000))
    return {
        "ok": True,
        "normalized": norm,
        "last4": "".join(ch for ch in norm if ch.isdigit())[-4:],
        "mobile_tail": tail,
        "label": label,
    }


# ------------------------------------------------------------------ schemas
class StartIn(BaseModel):
    role: str = Field(pattern="^(patient|caregiver|doctor|donor|admin|charity_partner)$")
    id_type: str = Field(pattern="^(aadhaar|abha|license|mobile)$")
    id_number: str


class VerifyIn(BaseModel):
    challenge_id: str = Field(max_length=64)
    code: str = Field(max_length=12)


class ResendIn(BaseModel):
    challenge_id: str = Field(max_length=64)


class ProfileIn(BaseModel):
    ticket: str = Field(max_length=64)
    name: str = Field(max_length=80)
    age: int | None = Field(default=None, ge=18, le=120)
    gender: str | None = Field(default=None, max_length=20)
    language: str = Field(default="en", pattern=r"^[a-z]{2,3}(-[A-Za-z]{2,4})?$")
    district: str | None = Field(default=None, max_length=80)
    speciality: str | None = Field(default=None, max_length=80)
    relation: str | None = Field(default=None, max_length=40)
    # The person agreed to the privacy notice of this version (docs/PRIVACY.md).
    consent: bool = False
    notice_version: str | None = Field(default=None, max_length=20)


PRIVACY_NOTICE_VERSION = "2026-10-09"


# ------------------------------------------------------------------ helpers
def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _purge_challenges() -> None:
    now = dt.datetime.now(dt.timezone.utc)
    for key in [k for k, v in _CHALLENGES.items() if v["expires"] < now]:
        del _CHALLENGES[key]
    if len(_CHALLENGES) >= MAX_CHALLENGES:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Sign-in is busy. Please try again shortly.")


def _issue_challenge(subject: dict) -> tuple[str, str]:
    challenge_id = secrets.token_hex(16)
    code = f"{secrets.randbelow(1_000_000):06d}"
    now = dt.datetime.now(dt.timezone.utc)
    _CHALLENGES[challenge_id] = {"code": code, "subject": subject, "expires": now + OTP_TTL,
                                 "attempts": 0, "sent_at": now}
    return challenge_id, code


def _otp_body(challenge_id: str, code: str, subject: dict) -> dict:
    return {
        "challenge_id": challenge_id,
        "mobile_tail": subject["mobile_tail"],
        "otp_delivery": MOCK_OTP_LABEL,
        "demo_code": code,          # only reached with SMIVAI_DEMO_OTP=1 — see module docstring
    }


def _require_otp_delivery() -> None:
    if not DEMO_OTP:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "No SMS provider is connected, so a one-time code cannot be sent. "
            "For local testing, start the API with SMIVAI_DEMO_OTP=1.",
        )


# ------------------------------------------------------------------ routes
@router.post("/start")
def start(body: StartIn, request: Request, db: Session = Depends(get_db)):
    """Check the identity (demo: format only) and issue a one-time code."""
    _START_PER_IP.hit(_client_ip(request))
    _require_otp_delivery()
    if body.id_type not in ROLE_ID_TYPES[body.role]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "That kind of ID is not used for this role.")
    res = check_identity(body.id_type, body.id_number)
    if not res["ok"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, res["error"])

    digest = hash_identity(body.role, body.id_type, res["normalized"])
    _START_PER_ID.hit(digest)
    if body.role in STAFF_ROLES and not db.query(models.Account).filter(
            models.Account.role == body.role, models.Account.id_hash == digest).first():
        # No self-sign-up for reviewers; and the same answer for any unknown
        # number, so the API does not reveal who is staff.
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Staff accounts are created by a Smivai administrator.")
    _purge_challenges()
    subject = {"role": body.role, "id_type": body.id_type, "hash": digest,
               "last4": res["last4"], "mobile_tail": res["mobile_tail"]}
    challenge_id, code = _issue_challenge(subject)
    exists = (
        db.query(models.Account)
        .filter(models.Account.role == body.role, models.Account.id_hash == digest)
        .first()
        is not None
    )
    return {**_otp_body(challenge_id, code, subject), "identity_check": res["label"], "account_exists": exists}


@router.post("/resend")
def resend(body: ResendIn, request: Request):
    """Replace a pending code with a new one. The old code stops working."""
    _START_PER_IP.hit(_client_ip(request))
    _require_otp_delivery()
    ch = _CHALLENGES.get(body.challenge_id)
    now = dt.datetime.now(dt.timezone.utc)
    if ch is None or ch["code"] is None or ch["expires"] < now:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This request has expired. Please start again.")
    if now - ch["sent_at"] < RESEND_COOLDOWN:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Please wait a few seconds before asking for a new code.")
    _START_PER_ID.hit(ch["subject"]["hash"])
    del _CHALLENGES[body.challenge_id]
    challenge_id, code = _issue_challenge(ch["subject"])
    return _otp_body(challenge_id, code, ch["subject"])


@router.post("/verify")
def verify(body: VerifyIn, request: Request, db: Session = Depends(get_db)):
    _VERIFY_PER_IP.hit(_client_ip(request))
    ch = _CHALLENGES.get(body.challenge_id)
    # A profile ticket (code None) is not a one-time-code challenge.
    if ch is None or ch["code"] is None or ch["expires"] < dt.datetime.now(dt.timezone.utc):
        _CHALLENGES.pop(body.challenge_id, None)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This code has expired. Please ask for a new one.")
    ch["attempts"] += 1
    if not hmac.compare_digest(ch["code"], "".join(c for c in body.code if c.isdigit())):
        left = OTP_MAX_ATTEMPTS - ch["attempts"]
        if left <= 0:
            del _CHALLENGES[body.challenge_id]
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Too many wrong codes. Please ask for a new one.")
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"That code is not correct. {left} left.")

    subject = ch["subject"]
    del _CHALLENGES[body.challenge_id]

    account = (
        db.query(models.Account)
        .filter(models.Account.role == subject["role"], models.Account.id_hash == subject["hash"])
        .first()
    )
    if account is None:
        ticket = secrets.token_hex(16)
        now = dt.datetime.now(dt.timezone.utc)
        _CHALLENGES[ticket] = {"code": None, "subject": subject, "expires": now + dt.timedelta(minutes=15),
                               "attempts": 0, "sent_at": now}
        return {"needs_profile": True, "ticket": ticket, "role": subject["role"]}

    token, expires = issue_token(account)
    account.last_login_at = dt.datetime.now(dt.timezone.utc)
    db.commit()
    return _session_body(account, token, expires)


@router.post("/profile", status_code=201)
def create_profile(body: ProfileIn, request: Request, db: Session = Depends(get_db)):
    _PROFILE_PER_IP.hit(_client_ip(request))
    ch = _CHALLENGES.get(body.ticket)
    # Only a ticket — issued after a correct code (code None) — is accepted
    # here. A pending one-time-code challenge id must never create an account.
    if ch is None or ch["code"] is not None or ch["expires"] < dt.datetime.now(dt.timezone.utc):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Your sign-in has expired. Please start again.")
    subject = ch["subject"]
    name = body.name.strip()
    if len(name) < 2:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Please enter your full name.")
    if not body.consent:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            "Please read the privacy notice and agree to it before your account is created.")

    role = subject["role"]
    if role in STAFF_ROLES:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Staff accounts are created by a Smivai administrator.")
    if role == "donor":
        entity_id = f"don_{uuid.uuid4().hex[:12]}"
        db.add(models.Donor(donor_id=entity_id, name=name))
    elif role == "patient":
        entity_id = f"pat_{uuid.uuid4().hex[:12]}"
        db.add(models.Patient(
            patient_id=entity_id, name=name, age=body.age, language=body.language,
            district=body.district, gender=body.gender, plan="free",
            share_code=_share_code(entity_id),
        ))
    elif role == "caregiver":
        entity_id = f"cg_{uuid.uuid4().hex[:12]}"
        db.add(models.Caregiver(caregiver_id=entity_id, name=name, relation=body.relation, plan="free"))
    else:
        entity_id = f"dr_{uuid.uuid4().hex[:12]}"
        name = name if name.lower().startswith("dr") else f"Dr. {name}"
        db.add(models.Doctor(doctor_id=entity_id, name=name,
                             speciality=body.speciality or "General Physician",
                             license_last4=subject["last4"], license_verified="prototype", plan="free"))

    account = models.Account(
        account_id=f"acct_{uuid.uuid4().hex[:12]}", role=role, entity_id=entity_id, name=name,
        id_type=subject["id_type"], id_hash=subject["hash"], id_last4=subject["last4"],
        phone_tail=subject["mobile_tail"], verification="prototype",
    )
    db.add(account)
    db.add(models.Consent(
        consent_id=f"cns_{uuid.uuid4().hex[:12]}", account_id=account.account_id, purpose="smivai_service",
        notice_version=body.notice_version or PRIVACY_NOTICE_VERSION,
    ))
    db.commit()
    db.refresh(account)
    del _CHALLENGES[body.ticket]

    token, expires = issue_token(account)
    return _session_body(account, token, expires)


def _share_code(seed: str) -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    h = int(hashlib.sha256(seed.encode()).hexdigest(), 16)
    out = ""
    for _ in range(6):
        out += alphabet[h % len(alphabet)]
        h //= len(alphabet)
    return f"SMV-{out}"


def _session_body(account: models.Account, token: str, expires: dt.datetime) -> dict:
    return {
        "token": token,
        "expires_at": expires,
        "account": {
            "account_id": account.account_id,
            "role": account.role,
            "actor_id": account.entity_id,
            "name": account.name,
            "id_type": account.id_type,
            "id_last4": account.id_last4,
            "verification": account.verification,
        },
    }


@router.get("/me")
def me(authorization: str = Header(default=""), db: Session = Depends(get_db)):
    payload = read_token(authorization.removeprefix("Bearer ").strip())
    if payload is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in again")
    account = db.get(models.Account, payload["sub"])
    if account is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in again")
    return {
        "account_id": account.account_id, "role": account.role,
        "actor_id": account.entity_id, "name": account.name,
        "expires_at": dt.datetime.fromtimestamp(payload["exp"], dt.timezone.utc),
    }
