"""Sign-in and read-side access control."""


def test_signup_issues_a_working_token(client, signup):
    alice = signup()
    r = client.get("/auth/me", headers=alice.h)
    assert r.status_code == 200
    assert r.json()["actor_id"] == alice.id


def test_bad_and_missing_tokens_are_refused(client):
    assert client.get("/patients", headers={"Authorization": "Bearer x.y"}).status_code == 401
    assert client.get("/patients").status_code == 401


def test_patient_cannot_read_another_patient(client, signup):
    alice, bob = signup(), signup()
    assert client.get(f"/patients/{alice.id}", headers=alice.h).status_code == 200
    # 404, not 403: the API never confirms that someone else's id exists.
    assert client.get(f"/patients/{alice.id}", headers=bob.h).status_code == 404


def test_caregiver_reads_only_linked_patients(client, signup, link):
    alice, bob = signup(), signup()
    carer = signup("caregiver", "Carer One")
    assert client.get(f"/patients/{alice.id}", headers=carer.h).status_code == 404
    link(carer, alice)
    assert client.get(f"/patients/{alice.id}", headers=carer.h).status_code == 200
    assert client.get(f"/patients/{bob.id}", headers=carer.h).status_code == 404
    assert [p["patient_id"] for p in client.get("/patients", headers=carer.h).json()] == [alice.id]
