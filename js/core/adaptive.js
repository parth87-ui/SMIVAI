/* ============================================================
   SMIVAI — adaptive.js
   Every brain game adjusts itself to the person playing it, using the
   Rasch model (one-parameter item response theory).

   Each level is an "item" with a difficulty b, in logits:

       very easy −2 · easy −1 · medium 0 · hard +1 · very hard +2

   Each person carries an ability θ per game, and the model predicts

       P(success) = 1 / (1 + e^-(θ − b))

   After a game, the score itself says what ability that game points to —
   the Rasch maximum-likelihood estimate for "right out of answers" at
   level b:

       θ_game = b + ln(p / (1 − p)),   p = (right + ½) / (answers + 1)

   (the ½ keeps a perfect or an empty game from running off to ±∞).

   THE NEXT LEVEL is chosen automatically after every game, from all the
   evidence so far and its uncertainty — see decideNext() and its policy
   notes below. In short: it moves up only after at least 8 answers at the
   current level (across several games if needed) show the next level would
   still be comfortable even at the cautious end of the estimate; two steps
   only with 16+ answers and strong evidence; down after 6 answers that show
   the level is too hard. One lucky or unlucky round never moves it.
   (decide() below is the older single-game rule, kept for reference.)

   Separately, θ — the ability a caregiver or doctor sees — is a maximum
   a-posteriori (MAP) estimate over the person's last 12 games of that
   activity, with a normal prior centred on the starting level
   (mean −1, sd 1.5). The prior is what keeps a brand-new player from
   being given an extreme θ after one lucky or unlucky game; as answers
   accumulate the data outweighs it. Each θ carries a standard error, and
   an estimate built on fewer than 20 answers is marked provisional.
   (Until Phase 3 θ was a running average of per-game estimates; the seeder
   still uses that `step` to build demo history.)

   The b values above are fixed design values, not calibrated from data.
   The server can estimate calibrated values once enough people have played
   (backend/app/scoring.py · calibrate_items); the device does not use them
   yet, and no screen presents θ as a validated measurement.

   AUTOMATIC vs CHOSEN levels are kept apart:
     · difficulty[game]  — the automatic level. Only a game played at the
                           automatic level moves it.
     · level_lock[game]  — an accessibility choice ("always use this level").
                           While set, it is served instead and automatic
                           changes are paused; θ is still updated.
     · a one-off level picked in "Choose level" is played and counted for θ,
       but does not move the automatic level.

   The person never sees any of this as mathematics. The results screen
   says, in their own language, how many they got right and what happens
   next time.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var ORDER = ['very_easy', 'easy', 'medium', 'hard', 'very_hard'];
  var B = { very_easy: -2, easy: -1, medium: 0, hard: 1, very_hard: 2 };
  var START = 'easy';        // where anyone new begins
  var UP_AT = 0.50;          // predicted success at the level above
  var DOWN_BELOW = 0.40;     // predicted success at this level
  var MIN_ANSWERS = 4;

  /* Ability estimate (MAP). Mirrored in backend/app/scoring.py. */
  var PRIOR_MEAN = B[START];  // −1: where a newcomer is assumed to be
  var PRIOR_SD = 1.5;
  var WINDOW = 12;            // most recent games of one activity
  var PROVISIONAL_BELOW = 20; // answers

  /* Target average response time per action (seconds), by level. A soft
     signal for the session score only — SMIVAI never runs a countdown. */
  var TARGET_RT = { very_easy: 10, easy: 9, medium: 8, hard: 7, very_hard: 6 };

  function logit(p) { return Math.log(p / (1 - p)); }
  function known(level) { return B.hasOwnProperty(level); }

  var Adaptive = {
    B: B,
    ORDER: ORDER,
    START: START,
    UP_AT: UP_AT,
    DOWN_BELOW: DOWN_BELOW,
    MIN_ANSWERS: MIN_ANSWERS,

    PRIOR_MEAN: PRIOR_MEAN,
    PRIOR_SD: PRIOR_SD,
    WINDOW: WINDOW,
    PROVISIONAL_BELOW: PROVISIONAL_BELOW,

    probability: function (theta, b) {
      return 1 / (1 + Math.exp(-(theta - b)));
    },

    /**
     * MAP ability from grouped answers [{right, total, b}], by Newton's
     * method on the log-posterior (concave, so it converges in a few steps).
     * No evidence → the prior itself, with the prior's spread as its error.
     * @returns {{theta:number, se:number, answers:number, provisional:boolean}}
     */
    estimate: function (evidence, priorMean) {
      var mu = typeof priorMean === 'number' ? priorMean : PRIOR_MEAN;
      var theta = mu, info = 1 / (PRIOR_SD * PRIOR_SD), answers = 0;
      (evidence || []).forEach(function (e) { answers += e.total || 0; });
      for (var it = 0; it < 30; it++) {
        var grad = -(theta - mu) / (PRIOR_SD * PRIOR_SD);
        info = 1 / (PRIOR_SD * PRIOR_SD);
        (evidence || []).forEach(function (e) {
          if (!e.total) return;
          var p = Adaptive.probability(theta, e.b);
          grad += e.right - e.total * p;
          info += e.total * p * (1 - p);
        });
        var next = S.clamp(theta + grad / info, -4, 4);
        var done = Math.abs(next - theta) < 1e-6;
        theta = next;
        if (done) break;
      }
      return { theta: theta, se: 1 / Math.sqrt(info), answers: answers, provisional: answers < PROVISIONAL_BELOW };
    },

    /** The grouped answers behind θ: this person's last WINDOW games of one activity. */
    evidenceFor: function (patientId, gameType) {
      var self = this;
      return this.sessionsFor(patientId, gameType).slice(-WINDOW).map(function (s) {
        var t = self.tally(s);
        return { right: t.right, total: t.total, b: self.bOf(gameType, s.difficulty), level: s.difficulty };
      });
    },

    /** This person's sessions of one game, oldest first. */
    sessionsFor: function (patientId, gameType) {
      return S.DB.where('game_sessions', function (s) {
        return s.patient_id === patientId && s.game_type === gameType;
      }).sort(function (a, b) { return a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0; });
    },

    /* ------------------------------------------------------------
       Item difficulty per game. Each game has its own table, because the
       games measure different things — Picture Matching "hard" is not the
       same challenge as Word Hustle "hard". The tables start at the design
       values (B) and are not calibrated yet; setGameDifficulties() installs
       calibrated values when the server has enough data (scoring.calibrate_items).
       ------------------------------------------------------------ */
    _gameB: {},
    bOf: function (gameType, level) {
      var t = this._gameB[gameType];
      if (t && typeof t[level] === 'number') return t[level];
      return known(level) ? B[level] : 0;
    },
    setGameDifficulties: function (gameType, table) { this._gameB[gameType] = Object.assign({}, table); },

    /* ------------------------------------------------------------
       PROGRESSION POLICY — chooses the next level from the evidence, with
       its uncertainty, never from one lucky or unlucky round:
         · evidence = answers given at the current level in the most recent
           unbroken run of games (a move resets it, so no ping-pong), with
           θ estimated from that run alone (prior centred on the level)
         · up one   with ≥ UP_MIN answers and P(success at the next level)
                    ≥ 50% even for θ − 1 SE (the cautious end of the estimate)
         · up two   only with ≥ UP2_MIN answers and the same test passing for
                    the level after next (strong, consistent evidence)
         · down one with ≥ DOWN_MIN answers and P(success here) < 40% even
                    for θ + 1 SE (struggling, however we read it)
         · otherwise stay; with too few answers say so ("insufficient")
       Mirrored in backend/app/scoring.py · next_level.
       ------------------------------------------------------------ */
    UP_MIN: 8,
    UP2_MIN: 16,
    DOWN_MIN: 6,
    RECENT_ANSWERS: 16,       // the decision looks at about the last 16 answers at this level
    CONF_Z: 1,

    /** Answers at `level` in the latest run of games played at that level. */
    runAt: function (patientId, gameType, level) {
      var list = this.sessionsFor(patientId, gameType), n = 0, right = 0, evidence = [];
      /* most recent games first, up to RECENT_ANSWERS answers: recent play counts */
      for (var i = list.length - 1; i >= 0 && list[i].difficulty === level && n < this.RECENT_ANSWERS; i--) {
        var t = this.tally(list[i]); n += t.total; right += t.right;
        evidence.push({ right: t.right, total: t.total, b: this.bOf(gameType, level) });
      }
      return { answers: n, right: right, evidence: evidence };
    },

    /**
     * The next automatic level for one game, from all the evidence so far.
     * @returns {{level, reason, steps, theta, se, answersAtLevel}}
     */
    decideNext: function (patientId, gameType, level) {
      level = known(level) ? level : START;
      var i = ORDER.indexOf(level), self = this;
      /* The decision rests on the answers given at this level, estimated with
         a prior centred on the level itself (50% expected success) — so how
         the person does here, not their history at other levels, moves it. */
      var run = this.runAt(patientId, gameType, level);
      var est = this.estimate(run.evidence, this.bOf(gameType, level));
      var lo = est.theta - this.CONF_Z * est.se, hi = est.theta + this.CONF_Z * est.se;
      var base = { theta: est.theta, se: est.se, answersAtLevel: run.answers };
      var pass = function (j) { return j < ORDER.length && self.probability(lo, self.bOf(gameType, ORDER[j])) >= UP_AT; };

      if (run.answers >= this.UP_MIN && pass(i + 1)) {
        var two = run.answers >= this.UP2_MIN && pass(i + 2);
        return Object.assign(base, { level: ORDER[i + (two ? 2 : 1)], reason: 'up', steps: two ? 2 : 1 });
      }
      if (run.answers >= this.DOWN_MIN && i > 0 && this.probability(hi, this.bOf(gameType, level)) < DOWN_BELOW) {
        return Object.assign(base, { level: ORDER[i - 1], reason: 'down', steps: -1 });
      }
      if (run.answers < Math.min(this.UP_MIN, this.DOWN_MIN)) return Object.assign(base, { level: level, reason: 'too_short', steps: 0 });
      if (i === ORDER.length - 1 && run.answers >= this.UP_MIN && this.probability(lo, this.bOf(gameType, level)) >= UP_AT) return Object.assign(base, { level: level, reason: 'top', steps: 0 });
      if (i === 0 && this.probability(hi, this.bOf(gameType, level)) < DOWN_BELOW) return Object.assign(base, { level: level, reason: 'bottom', steps: 0 });
      return Object.assign(base, { level: level, reason: 'same', steps: 0 });
    },

    abilityOf: function (patient, gameType) {
      if (!patient || !patient.ability) return 0;
      var v = patient.ability[gameType];
      return typeof v === 'number' ? v : 0;
    },

    /** An accessibility choice: always serve this level. Null when not set. */
    lockOf: function (patient, gameType) {
      var l = patient && patient.level_lock && patient.level_lock[gameType];
      return l && known(l) ? l : null;
    },

    /** The level the automatic adaptation would serve, ignoring any lock. */
    autoLevel: function (patient, gameType) {
      if (!patient) return START;
      var stored = patient.difficulty && patient.difficulty[gameType];
      if (stored && known(stored)) return stored;
      /* No saved automatic level: derive one only from games played at the
         automatic level (older records have no level_source — they count).
         Games played at a fixed or hand-picked level never set it. */
      var played = S.DB.where('game_sessions', function (s) {
        return s.patient_id === patient.patient_id && s.game_type === gameType && (!s.level_source || s.level_source === 'auto');
      });
      return played.length ? this.levelNearest(this.abilityOf(patient, gameType)) : START;
    },

    /** The level the patient should be served next for this activity. */
    difficultyFor: function (patient, gameType) {
      return this.lockOf(patient, gameType) || this.autoLevel(patient, gameType);
    },

    /** Set or clear (level = null) the "always use this level" choice. */
    setLock: function (patient, gameType, level) {
      var lock = Object.assign({}, patient.level_lock || {});
      if (level && known(level)) lock[gameType] = level; else delete lock[gameType];
      S.DB.update('patients', patient.patient_id, { level_lock: lock });
    },

    /** The hardest level still predicted at 50% or better for this ability. */
    levelNearest: function (theta) {
      var best = ORDER[0];
      ORDER.forEach(function (id) { if (Adaptive.probability(theta, B[id]) >= UP_AT) best = id; });
      return best;
    },

    /** Right answers and total answers in one session. */
    tally: function (session) {
      var total = Math.max(0, Math.round(session.attempts || 0));
      var right = Math.round(S.clamp(session.accuracy || 0, 0, 1) * total);
      return { right: right, total: total };
    },

    /** The ability this one game points to (Rasch maximum likelihood, smoothed). */
    sessionAbility: function (session) {
      var t = this.tally(session);
      var total = t.total || 8;
      var right = t.total ? t.right : Math.round(S.clamp(session.accuracy || 0, 0, 1) * total);
      var p = (right + 0.5) / (total + 1);
      return (known(session.difficulty) ? B[session.difficulty] : 0) + logit(p);
    },

    /** How far one game moves the running estimate. The first game sets it. */
    weightOf: function (answers, priorCount) {
      if (!priorCount) return 1;
      var n = answers || 8;
      return n / (n + 4);
    },

    /** One running-estimate update. Shared with the demo seeder, so a seeded
        history and a played history arrive at the same θ. */
    step: function (theta, session, priorCount) {
      var w = this.weightOf(this.tally(session).total, priorCount);
      return S.clamp(theta + w * (this.sessionAbility(session) - theta), -4, 4);
    },

    /**
     * The level to serve next, from one finished game.
     * reason: up · down · same · top (already hardest, doing well) ·
     *         bottom (already gentlest, still struggling) · too_short
     */
    decide: function (session) {
      var level = known(session.difficulty) ? session.difficulty : START;
      var i = ORDER.indexOf(level);
      var t = this.tally(session);
      if (t.total < MIN_ANSWERS) return { level: level, reason: 'too_short' };

      var th = this.sessionAbility(session);
      var readyForMore = this.probability(th, B[level] + 1) >= UP_AT;
      var struggling = this.probability(th, B[level]) < DOWN_BELOW;

      if (readyForMore) return i < ORDER.length - 1 ? { level: ORDER[i + 1], reason: 'up' } : { level: level, reason: 'top' };
      if (struggling) return i > 0 ? { level: ORDER[i - 1], reason: 'down' } : { level: level, reason: 'bottom' };
      return { level: level, reason: 'same' };
    },

    /**
     * The hardest level this person has reached in a game — everything up
     * to it stays open. Doing well opens the next one; a poor game never
     * closes one again, so they can go back and try it until it goes well.
     * Read from their record, so a level opened long ago is still open.
     */
    unlockedIndex: function (patient, gameType) {
      if (!patient) return ORDER.indexOf(START);
      var idx = Math.max(ORDER.indexOf(START), ORDER.indexOf(this.difficultyFor(patient, gameType)));
      S.DB.where('game_sessions', function (s) {
        return s.patient_id === patient.patient_id && s.game_type === gameType;
      }).forEach(function (s) { idx = Math.max(idx, ORDER.indexOf(s.difficulty)); });
      return idx;
    },

    unlocked: function (patient, gameType) { return ORDER.slice(0, this.unlockedIndex(patient, gameType) + 1); },

    isUnlocked: function (patient, gameType, level) {
      return ORDER.indexOf(level) <= this.unlockedIndex(patient, gameType);
    },

    /** Speed signal in 0..1 (1 = comfortably quick, 0 = very slow). */
    speedFactor: function (avgRt, difficulty) {
      var target = TARGET_RT[difficulty] || 8;
      if (!avgRt || avgRt <= 0) return 0.6;
      var f = 1 - (avgRt - target) / (target * 1.8);
      return S.clamp(f, 0, 1);
    },

    /**
     * Fold one finished session into the patient's record and choose the
     * level for next time. The session is already saved when this runs.
     */
    /**
     * @param {string} [source] 'auto' when the game was served at the
     *   automatic level, 'manual' when the person picked another level.
     *   Defaults to comparing the played level with the automatic one.
     */
    update: function (patient, session, source) {
      var game = session.game_type;
      var level = known(session.difficulty) ? session.difficulty : START;
      var lock = this.lockOf(patient, game);
      var auto = this.autoLevel(patient, game);
      source = source || (level === auto ? 'auto' : 'manual');

      var thetaBefore = this.abilityOf(patient, game);
      var est = this.estimate(this.evidenceFor(patient.patient_id, game));
      var t = this.tally(session);

      var d;
      if (lock) d = { level: lock, reason: 'locked' };
      else if (source !== 'auto') d = { level: auto, reason: 'manual' };
      else d = this.decideNext(patient.patient_id, game, level);

      var ability = Object.assign({}, patient.ability || {});
      var difficulty = Object.assign({}, patient.difficulty || {});
      ability[game] = S.round(est.theta, 3);
      if (!lock && source === 'auto') difficulty[game] = d.level;
      S.DB.update('patients', patient.patient_id, { ability: ability, difficulty: difficulty });
      /* The session records what it led to: the level chosen for next time. */
      if (session.session_id && S.DB.find('game_sessions', session.session_id)) {
        S.DB.update('game_sessions', session.session_id, { level_source: lock ? 'locked' : source, next_level: d.level });
      }

      return {
        from: level,
        to: d.level,
        changed: d.level !== level,
        direction: d.reason === 'up' ? 'up' : d.reason === 'down' ? 'down' : 'same',
        reason: d.reason,
        source: lock ? 'locked' : source,
        right: t.right,
        total: t.total,
        theta: S.round(est.theta, 3),
        se: S.round(est.se, 3),
        provisional: est.provisional,
        thetaBefore: S.round(thetaBefore, 3),
        sessionTheta: S.round(this.sessionAbility(session), 3),
        expected: S.round(this.probability(thetaBefore, B[level]), 3),
        steps: d.steps || 0,
        answersAtLevel: d.answersAtLevel,
        message: this.message(d.reason, d.level, t)
      };
    },

    /** One sentence for the results screen, in the reader's language. */
    message: function (reason, next, t) {
      var p = { right: t.right, total: t.total, level: S.M.difficultyName(next) };
      switch (reason) {
        case 'locked': return S.tx('adapt_locked', 'You got {right} of {total} right — you chose to always play {level}, so it stays the same.', p);
        case 'manual': return S.tx('adapt_manual', 'You got {right} of {total} right. Your suggested level is still {level}.', p);
        case 'up': return S.tx('adapt_up', 'You got {right} of {total} right — next time will be a little harder: {level}.', p);
        case 'down': return S.tx('adapt_down', 'You got {right} of {total} right — next time will be a little easier: {level}.', p);
        case 'top': return S.tx('adapt_top', 'You got {right} of {total} right — you are already on the hardest level.', p);
        case 'bottom': return S.tx('adapt_bottom', 'You got {right} of {total} right — it stays at the gentlest level.', p);
        case 'same': return S.tx('adapt_same', 'You got {right} of {total} right — {level} suits you, so it stays the same.', p);
        case 'too_short': return S.tx('adapt_more', 'You got {right} of {total} right. A few more games at {level} will help me choose the right level for you.', p);
        default: return '';
      }
    },

    /** Plain-language explanation for caregiver / doctor screens. */
    explain: function (patient, gameType) {
      var theta = this.abilityOf(patient, gameType);
      var level = this.difficultyFor(patient, gameType);
      var p = this.probability(theta, B[level]);
      var lock = this.lockOf(patient, gameType);
      return {
        theta: S.round(theta, 2),
        level: level,
        levelName: S.M.difficultyName(level),
        expectedSuccess: Math.round(p * 100),
        text: lock
          ? 'Fixed at ' + S.M.difficultyName(level) + ' by choice; automatic changes are paused. Expected success at this level is about ' + Math.round(p * 100) + '%.'
          : 'Currently served at ' + S.M.difficultyName(level) + '. Expected success at this level is about ' +
            Math.round(p * 100) + '%. It moves up only after at least 8 answers at this level show it would still be comfortable, and down after 6 answers that show it is too hard.'
      };
    },

    /** "0.42 ± 0.31 · provisional" — θ for a staff table, never without its error. */
    thetaText: function (row) {
      if (!row.plays) return '—';
      return row.theta + (row.se != null ? ' ± ' + row.se : '') + (row.provisional ? ' · provisional' : '');
    },

    /** Snapshot across all activities — powers the caregiver difficulty panel. */
    profile: function (patient) {
      var self = this;
      return S.M.GAMES.map(function (g) {
        var played = S.DB.where('game_sessions', function (s) {
          return s.patient_id === patient.patient_id && s.game_type === g.id;
        });
        var level = self.difficultyFor(patient, g.id);
        var est = played.length ? self.estimate(self.evidenceFor(patient.patient_id, g.id)) : null;
        // θ shown beside its error comes from the same estimate.
        var theta = est ? est.theta : self.abilityOf(patient, g.id);
        return {
          game: g,
          level: level,
          locked: !!self.lockOf(patient, g.id),
          theta: S.round(theta, 2),
          se: est ? S.round(est.se, 2) : null,
          answers: est ? est.answers : 0,
          provisional: est ? est.provisional : true,
          plays: played.length,
          expected: Math.round(self.probability(theta, B[level]) * 100)
        };
      });
    }
  };

  S.Adaptive = Adaptive;
})(window);
