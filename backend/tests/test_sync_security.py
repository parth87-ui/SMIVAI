"""POST /sync/push must never let one account write another patient's data.

Each test here reproduces an issue found in the Phase 0 audit (S1–S3, B1).
"""
from app import models
from conftest import push, rec


def _reminder(pk, patient_id, **extra):
    return rec("reminders", pk, patient_id=patient_id, title="Morning pill", date="2026-10-09",
               time="08:00", created_by_role="patient", created_by_id=patient_id, **extra)


def test_patient_can_write_own_rows(client, signup, db):
    alice = signup()
    res = push(client, alice, _reminder("rem_own_1", alice.id))
    assert res["accepted"] == 1 and res["rejected"] == 0
    assert res["results"] == [{"table": "reminders", "pk": "rem_own_1", "ok": True, "error": None}]
    assert db.get(models.Reminder, "rem_own_1").patient_id == alice.id


def test_s1_cannot_take_over_another_patients_row(client, signup, db):
    alice, bob = signup(), signup()
    push(client, alice, _reminder("rem_s1", alice.id))
    res = push(client, bob, rec("reminders", "rem_s1", op="update", patient_id=bob.id, title="stolen"))
    assert res["accepted"] == 0 and res["results"][0]["ok"] is False
    row = db.get(models.Reminder, "rem_s1")
    assert row.patient_id == alice.id and row.title == "Morning pill"


def test_s1_cannot_edit_another_patients_row_without_claiming_it(client, signup, db):
    alice, bob = signup(), signup()
    push(client, alice, _reminder("rem_s1b", alice.id))
    res = push(client, bob, rec("reminders", "rem_s1b", op="update", title="changed"))
    assert res["rejected"] == 1
    assert db.get(models.Reminder, "rem_s1b").title == "Morning pill"


def test_owner_cannot_move_own_row_to_another_patient(client, signup, db):
    alice, bob = signup(), signup()
    push(client, alice, _reminder("rem_move", alice.id))
    res = push(client, alice, rec("reminders", "rem_move", op="update", patient_id=bob.id))
    assert res["rejected"] == 1
    assert db.get(models.Reminder, "rem_move").patient_id == alice.id


def test_s2_cannot_delete_another_patients_row(client, signup, db):
    alice, bob = signup(), signup()
    push(client, alice, rec("memory_bank", "mem_s2", patient_id=alice.id, category="family", title="Wedding"))
    res = push(client, bob, rec("memory_bank", "mem_s2", op="delete", patient_id=bob.id))
    assert res["rejected"] == 1
    assert db.get(models.Memory, "mem_s2") is not None


def test_s3_plan_and_care_code_cannot_be_set_through_sync(client, signup, db):
    alice = signup()
    code = db.get(models.Patient, alice.id).share_code
    res = push(client, alice, rec("patients", alice.id, op="update", plan="premium",
                                  share_code="SMV-HACKED", name="Alice Renamed"))
    assert res["accepted"] == 1          # the harmless field still applies
    db.expire_all()
    row = db.get(models.Patient, alice.id)
    assert row.plan == "free" and row.share_code == code and row.name == "Alice Renamed"
    assert client.get("/plan", headers=alice.h).json()["plan"] == "free"


def test_s3_caregiver_cannot_upgrade_own_plan_through_sync(client, signup, db):
    carer = signup("caregiver", "Carer Plan")
    push(client, carer, rec("caregivers", carer.id, op="update", plan="premium"))
    db.expire_all()
    assert db.get(models.Caregiver, carer.id).plan == "free"


def test_cannot_write_someone_elses_profile_row(client, signup):
    alice = signup()
    carer = signup("caregiver", "Carer Other")
    res = push(client, alice, rec("caregivers", carer.id, op="update", name="x"))
    assert res["rejected"] == 1


def test_profiles_and_links_are_not_writable_through_sync(client, signup):
    alice = signup()
    carer = signup("caregiver", "Carer Link")
    res = push(client, alice,
               rec("patients", alice.id, op="delete"),
               rec("links", "lnk_forged", patient_id=alice.id, actor_role="caregiver", actor_id=carer.id))
    assert [r["ok"] for r in res["results"]] == [False, False]
    assert client.get(f"/patients/{alice.id}", headers=carer.h).status_code == 404


def test_cannot_create_a_patient_row_for_someone_else(client, signup):
    alice = signup()
    res = push(client, alice, rec("patients", "pat_invented", name="Nobody"))
    assert res["rejected"] == 1


def test_linked_caregiver_may_write_unlinked_may_not(client, signup, link, db):
    alice = signup()
    linked, stranger = signup("caregiver", "Linked"), signup("caregiver", "Stranger")
    link(linked, alice)
    assert push(client, linked, _reminder("rem_cg_ok", alice.id))["accepted"] == 1
    assert push(client, stranger, _reminder("rem_cg_no", alice.id))["rejected"] == 1
    assert db.get(models.Reminder, "rem_cg_no") is None


def test_private_notes_are_patient_only(client, signup, link):
    alice = signup()
    carer = signup("caregiver", "Carer Notes")
    link(carer, alice)
    assert push(client, alice, rec("patient_notes", "pn_1", patient_id=alice.id, text="mine"))["accepted"] == 1
    assert push(client, carer, rec("patient_notes", "pn_1", op="update", text="edited"))["rejected"] == 1


def test_b1_results_line_up_and_good_rows_survive_bad_ones(client, signup, db):
    alice, bob = signup(), signup()
    res = push(client, alice,
               _reminder("rem_b1_a", alice.id),
               _reminder("rem_b1_bad", bob.id),                 # not Alice's patient
               rec("reminders", "rem_b1_date", patient_id=alice.id, title="x", date="not-a-date", time="08:00",
                   created_by_role="patient", created_by_id=alice.id),
               rec("reminders", "rem_b1_c", patient_id=alice.id, title="Evening pill", date="2026-10-09",
                   time="20:00", created_by_role="patient", created_by_id=alice.id))
    assert [r["ok"] for r in res["results"]] == [True, False, False, True]
    assert [r["pk"] for r in res["results"]] == ["rem_b1_a", "rem_b1_bad", "rem_b1_date", "rem_b1_c"]
    assert res["accepted"] == 2 and res["rejected"] == 2
    # A malformed value gets a generic message, never a database error text.
    assert res["results"][2]["error"] == "this record could not be saved"
    assert db.get(models.Reminder, "rem_b1_a") and db.get(models.Reminder, "rem_b1_c")


def test_unknown_table_is_reported_not_crashed(client, signup):
    alice = signup()
    res = push(client, alice, rec("accounts", "acct_x", patient_id=alice.id))
    assert res["results"][0]["ok"] is False
