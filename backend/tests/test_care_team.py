"""Phase 7: what a patient shares with each care-team member, reminder
duplicates, and that a removed link really ends access."""
from app import models
from conftest import push, rec


def _scopes(client, carer, patient_id):
    return next(l for l in client.get("/links", headers=carer.h).json() if l["patient_id"] == patient_id)


def test_new_links_share_everything_until_the_patient_narrows_them(client, signup, link):
    alice = signup()
    carer = signup("caregiver", "Carer Scope")
    link(carer, alice)
    assert _scopes(client, carer, alice.id)["scopes"] == {"memories": True, "health": True, "activity": True}
    for path in ("memories", "sessions", "vitals", "ability"):
        assert client.get(f"/patients/{alice.id}/{path}", headers=carer.h).status_code == 200, path


def test_withheld_scopes_are_enforced_on_reads(client, signup, link):
    alice = signup()
    carer = signup("caregiver", "Carer Narrow")
    link(carer, alice)
    lid = _scopes(client, carer, alice.id)["link_id"]
    r = client.patch(f"/links/{lid}/scopes", headers=alice.h, json={"memories": False, "health": False, "activity": True})
    assert r.status_code == 200
    assert client.get(f"/patients/{alice.id}/memories", headers=carer.h).status_code == 403
    assert client.get(f"/patients/{alice.id}/vitals", headers=carer.h).status_code == 403
    assert client.get(f"/patients/{alice.id}/sessions", headers=carer.h).status_code == 200
    # Always shared, for safety and care:
    for path in ("reminders", "appointments", "alerts", "notes"):
        assert client.get(f"/patients/{alice.id}/{path}", headers=carer.h).status_code == 200, path
    # The patient always sees their own records.
    assert client.get(f"/patients/{alice.id}/memories", headers=alice.h).status_code == 200


def test_withheld_scopes_are_enforced_on_writes(client, signup, link, db):
    alice = signup()
    carer = signup("caregiver", "Carer Write")
    link(carer, alice)
    lid = _scopes(client, carer, alice.id)["link_id"]
    client.patch(f"/links/{lid}/scopes", headers=alice.h, json={"memories": False, "health": True, "activity": True})
    res = push(client, carer, rec("memory_bank", "mem_scope", patient_id=alice.id, category="family", title="X"))
    assert res["rejected"] == 1
    assert db.get(models.Memory, "mem_scope") is None


def test_only_the_patient_sets_scopes(client, signup, link):
    alice = signup()
    carer = signup("caregiver", "Carer Self")
    link(carer, alice)
    lid = _scopes(client, carer, alice.id)["link_id"]
    assert client.patch(f"/links/{lid}/scopes", headers=carer.h, json={"memories": True}).status_code == 404
    assert client.patch(f"/links/{lid}/scopes", headers=alice.h, json={"everything": True}).status_code == 422


def test_patient_device_can_change_scopes_and_end_a_link_through_sync(client, signup, link, db):
    alice = signup()
    carer = signup("caregiver", "Carer Sync")
    link(carer, alice)
    lid = _scopes(client, carer, alice.id)["link_id"]
    # Only scopes/status are taken; a forged actor or patient is ignored.
    res = push(client, alice, rec("links", lid, op="update", scopes={"memories": False},
                                  actor_id="someone_else", patient_id=alice.id))
    assert res["accepted"] == 1
    db.expire_all()
    row = db.get(models.CareLink, lid)
    assert row.scopes == {"memories": False, "health": True, "activity": True}
    assert row.actor_id == carer.id
    assert push(client, alice, rec("links", lid, op="update", status="removed"))["accepted"] == 1
    assert client.get(f"/patients/{alice.id}", headers=carer.h).status_code == 404     # access really ends
    # A caregiver cannot edit the link through sync.
    assert push(client, carer, rec("links", lid, op="update", status="active"))["rejected"] == 1


def test_only_the_patient_talks_to_hun(client, signup, link):
    alice = signup()
    carer = signup("caregiver", "Carer HUN")
    link(carer, alice)
    r = client.post("/ai/chat", headers=carer.h, json={"patient_id": alice.id, "message": "hello"})
    assert r.status_code == 403


def test_duplicate_reminders_are_refused(client, signup, link):
    alice = signup()
    carer = signup("caregiver", "Carer Dup")
    link(carer, alice)
    body = {"patient_id": alice.id, "title": "Evening walk", "reminder_date": "2026-10-09",
            "reminder_time": "18:00", "repeat_rule": "daily"}
    assert client.post(f"/patients/{alice.id}/reminders", headers=carer.h, json=body).status_code == 201
    dup = dict(body, title="  evening WALK ")
    assert client.post(f"/patients/{alice.id}/reminders", headers=carer.h, json=dup).status_code == 409
    other_time = dict(body, reminder_time="19:00")
    assert client.post(f"/patients/{alice.id}/reminders", headers=carer.h, json=other_time).status_code == 201
    via_sync = rec("reminders", "rem_dup_sync", patient_id=alice.id, title="Evening walk", date="2026-10-10",
                   time="18:00", repeat="daily", created_by_role="patient", created_by_id=alice.id)
    assert push(client, alice, via_sync)["results"][0]["error"] == "this reminder already exists"
