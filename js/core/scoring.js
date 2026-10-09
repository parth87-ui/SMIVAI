/* ============================================================
   SMIVAI — scoring.js
   Activity scoring and the Cognitive Activity Score.

   The Cognitive Activity Score is a *engagement and performance* index
   over recent SMIVAI activity. It is not a clinical measure, not a
   severity rating, and is never presented as one.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  /* How much credit the level itself carries. Accuracy still dominates, so
     the score stays readable: roughly "how well did this go?", not a curve. */
  var DIFFICULTY_WEIGHT = { very_easy: 0.45, easy: 0.60, medium: 0.85, hard: 1.0, very_hard: 1.0 };

  /** Accuracy adjusted for an activity that was left part-way. */
  function effectiveAccuracy(s) {
    var a = S.clamp(s.accuracy || 0, 0, 1);
    return s.completion_status === 'completed' ? a : a * 0.9;
  }

  var Scoring = {

    /* ---------- Per-session score (0..100) ---------- */
    sessionScore: function (r) {
      var speed = S.Adaptive.speedFactor(r.response_time, r.difficulty);
      var raw = 0.78 * effectiveAccuracy(r) +
                0.14 * speed +
                0.08 * (DIFFICULTY_WEIGHT[r.difficulty] || 0.85);
      return Math.round(S.clamp(raw, 0, 1) * 100);
    },

    /* ---------- Cognitive Activity Score ---------- */
    /**
     * The one formula. Kept in a single place so the live score, the daily
     * history series and the seeded demo history can never drift apart.
     */
    scoreOfSessions: function (sessions) {
      if (!sessions || !sessions.length) return 0;
      var accs = sessions.map(effectiveAccuracy);
      var speeds = sessions.map(function (s) { return S.Adaptive.speedFactor(s.response_time, s.difficulty); });
      var diffs = sessions.map(function (s) { return DIFFICULTY_WEIGHT[s.difficulty] || 0.85; });
      return Math.round(S.clamp(
        0.80 * S.avg(accs) +
        0.12 * S.avg(speeds) +
        0.08 * S.avg(diffs), 0, 1) * 100);
    },

    /**
     * Aggregate of recent sessions.
     * @returns {{score:number, trend:'improving'|'stable'|'lower', delta:number,
     *            sessions:number, accuracy:number, speed:number}}
     */
    cognitiveActivityScore: function (patientId) {
      var sessions = this.recentSessions(patientId, 12);
      if (!sessions.length) {
        return { score: 0, trend: 'stable', delta: 0, sessions: 0, accuracy: 0, speed: 0, empty: true };
      }

      var accs = sessions.map(function (s) { return s.accuracy; });
      var speeds = sessions.map(function (s) { return S.Adaptive.speedFactor(s.response_time, s.difficulty); });
      var score = this.scoreOfSessions(sessions);
      var d = this.trendOf(patientId, score);

      return {
        score: score,
        trend: d.trend,
        delta: d.delta,
        sessions: sessions.length,
        accuracy: S.round(S.avg(accs), 3),
        speed: S.round(S.avg(speeds), 3),
        empty: false
      };
    },

    /** Compare the newest window with the one before it. */
    trendOf: function (patientId, currentScore) {
      var all = this.recentSessions(patientId, 24);
      if (all.length < 6) return { trend: 'stable', delta: 0 };
      var half = Math.floor(all.length / 2);
      var older = all.slice(0, half);
      var newer = all.slice(half);
      var delta = this.scoreOfSessions(newer) - this.scoreOfSessions(older);
      var trend = delta >= 3 ? 'improving' : (delta <= -3 ? 'lower' : 'stable');
      return { trend: trend, delta: delta, current: currentScore };
    },

    trendLabel: function (trend) {
      if (trend === 'improving') return { icon: '↑', text: 'Improving', cls: 'trend-up' };
      if (trend === 'lower') return { icon: '↓', text: 'Lower than recent average', cls: 'trend-down' };
      return { icon: '→', text: 'Stable', cls: 'trend-flat' };
    },

    /* ---------- Session queries ---------- */
    sessionsFor: function (patientId) {
      return S.DB.forPatient('game_sessions', patientId).sort(function (a, b) {
        return a.timestamp < b.timestamp ? -1 : 1;
      });
    },

    recentSessions: function (patientId, n) {
      var all = this.sessionsFor(patientId);
      return all.slice(Math.max(0, all.length - n));
    },

    sessionsOn: function (patientId, dateISO) {
      return S.DB.where('game_sessions', function (s) {
        return s.patient_id === patientId && s.date === dateISO;
      });
    },

    /* ---------- Daily score record (chart series) ---------- */
    recordDailyScore: function (patientId) {
      var cas = this.cognitiveActivityScore(patientId);
      if (cas.empty) return null;
      var today = S.todayISO();
      var existing = S.DB.where('cognitive_scores', function (r) {
        return r.patient_id === patientId && r.date === today;
      })[0];
      if (existing) {
        return S.DB.update('cognitive_scores', existing.score_id, {
          score: cas.score, trend: cas.trend, sessions_counted: cas.sessions
        });
      }
      return S.DB.insert('cognitive_scores', S.M.newScore({
        patient_id: patientId, date: today, score: cas.score,
        trend: cas.trend, sessions_counted: cas.sessions
      }));
    },

    /** Daily score series for the last `days` days (gaps carried forward). */
    scoreSeries: function (patientId, days) {
      days = days || 14;
      var rows = S.DB.forPatient('cognitive_scores', patientId)
        .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      var map = {};
      rows.forEach(function (r) { map[r.date] = r.score; });
      var out = [], last = null, today = S.todayISO();
      for (var i = days - 1; i >= 0; i--) {
        var d = S.addDays(today, -i);
        if (map[d] !== undefined) last = map[d];
        out.push({ date: d, value: map[d] !== undefined ? map[d] : last });
      }
      return out.filter(function (p) { return p.value !== null; });
    },

    /* ---------- Per-activity breakdown ---------- */
    /** Accepts a patient row or a patient_id. */
    gameBreakdown: function (patientOrId) {
      var patientId = typeof patientOrId === 'string' ? patientOrId : (patientOrId || {}).patient_id;
      var sessions = this.sessionsFor(patientId);
      return S.M.GAMES.map(function (g) {
        var list = sessions.filter(function (s) { return s.game_type === g.id; });
        if (!list.length) {
          return { game: g, plays: 0, accuracy: null, score: null, rt: null, mistakes: 0, level: null, last: null };
        }
        return {
          game: g,
          plays: list.length,
          accuracy: S.avg(list.map(function (s) { return s.accuracy; })),
          score: Math.round(S.avg(list.map(function (s) { return s.score; }))),
          rt: S.round(S.avg(list.map(function (s) { return s.response_time; })), 1),
          mistakes: Math.round(S.avg(list.map(function (s) { return s.mistakes; }))),
          level: list[list.length - 1].difficulty,
          last: list[list.length - 1]
        };
      });
    },

    /** Overall averages used by the doctor's header stats. Row or id. */
    summary: function (patientOrId) {
      var patientId = typeof patientOrId === 'string' ? patientOrId : (patientOrId || {}).patient_id;
      var sessions = this.recentSessions(patientId, 20);
      var cas = this.cognitiveActivityScore(patientId);
      return {
        cas: cas,
        plays: this.sessionsFor(patientId).length,
        accuracy: sessions.length ? S.avg(sessions.map(function (s) { return s.accuracy; })) : 0,
        responseTime: sessions.length ? S.round(S.avg(sessions.map(function (s) { return s.response_time; })), 1) : 0,
        mistakes: sessions.length ? S.round(S.avg(sessions.map(function (s) { return s.mistakes; })), 1) : 0
      };
    },

    /** Weakest activities first — feeds the daily personalised session. */
    weakestActivities: function (patientId) {
      var breakdown = this.gameBreakdown(patientId);
      var played = breakdown.filter(function (b) { return b.plays > 0; });
      var never = breakdown.filter(function (b) { return b.plays === 0; });
      played.sort(function (a, b) { return a.accuracy - b.accuracy; });
      // Unplayed activities are worth introducing before re-drilling a strong one.
      return never.concat(played);
    }
  };

  S.Scoring = Scoring;
})(window);
