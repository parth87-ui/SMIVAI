"""Phase 5: booking rules enforced by the server (sync)."""
from app import models
from conftest import push, rec


def _appt(pk, patient_id, doctor_id="dr_x", date="2026-10-20", time="10:00", **extra):
    return rec("appointments", pk, patient_id=patient_id, doctor_id=doctor_id, doctor_name="Dr. X",
               speciality="General", date=date, time=time, mode="video", **dict({"status": "scheduled"}, **extra))


def test_patient_can_request_but_not_confirm(client, signup, db):
    alice = signup()
    assert push(client, alice, _appt("apt_r1", alice.id))["accepted"] == 1
    res = push(client, alice, rec("appointments", "apt_r1", op="update", status="confirmed"))
    assert res["results"][0] == {"table": "appointments", "pk": "apt_r1", "ok": False,
                                 "error": "only the doctor can confirm an appointment"}
    db.expire_all()
    assert db.get(models.Appointment, "apt_r1").status == "scheduled"
    # Booking straight in as "confirmed" is refused too.
    assert push(client, alice, _appt("apt_r2", alice.id, time="11:00", status="confirmed"))["rejected"] == 1


def test_only_that_doctor_confirms(client, signup, link, db):
    alice = signup()
    doc = signup("doctor", "Dr Real")
    other = signup("doctor", "Dr Other")
    link(doc, alice)
    link(other, alice)
    push(client, alice, _appt("apt_c1", alice.id, doctor_id=doc.id))
    assert push(client, other, rec("appointments", "apt_c1", op="update", status="confirmed"))["rejected"] == 1
    assert push(client, doc, rec("appointments", "apt_c1", op="update", status="confirmed"))["accepted"] == 1
    db.expire_all()
    assert db.get(models.Appointment, "apt_c1").status == "confirmed"


def test_a_slot_cannot_be_double_booked(client, signup):
    alice, bob = signup(), signup()
    assert push(client, alice, _appt("apt_d1", alice.id, doctor_id="dr_slot"))["accepted"] == 1
    res = push(client, bob, _appt("apt_d2", bob.id, doctor_id="dr_slot"))
    assert res["results"][0]["error"] == "that time is already booked"
    # Another time, or the same time after a cancellation, is fine.
    assert push(client, bob, _appt("apt_d3", bob.id, doctor_id="dr_slot", time="10:30"))["accepted"] == 1
    push(client, alice, rec("appointments", "apt_d1", op="update", status="cancelled"))
    assert push(client, bob, _appt("apt_d4", bob.id, doctor_id="dr_slot"))["accepted"] == 1


def test_rescheduling_frees_the_old_slot(client, signup):
    alice, bob = signup(), signup()
    push(client, alice, _appt("apt_m1", alice.id, doctor_id="dr_move"))
    push(client, alice, rec("appointments", "apt_m1", op="update", status="rescheduled"),
         _appt("apt_m2", alice.id, doctor_id="dr_move", time="15:00", replaces="apt_m1"))
    assert push(client, bob, _appt("apt_m3", bob.id, doctor_id="dr_move"))["accepted"] == 1


def test_editing_your_own_booking_is_not_a_clash_with_itself(client, signup):
    alice = signup()
    push(client, alice, _appt("apt_s1", alice.id, doctor_id="dr_self"))
    assert push(client, alice, rec("appointments", "apt_s1", op="update", reason="knee pain"))["accepted"] == 1
