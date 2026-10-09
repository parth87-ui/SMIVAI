"""Phase 3: Rasch ability (MAP), level selection, calibration, and device/server parity."""
import json
import math
import random
import shutil
import subprocess
from pathlib import Path

import pytest

from app import scoring
from conftest import push, rec

ADAPTIVE_JS = Path(__file__).resolve().parents[2] / "js" / "core" / "adaptive.js"


# ------------------------------------------------------------- estimation
def test_probability_formula():
    for theta, b in [(0, 0), (1.3, -0.4), (-2, 1)]:
        assert math.isclose(scoring.rasch_probability(theta, b), 1 / (1 + math.exp(-(theta - b))))


def test_cold_start_is_the_prior():
    est = scoring.estimate_ability([])
    assert est.theta == scoring.PRIOR_MEAN == -1.0
    assert math.isclose(est.se, scoring.PRIOR_SD)
    assert est.answers == 0 and est.provisional


def test_one_perfect_game_does_not_run_away():
    est = scoring.estimate_ability([(10, 10, scoring.RASCH_B["easy"])])
    assert scoring.PRIOR_MEAN < est.theta < 2.5          # finite, moved up, but held by the prior
    assert est.provisional                               # 10 answers < 20


def test_more_evidence_means_smaller_error_and_less_prior():
    few = scoring.estimate_ability([(7, 10, 0.0)])
    many = scoring.estimate_ability([(7, 10, 0.0)] * 6)
    assert many.se < few.se
    assert not many.provisional
    # 70% at b=0 implies θ ≈ ln(.7/.3) ≈ 0.85; with lots of data the MAP approaches it.
    assert abs(many.theta - math.log(0.7 / 0.3)) < 0.15
    assert abs(many.theta - math.log(0.7 / 0.3)) < abs(few.theta - math.log(0.7 / 0.3))


def test_estimate_is_the_posterior_mode():
    ev = [(6, 10, -1.0), (4, 8, 0.0)]
    est = scoring.estimate_ability(ev)

    def logpost(t):
        lp = -((t - scoring.PRIOR_MEAN) ** 2) / (2 * scoring.PRIOR_SD ** 2)
        for r, n, b in ev:
            p = scoring.rasch_probability(t, b)
            lp += r * math.log(p) + (n - r) * math.log(1 - p)
        return lp

    assert logpost(est.theta) >= logpost(est.theta + 0.01)
    assert logpost(est.theta) >= logpost(est.theta - 0.01)


# ------------------------------------------------------------- calibration
def _simulate(true_b: dict, persons: int, per_level: int, seed=7):
    rnd = random.Random(seed)
    rows = []
    for i in range(persons):
        theta = rnd.gauss(0, 1)
        for level, b in true_b.items():
            for _ in range(per_level):
                rows.append((f"p{i}", "pattern", level, rnd.random() < scoring.rasch_probability(theta, b)))
    return rows


def test_calibration_recovers_a_level_that_is_harder_than_designed():
    true_b = dict(scoring.RASCH_B)
    true_b["medium"] = 1.0                     # designed 0.0, really harder
    items = {i.level: i for i in scoring.calibrate_items(_simulate(true_b, persons=60, per_level=12))}
    assert all(i.calibrated for i in items.values())
    # Anchored to the design mean, the true values read 0.2 lower: medium ≈ 0.8, hard ≈ 0.8.
    assert items["medium"].estimated_b > 0.5
    assert abs(items["medium"].estimated_b - items["hard"].estimated_b) < 0.4
    for lv in ("very_easy", "easy", "very_hard"):
        assert abs(items[lv].estimated_b - (true_b[lv] - 0.2)) < 0.35, lv
    mean_est = sum(i.estimated_b for i in items.values()) / len(items)
    assert abs(mean_est - 0.0) < 1e-3           # anchored: same mean as the design values (b is rounded to 3 dp)


def test_sparse_items_keep_their_design_value():
    rows = _simulate({"easy": -1.0}, persons=3, per_level=4)
    (item,) = scoring.calibrate_items(rows)
    assert not item.calibrated and item.responses == 12 and item.persons == 3
    assert item.b == item.design_b == -1.0


# ------------------------------------------------------------- endpoints
def _session(pid, sid, level, attempts, accuracy):
    return rec("game_sessions", sid, patient_id=pid, game_type="pattern", difficulty=level, attempts=attempts,
               accuracy=accuracy, date="2026-10-09", score=70)


def test_ability_endpoint_is_scoped_and_honest(client, signup):
    alice, bob = signup(), signup()
    push(client, alice, _session(alice.id, "ses_ab1", "easy", 10, 0.8))
    body = client.get(f"/patients/{alice.id}/ability", headers=alice.h).json()
    pattern = next(a for a in body["activities"] if a["game_type"] == "pattern")
    assert pattern["plays"] == 1 and pattern["answers"] == 10 and pattern["provisional"]
    assert pattern["theta"] > scoring.PRIOR_MEAN and pattern["se"] > 0
    assert body["disclaimer"] == "This is a progress-tracking aid, not a medical diagnosis."
    unplayed = next(a for a in body["activities"] if a["game_type"] == "jigsaw")
    assert unplayed["theta"] is None
    assert client.get(f"/patients/{alice.id}/ability", headers=bob.h).status_code == 404


def test_ability_endpoint_reports_the_automatic_next_level(client, signup):
    alice = signup()
    for i in range(3):
        push(client, alice, rec("game_sessions", f"ses_nl{i}", patient_id=alice.id, game_type="picture_matching",
                                difficulty="easy", attempts=3, accuracy=1.0, date="2026-10-09", score=90,
                                timestamp=f"2026-10-09T10:0{i}:00+00:00"))
    pm = next(a for a in client.get(f"/patients/{alice.id}/ability", headers=alice.h).json()["activities"]
              if a["game_type"] == "picture_matching")
    assert (pm["next_level"], pm["next_level_reason"], pm["answers_at_level"]) == ("medium", "up", 9)


def test_item_responses_sync_with_ownership(client, signup, db):
    from app import models
    alice, bob = signup(), signup()
    resp = rec("item_responses", "resp_t1", patient_id=alice.id, session_id="ses_x", game_type="pattern",
               level="easy", b=-1, seq=1, correct=True, response_ms=2300)
    assert push(client, alice, resp)["accepted"] == 1
    assert db.get(models.ItemResponse, "resp_t1").correct is True
    stolen = rec("item_responses", "resp_t1", op="update", patient_id=bob.id, correct=False)
    assert push(client, bob, stolen)["rejected"] == 1


def test_calibration_endpoint_is_doctor_only_and_aggregate(client, signup):
    alice = signup()
    doctor = signup("doctor", "Dr Test")
    push(client, alice, rec("item_responses", "resp_c1", patient_id=alice.id, session_id="s", game_type="pattern",
                            level="easy", b=-1, seq=1, correct=True))
    assert client.get("/calibration", headers=alice.h).status_code == 403
    body = client.get("/calibration", headers=doctor.h).json()
    item = next(i for i in body["items"] if i["game_type"] == "pattern" and i["level"] == "easy")
    assert item["calibrated"] is False and item["b"] == -1.0
    assert "patient_id" not in json.dumps(body)


# ------------------------------------------------------------- parity with the device
NODE = shutil.which("node")


def _run_js(expr: str):
    script = (
        "global.window={S:{clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),round:(v,d)=>Math.round(v*10**d)/10**d}};"
        f"require({json.dumps(str(ADAPTIVE_JS))});"
        "const A=window.S.Adaptive;"
        f"process.stdout.write(JSON.stringify({expr}));"
    )
    out = subprocess.run([NODE, "-e", script], capture_output=True, text=True, timeout=30, check=True)
    return json.loads(out.stdout)


@pytest.mark.skipif(NODE is None, reason="node is not installed")
def test_device_and_server_estimate_agree():
    cases = [[], [[10, 10, -1]], [[6, 10, -1], [4, 8, 0]], [[0, 12, 2]], [[7, 10, 0]] * 6]
    js = _run_js("%s.map(c=>A.estimate(c.map(e=>({right:e[0],total:e[1],b:e[2]}))))" % json.dumps(cases))
    for case, j in zip(cases, js):
        py = scoring.estimate_ability([tuple(e) for e in case])
        assert math.isclose(j["theta"], py.theta, abs_tol=1e-6)
        assert math.isclose(j["se"], py.se, abs_tol=1e-6)
        assert j["provisional"] == py.provisional


HARNESS = Path(__file__).resolve().parents[2] / "tests" / "frontend" / "harness.js"


def _policy_cases():
    rnd = random.Random(42)
    cases = []
    for _ in range(60):
        level = rnd.choice(scoring.LEVELS)
        hist = []
        for _ in range(rnd.randint(0, 7)):
            total = rnd.randint(2, 6)
            lvl = level if rnd.random() < 0.8 else rnd.choice(scoring.LEVELS)
            hist.append((lvl, rnd.randint(0, total), total))
        cases.append((hist, level))
    # hand-made edge cases: perfect runs, failing runs, nothing played
    cases += [([("easy", 3, 3)] * 3, "easy"), ([("medium", 1, 5)] * 4, "medium"), ([], "easy"),
              ([("easy", 4, 4)] * 4, "easy"), ([("very_hard", 5, 5)] * 4, "very_hard"), ([("very_easy", 0, 5)] * 3, "very_easy")]
    return cases


@pytest.mark.skipif(NODE is None, reason="node is not installed")
def test_device_and_server_policy_choose_the_same_next_level():
    """The NumPy/SciPy policy (scoring.next_level) and the device policy
    (Adaptive.decideNext) agree on level, reason and estimate."""
    cases = _policy_cases()
    script = (
        f"const h=require({json.dumps(str(HARNESS))}); const cases={json.dumps(cases)}; const out=[];"
        "for (const [hist, level] of cases) { const S=h.load();"
        "  hist.forEach((s,i)=>S.DB.insert('game_sessions',{session_id:'s'+i,patient_id:'p',game_type:'g',difficulty:s[0],"
        "    attempts:s[2],accuracy:s[2]?s[1]/s[2]:0,timestamp:'2026-01-01T00:00:'+String(10+i).padStart(2,'0')+'Z'},{silent:true}));"
        "  const d=S.Adaptive.decideNext('p','g',level); out.push([d.level,d.reason,d.theta,d.se,d.answersAtLevel]); }"
        "process.stdout.write(JSON.stringify(out));"
    )
    res = subprocess.run([NODE, "-e", script], capture_output=True, text=True, timeout=120, check=True)
    for (hist, level), (lvl, reason, theta, se, n) in zip(cases, json.loads(res.stdout)):
        py = scoring.next_level([tuple(s) for s in hist], level)
        assert (py["level"], py["reason"], py["answers_at_level"]) == (lvl, reason, n), (hist, level)
        assert math.isclose(py["theta"], theta, abs_tol=1e-5) and math.isclose(py["se"], se, abs_tol=1e-5)


def test_policy_needs_evidence_and_moves_one_step():
    assert scoring.next_level([("easy", 3, 3)], "easy")["reason"] == "too_short"
    assert scoring.next_level([("easy", 3, 3)] * 3, "easy")["level"] == "medium"
    assert scoring.next_level([("medium", 1, 5)] * 2, "medium")["level"] == "easy"
    assert scoring.next_level([("easy", 3, 3)] * 2 + [("medium", 3, 3)], "medium")["reason"] == "too_short", \
        "evidence at another level does not count"


@pytest.mark.skipif(NODE is None, reason="node is not installed")
def test_device_and_server_choose_the_same_next_level():
    grid = [(r, n, lv) for lv in scoring.LEVELS for n in (3, 4, 6, 10, 20) for r in range(n + 1)]
    js = _run_js("%s.map(g=>A.decide({difficulty:g[2],attempts:g[1],accuracy:g[1]?g[0]/g[1]:0}).level)" % json.dumps(grid))
    for (r, n, lv), level in zip(grid, js):
        assert level == scoring.next_difficulty(r, n, lv), (r, n, lv)
