"""Batch 3: verified doctor reviews (the only source of ratings)."""
from conftest import push, rec


def _done_visit(client, patient, doctor, pk):
    """A visit the doctor really marked completed."""
    push(client, patient, rec("appointments", pk, patient_id=patient.id, doctor_id=doctor.id, doctor_name="Dr",
                              date="2026-10-01", time="10:00", mode="video", status="scheduled"))
    push(client, doctor, rec("appointments", pk, op="update", status="confirmed"))
    push(client, doctor, rec("appointments", pk, op="update", status="completed"))


def _review(pk, patient, doctor_id, appt, stars):
    return rec("doctor_reviews", pk, patient_id=patient.id, doctor_id=doctor_id, appointment_id=appt, stars=stars)


def test_review_only_for_own_completed_visit_once(client, signup, link):
    alice, bob = signup(), signup()
    doc = signup("doctor", "Dr Rated")
    link(doc, alice)
    _done_visit(client, alice, doc, "apt_rev1")
    assert push(client, bob, _review("rv_x", bob, doc.id, "apt_rev1", 5))["rejected"] == 1        # not Bob's visit
    assert push(client, alice, _review("rv_bad", alice, doc.id, "apt_rev1", 7))["rejected"] == 1  # stars 1–5
    assert push(client, alice, _review("rv_1", alice, doc.id, "apt_rev1", 4))["accepted"] == 1
    assert push(client, alice, _review("rv_2", alice, doc.id, "apt_rev1", 5))["rejected"] == 1    # once
    r = client.get(f"/doctors/{doc.id}/rating", headers=alice.h).json()
    assert r == {"doctor_id": doc.id, "average": 4.0, "count": 1}


def test_unfinished_visit_cannot_be_rated(client, signup, link):
    alice = signup()
    doc = signup("doctor", "Dr Pending")
    link(doc, alice)
    push(client, alice, rec("appointments", "apt_rev2", patient_id=alice.id, doctor_id=doc.id, doctor_name="Dr",
                            date="2026-10-01", time="11:00", mode="video", status="scheduled"))
    assert push(client, alice, _review("rv_3", alice, doc.id, "apt_rev2", 5))["rejected"] == 1


def test_no_reviews_means_no_rating_not_zero(client, signup):
    alice = signup()
    assert client.get("/doctors/dr_nobody/rating", headers=alice.h).json() == {"doctor_id": "dr_nobody", "average": None, "count": 0}
