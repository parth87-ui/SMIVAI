"""PATCH /reminders/{id} edits only declared fields (audit issues S4, S5)."""
from app import models
from conftest import push, rec


def _seed(client, user, pk):
    push(client, user, rec("reminders", pk, patient_id=user.id, title="Walk", date="2026-10-09",
                           time="17:00", created_by_role="patient", created_by_id=user.id))


def test_s4_patch_cannot_move_a_reminder(client, signup, db):
    alice, bob = signup(), signup()
    _seed(client, alice, "rem_p1")
    r = client.patch("/reminders/rem_p1", headers=alice.h, json={"patient_id": bob.id})
    assert r.status_code == 422
    db.expire_all()
    assert db.get(models.Reminder, "rem_p1").patient_id == alice.id


def test_s5_patch_with_date_string_is_parsed_not_500(client, signup):
    alice = signup()
    _seed(client, alice, "rem_p2")
    r = client.patch("/reminders/rem_p2", headers=alice.h,
                     json={"reminder_date": "2026-10-10", "reminder_time": "18:30", "status": "paused"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["reminder_date"] == "2026-10-10" and body["reminder_time"] == "18:30" and body["status"] == "paused"


def test_patch_validates_values(client, signup):
    alice = signup()
    _seed(client, alice, "rem_p3")
    assert client.patch("/reminders/rem_p3", headers=alice.h, json={"reminder_time": "25:99"}).status_code == 422
    assert client.patch("/reminders/rem_p3", headers=alice.h, json={"status": "deleted"}).status_code == 422
    assert client.patch("/reminders/rem_p3", headers=alice.h, json={"reminder_date": "soon"}).status_code == 422


def test_patch_other_patients_reminder_is_404(client, signup):
    alice, bob = signup(), signup()
    _seed(client, alice, "rem_p4")
    assert client.patch("/reminders/rem_p4", headers=bob.h, json={"title": "x"}).status_code == 404


def test_create_reminder_validates_time(client, signup, link):
    alice = signup()
    carer = signup("caregiver", "Carer Rem")
    link(carer, alice)
    good = {"patient_id": alice.id, "title": "Tea", "reminder_date": "2026-10-09", "reminder_time": "16:00"}
    assert client.post(f"/patients/{alice.id}/reminders", headers=carer.h, json=good).status_code == 201
    bad = dict(good, reminder_time="4pm")
    assert client.post(f"/patients/{alice.id}/reminders", headers=carer.h, json=bad).status_code == 422
