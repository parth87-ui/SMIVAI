/* ============================================================
   SMIVAI — auth.js
   Sign-in: role → identity check (mock) → OTP (mock) → session.

   Two transports, same shape (like sync.js):
     · device  — accounts live in the device store; identity and OTP are
                 the clearly-labelled mocks in services.js.
     · server  — when S.CONFIG.apiBase is set, the FastAPI service issues
                 a signed token (backend/app/auth.py) and the device keeps
                 a local mirror of the account for offline use.

   The session token is never a credential for anything outside SMIVAI,
   and no identity number is stored — only a salted hash and the last
   four digits, which is all the UI ever shows.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var SESSION_KEY = 'smivai.session.v2';
  var TTL = { patient: 30 * 24 * 3600e3, caregiver: 24 * 3600e3, doctor: 12 * 3600e3 };
  var SALT = 'smivai-device-v1';

  function randomToken() {
    var bytes = new Uint8Array(24);
    try { global.crypto.getRandomValues(bytes); } catch (e) { for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256); }
    return Array.prototype.map.call(bytes, function (b) { return (b < 16 ? '0' : '') + b.toString(16); }).join('');
  }

  function hashId(role, idType, normalized) {
    var input = SALT + '|' + role + '|' + idType + '|' + normalized;
    if (global.crypto && global.crypto.subtle && global.TextEncoder) {
      return global.crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) { return (b < 16 ? '0' : '') + b.toString(16); }).join('');
      }).catch(function () { return 'f' + S.hashSeed(input).toString(16); });
    }
    return Promise.resolve('f' + S.hashSeed(input).toString(16));
  }

  var pending = {};   // OTP challenge id → verified identity subject

  /* ============================================================
     Transport. `device` is the offline-first default: identity and OTP
     are the labelled mocks in services.js and the token is local. With
     S.CONFIG.apiBase set, the FastAPI service does the same three steps
     and signs the token (backend/app/auth.py); the account is mirrored
     locally so the app still works with the network off afterwards.
     ============================================================ */
  /* Server sign-in for this role? Always with apiBase; otherwise only for
     the server-only roles (donor and staff), when a server was found. */
  function remote(role) { return !!S.Server.base(role); }

  function api(path, body, role) {
    return fetch(S.Server.base(role) + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().then(function (j) { return { status: r.status, body: j }; });
    });
  }

  /**
   * After a server sign-in, bring this person's own profile — and, for a
   * caregiver or doctor, the profiles of the patients they may see — onto
   * the device. Without it a device that never held the account has no
   * profile to show. Stored silently (not queued back to the server).
   * Only profiles: the rest of a patient's records are not pulled yet.
   */
  function pullProfile(token, role) {
    var auth = { Authorization: 'Bearer ' + token };
    var table = { patient: 'patients', caregiver: 'caregivers', doctor: 'doctors', donor: 'donors', admin: 'staff', charity_partner: 'staff' }[role];
    var pk = S.DB.pk(table);
    function upsert(t, row) {
      var key = S.DB.pk(t);
      if (S.DB.find(t, row[key])) S.DB.update(t, row[key], row, { silent: true });
      else S.DB.insert(t, row, { silent: true });
    }
    var base = S.Server.base(role);
    var own = fetch(base + '/me/profile', { headers: auth }).then(function (r) {
      if (!r.ok) throw new Error('profile ' + r.status);
      return r.json();
    }).then(function (j) { if (j.profile && j.profile[pk]) upsert(table, j.profile); });
    var theirs = role === 'patient' ? Promise.resolve() : fetch(base + '/patients', { headers: auth })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) { (list || []).forEach(function (p) { if (p.patient_id) upsert('patients', p); }); });
    return Promise.all([own, theirs]).then(function () { return true; }, function (e) {
      console.warn('[SMIVAI] could not fetch the profile from the server', e);
      return false;
    });
  }

  /** Keep a local mirror of the server account so offline use continues. */
  function mirror(session) {
    var a = session.account;
    var row = S.DB.find('accounts', a.account_id);
    var patch = {
      account_id: a.account_id, role: a.role, entity_id: a.actor_id, name: a.name,
      id_type: a.id_type, id_last4: a.id_last4, verification: a.verification || 'prototype',
      settings: row ? row.settings : {}, created_at: row ? row.created_at : S.stamp()
    };
    if (row) S.DB.update('accounts', a.account_id, patch, { silent: true });
    else S.DB.insert('accounts', patch, { silent: true });
    return S.DB.find('accounts', a.account_id);
  }

  var Auth = {
    lastExpired: false,

    /* ---------------- session ---------------- */
    session: function () {
      var s = null;
      try { s = JSON.parse(global.localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { s = null; }
      if (!s) return null;
      if (!s.expires_at || Date.now() > s.expires_at) {
        this.lastExpired = true;
        this._clear();
        return null;
      }
      var acct = S.DB.find('accounts', s.account_id);
      if (!acct) {
        /* Only forget the session once we are sure the store is loaded and
           does hold accounts — otherwise a half-finished boot would sign
           the patient out for no reason. */
        if (S.DB.ready && S.DB.count('accounts')) this._clear();
        return null;
      }
      return s;
    },

    account: function () {
      var s = this.session();
      return s ? S.DB.find('accounts', s.account_id) : null;
    },

    _clear: function () { try { global.localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ } },

    /** The server no longer accepts this session's token (expired, or the
        server restarted without SMIVAI_AUTH_SECRET). Sign out; the router
        tells the person why on the next screen. */
    expire: function () {
      var s = null;
      try { s = JSON.parse(global.localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { s = null; }
      if (!s || s.mode !== 'server') return;
      this._clear();
      this.lastExpired = true;
      S.bus.emit('auth:changed', null);
    },

    _start: function (acct, serverToken) {
      var s = {
        token: serverToken || randomToken(),
        mode: serverToken ? 'server' : 'device',
        account_id: acct.account_id,
        role: acct.role,
        actor_id: acct.entity_id,
        name: acct.name,
        issued_at: Date.now(),
        expires_at: Date.now() + (TTL[acct.role] || TTL.caregiver)
      };
      try { global.localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
      S.DB.update('accounts', acct.account_id, { last_login_at: S.stamp() }, { silent: true });
      this.lastExpired = false;
      S.Prefs.apply();
      S.bus.emit('auth:changed', s);
      return s;
    },

    /* ---------------- step 1: identity ---------------- */
    /**
     * @returns {Promise<{ok, error?, challengeId, demoCode, mobileTail, label}>}
     */
    begin: function (role, idType, raw) {
      var self = this;
      if (remote(role)) {
        return api('/auth/start', { role: role, id_type: idType, id_number: raw }, role).then(function (r) {
          if (r.status !== 200) return { ok: false, error: (r.body && r.body.detail) || 'Verification failed.' };
          pending[r.body.challenge_id] = { role: role, idType: idType, remote: true, mobileTail: r.body.mobile_tail };
          return {
            ok: true, challengeId: r.body.challenge_id, demoCode: r.body.demo_code,
            mobileTail: r.body.mobile_tail, label: r.body.identity_check, existing: r.body.account_exists,
            otpLabel: r.body.otp_delivery
          };
        }).catch(function () {
          return { ok: false, error: 'We could not reach the SMIVAI service. Please try again.' };
        });
      }
      return S.Services.Identity.verify(idType, raw).then(function (res) {
        if (!res.ok) return res;
        return hashId(role, idType, res.normalized).then(function (hash) {
          return S.Services.Otp.send({ role: role, idType: idType, hash: hash, last4: res.last4, mobileTail: res.mobileTail })
            .then(function (otp) {
              pending[otp.challengeId] = { role: role, idType: idType, hash: hash, last4: res.last4, mobileTail: res.mobileTail, label: res.label };
              return {
                ok: true, challengeId: otp.challengeId, demoCode: otp.demoCode,
                mobileTail: res.mobileTail, label: res.label,
                existing: !!self.findAccount(role, hash)
              };
            });
        });
      }).catch(function (err) {
        console.warn('[SMIVAI] auth.begin', err);
        return { ok: false, error: 'We could not start verification. Please try again.' };
      });
    },

    resend: function (challengeId) {
      var subj = pending[challengeId];
      if (subj && subj.remote) {
        return api('/auth/resend', { challenge_id: challengeId }, subj.role).then(function (r) {
          if (r.status !== 200) return { ok: false, error: (r.body && r.body.detail) || 'We could not send a new code.' };
          pending[r.body.challenge_id] = subj; delete pending[challengeId];
          return { ok: true, challengeId: r.body.challenge_id, demoCode: r.body.demo_code, otpLabel: r.body.otp_delivery };
        }).catch(function () { return { ok: false, error: 'We could not reach the SMIVAI service. Please try again.' }; });
      }
      return S.Services.Otp.resend(challengeId).then(function (r) {
        if (r.ok && subj) { pending[r.challengeId] = subj; delete pending[challengeId]; }
        return r;
      });
    },

    findAccount: function (role, hash) {
      return S.DB.where('accounts', function (a) { return a.role === role && a.id_hash === hash; })[0] || null;
    },

    /* ---------------- step 2: OTP ---------------- */
    /** @returns {Promise<{ok, error?, session?, needsProfile?, ticket?}>} */
    confirm: function (challengeId, code) {
      var self = this;
      var subj = pending[challengeId];
      if (subj && subj.remote && remote(subj.role)) {
        return api('/auth/verify', { challenge_id: challengeId, code: code }, subj.role).then(function (r) {
          if (r.status !== 200) return { ok: false, error: (r.body && r.body.detail) || 'That code is not correct.' };
          delete pending[challengeId];
          if (r.body.needs_profile) {
            pending[r.body.ticket] = { role: r.body.role, remote: true };
            return { ok: true, needsProfile: true, ticket: r.body.ticket, role: r.body.role };
          }
          var acct = mirror(r.body);
          return pullProfile(r.body.token, acct.role).then(function () { return { ok: true, session: self._start(acct, r.body.token) }; });
        });
      }
      return S.Services.Otp.verify(challengeId, code).then(function (r) {
        if (!r.ok) return r;
        delete pending[challengeId];
        if (!subj) return { ok: false, error: 'Please start again.' };
        var acct = self.findAccount(subj.role, subj.hash);
        if (acct) return { ok: true, session: self._start(acct) };
        var ticket = S.uid('tkt');
        pending[ticket] = subj;
        return { ok: true, needsProfile: true, ticket: ticket, role: subj.role };
      });
    },

    /* ---------------- step 3 (first time only): profile ---------------- */
    createProfile: function (ticket, profile) {
      var subj = pending[ticket];
      if (!subj) return { ok: false, error: 'Your sign-in has expired. Please start again.' };
      if (subj.remote && remote(subj.role)) {
        var self = this;
        return api('/auth/profile', {
          ticket: ticket, name: profile.name, age: parseInt(profile.age, 10) || null,
          gender: profile.gender, language: profile.language || 'en', district: profile.district,
          speciality: profile.speciality, relation: profile.relation,
          consent: !!profile.consent, notice_version: profile.notice_version
        }, subj.role).then(function (r) {
          if (r.status >= 400) return { ok: false, error: (r.body && r.body.detail) || 'We could not finish sign-up.' };
          delete pending[ticket];
          var acct = mirror(r.body);
          return pullProfile(r.body.token, acct.role).then(function () { return { ok: true, session: self._start(acct, r.body.token) }; });
        });
      }
      var name = String(profile.name || '').trim();
      if (name.length < 2) return { ok: false, error: 'Please enter your full name.' };
      if (!profile.consent) return { ok: false, error: 'Please read the privacy notice and agree to it first.' };
      var entityId;

      if (subj.role === 'patient') {
        var p = S.M.newPatient({
          name: name, age: parseInt(profile.age, 10) || null,
          language: profile.language || 'en', language_confirmed: true,
          district: profile.district || '', gender: profile.gender || '',
          caregiver_id: null, doctor_id: null
        });
        p.plan = 'free';
        p.share_code = S.Plans.makeShareCode(p.patient_id);
        S.DB.insert('patients', p);
        entityId = p.patient_id;
      } else if (subj.role === 'caregiver') {
        entityId = S.uid('cg');
        S.DB.insert('caregivers', { caregiver_id: entityId, name: name, phone_tail: subj.mobileTail, plan: 'free', relation: profile.relation || '' });
      } else {
        entityId = S.uid('dr');
        S.DB.insert('doctors', {
          doctor_id: entityId, name: /^dr\.?\s/i.test(name) ? name : 'Dr. ' + name, speciality: profile.speciality || 'General Physician',
          license_last4: subj.last4, license_verified: 'prototype', plan: 'free'
        });
      }

      var acct = S.DB.insert('accounts', {
        account_id: S.uid('acct'), role: subj.role, entity_id: entityId,
        name: subj.role === 'doctor' ? S.DB.find('doctors', entityId).name : name,
        id_type: subj.idType, id_hash: subj.hash, id_last4: subj.last4, phone_tail: subj.mobileTail,
        verification: 'prototype', settings: {}, created_at: S.stamp(),
        consent: { purpose: 'smivai_service', notice_version: profile.notice_version || S.PRIVACY_NOTICE_VERSION, given_at: S.stamp() }
      });
      delete pending[ticket];
      return { ok: true, session: this._start(acct) };
    },

    /* ---------------- sign out ---------------- */
    logout: function () {
      if (S.Talk) S.Talk.end(true);
      S.Voice.stop();
      this._clear();
      S.State.clear();
      S.Prefs.apply();
      S.bus.emit('auth:changed', null);
    },

    /** Route guard. Returns the session if the role matches. */
    require: function (role) {
      var s = this.session();
      if (!s) return { ok: false, reason: this.lastExpired ? 'expired' : 'signed-out' };
      if (role && s.role !== role) return { ok: false, reason: 'wrong-role', session: s };
      return { ok: true, session: s };
    },

    hashId: hashId
  };

  /* ============================================================
     Preferences (Settings) — stored on the account, applied globally.
     ============================================================ */
  /* Text size and language have to work on the welcome and sign-in
     screens too, before there is an account to keep them on. This device
     remembers them; an account that has never chosen follows the device,
     so enlarging the text before signing in is not undone by signing in. */
  var DEVICE_KEY = 'smivai.device.v1';
  var DEVICE_KEYS = ['font', 'ui_lang'];
  function deviceRead() {
    try { return JSON.parse(localStorage.getItem(DEVICE_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function deviceWrite(k, v) {
    try { var d = deviceRead(); d[k] = v; localStorage.setItem(DEVICE_KEY, JSON.stringify(d)); } catch (e) { /* private mode */ }
  }

  var DEFAULTS = {
    ui_lang: 'en',            // screens shown before anyone signs in
    premium_card: 'show',     // show · hidden — the sidebar's upgrade card
    font: 'md',               // md · lg · xl · xxl
    motion: 'auto',           // auto · reduce
    contrast: 'normal',       // normal · high
    voice_autoplay: true,
    /* Which language to read aloud in when the patient's own has no voice
       on this device. 'off' means: show the words, never substitute. */
    voice_fallback: 'off',
    /* Hands-free "Hey HUN" on the Talk screen. Off until the person turns
       it on; it never listens anywhere else (see wakeword.js). */
    wake_word: false,
    /* Nearest known town, {key, source} — never coordinates (core/location.js). */
    location: null,
    /* Book a Doctor order: recommended · rating_desc/asc · fee_asc/desc · distance_asc/desc */
    doctor_sort: 'recommended',
    notif_reminders: true,
    notif_caregiver: true,
    notif_appointments: true,
    notif_system: false,
    show_weather: true
  };

  var Prefs = {
    DEFAULTS: DEFAULTS,
    all: function () {
      var a = Auth.account();
      var s = (a && a.settings) || {};
      var dev = deviceRead();
      var out = {};
      Object.keys(DEFAULTS).forEach(function (k) {
        out[k] = s[k] !== undefined ? s[k]
          : (DEVICE_KEYS.indexOf(k) !== -1 && dev[k] !== undefined ? dev[k] : DEFAULTS[k]);
      });
      return out;
    },
    get: function (k) { return this.all()[k]; },
    set: function (k, v) {
      if (DEVICE_KEYS.indexOf(k) !== -1) deviceWrite(k, v);
      var a = Auth.account();
      if (a) {
        var s = Object.assign({}, a.settings || {});
        s[k] = v;
        S.DB.update('accounts', a.account_id, { settings: s }, { silent: true });
      }
      this.apply();
    },
    apply: function () {
      var p = this.all();
      var root = document.documentElement;
      root.setAttribute('data-font', p.font === 'md' ? '' : p.font);
      if (p.font === 'md') root.removeAttribute('data-font');
      if (p.motion === 'reduce') root.setAttribute('data-motion', 'reduce'); else root.removeAttribute('data-motion');
      if (p.contrast === 'high') root.setAttribute('data-contrast', 'high'); else root.removeAttribute('data-contrast');
      if (S.Voice) S.Voice.enabled = true;
    }
  };

  S.Auth = Auth;
  S.Prefs = Prefs;
})(window);
