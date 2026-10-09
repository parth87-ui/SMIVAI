"""Phase 8: consent records, export of your own data, erasure, security headers."""
from app import models
from conftest import push, rec


def test_sign_up_records_consent(client, signup):
    alice = signup()
    consents = client.get("/me/consents", headers=alice.h).json()
    assert len(consents) == 1 and consents[0]["purpose"] == "smivai_service" and consents[0]["notice_version"]


def test_export_holds_only_your_own_records(client, signup):
    alice, bob = signup(name="Alice Export"), signup(name="Bob Other")
    push(client, alice, rec("memory_bank", "mem_exp_a", patient_id=alice.id, category="family", title="Alice memory"))
    push(client, bob, rec("memory_bank", "mem_exp_b", patient_id=bob.id, category="family", title="Bob memory"))
    body = client.get("/me/export", headers=alice.h).json()
    text = str(body)
    assert "Alice memory" in text and "Bob memory" not in text and "Bob Other" not in text
    assert "id_hash" not in text
    assert body["records"]["patients"][0]["patient_id"] == alice.id


def test_patient_erase_removes_everything_about_them_only(client, signup, link, db):
    alice, bob = signup(), signup()
    carer = signup("caregiver", "Carer Erase")
    link(carer, alice)
    push(client, alice,
         rec("memory_bank", "mem_er_a", patient_id=alice.id, category="family", title="A"),
         rec("reminders", "rem_er_a", patient_id=alice.id, title="Pill", date="2026-10-09", time="08:00",
             created_by_role="patient", created_by_id=alice.id))
    push(client, bob, rec("memory_bank", "mem_er_b", patient_id=bob.id, category="family", title="B"))

    assert client.post("/me/erase", headers=alice.h, json={"confirm": "yes"}).status_code == 400
    r = client.post("/me/erase", headers=alice.h, json={"confirm": "DELETE"})
    assert r.status_code == 200 and r.json()["erased"]

    db.expire_all()
    assert db.get(models.Patient, alice.id) is None
    assert db.get(models.Memory, "mem_er_a") is None and db.get(models.Reminder, "rem_er_a") is None
    assert db.query(models.CareLink).filter(models.CareLink.patient_id == alice.id).count() == 0
    assert db.query(models.Consent).count() >= 1                       # others' consents remain
    assert db.get(models.Memory, "mem_er_b") is not None               # Bob untouched
    # The token no longer works, and the caregiver no longer reaches Alice.
    assert client.get("/auth/me", headers=alice.h).status_code == 401
    assert client.get("/patients", headers=carer.h).json() == []


def test_caregiver_erase_keeps_the_patients_records(client, signup, link, db):
    alice = signup()
    carer = signup("caregiver", "Carer Leaving")
    link(carer, alice)
    push(client, carer, rec("reminders", "rem_by_carer", patient_id=alice.id, title="Tea", date="2026-10-09",
                            time="16:00", created_by_role="caregiver", created_by_id=carer.id))
    assert client.post("/me/erase", headers=carer.h, json={"confirm": "DELETE"}).status_code == 200
    db.expire_all()
    assert db.get(models.Caregiver, carer.id) is None
    assert db.get(models.Reminder, "rem_by_carer") is not None         # Alice's reminder stays hers
    assert db.get(models.Patient, alice.id) is not None


def test_profile_returns_your_own_row_without_identity_hash(client, signup, link, db):
    alice = signup(name="Alice Profile")
    body = client.get("/me/profile", headers=alice.h).json()
    assert body["role"] == "patient" and body["profile"]["patient_id"] == alice.id
    assert body["profile"]["share_code"].startswith("SMV-") and body["profile"]["plan"] == "free"
    assert "id_hash" not in str(body)
    carer = signup("caregiver", "Carer Profile")
    link(carer, alice)
    cg = client.get("/me/profile", headers=carer.h).json()
    assert cg["profile"]["caregiver_id"] == carer.id and "share_code" not in cg["profile"]


def test_security_headers(client):
    r = client.get("/health")
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["x-frame-options"] == "DENY"
    assert r.headers["cache-control"] == "no-store"
