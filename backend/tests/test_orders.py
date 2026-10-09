"""Phase 6: medicine orders are demo-only and need a prescription."""
from conftest import push, rec


def _order(pk, pid, **extra):
    base = {"patient_id": pid, "items": [{"name": "Metformin 500", "qty": 1}], "address": "Jorhat",
            "payment": "cod", "status": "demo", "reference": "DEMO-RX-1", "prescription_media": "media_123"}
    base.update(extra)
    return rec("orders", pk, **base)


def test_demo_order_with_prescription_is_saved(client, signup):
    alice = signup()
    assert push(client, alice, _order("ord_1", alice.id))["accepted"] == 1


def test_order_without_prescription_is_refused(client, signup):
    alice = signup()
    res = push(client, alice, _order("ord_2", alice.id, prescription_media=""))
    assert res["results"][0]["error"] == "an order needs a prescription"


def test_device_cannot_claim_pharmacy_progress(client, signup):
    alice = signup()
    push(client, alice, _order("ord_3", alice.id))
    for status in ("dispatched", "delivered", "confirmed"):
        res = push(client, alice, rec("orders", "ord_3", op="update", status=status))
        assert res["results"][0]["error"] == "order progress can only come from a pharmacy", status
    assert push(client, alice, rec("orders", "ord_3", op="update", status="cancelled"))["accepted"] == 1


def test_orders_stay_private_to_the_patient_scope(client, signup):
    alice, bob = signup(), signup()
    assert push(client, bob, _order("ord_4", alice.id))["rejected"] == 1
