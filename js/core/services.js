/* ============================================================
   SMIVAI — services.js
   External integrations, each behind a small, replaceable interface.

   Every service here that is NOT a real integration says so in its
   `mock` flag and `label`, and the UI shows that label wherever the
   result is presented. Nothing in this file claims UIDAI, ABDM, NMC,
   SMS, payment-gateway or emergency-service connectivity that does not
   exist. To go live, replace the body of a service — callers only depend
   on the method signatures and the {ok, …} result shapes.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  /* ---------------- Verhoeff checksum (used by real Aadhaar numbers) ---------------- */
  var VD = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],
            [5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
  var VP = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],
            [4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
  var VINV = [0,4,3,2,1,5,6,7,8,9];
  function verhoeffValid(num) {
    var c = 0, digits = String(num).split('').reverse();
    for (var i = 0; i < digits.length; i++) c = VD[c][VP[i % 8][parseInt(digits[i], 10)]];
    return c === 0;
  }
  function verhoeffDigit(num) {
    var c = 0, digits = String(num).split('').reverse();
    for (var i = 0; i < digits.length; i++) c = VD[c][VP[(i + 1) % 8][parseInt(digits[i], 10)]];
    return VINV[c];
  }

  function digitsOnly(s) { return String(s || '').replace(/\D/g, ''); }

  /** A stable, fake "linked mobile" derived from the id, for display only. */
  function fakeMobileTail(id) { return String(1000 + (S.hashSeed(id) % 9000)); }

  var MOCK_ID_LABEL = 'Demo mode — identity is not verified with UIDAI or ABDM';
  var MOCK_LICENSE_LABEL = 'Demo mode — not checked against the NMC / State Medical Council register';

  /* ============================================================
     Identity (Aadhaar / ABHA / medical licence)
     ============================================================ */
  var Identity = {
    mock: true,
    label: MOCK_ID_LABEL,

    /** Aadhaar: 12 digits, first digit 2–9, valid Verhoeff checksum. */
    checkAadhaar: function (raw) {
      var n = digitsOnly(raw);
      if (n.length !== 12) return { ok: false, error: 'An Aadhaar number has 12 digits. Please check and try again.' };
      if (/^[01]/.test(n)) return { ok: false, error: 'An Aadhaar number never starts with 0 or 1. Please check the number.' };
      if (!verhoeffValid(n)) return { ok: false, error: 'This number does not look right. Please check each digit carefully.' };
      return { ok: true, normalized: n, last4: n.slice(-4), mobileTail: fakeMobileTail(n), idType: 'aadhaar' };
    },

    /** ABHA number: 14 digits (shown as XX-XXXX-XXXX-XXXX). */
    checkAbha: function (raw) {
      var n = digitsOnly(raw);
      if (n.length !== 14) return { ok: false, error: 'An ABHA number has 14 digits. Please check and try again.' };
      return { ok: true, normalized: n, last4: n.slice(-4), mobileTail: fakeMobileTail(n), idType: 'abha' };
    },

    /** Medical registration number, e.g. "ASMC-45821" or "NMC/2019/045821". */
    checkLicense: function (raw) {
      var n = String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
      if (!/^[A-Z]{2,6}[-\/]?(\d{4}[-\/])?\d{4,7}$/.test(n)) {
        return { ok: false, error: 'Please enter your registration number as it appears on your certificate, for example ASMC-45821.' };
      }
      return { ok: true, normalized: n, last4: n.replace(/\D/g, '').slice(-4), mobileTail: fakeMobileTail(n), idType: 'license', label: MOCK_LICENSE_LABEL };
    },

    /** Simulated network round-trip. Fails honestly when offline. */
    verify: function (idType, raw) {
      var res = idType === 'aadhaar' ? this.checkAadhaar(raw) : idType === 'abha' ? this.checkAbha(raw) : this.checkLicense(raw);
      return S.delay(700).then(function () {
        if (!res.ok) return res;
        if (!S.Sync.isOnline()) return { ok: false, error: 'You appear to be offline. Verification needs a connection — please try again when you are online.' };
        res.label = idType === 'license' ? MOCK_LICENSE_LABEL : MOCK_ID_LABEL;
        return res;
      });
    },

    /** Build a valid demo Aadhaar from an 11-digit stem (used by the seeder). */
    demoAadhaar: function (stem11) { return stem11 + verhoeffDigit(stem11); }
  };

  /* ============================================================
     OTP — no SMS is sent. The code is shown in a clearly marked
     demo banner so the flow can be exercised end to end.
     ============================================================ */
  var OTP_TTL_MS = 5 * 60 * 1000;
  var OTP_MAX_ATTEMPTS = 3;
  var challenges = {};

  var Otp = {
    mock: true,
    label: 'Demo mode — no SMS is sent; the code is shown on screen',

    send: function (subject) {
      var code = String(Math.floor(100000 + Math.random() * 900000));
      var id = S.uid('otp');
      challenges[id] = { code: code, subject: subject, expires: Date.now() + OTP_TTL_MS, attempts: 0, sentAt: Date.now() };
      return S.delay(500).then(function () {
        return { ok: true, challengeId: id, demoCode: code, expiresInSec: OTP_TTL_MS / 1000 };
      });
    },

    resend: function (challengeId) {
      var c = challenges[challengeId];
      if (!c) return Promise.resolve({ ok: false, error: 'This request has expired. Please start again.' });
      if (Date.now() - c.sentAt < 20000) return Promise.resolve({ ok: false, error: 'Please wait a few seconds before asking for a new code.' });
      delete challenges[challengeId];
      return this.send(c.subject);
    },

    verify: function (challengeId, code) {
      var c = challenges[challengeId];
      return S.delay(450).then(function () {
        if (!c) return { ok: false, error: 'This code has expired. Please ask for a new one.', expired: true };
        if (Date.now() > c.expires) { delete challenges[challengeId]; return { ok: false, error: 'This code has expired. Please ask for a new one.', expired: true }; }
        c.attempts += 1;
        if (digitsOnly(code) !== c.code) {
          var left = OTP_MAX_ATTEMPTS - c.attempts;
          if (left <= 0) { delete challenges[challengeId]; return { ok: false, error: 'Too many wrong codes. Please ask for a new one.', expired: true }; }
          return { ok: false, error: 'That code is not correct. You have ' + left + (left === 1 ? ' try' : ' tries') + ' left.' };
        }
        var subject = c.subject;
        delete challenges[challengeId];
        return { ok: true, subject: subject };
      });
    }
  };

  /* ============================================================
     Payment — demo only. No money moves, and the UI says so.
     ============================================================ */
  var Payment = {
    mock: true,
    label: 'Demo payment — no money is charged',
    charge: function (o) {
      return S.delay(1300).then(function () {
        if (!S.Sync.isOnline()) return { ok: false, error: 'Payment could not be completed because you are offline. Nothing was charged.' };
        if (!o || !o.amount || !o.method) return { ok: false, error: 'Please choose a payment method.' };
        return { ok: true, txnId: 'DEMO-' + Date.now().toString(36).toUpperCase(), amount: o.amount, method: o.method };
      });
    }
  };

  /* ============================================================
     Emergency — SMIVAI alerts linked caregivers inside the app and hands
     the phone's own dialer the emergency number. It does NOT contact
     emergency services itself.
     ============================================================ */
  var Emergency = {
    mock: true,
    label: 'SMIVAI alerts your caregivers in the app. It does not call emergency services by itself.',
    NUMBER: '112',
    raise: function (patient, note) {
      var caregivers = S.Links.forPatient(patient.patient_id, 'caregiver');
      var alert = S.DB.insert('alerts', {
        alert_id: S.uid('alert'),
        patient_id: patient.patient_id,
        kind: 'sos',
        severity: 'critical',
        title: patient.name + ' pressed SOS',
        body: note || 'Needs help now. Please call ' + patient.name.split(' ')[0] + ' immediately.',
        status: 'open',
        created_at: S.stamp()
      });
      caregivers.forEach(function (l) {
        Notify.push({ recipient_role: 'caregiver', recipient_id: l.actor_id, patient_id: patient.patient_id,
          kind: 'sos', title: 'SOS from ' + patient.name, body: alert.body, link: '#/caregiver/alerts' });
      });
      return S.delay(900).then(function () {
        return { ok: true, alert: alert, notified: caregivers.length };
      });
    },
    resolve: function (alertId, by) {
      return S.DB.update('alerts', alertId, { status: 'resolved', resolved_by: by, resolved_at: S.stamp() });
    }
  };

  /* ============================================================
     In-app notifications (and the browser's own, only if the user
     has already granted permission — SMIVAI never nags for it).
     ============================================================ */
  var Notify = {
    push: function (n) {
      var row = S.DB.insert('notifications', {
        notification_id: S.uid('ntf'),
        recipient_role: n.recipient_role,
        recipient_id: n.recipient_id,
        patient_id: n.patient_id || null,
        kind: n.kind || 'info',
        title: n.title,
        body: n.body || '',
        link: n.link || '',
        read: false,
        created_at: S.stamp()
      });
      try {
        var sess = S.Auth && S.Auth.session();
        if (sess && sess.role === n.recipient_role && sess.actor_id === n.recipient_id &&
            global.Notification && global.Notification.permission === 'granted' && S.Prefs.get('notif_system')) {
          new global.Notification(n.title, { body: n.body || '' });
        }
      } catch (e) { /* not supported */ }
      S.bus.emit('notifications:changed');
      return row;
    },
    forMe: function () {
      var sess = S.Auth.session();
      if (!sess) return [];
      return S.DB.where('notifications', function (n) {
        return n.recipient_role === sess.role && n.recipient_id === sess.actor_id;
      }).sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; });
    },
    unreadCount: function () { return this.forMe().filter(function (n) { return !n.read; }).length; },
    markAllRead: function () {
      this.forMe().forEach(function (n) { if (!n.read) S.DB.update('notifications', n.notification_id, { read: true }, { silent: true }); });
      S.bus.emit('notifications:changed');
    }
  };

  /* ============================================================
     Weather — a real, key-free public API (Open-Meteo), city-level
     coordinates only. Fails quietly: the card simply hides.
     ============================================================ */
  var CITY = {
    jorhat: [26.75, 94.2, 'Jorhat'], guwahati: [26.14, 91.74, 'Guwahati'], imphal: [24.82, 93.94, 'Imphal'],
    kokrajhar: [26.4, 90.27, 'Kokrajhar'], shillong: [25.58, 91.89, 'Shillong'], aizawl: [23.73, 92.72, 'Aizawl'],
    dibrugarh: [27.47, 94.91, 'Dibrugarh'], kohima: [25.67, 94.11, 'Kohima'], agartala: [23.83, 91.28, 'Agartala'],
    itanagar: [27.08, 93.61, 'Itanagar'], gangtok: [27.33, 88.61, 'Gangtok'], tezpur: [26.63, 92.8, 'Tezpur'],
    delhi: [28.61, 77.21, 'Delhi'], gurugram: [28.46, 77.03, 'Gurugram'], mumbai: [19.08, 72.88, 'Mumbai'],
    kolkata: [22.57, 88.36, 'Kolkata'], bengaluru: [12.97, 77.59, 'Bengaluru'], chennai: [13.08, 80.27, 'Chennai']
  };
  var Weather = {
    mock: false,
    label: 'Weather by Open-Meteo',
    CITY: CITY,                 // also used by core/location.js
    cityFor: function (district) {
      var d = String(district || '').toLowerCase();
      for (var k in CITY) if (d.indexOf(k) !== -1) return CITY[k];
      if (/assam/.test(d)) return CITY.guwahati;
      if (/manipur/.test(d)) return CITY.imphal;
      if (/meghalaya/.test(d)) return CITY.shillong;
      return null;
    },
    get: function (district) {
      var city = this.cityFor(district);
      if (!city || !S.Sync.isOnline() || !global.fetch) return Promise.resolve({ ok: false });
      var key = 'smivai.wx.' + city[2];
      try {
        var cached = JSON.parse(global.sessionStorage.getItem(key) || 'null');
        if (cached && Date.now() - cached.at < 30 * 60 * 1000) return Promise.resolve(cached.data);
      } catch (e) { /* ignore */ }
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + city[0] + '&longitude=' + city[1] + '&current=temperature_2m,weather_code&timezone=auto';
      var ctl = global.AbortController ? new global.AbortController() : null;
      var t = setTimeout(function () { if (ctl) ctl.abort(); }, 4500);
      return fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) { return r.json(); }).then(function (j) {
        clearTimeout(t);
        var c = j && j.current;
        if (!c) return { ok: false };
        var code = c.weather_code;
        var kind = code === 0 ? 'sun' : code <= 3 ? 'partly' : code >= 51 ? 'rain' : 'cloud';
        var text = code === 0 ? 'Clear sky' : code <= 3 ? 'Partly cloudy' : code >= 95 ? 'Thunderstorm' : code >= 51 ? 'Rain' : code >= 45 ? 'Foggy' : 'Cloudy';
        var data = { ok: true, temp: Math.round(c.temperature_2m), kind: kind, text: text, city: city[2] };
        try { global.sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data: data })); } catch (e) { /* ignore */ }
        return data;
      }).catch(function () { clearTimeout(t); return { ok: false }; });
    }
  };

  /* ============================================================
     Pharmacy — demo orders only.
     ============================================================ */
  /* No pharmacy is connected. Indian e-pharmacies do not offer a public
     ordering API; a real integration needs a partnership and a licensed
     pharmacy (docs/MEDICINES.md). So this saves a DEMO order only: no
     delivery estimate is invented, nothing is sent, and a prescription
     photo is always required, as a real pharmacy would ask for one. */
  var Pharmacy = {
    mock: true,
    label: 'Demo mode — no pharmacy is contacted and nothing will be delivered',
    place: function (o) {
      return S.delay(400).then(function () {
        if (!o.items || !o.items.length) return { ok: false, error: 'Please add at least one medicine.' };
        if (!o.prescription) return { ok: false, error: 'Please add a photo of your prescription. A pharmacy needs it before it can supply medicines.' };
        return { ok: true, reference: 'DEMO-RX-' + Date.now().toString(36).toUpperCase().slice(-6), eta: null };
      });
    }
  };

  /* ============================================================
     Advanced AI — only through the SMIVAI backend, which holds the
     model credentials server-side. Never a key in the browser.
     ============================================================ */
  var AI = {
    available: function () { return !!S.CONFIG.apiBase; },
    chat: function (payload) {
      if (!this.available()) return Promise.resolve({ ok: false, reason: 'not-configured' });
      var sess = S.Auth.session();
      return fetch(S.CONFIG.apiBase + '/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (sess ? sess.token : '') },
        body: JSON.stringify(payload)
      }).then(function (r) {
        if (r.status === 401) { S.Auth.expire(); return { ok: false, reason: 'signed-out' }; }
        if (r.status === 402) return { ok: false, reason: 'premium-required' };
        if (r.status === 503) return { ok: false, reason: 'not-configured' };
        if (!r.ok) return { ok: false, reason: 'server-error' };
        return r.json().then(function (j) { return { ok: true, text: j.reply, provider: j.provider || 'HUN (advanced)' }; });
      }).catch(function () { return { ok: false, reason: 'network' }; });
    }
  };

  S.Services = {
    Identity: Identity, Otp: Otp, Payment: Payment, Emergency: Emergency,
    Notify: Notify, Weather: Weather, Pharmacy: Pharmacy, AI: AI,
    verhoeffValid: verhoeffValid
  };
})(window);
