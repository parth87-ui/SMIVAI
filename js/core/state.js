/* ============================================================
   SMIVAI — state.js
   Session state (who is using the app, which patient is selected) and
   the personalised daily session planner.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var STATE_KEY = 'smivai.state.v1';

  var State = {
    role: null,            // patient | caregiver | doctor
    patientId: null,       // the patient currently being viewed / played as
    actorId: null,         // cg_001 / dr_001 / the patient's own id
    actorName: '',

    load: function () {
      try {
        var raw = global.localStorage.getItem(STATE_KEY);
        if (raw) {
          var o = JSON.parse(raw);
          this.role = o.role || null;
          this.patientId = o.patientId || null;
          this.actorId = o.actorId || null;
          this.actorName = o.actorName || '';
        }
      } catch (e) { /* first run */ }
    },

    save: function () {
      try {
        global.localStorage.setItem(STATE_KEY, JSON.stringify({
          role: this.role, patientId: this.patientId,
          actorId: this.actorId, actorName: this.actorName
        }));
      } catch (e) { /* ignore */ }
    },

    /** Adopt the signed-in session. The actor always comes from Auth —
        never from a role picked on screen. */
    fromSession: function (sess) {
      if (!sess) { this.clear(); return; }
      var changed = this.role !== sess.role || this.actorId !== sess.actor_id;
      this.role = sess.role;
      this.actorId = sess.actor_id;
      var ent = S.Plans.entity(sess.role, sess.actor_id);
      this.actorName = ent ? ent.name : sess.name;
      if (sess.role === 'patient') this.patientId = sess.actor_id;
      else if (this.patientId && !this.assertAccess(this.patient())) this.patientId = null;
      if (!this.patientId && sess.role !== 'patient') {
        var first = this.patients()[0];
        this.patientId = first ? first.patient_id : null;
      }
      document.body.classList.toggle('role-patient', sess.role === 'patient');
      this.save();
      if (changed) S.bus.emit('state:role', sess.role);
    },

    setRole: function (role) {
      var sess = S.Auth.session();
      if (sess && sess.role === role) this.fromSession(sess);
    },

    setPatient: function (patientId) {
      if (this.role && this.role !== 'patient' && !this.assertAccess(S.DB.find('patients', patientId))) return;
      if (this.role === 'patient' && patientId !== this.actorId) return;
      this.patientId = patientId;
      if (this.role === 'patient') { this.actorId = patientId; this.actorName = (this.patient() || {}).name || ''; }
      this.save();
      S.bus.emit('state:patient', patientId);
    },

    patient: function () { return S.DB.find('patients', this.patientId); },

    /** Patients this actor is allowed to see. */
    patients: function () { return S.M.visiblePatients(this.role, this.actorId); },

    /** Guard used by every dashboard read. */
    assertAccess: function (patient) {
      if (!patient) return false;
      return S.M.canAccess(this.role, this.actorId, patient);
    },

    clear: function () {
      this.role = null; this.actorId = null; this.actorName = ''; this.patientId = null;
      document.body.classList.remove('role-patient');
      this.save();
    }
  };

  /* ============================================================
     Daily personalised session
     2–3 short activities chosen from recent performance, not all six.
     ============================================================ */
  var Plan = {
    /** Stored plan for today, generated on first use. */
    forToday: function (patient) {
      if (!patient) return null;
      var today = S.todayISO();
      var existing = S.DB.where('daily_sessions', function (p) {
        return p.patient_id === patient.patient_id && p.date === today;
      })[0];
      if (existing) return existing;
      return this.generate(patient, today);
    },

    generate: function (patient, date) {
      var ranked = S.Scoring.weakestActivities(patient.patient_id);
      var memoryCount = S.DB.forPatient('memory_bank', patient.patient_id).length;

      var chosen = [];
      var pushGame = function (gameId) {
        // Only activities this patient's plan includes are ever suggested.
        if (!S.Plans.canPlay(patient, gameId) || !S.Games[gameId]) return;
        if (chosen.indexOf(gameId) === -1 && chosen.length < 3) chosen.push(gameId);
      };

      // Always include a personal reminiscence activity when there is
      // enough in the Memory Bank to build real questions from.
      if (memoryCount >= 4) pushGame('my_memories');

      ranked.forEach(function (r) { pushGame(r.game.id); });

      var plan = {
        plan_id: S.uid('plan'),
        patient_id: patient.patient_id,
        date: date,
        activities: chosen.map(function (g) {
          var level = S.Adaptive.difficultyFor(patient, g);
          return {
            game_type: g,
            difficulty: level,
            minutes: S.M.game(g).minutes[S.M.difficultyIndex(level)]
          };
        }),
        created_at: S.stamp()
      };
      S.DB.insert('daily_sessions', plan, { silent: true });
      return plan;
    },

    /** How far through today's session the patient is. */
    progress: function (patient) {
      var plan = this.forToday(patient);
      if (!plan) return { done: 0, total: 0, items: [] };
      var todays = S.Scoring.sessionsOn(patient.patient_id, S.todayISO());
      var items = plan.activities.filter(function (a) { return S.Plans.canPlay(patient, a.game_type); }).map(function (a) {
        var match = todays.filter(function (s) { return s.game_type === a.game_type; });
        return {
          game: S.M.game(a.game_type),
          game_type: a.game_type,
          difficulty: a.difficulty,
          minutes: a.minutes,
          done: match.length > 0,
          session: match[match.length - 1] || null
        };
      });
      return {
        done: items.filter(function (i) { return i.done; }).length,
        total: items.length,
        items: items,
        minutes: S.sum(plan.activities.map(function (a) { return a.minutes; })),
        next: items.filter(function (i) { return !i.done; })[0] || null
      };
    },

    /** Rebuild tomorrow's plan shape after a session (difficulty may have moved). */
    refresh: function (patient) {
      var today = S.todayISO();
      var existing = S.DB.where('daily_sessions', function (p) {
        return p.patient_id === patient.patient_id && p.date === today;
      })[0];
      if (!existing) return;
      var acts = existing.activities.map(function (a) {
        var level = S.Adaptive.difficultyFor(patient, a.game_type);
        return { game_type: a.game_type, difficulty: level, minutes: S.M.game(a.game_type).minutes[S.M.difficultyIndex(level)] };
      });
      S.DB.update('daily_sessions', existing.plan_id, { activities: acts }, { silent: true });
    }
  };

  S.State = State;
  S.Plan = Plan;
})(window);
