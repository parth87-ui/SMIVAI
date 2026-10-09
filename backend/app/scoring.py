"""SMIVAI — server-side scoring.

Deliberately the same arithmetic as js/core/scoring.py's client twin
(js/core/scoring.js) so a figure never changes when it crosses the wire.

None of this is a clinical measure.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
from scipy.optimize import minimize_scalar

LEVELS = ["very_easy", "easy", "medium", "hard", "very_hard"]
DIFFICULTY_WEIGHT = {"very_easy": 0.45, "easy": 0.60, "medium": 0.85, "hard": 1.0, "very_hard": 1.0}
TARGET_RT = {"very_easy": 10.0, "easy": 9.0, "medium": 8.0, "hard": 7.0, "very_hard": 6.0}
RASCH_B = {"very_easy": -2.0, "easy": -1.0, "medium": 0.0, "hard": 1.0, "very_hard": 2.0}

# The next level follows each game (see js/core/adaptive.js): up when the
# level above is predicted at 50% or better, down when this level is
# predicted below 40%, one step at a time, never on fewer than 4 answers.
UP_AT = 0.50
DOWN_BELOW = 0.40
MIN_ANSWERS = 4
# In effect the served level is one where the person's predicted success is
# between about 40% and 73%: above ~73% at the current level, the next level
# up is predicted at 50% or better and the level rises.

# Ability (MAP) — same constants as js/core/adaptive.js.
PRIOR_MEAN = RASCH_B["easy"]   # newcomers start at "easy"
PRIOR_SD = 1.5
WINDOW = 12                    # most recent games of one activity
PROVISIONAL_BELOW = 20         # answers

# Item calibration: an item is (game, level). A level's calibrated b is
# reported only with enough data behind it; otherwise the design value stands.
CALIBRATION_MIN_RESPONSES = 30
CALIBRATION_MIN_PERSONS = 5
B_PRIOR_SD = 1.0               # how far data must pull b away from its design value


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def speed_factor(avg_rt: float, difficulty: str) -> float:
    target = TARGET_RT.get(difficulty, 8.0)
    if not avg_rt or avg_rt <= 0:
        return 0.6
    return clamp(1 - (avg_rt - target) / (target * 1.8), 0.0, 1.0)


def effective_accuracy(accuracy: float, completed: bool) -> float:
    a = clamp(accuracy, 0, 1)
    return a if completed else a * 0.9


def session_score(accuracy: float, response_time: float, difficulty: str, completed: bool) -> int:
    raw = (
        0.78 * effective_accuracy(accuracy, completed)
        + 0.14 * speed_factor(response_time, difficulty)
        + 0.08 * DIFFICULTY_WEIGHT.get(difficulty, 0.85)
    )
    return round(clamp(raw, 0, 1) * 100)


def score_of_sessions(sessions: list) -> int:
    if not sessions:
        return 0
    n = len(sessions)
    acc = sum(
        effective_accuracy(s.accuracy, s.completion_status == "completed") for s in sessions
    ) / n
    spd = sum(speed_factor(s.response_time, s.difficulty) for s in sessions) / n
    dif = sum(DIFFICULTY_WEIGHT.get(s.difficulty, 0.85) for s in sessions) / n
    return round(clamp(0.80 * acc + 0.12 * spd + 0.08 * dif, 0, 1) * 100)


@dataclass
class CasResult:
    score: int
    trend: str
    delta: int
    sessions: int
    accuracy: float
    response_time: float


def cognitive_activity_score(sessions: list) -> CasResult:
    """`sessions` must be ordered oldest → newest."""
    if not sessions:
        return CasResult(0, "stable", 0, 0, 0.0, 0.0)

    window = sessions[-12:]
    score = score_of_sessions(window)

    trend, delta = "stable", 0
    if len(sessions) >= 6:
        recent = sessions[-24:]
        half = len(recent) // 2
        delta = score_of_sessions(recent[half:]) - score_of_sessions(recent[:half])
        trend = "improving" if delta >= 3 else ("lower" if delta <= -3 else "stable")

    n = len(window)
    return CasResult(
        score=score,
        trend=trend,
        delta=delta,
        sessions=n,
        accuracy=round(sum(s.accuracy for s in window) / n, 3),
        response_time=round(sum(s.response_time for s in window) / n, 1),
    )


def rasch_probability(theta: float, b: float) -> float:
    return 1 / (1 + math.exp(-(theta - b)))


@dataclass
class Estimate:
    theta: float
    se: float
    answers: int
    provisional: bool


def estimate_ability(evidence: list[tuple[int, int, float]],
                     prior_mean: float = PRIOR_MEAN, prior_sd: float = PRIOR_SD) -> Estimate:
    """MAP ability from grouped answers [(right, total, b)] under the 1PL model.

    Maximises the log-posterior  Σ[r·ln P + (n−r)·ln(1−P)] − (θ−μ)²/2σ²,
    P = 1/(1+e^−(θ−b)), with SciPy's bounded scalar optimiser on θ ∈ [−4, 4];
    the standard error is 1/√(observed information). The normal prior keeps a
    newcomer's estimate finite after one game; with no evidence the result is
    the prior itself. The device (Adaptive.estimate in js/core/adaptive.js)
    reaches the same value by Newton's method — tests/test_rasch.py checks it.
    """
    ev = [(r, n, b) for r, n, b in evidence if n]
    answers = int(sum(n for _, n, _ in ev))
    if not ev:
        return Estimate(prior_mean, prior_sd, 0, True)
    r = np.array([e[0] for e in ev], dtype=float)
    n = np.array([e[1] for e in ev], dtype=float)
    b = np.array([e[2] for e in ev], dtype=float)

    def neg_log_posterior(theta: float) -> float:
        p = np.clip(1.0 / (1.0 + np.exp(-(theta - b))), 1e-12, 1 - 1e-12)
        return -(float(np.sum(r * np.log(p) + (n - r) * np.log1p(-p))) - (theta - prior_mean) ** 2 / (2 * prior_sd ** 2))

    theta = float(minimize_scalar(neg_log_posterior, bounds=(-4.0, 4.0), method="bounded",
                                  options={"xatol": 1e-10}).x)
    p = 1.0 / (1.0 + np.exp(-(theta - b)))
    info = float(np.sum(n * p * (1 - p))) + 1.0 / prior_sd ** 2
    return Estimate(theta, 1.0 / math.sqrt(info), answers, answers < PROVISIONAL_BELOW)


# Progression policy — the same numbers as js/core/adaptive.js · decideNext.
UP_MIN = 8
UP2_MIN = 16
DOWN_MIN = 6
CONF_Z = 1.0
RECENT_ANSWERS = 16


def next_level(sessions: list[tuple[str, int, int]], level: str, b_of=None) -> dict:
    """The next automatic level for one game.

    `sessions` are (level, right, total) for that game, oldest first. Only the
    most recent unbroken run at `level` (up to RECENT_ANSWERS answers) counts,
    estimated with a prior centred on that level's difficulty. Up one when
    ≥ UP_MIN answers and P(next level | θ − SE) ≥ 50%; up two with ≥ UP2_MIN
    answers and the same test for the level after next; down one when
    ≥ DOWN_MIN answers and P(this level | θ + SE) < 40%; otherwise stay.
    """
    b_of = b_of or (lambda lvl: RASCH_B.get(lvl, 0.0))
    level = level if level in LEVELS else "easy"
    i = LEVELS.index(level)
    run, answers = [], 0
    for lvl, right, total in reversed(sessions):
        if lvl != level or answers >= RECENT_ANSWERS:
            break
        run.append((right, total, b_of(level)))
        answers += total
    est = estimate_ability(run, prior_mean=b_of(level))
    lo, hi = est.theta - CONF_Z * est.se, est.theta + CONF_Z * est.se
    base = {"theta": est.theta, "se": est.se, "answers_at_level": answers}

    def passes(j: int) -> bool:
        return j < len(LEVELS) and rasch_probability(lo, b_of(LEVELS[j])) >= UP_AT

    if answers >= UP_MIN and passes(i + 1):
        two = answers >= UP2_MIN and passes(i + 2)
        return {**base, "level": LEVELS[i + (2 if two else 1)], "reason": "up", "steps": 2 if two else 1}
    if answers >= DOWN_MIN and i > 0 and rasch_probability(hi, b_of(level)) < DOWN_BELOW:
        return {**base, "level": LEVELS[i - 1], "reason": "down", "steps": -1}
    if answers < min(UP_MIN, DOWN_MIN):
        return {**base, "level": level, "reason": "too_short", "steps": 0}
    if i == len(LEVELS) - 1 and answers >= UP_MIN and rasch_probability(lo, b_of(level)) >= UP_AT:
        return {**base, "level": level, "reason": "top", "steps": 0}
    if i == 0 and rasch_probability(hi, b_of(level)) < DOWN_BELOW:
        return {**base, "level": level, "reason": "bottom", "steps": 0}
    return {**base, "level": level, "reason": "same", "steps": 0}


def ability_from_sessions(sessions: list) -> Estimate:
    """θ for one activity from its sessions (oldest → newest), last WINDOW games."""
    evidence = []
    for s in sessions[-WINDOW:]:
        total = max(0, round(s.attempts or 0))
        right = round(clamp(s.accuracy or 0, 0, 1) * total)
        evidence.append((right, total, RASCH_B.get(s.difficulty, 0.0)))
    return estimate_ability(evidence)


@dataclass
class ItemCalibration:
    game_type: str
    level: str
    design_b: float
    estimated_b: float
    se: float
    responses: int
    persons: int
    calibrated: bool

    @property
    def b(self) -> float:
        """The value to use: the estimate only when there is enough data."""
        return self.estimated_b if self.calibrated else self.design_b


def calibrate_items(responses: list[tuple[str, str, str, bool]], iterations: int = 50) -> list[ItemCalibration]:
    """Estimate level difficulties from (person, game, level, correct) responses.

    Joint maximum a-posteriori estimation per game: person abilities and item
    difficulties are updated in turn, each with a normal prior (abilities
    around PRIOR_MEAN, difficulties around their design value), and the scale
    is anchored so the estimated levels of a game keep the mean of their
    design values — so results are *relative*: "medium is harder than
    designed compared with the other levels". The difficulty prior keeps
    sparse items near their design value. JMAP is a
    pragmatic choice for small samples; it is a progress aid, not a validated
    psychometric calibration, and an item is marked `calibrated` only with at
    least CALIBRATION_MIN_RESPONSES answers from CALIBRATION_MIN_PERSONS people.
    """
    by_game: dict[str, list[tuple[str, str, bool]]] = {}
    for person, game, level, correct in responses:
        if level in RASCH_B:
            by_game.setdefault(game, []).append((person, level, bool(correct)))

    out: list[ItemCalibration] = []
    for game, rows in sorted(by_game.items()):
        persons = sorted({p for p, _, _ in rows})
        levels = sorted({lv for _, lv, _ in rows}, key=LEVELS.index)
        b = {lv: RASCH_B[lv] for lv in levels}
        theta = {p: PRIOR_MEAN for p in persons}

        for _ in range(iterations):
            for p in persons:                                    # abilities, given b
                counts: dict[str, list[int]] = {}
                for pp, lv, x in rows:
                    if pp == p:
                        c = counts.setdefault(lv, [0, 0])
                        c[0] += int(x)
                        c[1] += 1
                theta[p] = estimate_ability([(r, n, b[lv]) for lv, (r, n) in counts.items()]).theta
            moved = 0.0
            for lv in levels:                                    # difficulties, given θ
                grad = -(b[lv] - RASCH_B[lv]) / B_PRIOR_SD ** 2
                info = 1 / B_PRIOR_SD ** 2
                for pp, l2, x in rows:
                    if l2 == lv:
                        pr = rasch_probability(theta[pp], b[lv])
                        grad += pr - int(x)
                        info += pr * (1 - pr)
                step = grad / info
                b[lv] = clamp(b[lv] + step, -5.0, 5.0)
                moved = max(moved, abs(step))
            # Anchor the scale: a Rasch scale is fixed only up to a constant, so
            # the estimated levels keep the same mean as their design values.
            # Without this the ability prior would drag every b by its offset.
            shift = sum(b[lv] - RASCH_B[lv] for lv in levels) / len(levels)
            for lv in levels:
                b[lv] -= shift
            if moved < 1e-5:
                break

        for lv in levels:
            item_rows = [(pp, x) for pp, l2, x in rows if l2 == lv]
            info = 1 / B_PRIOR_SD ** 2 + sum(
                rasch_probability(theta[pp], b[lv]) * (1 - rasch_probability(theta[pp], b[lv])) for pp, _ in item_rows)
            n_persons = len({pp for pp, _ in item_rows})
            out.append(ItemCalibration(
                game_type=game, level=lv, design_b=RASCH_B[lv], estimated_b=round(b[lv], 3),
                se=round(1 / math.sqrt(info), 3), responses=len(item_rows), persons=n_persons,
                calibrated=len(item_rows) >= CALIBRATION_MIN_RESPONSES and n_persons >= CALIBRATION_MIN_PERSONS,
            ))
    return out


def session_ability(right: int, answers: int, level: str) -> float:
    """Rasch maximum-likelihood ability for one game, smoothed by a half."""
    p = (right + 0.5) / (answers + 1)
    return RASCH_B.get(level, 0.0) + math.log(p / (1 - p))


def next_difficulty(right: int, answers: int, current: str) -> str:
    """The same rule as the client engine in js/core/adaptive.js."""
    idx = LEVELS.index(current) if current in LEVELS else LEVELS.index("easy")
    if answers < MIN_ANSWERS:
        return current
    theta = session_ability(right, answers, current)
    b = RASCH_B.get(current, 0.0)
    if rasch_probability(theta, b + 1) >= UP_AT and idx < len(LEVELS) - 1:
        return LEVELS[idx + 1]
    if rasch_probability(theta, b) < DOWN_BELOW and idx > 0:
        return LEVELS[idx - 1]
    return current
