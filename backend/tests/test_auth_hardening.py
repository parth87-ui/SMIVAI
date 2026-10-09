"""Phase 2: sign-in hardening, the language proxy, and CORS."""
import datetime as dt

from app import auth
from conftest import valid_aadhaar


def _start(client, number=None, role="patient"):
    return client.post("/auth/start", json={"role": role, "id_type": "aadhaar", "id_number": number or valid_aadhaar()})


def test_without_demo_flag_no_code_is_issued(client, monkeypatch):
    monkeypatch.setattr(auth, "DEMO_OTP", False)
    r = _start(client)
    assert r.status_code == 503
    assert "demo_code" not in r.text
    assert "SMIVAI_DEMO_OTP" in r.json()["detail"]


def test_codes_are_six_digits_and_unpredictable(client):
    codes = {_start(client).json()["demo_code"] for _ in range(10)}
    assert all(len(c) == 6 and c.isdigit() for c in codes)
    assert len(codes) > 1


def test_unverified_challenge_cannot_create_an_account(client):
    """Before Phase 2 a /auth/start challenge id was accepted as a profile ticket,
    so an account could be created without ever entering the code."""
    challenge = _start(client).json()["challenge_id"]
    r = client.post("/auth/profile", json={"ticket": challenge, "name": "No Code Given"})
    assert r.status_code == 400


def test_profile_ticket_cannot_be_used_as_a_code_challenge(client):
    body = _start(client).json()
    v = client.post("/auth/verify", json={"challenge_id": body["challenge_id"], "code": body["demo_code"]}).json()
    assert v["needs_profile"]
    r = client.post("/auth/verify", json={"challenge_id": v["ticket"], "code": "000000"})
    assert r.status_code == 400


def test_three_wrong_codes_end_the_challenge(client):
    body = _start(client).json()
    wrong = "000000" if body["demo_code"] != "000000" else "111111"
    for _ in range(3):
        assert client.post("/auth/verify", json={"challenge_id": body["challenge_id"], "code": wrong}).status_code == 400
    r = client.post("/auth/verify", json={"challenge_id": body["challenge_id"], "code": body["demo_code"]})
    assert r.status_code == 400


def test_start_is_rate_limited_per_identity(client):
    number = valid_aadhaar()
    for _ in range(5):
        assert _start(client, number).status_code == 200
    r = _start(client, number)
    assert r.status_code == 429
    assert int(r.headers["Retry-After"]) > 0
    assert _start(client).status_code == 200          # a different person is unaffected


def test_start_is_rate_limited_per_address(client):
    statuses = [_start(client).status_code for _ in range(21)]
    assert statuses[:20] == [200] * 20 and statuses[20] == 429


def test_resend_has_a_cooldown_and_replaces_the_code(client):
    body = _start(client).json()
    assert client.post("/auth/resend", json={"challenge_id": body["challenge_id"]}).status_code == 429
    auth._CHALLENGES[body["challenge_id"]]["sent_at"] -= dt.timedelta(seconds=30)
    new = client.post("/auth/resend", json={"challenge_id": body["challenge_id"]})
    assert new.status_code == 200
    new = new.json()
    assert new["challenge_id"] != body["challenge_id"]
    old = client.post("/auth/verify", json={"challenge_id": body["challenge_id"], "code": body["demo_code"]})
    assert old.status_code == 400
    ok = client.post("/auth/verify", json={"challenge_id": new["challenge_id"], "code": new["demo_code"]})
    assert ok.status_code == 200


def test_profile_fields_are_validated(client):
    body = _start(client).json()
    ticket = client.post("/auth/verify", json={"challenge_id": body["challenge_id"],
                                              "code": body["demo_code"]}).json()["ticket"]
    ok = {"ticket": ticket, "name": "Valid Name", "consent": True}
    assert client.post("/auth/profile", json=dict(ok, name="A" * 200)).status_code == 422
    assert client.post("/auth/profile", json=dict(ok, age=7)).status_code == 422
    assert client.post("/auth/profile", json=dict(ok, language="en; drop")).status_code == 422
    # No account without agreeing to the privacy notice.
    r = client.post("/auth/profile", json=dict(ok, consent=False))
    assert r.status_code == 400 and "privacy notice" in r.json()["detail"]
    assert client.post("/auth/profile", json=dict(ok, age=70)).status_code == 201


def test_language_proxy_requires_sign_in(client, signup):
    payload = {"text": "hello", "source": "en", "target": "hi"}
    assert client.post("/language/translate", json=payload).status_code == 401
    assert client.post("/language/tts", json={"text": "hi", "language": "hi"}).status_code == 401
    assert client.post("/language/asr", json={"audio_base64": "AAAA", "language": "hi"}).status_code == 401
    alice = signup()
    # Signed in, but no Bhashini credentials on this machine: an honest 503.
    assert client.post("/language/translate", headers=alice.h, json=payload).status_code == 503
    assert client.get("/language/status").status_code == 200        # capabilities stay public


def test_language_proxy_limits_size(client, signup):
    alice = signup()
    big = {"text": "x" * 2001, "source": "en", "target": "hi"}
    assert client.post("/language/translate", headers=alice.h, json=big).status_code == 422
    assert client.post("/language/tts", headers=alice.h,
                       json={"text": "hi", "language": "hi", "gender": "robot"}).status_code == 422


def test_cors_allows_only_the_local_app(client):
    def preflight(origin):
        return client.options("/health", headers={"Origin": origin, "Access-Control-Request-Method": "GET"})
    assert preflight("http://localhost:8123").headers.get("access-control-allow-origin") == "http://localhost:8123"
    assert "access-control-allow-origin" not in preflight("https://evil.example").headers
