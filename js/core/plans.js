/* ============================================================
   SMIVAI — plans.js
   Free / Premium entitlements and care relationships (links).

   Every limit here is enforced where the action happens (starting a
   game, linking a patient, asking the advanced AI), not by hiding a
   button. The FastAPI service enforces the same numbers server-side
   (backend/app/plans.py) — if you change one, change both.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var FREE_GAMES = ['picture_matching', 'memory_pairs', 'picture_bingo', 'category_sorting'];

  var FEATURES = {
    patient: {
      free: {
        games: FREE_GAMES, maxCaregivers: 2, ai: 'basic', progress: 'basic',
        perks: ['4 brain games', 'Basic chat with HUN', 'Daily Fact & Daily Skill', 'Reminders', 'Photo memories', 'Up to 2 caregivers']
      },
      premium: {
        games: 'all', maxCaregivers: 6, ai: 'advanced', progress: 'advanced',
        perks: ['All 8 brain games', 'Advanced HUN conversations', 'Personalised activities', 'Detailed progress & insights', 'Early access to new games', 'Up to 6 caregivers']
      }
    },
    caregiver: {
      free: { maxPatients: 2, perks: ['Support up to 2 people', 'Reminders & memories', 'SOS alerts', 'Progress overview'] },
      premium: { maxPatients: 6, perks: ['Support up to 6 people', 'Everything in Free', 'Detailed progress for each person', 'Priority support'] }
    },
    doctor: {
      free: { maxPatients: 100, perks: ['Up to 100 patients', 'Activity & progress insights', 'Care reminders'] },
      premium: { maxPatients: 500, perks: ['Up to 500 patients', 'Everything in Free', 'Printable summaries', 'Priority support'] }
    }
  };

  /* Demo prices, shown with a "no money is charged" note. */
  var PRICE = { patient: 149, caregiver: 199, doctor: 1499 };

  var ENTITY = { patient: ['patients', 'patient_id'], caregiver: ['caregivers', 'caregiver_id'], doctor: ['doctors', 'doctor_id'],
                 donor: ['donors', 'donor_id'], admin: ['staff', 'staff_id'], charity_partner: ['staff', 'staff_id'] };
  function entityTable(role) { return (ENTITY[role] || ENTITY.doctor)[0]; }
  function entityPk(role) { return (ENTITY[role] || ENTITY.doctor)[1]; }

  var Plans = {
    FEATURES: FEATURES,
    PRICE: PRICE,
    FREE_GAMES: FREE_GAMES,

    entity: function (role, id) { return S.DB.find(entityTable(role), id); },

    planOf: function (role, id) {
      var e = this.entity(role, id);
      return e && e.plan === 'premium' ? 'premium' : 'free';
    },

    /** Plan of whoever is signed in. */
    current: function () {
      var s = S.Auth.session();
      return s ? this.planOf(s.role, s.actor_id) : 'free';
    },
    isPremium: function () { return this.current() === 'premium'; },

    features: function (role, plan) { return FEATURES[role][plan || 'free']; },

    /* ---------------- games ---------------- */
    gameTier: function (gameId) { return FREE_GAMES.indexOf(gameId) !== -1 ? 'free' : 'premium'; },

    /** Game access follows the *patient's* plan, whoever is holding the tablet. */
    canPlay: function (patient, gameId) {
      if (this.gameTier(gameId) === 'free') return true;
      return !!patient && this.planOf('patient', patient.patient_id) === 'premium';
    },

    patientFeature: function (patient, key) {
      var plan = patient ? this.planOf('patient', patient.patient_id) : 'free';
      return FEATURES.patient[plan][key];
    },

    /* ---------------- limits ---------------- */
    linkLimit: function (role, actorId) {
      var plan = this.planOf(role, actorId);
      return role === 'patient' ? FEATURES.patient[plan].maxCaregivers : FEATURES[role][plan].maxPatients;
    },

    /* ---------------- upgrade / downgrade ---------------- */
    upgrade: function (role, id, method) {
      return S.Services.Payment.charge({ amount: PRICE[role], method: method }).then(function (res) {
        if (!res.ok) return res;
        var patch = { plan: 'premium', plan_since: S.stamp(), plan_txn: res.txnId };
        S.DB.update(entityTable(role), id, patch);
        S.Services.Notify.push({ recipient_role: role, recipient_id: id, kind: 'plan',
          title: 'Welcome to SMIVAI Premium', body: 'Your Premium features are ready. (Demo payment ' + res.txnId + ')' });
        S.bus.emit('plan:changed', { role: role, id: id, plan: 'premium' });
        return { ok: true, txnId: res.txnId };
      });
    },

    downgrade: function (role, id) {
      S.DB.update(entityTable(role), id, { plan: 'free' });
      S.bus.emit('plan:changed', { role: role, id: id, plan: 'free' });
      return { ok: true };
    }
  };

  /* ============================================================
     Links — who may see which patient.
     link: { link_id, patient_id, actor_role, actor_id, status, created_at }
     ============================================================ */
  var Links = {
    all: function () { return S.DB.all('links').filter(function (l) { return l.status !== 'removed'; }); },

    forActor: function (role, actorId) {
      return this.all().filter(function (l) { return l.actor_role === role && l.actor_id === actorId; });
    },

    forPatient: function (patientId, role) {
      return this.all().filter(function (l) { return l.patient_id === patientId && (!role || l.actor_role === role); });
    },

    exists: function (role, actorId, patientId) {
      return this.all().some(function (l) { return l.actor_role === role && l.actor_id === actorId && l.patient_id === patientId; });
    },

    /** Everything that can stop a link, checked in one place. */
    check: function (role, actorId, patient) {
      if (!patient) return { ok: false, error: 'We could not find a SMIVAI member with that code. Please check it with them.' };
      if (this.exists(role, actorId, patient.patient_id)) return { ok: false, error: patient.name + ' is already in your list.' };

      var mine = this.forActor(role, actorId).length;
      var myLimit = Plans.linkLimit(role, actorId);
      if (mine >= myLimit) {
        return {
          ok: false, limit: true, error: role === 'doctor'
            ? 'Your ' + (Plans.planOf(role, actorId) === 'premium' ? 'Premium' : 'Free') + ' plan includes up to ' + myLimit + ' patients.'
            : 'Your ' + (Plans.planOf(role, actorId) === 'premium' ? 'Premium' : 'Free') + ' plan lets you support up to ' + myLimit + ' people.'
        };
      }
      if (role === 'caregiver') {
        var theirs = this.forPatient(patient.patient_id, 'caregiver').length;
        var theirLimit = Plans.linkLimit('patient', patient.patient_id);
        if (theirs >= theirLimit) {
          return { ok: false, error: patient.name + ' already has ' + theirs + ' caregivers, the most their ' +
            (Plans.planOf('patient', patient.patient_id) === 'premium' ? 'Premium' : 'Free') + ' plan allows.' };
        }
      }
      return { ok: true };
    },

    add: function (role, actorId, patient) {
      var c = this.check(role, actorId, patient);
      if (!c.ok) return c;
      var link = S.DB.insert('links', {
        link_id: S.uid('lnk'), patient_id: patient.patient_id,
        actor_role: role, actor_id: actorId, status: 'active', created_at: S.stamp()
      });
      S.Services.Notify.push({ recipient_role: 'patient', recipient_id: patient.patient_id, patient_id: patient.patient_id,
        kind: 'link', title: (role === 'doctor' ? 'A doctor' : 'A caregiver') + ' joined your care team',
        body: (S.State.actorName || 'Someone') + ' can now see your SMIVAI activity.' });
      return { ok: true, link: link };
    },

    remove: function (linkId) {
      return S.DB.update('links', linkId, { status: 'removed', removed_at: S.stamp() });
    },

    /* ------------------------------------------------------------
       What each person on the care team may see — the patient decides.
       Alerts/SOS, reminders and appointments are always shared, because
       the link exists for safety and care. These three can be withheld:
         memories  the Memory Bank (photos, stories)
         health    medicine orders and health records
         activity  games, scores, progress and mood
       A link made before scopes existed shares all three; the patient can
       narrow it at any time. Mirrored on the server (backend/app/deps.py).
       ------------------------------------------------------------ */
    SCOPES: ['memories', 'health', 'activity'],

    scopesOf: function (link) {
      var s = (link && link.scopes) || {};
      var out = {};
      this.SCOPES.forEach(function (k) { out[k] = s[k] !== false; });
      return out;
    },

    allows: function (role, actorId, patientId, scope) {
      if (role === 'patient') return actorId === patientId;
      var link = this.all().filter(function (l) { return l.actor_role === role && l.actor_id === actorId && l.patient_id === patientId; })[0];
      return !!link && this.scopesOf(link)[scope] !== false;
    },

    setScopes: function (linkId, scopes) {
      var clean = {};
      this.SCOPES.forEach(function (k) { clean[k] = scopes[k] !== false; });
      return S.DB.update('links', linkId, { scopes: clean });
    },

    /**
     * Join a patient's care team with the code they read out.
     * Server mode: the SMIVAI server checks the code, the plan limits and
     * creates the link (POST /links); the device then keeps a copy of the
     * link and of the patient's profile. Device mode: as before, on this device.
     * @returns {Promise<{ok, error?, limit?, patient?}>}
     */
    join: function (role, actorId, code) {
      var sess = S.Auth.session();
      if (!(S.CONFIG.apiBase && sess && sess.mode === 'server')) {
        var found = this.byCode(code);
        var res = this.add(role, actorId, found);
        return Promise.resolve(res.ok ? { ok: true, patient: found } : res);
      }
      var base = S.CONFIG.apiBase, auth = { Authorization: 'Bearer ' + sess.token };
      return fetch(base + '/links', {
        method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, auth),
        body: JSON.stringify({ share_code: String(code || '').trim() })
      }).then(function (r) {
        return r.json().then(function (j) { return { status: r.status, body: j }; });
      }).then(function (r) {
        if (r.status === 401) { S.Auth.expire(); return { ok: false, error: 'Please sign in again.' }; }
        if (r.status !== 201) {
          return { ok: false, limit: r.status === 409 && /plan/i.test((r.body && r.body.detail) || ''),
                   error: (r.body && r.body.detail) || 'That care code did not work. Please check it.' };
        }
        var pid = r.body.patient_id;
        if (!S.DB.find('links', r.body.link_id)) {
          S.DB.insert('links', { link_id: r.body.link_id, patient_id: pid, actor_role: role, actor_id: actorId,
            status: 'active', created_at: S.stamp() }, { silent: true });
        }
        return fetch(base + '/patients/' + encodeURIComponent(pid), { headers: auth })
          .then(function (pr) { return pr.ok ? pr.json() : { patient_id: pid, name: r.body.patient_name }; })
          .then(function (p) {
            if (S.DB.find('patients', pid)) S.DB.update('patients', pid, p, { silent: true });
            else S.DB.insert('patients', p, { silent: true });
            return { ok: true, patient: S.DB.find('patients', pid) };
          });
      }).catch(function () { return { ok: false, error: 'We could not reach the SMIVAI server. Please try again.' }; });
    },

    byCode: function (code) {
      var c = String(code || '').trim().toUpperCase().replace(/\s+/g, '');
      if (!c) return null;
      return S.DB.where('patients', function (p) {
        return (p.share_code || '').replace(/-/g, '') === c.replace(/-/g, '');
      })[0] || null;
    }
  };

  /**
   * Human-friendly code a patient reads out to a caregiver or doctor.
   * Deterministic per patient, and it avoids the letters and digits that
   * are easy to mishear (I, O, 0, 1).
   */
  Plans.makeShareCode = function (seed) {
    var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var out = '';
    for (var i = 0; i < 6; i++) {
      out += alphabet.charAt(S.hashSeed(seed + ':share:' + i) % alphabet.length);
    }
    return 'SMV-' + out;
  };

  S.Plans = Plans;
  S.Links = Links;
})(window);
