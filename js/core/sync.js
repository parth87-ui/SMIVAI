/* ============================================================
   SMIVAI — sync.js
   Offline-first sync engine.

        LOCAL WRITE → PENDING QUEUE → (connection) → API → POSTGRESQL

   The device database is always the source of truth for the patient. Every
   syncable write is mirrored into `sync_queue`. When a connection is
   available the queue is drained in order and the rows are handed to a
   remote adapter.

   Two adapters ship:
     · CloudMockAdapter — a local "central database" mirror. This is what
       the prototype runs on so the demo is reliable with no server.
     · HttpAdapter      — posts the same payload to the FastAPI service in
       backend/. Enable by setting S.CONFIG.apiBase.

   The queue, the ordering, the retry and the status reporting are real;
   only the transport is simulated by default, and the app says so.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  /* Build-time settings (js/config.js, written by scripts/build.js on Vercel). */
  var ENV = global.SMIVAI_ENV || {};
  S.CONFIG = S.CONFIG || {
    apiBase: (ENV.FULL_SERVER_MODE && ENV.API_BASE_URL) || null,   // every role through the server
    autoSyncMs: 20000,
    simulatedLatencyMs: 900
  };

  /* ------------------------------------------------------------
     The Smivai server for accounts that exist only there (donors,
     administrators, charity partners). With apiBase set, everything uses
     the server. Without it, patients, caregivers and doctors keep working
     on the device, and only these roles use `serverBase`, which is found
     automatically on a local development address (localhost:8000) or set
     here for a deployed server.
     ------------------------------------------------------------ */
  S.CONFIG.serverBase = S.CONFIG.serverBase || ENV.API_BASE_URL || null;
  var SERVER_ONLY = { donor: 1, admin: 1, charity_partner: 1 };
  var probe = null;
  S.Server = {
    serverOnly: function (role) { return !!SERVER_ONLY[role]; },
    /** The server for this role, or null (then the role works on the device, or not at all). */
    base: function (role) {
      if (S.CONFIG.apiBase) return S.CONFIG.apiBase;
      return (!role || SERVER_ONLY[role]) ? S.CONFIG.serverBase || null : null;
    },
    /** Look for a local development server once. @returns {Promise<string|null>} */
    detect: function (force) {
      if (S.CONFIG.apiBase || S.CONFIG.serverBase) return Promise.resolve(S.CONFIG.apiBase || S.CONFIG.serverBase);
      if (probe && !force) return probe;
      var host = global.location && global.location.hostname;
      if (!/^(localhost|127\.0\.0\.1|\[::1\]|.+\.localhost)$/.test(host || '') || typeof fetch !== 'function') return Promise.resolve(null);
      var url = global.location.protocol + '//' + host + ':8000';
      var ctl = typeof AbortController === 'function' ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 2500);
      probe = fetch(url + '/health', ctl ? { signal: ctl.signal } : {}).then(function (r) {
        clearTimeout(timer);
        if (!r.ok) return null;
        S.CONFIG.serverBase = url;
        return url;
      }).catch(function () { clearTimeout(timer); return null; });
      return probe;
    }
  };

  S.Server.detect();

  var SERVER_KEY = 'smivai.server.v1';

  /* ---------------- Remote adapters ---------------- */

  var CloudMockAdapter = {
    name: 'local-cloud-mirror',
    simulated: true,
    _read: function () {
      try { return JSON.parse(global.localStorage.getItem(SERVER_KEY) || '{}'); }
      catch (e) { return {}; }
    },
    _write: function (d) {
      try { global.localStorage.setItem(SERVER_KEY, JSON.stringify(d)); } catch (e) { /* ignore */ }
    },
    push: function (records) {
      var self = this;
      return S.delay(S.CONFIG.simulatedLatencyMs).then(function () {
        var db = self._read();
        records.forEach(function (rec) {
          var t = db[rec.table] = db[rec.table] || {};
          if (rec.op === 'delete') delete t[rec.pk];
          else t[rec.pk] = rec.payload;
        });
        db.__meta = { last_push: S.stamp(), rows: records.length };
        self._write(db);
        return { accepted: records.length };
      });
    },
    stats: function () {
      var db = this._read(), total = 0, tables = 0;
      Object.keys(db).forEach(function (k) {
        if (k === '__meta') return;
        tables++; total += Object.keys(db[k]).length;
      });
      return { tables: tables, rows: total, lastPush: (db.__meta || {}).last_push || null };
    }
  };

  var HttpAdapter = {
    name: 'fastapi',
    simulated: false,
    push: function (records) {
      var sess = S.Auth && S.Auth.session();
      /* A demo account created on this device has no server identity, so
         the service would refuse every row. Keep them here and say why. */
      if (!sess || sess.mode !== 'server') {
        var e = new Error('device-only account');
        e.userText = 'This account lives on this device only, so it is not synced to the SMIVAI server. Your data is safe here.';
        return Promise.reject(e);
      }
      /* The service scopes every pushed row to the signed-in account. */
      var headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sess.token };
      return fetch(S.CONFIG.apiBase + '/sync/push', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ device_id: Sync.deviceId, records: records })
      }).then(function (r) {
        if (r.status === 401) {
          S.Auth.expire();
          var e401 = new Error('session expired');
          e401.userText = 'Please sign in again — your progress is saved on this device and will sync afterwards.';
          throw e401;
        }
        if (!r.ok) throw new Error('sync rejected: ' + r.status);
        return r.json();
      });
    },
    stats: function () { return { tables: null, rows: null, lastPush: null }; }
  };

  /* ---------------- Engine ---------------- */

  var Sync = {
    deviceId: 'device_demo_01',
    state: 'online',            // online | offline | syncing
    forcedOffline: false,
    lastSyncedAt: null,
    lastSyncedCount: 0,
    _timer: null,
    _busy: false,

    adapter: function () {
      return S.CONFIG.apiBase ? HttpAdapter : CloudMockAdapter;
    },

    init: function () {
      var self = this;
      S.bus.on('db:change', function (change) { self.enqueue(change); });

      global.addEventListener('online', function () { self._recompute(true); });
      global.addEventListener('offline', function () { self._recompute(false); });

      this._recompute();
      this._timer = setInterval(function () {
        if (self.isOnline() && self.pendingCount()) self.flush();
      }, S.CONFIG.autoSyncMs);
    },

    isOnline: function () {
      if (this.forcedOffline) return false;
      return global.navigator.onLine !== false;
    },

    /** Demo control: the offline toggle in the header. */
    setOffline: function (off) {
      this.forcedOffline = !!off;
      if (off) {
        this._set('offline');
        S.bus.emit('sync:message', { kind: 'offline', text: 'Offline — your progress is saved on this device.' });
      } else {
        this._set('online');
        S.bus.emit('sync:message', { kind: 'restored', text: 'Connection restored.' });
        if (this.pendingCount()) this.flush();
      }
    },

    _recompute: function (isOnline) {
      var on = isOnline === undefined ? this.isOnline() : isOnline && !this.forcedOffline;
      this._set(on ? 'online' : 'offline');
      if (on && this.pendingCount()) this.flush();
    },

    _set: function (state) {
      this.state = state;
      S.bus.emit('sync:status', this.status());
    },

    /* ---------------- queue ---------------- */
    enqueue: function (change) {
      var pkField = S.DB.pk(change.table);
      S.DB.insert('sync_queue', {
        queue_id: S.uid('q'),
        table: change.table,
        op: change.op,
        pk: change.row[pkField],
        payload: JSON.parse(JSON.stringify(change.row)),
        created_at: S.stamp(),
        attempts: 0
      }, { silent: true });
      S.bus.emit('sync:status', this.status());
    },

    /* Rows the server refused (not this account's record, malformed) stay
       in the queue marked `rejected`, so nothing is silently thrown away,
       but they are not re-sent on every flush. */
    pending: function () {
      return S.DB.where('sync_queue', function (q) { return !q.rejected; }).sort(function (a, b) {
        return a.created_at < b.created_at ? -1 : 1;
      });
    },

    pendingCount: function () { return this.pending().length; },

    rejectedCount: function () { return S.DB.where('sync_queue', function (q) { return !!q.rejected; }).length; },

    /* ---------------- flush ---------------- */
    flush: function () {
      var self = this;
      if (this._busy) return Promise.resolve(false);
      if (!this.isOnline()) {
        S.bus.emit('sync:message', { kind: 'offline', text: 'Offline — your progress is saved on this device.' });
        return Promise.resolve(false);
      }
      var batch = this.pending();
      if (!batch.length) { this._set('online'); return Promise.resolve(true); }

      /* Server transport, but a device-only (demo) account: nothing can be
         sent. Say so once, then keep the queue quietly on the device. */
      if (this.adapter() === HttpAdapter) {
        var sess = S.Auth && S.Auth.session();
        if (!sess || sess.mode !== 'server') {
          if (!this._deviceOnlyNoted) {
            this._deviceOnlyNoted = true;
            S.bus.emit('sync:message', { kind: 'error', text: 'This account lives on this device only, so it is not synced to the SMIVAI server. Your data is safe here.' });
          }
          return Promise.resolve(false);
        }
        this._deviceOnlyNoted = false;
      }

      this._busy = true;
      this._set('syncing');
      S.bus.emit('sync:message', { kind: 'syncing', text: 'Syncing your data…' });

      var records = batch.map(function (q) {
        return { table: q.table, op: q.op, pk: q.pk, payload: q.payload, queued_at: q.created_at };
      });

      return this.adapter().push(records).then(function (res) {
        /* `results` lines up with `records` by position. Without it (the
           local mirror, or an older server) every row counts as accepted. */
        var results = res && Array.isArray(res.results) && res.results.length === batch.length ? res.results : null;
        var accepted = 0, refused = 0;
        batch.forEach(function (q, i) {
          var r = results ? results[i] : { ok: true };
          if (r.ok) { S.DB.remove('sync_queue', q.queue_id, { silent: true }); accepted++; }
          else {
            refused++;
            S.DB.update('sync_queue', q.queue_id, { rejected: true, error: r.error || 'refused', attempts: (q.attempts || 0) + 1 }, { silent: true });
            console.warn('[SMIVAI] sync refused', q.table + '/' + q.pk, r.error);
          }
        });
        self.lastSyncedAt = S.stamp();
        self.lastSyncedCount = accepted;
        self._busy = false;
        self._set('online');
        S.bus.emit('sync:message', refused ? {
          kind: 'error',
          text: 'Saved ' + accepted + ' · ' + refused + ' ' + (refused === 1 ? 'change' : 'changes') + ' not accepted by the server — kept on this device.'
        } : {
          kind: 'synced',
          text: 'All data synced · ' + accepted + ' ' + (accepted === 1 ? 'record' : 'records')
        });
        S.bus.emit('data:updated', { table: 'sync', op: 'flush' });
        return true;
      }).catch(function (err) {
        console.warn('[SMIVAI] sync failed', err);
        batch.forEach(function (q) { S.DB.update('sync_queue', q.queue_id, { attempts: (q.attempts || 0) + 1 }, { silent: true }); });
        self._busy = false;
        self._set(self.isOnline() ? 'online' : 'offline');
        // Never surface a technical error to a patient.
        S.bus.emit('sync:message', {
          kind: 'error',
          text: (err && err.userText) || "We couldn't connect right now. Your progress is saved and we'll try again."
        });
        return false;
      });
    },

    status: function () {
      return {
        state: this._busy ? 'syncing' : (this.isOnline() ? 'online' : 'offline'),
        pending: this.pendingCount(),
        rejected: this.rejectedCount(),
        lastSyncedAt: this.lastSyncedAt,
        lastSyncedCount: this.lastSyncedCount,
        adapter: this.adapter().name,
        simulated: !!this.adapter().simulated
      };
    },

    label: function () {
      var st = this.status();
      if (st.state === 'syncing') return { icon: '🔄', text: 'Syncing…', state: 'syncing' };
      if (st.state === 'offline') return { icon: '🟠', text: st.pending ? 'Offline · ' + st.pending + ' saved' : 'Offline', state: 'offline' };
      if (st.pending) return { icon: '🟢', text: st.pending + ' to sync', state: 'online' };
      return { icon: '🟢', text: 'Online', state: 'online' };
    },

    /** Patient-facing pill — short enough for a phone top bar. */
    patientLabel: function () {
      var st = this.status();
      if (st.state === 'syncing') return { icon: '🔄', text: 'Saving…', state: 'syncing' };
      if (st.state === 'offline') return { icon: '🟠', text: 'Offline', state: 'offline' };
      return { icon: '🟢', text: 'Online', state: 'online' };
    },

    /** The full reassurance, shown on the patient's Home card where
        there is room for it. Offline must never read as a failure. */
    patientMessage: function () {
      var st = this.status();
      if (st.state === 'syncing') return { icon: '🔄', text: 'Saving your progress…', state: 'syncing' };
      if (st.state === 'offline') return { icon: '🟠', text: 'Offline — your progress is saved', state: 'offline' };
      return { icon: '🟢', text: 'Online — everything is saved', state: 'online' };
    },

    serverStats: function () { return this.adapter().stats(); }
  };

  S.Sync = Sync;
})(window);
