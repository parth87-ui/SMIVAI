"""Shared fixtures. Every test run uses a throwaway SQLite file, never smivai_local.db."""
from __future__ import annotations

import os
import random
import sys
import tempfile
from pathlib import Path

# Must be set before app.database is imported.
_TMP = Path(tempfile.mkdtemp(prefix="smivai-test-"))
os.environ["SMIVAI_DATABASE_URL"] = f"sqlite:///{(_TMP / 'test.db').as_posix()}"
os.environ["SMIVAI_AUTH_SECRET"] = "test-secret-not-for-real-use"
os.environ["SMIVAI_BACKUP_DIR"] = str(_TMP / "backups")      # never into the project
os.environ["SMIVAI_UPLOAD_DIR"] = str(_TMP / "uploads")      # charity documents, never into the project
os.environ.pop("ANTHROPIC_API_KEY", None)
os.environ.pop("SMIVAI_AI_MODEL", None)
os.environ["SMIVAI_DEMO_OTP"] = "1"          # no SMS provider exists; tests use the demo code
os.environ.pop("SMIVAI_CORS_ORIGINS", None)
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app import models  # noqa: E402
from app.auth import _VD, _VP  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.ratelimit import reset_all  # noqa: E402

_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]


def valid_aadhaar() -> str:
    """A random 12-digit number that passes the Verhoeff check (fictional)."""
    stem = str(random.randint(2, 9)) + "".join(str(random.randint(0, 9)) for _ in range(10))
    c = 0
    for i, d in enumerate(reversed(stem)):
        c = _VD[c][_VP[(i + 1) % 8][int(d)]]
    return stem + str(_INV[c])


@pytest.fixture(autouse=True)
def _fresh_rate_limits():
    reset_all()
    yield


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def db():
    s = SessionLocal()
    yield s
    s.close()


class User:
    def __init__(self, token: str, actor_id: str, role: str):
        self.token, self.id, self.role = token, actor_id, role
        self.h = {"Authorization": f"Bearer {token}"}


def valid_mobile() -> str:
    return str(random.randint(6, 9)) + "".join(str(random.randint(0, 9)) for _ in range(9))


def _identity(role: str) -> tuple[str, str]:
    if role == "doctor":
        return "license", f"ASMC-{random.randint(10000, 999999)}"
    if role in ("donor", "admin", "charity_partner"):
        return "mobile", valid_mobile()
    return "aadhaar", valid_aadhaar()


def _login(client: TestClient, role: str, id_type: str, number: str) -> dict:
    start = client.post("/auth/start", json={"role": role, "id_type": id_type, "id_number": number})
    assert start.status_code == 200, start.text
    body = start.json()
    return client.post("/auth/verify", json={"challenge_id": body["challenge_id"], "code": body["demo_code"]}).json()


@pytest.fixture
def staff(client, db):
    """An administrator or charity partner, made by the real `app.manage` command, then signed in."""
    from app.manage import create_staff

    def _make(role: str, name: str = "Staff Person"):
        mobile = valid_mobile()
        create_staff(db, role, mobile, name, "Test Org" if role == "charity_partner" else None)
        v = _login(client, role, "mobile", mobile)
        return User(v["token"], v["account"]["actor_id"], role)
    return _make


def _signup(client: TestClient, role: str, name: str) -> User:
    id_type, number = _identity(role)
    start = client.post("/auth/start", json={"role": role, "id_type": id_type, "id_number": number})
    assert start.status_code == 200, start.text
    body = start.json()
    v = client.post("/auth/verify", json={"challenge_id": body["challenge_id"], "code": body["demo_code"]}).json()
    if v.get("needs_profile"):
        v = client.post("/auth/profile", json={"ticket": v["ticket"], "name": name, "consent": True}).json()
    return User(v["token"], v["account"]["actor_id"], role)


@pytest.fixture
def signup(client):
    return lambda role="patient", name="Test Person": _signup(client, role, name)


@pytest.fixture
def link(client, db):
    """Link a caregiver/doctor to a patient through the real care-code flow."""
    def _link(actor: User, patient: User):
        code = db.get(models.Patient, patient.id).share_code
        r = client.post("/links", headers=actor.h, json={"share_code": code})
        assert r.status_code == 201, r.text
    return _link


def push(client: TestClient, user: User, *records: dict):
    r = client.post("/sync/push", headers=user.h, json={"device_id": "test", "records": list(records)})
    assert r.status_code == 200, r.text
    return r.json()


def rec(table: str, pk: str, op: str = "insert", **payload) -> dict:
    return {"table": table, "op": op, "pk": pk, "payload": payload}
