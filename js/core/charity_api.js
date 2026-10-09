/* ============================================================
   SMIVAI — charity_api.js
   Talking to the Smivai server for charity assistance, donations and
   the fund. These records live only on the server (backend/app/charity.py,
   backend/app/donations.py): eligibility, approvals, the visit counter
   and the ledger are decided there, never on a device.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var Api = {
    available: function () {
      var s = S.Auth.session();
      return !!(s && s.mode === 'server' && s.token && S.Server.base(s.role));
    },

    /**
     * @returns {Promise<{ok, status, data?, error?}>} — never throws.
     * `body` may be a FormData (file uploads) or a plain object (JSON).
     */
    request: function (method, path, body, opts) {
      var s = S.Auth.session();
      var base = s && S.Server.base(s.role);
      if (!base) return Promise.resolve({ ok: false, status: 0, error: 'The Smivai server is not connected on this device.' });
      if (!s || !s.token) return Promise.resolve({ ok: false, status: 401, error: 'Please sign in again.' });
      var headers = { Authorization: 'Bearer ' + s.token };
      var init = { method: method, headers: headers };
      if (body instanceof global.FormData) init.body = body;
      else if (body !== undefined) { headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body); }
      return fetch(base + path, init).then(function (r) {
        if (r.status === 401) { S.Auth.expire(); return { ok: false, status: 401, error: 'Please sign in again.' }; }
        if (opts && opts.blob) return r.ok ? r.blob().then(function (b) { return { ok: true, status: r.status, data: b }; })
          : { ok: false, status: r.status, error: 'That file could not be opened.' };
        if (r.status === 204) return { ok: true, status: 204, data: null };
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.ok) return { ok: true, status: r.status, data: j };
          var d = j && j.detail;
          if (Array.isArray(d)) d = d.map(function (x) { return x.msg; }).join(' ');
          return { ok: false, status: r.status, error: d || 'Something went wrong. Please try again.' };
        });
      }).catch(function () {
        return { ok: false, status: 0, error: 'We could not reach the Smivai server. Please try again.' };
      });
    },
    get: function (path, opts) { return this.request('GET', path, undefined, opts); },
    post: function (path, body) { return this.request('POST', path, body === undefined ? {} : body); },
    patch: function (path, body) { return this.request('PATCH', path, body); },
    del: function (path) { return this.request('DELETE', path); }
  };

  var e = encodeURIComponent;
  var CharityApi = {
    STATUS: {
      draft: 'Draft — not sent yet', submitted: 'Submitted — waiting for review', under_review: 'Being reviewed',
      info_requested: 'More information needed', rejected: 'Not approved', approved: 'Approved — waiting to be activated',
      active: 'Assistance active', completed: 'Completed — all covered visits used'
    },
    statusText: function (st) { return this.STATUS[st] || st; },

    policy: function () { return Api.get('/charity/policy'); },
    mine: function () { return Api.get('/charity/applications'); },
    list: function (status) { return Api.get('/charity/applications' + (status ? '?status_filter=' + e(status) : '')); },
    get: function (id) { return Api.get('/charity/applications/' + e(id)); },
    create: function (body) { return Api.post('/charity/applications', body); },
    update: function (id, body) { return Api.patch('/charity/applications/' + e(id), body); },
    upload: function (id, docType, file) {
      var fd = new global.FormData();
      fd.append('doc_type', docType);
      fd.append('file', file, file.name);
      return Api.request('POST', '/charity/applications/' + e(id) + '/documents', fd);
    },
    document: function (docId) { return Api.get('/charity/documents/' + e(docId), { blob: true }); },
    removeDocument: function (docId) { return Api.del('/charity/documents/' + e(docId)); },
    submit: function (id) { return Api.post('/charity/applications/' + e(id) + '/submit'); },
    review: function (id, action, note) { return Api.post('/charity/applications/' + e(id) + '/review', { action: action, note: note || null }); },
    activate: function (id) { return Api.post('/charity/applications/' + e(id) + '/activate'); },
    claims: function (id) { return Api.get('/charity/applications/' + e(id) + '/claims'); },
    claim: function (id, appointmentId) { return Api.post('/charity/applications/' + e(id) + '/claims', { appointment_id: appointmentId }); },
    reverse: function (claimId, reason) { return Api.post('/charity/claims/' + e(claimId) + '/reverse', { reason: reason }); },
    fund: function () { return Api.get('/charity/fund'); },
    ledger: function () { return Api.get('/charity/ledger'); },
    adjust: function (body) { return Api.post('/charity/ledger/adjustments', body); },
    addProvider: function (doctorId, terms) { return Api.post('/charity/providers', { doctor_id: doctorId, terms: terms }); }
  };

  /** Indian-style rupee text: ₹1,50,000. */
  S.rupees = function (n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    var neg = n < 0, v = Math.abs(Math.round(n * 100) / 100);
    var whole = Math.floor(v), paise = Math.round((v - whole) * 100);
    var s = String(whole), last3 = s.slice(-3), rest = s.slice(0, -3);
    if (rest) last3 = ',' + last3;
    var out = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + last3;
    return (neg ? '−' : '') + '₹' + out + (paise ? '.' + (paise < 10 ? '0' : '') + paise : '');
  };

  /** Server times are UTC; SQLite returns them without a zone, so add it. */
  S.serverDate = function (iso) {
    var s = String(iso || '');
    if (/T\d{2}:\d{2}/.test(s) && !/(Z|[+-]\d{2}:?\d{2})$/.test(s)) s += 'Z';
    return new Date(s);
  };

  S.Api = Api;
  S.CharityApi = CharityApi;
})(window);
