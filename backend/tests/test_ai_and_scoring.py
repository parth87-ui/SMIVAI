"""HUN's advanced endpoint fails cleanly without a key; Rasch helpers match js/core/adaptive.js."""
import math

from app import ai, scoring


def test_ai_chat_needs_premium(client, signup):
    alice = signup()
    r = client.post("/ai/chat", headers=alice.h, json={"patient_id": alice.id, "message": "hello"})
    assert r.status_code == 402


def test_ai_chat_without_model_key_is_503(client, signup):
    alice = signup()
    client.post("/plan/upgrade", headers=alice.h, json={"plan": "premium"})
    r = client.post("/ai/chat", headers=alice.h, json={"patient_id": alice.id, "message": "hello"})
    assert r.status_code == 503
    assert client.get("/ai/status").json() == {"configured": False, "model": None}


def test_ai_chat_cannot_target_another_patient(client, signup):
    alice, bob = signup(), signup()
    client.post("/plan/upgrade", headers=bob.h, json={"plan": "premium"})
    r = client.post("/ai/chat", headers=bob.h, json={"patient_id": alice.id, "message": "hi"})
    assert r.status_code == 404


def test_assistant_is_named_hun_and_model_id_is_current():
    assert ai.SYSTEM.startswith("You are HUN")
    assert ai.MODEL == "claude-opus-5-5"


def test_rasch_probability():
    assert scoring.rasch_probability(0, 0) == 0.5
    assert math.isclose(scoring.rasch_probability(1, 0), 1 / (1 + math.exp(-1)))
    assert scoring.rasch_probability(-2, 2) < 0.02


def test_next_difficulty_matches_device_rule():
    # Same expectations as js/core/adaptive.js: 8/10 up, 4–7/10 stay, ≤3/10 down, <4 answers hold.
    assert scoring.next_difficulty(8, 10, "easy") == "medium"
    assert scoring.next_difficulty(6, 10, "easy") == "easy"
    assert scoring.next_difficulty(3, 10, "medium") == "easy"
    assert scoring.next_difficulty(3, 3, "medium") == "medium"
    assert scoring.next_difficulty(10, 10, "very_hard") == "very_hard"
    assert scoring.next_difficulty(0, 10, "very_easy") == "very_easy"
