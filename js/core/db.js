/* ============================================================
   SMIVAI — db.js
   Offline-first local store.

   This is the *device* database. Every write lands here first and stays
   readable with no network. Writes to syncable tables also raise a change
   event that the sync engine turns into a pending record.

   Storage adapter is swappable:
     - LocalStorageAdapter (default, works in any browser / Replit)
     - SqliteAdapter       (interface documented below; used by the
                            Capacitor/React-Native build with SQLite)
   The table shapes mirror the PostgreSQL schema in backend/schema.sql,
   so the same rows can be pushed to FastAPI unchanged.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var STORAGE_KEY = 'smivai.db.v4';

  /* Primary key per table (mirrors backend/schema.sql) */
  var PK = {
    patients: 'patient_id',
    game_sessions: 'session_id',
    item_responses: 'response_id',
    reminders: 'reminder_id',
    reminder_events: 'event_id',
    memory_bank: 'memory_id',
    cognitive_scores: 'score_id',
    moods: 'mood_id',
    care_notes: 'note_id',
    /* the patient's own notepad — private to them, see backend/app/main.py */
    patient_notes: 'note_id',
    contacts: 'contact_id',
    routines: 'routine_id',
    daily_sessions: 'plan_id',
    /* SMIVAI v2 — accounts, care relationships and everyday services */
    accounts: 'account_id',
    /* Donor and staff profiles, mirrored from the server when they sign in (device-only). */
    donors: 'donor_id',
    staff: 'staff_id',
    caregivers: 'caregiver_id',
    doctors: 'doctor_id',
    links: 'link_id',
    appointments: 'appointment_id',
    /* Verified patient reviews: one per own completed appointment. */
    doctor_reviews: 'review_id',
    vitals: 'vital_id',
    notifications: 'notification_id',
    alerts: 'alert_id',
    orders: 'order_id',
    care_requests: 'request_id',
    activity_log: 'activity_id',
    /* Machine translations fetched at runtime, cached so a language keeps
       working with the network off. Device-only: a translation is not
       patient data and does not belong in the central record. */
    translations: 'translation_id',
    /* Hun's conversation turns, for "what did I tell you earlier". Device-only:
       private to the patient, never synced or shown to the care team. */
    conversation_turns: 'turn_id',
    /* Which Daily Facts items a patient has been shown, to avoid repeats. Device-only. */
    content_seen: 'seen_id',
    sync_queue: 'queue_id',
    meta: 'key'
  };

  /* Tables whose rows belong in the central database */
  var SYNCABLE = [
    'patients', 'game_sessions', 'item_responses', 'reminders', 'reminder_events',
    'memory_bank', 'cognitive_scores', 'moods', 'care_notes', 'patient_notes',
    'contacts', 'routines',
    'caregivers', 'doctors', 'links', 'appointments', 'doctor_reviews', 'vitals',
    'notifications', 'alerts', 'orders', 'care_requests', 'activity_log'
  ];
  /* `accounts` is deliberately NOT syncable: identity lives with the auth
     service (backend/app/auth.py), never in the generic sync payload. */

  function emptyData() {
    var d = {};
    Object.keys(PK).forEach(function (t) { d[t] = []; });
    return d;
  }

  /* ---------------- Storage adapters ---------------- */

  var LocalStorageAdapter = {
    name: 'localStorage',
    read: function () {
      try {
        var raw = global.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        console.warn('[SMIVAI] could not read local database', e);
        return null;
      }
    },
    write: function (data) {
      try {
        global.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
      } catch (e) {
        console.warn('[SMIVAI] could not persist local database', e);
        return false;
      }
    },
    clear: function () {
      try { global.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    }
  };

  /* In-memory fallback for environments with no localStorage (private mode). */
  var MemoryAdapter = (function () {
    var store = null;
    return {
      name: 'memory',
      read: function () { return store; },
      write: function (data) { store = JSON.parse(JSON.stringify(data)); return true; },
      clear: function () { store = null; }
    };
  })();

  /*
    SqliteAdapter (native builds) — same three methods, backed by
    `smivai.db`. Kept as documentation of the intended mobile path;
    it is not registered in the web prototype.

      const SqliteAdapter = {
        name: 'sqlite',
        read:  () => sqlite.exec('SELECT payload FROM kv WHERE key = ?', [KEY]),
        write: (data) => sqlite.exec('INSERT OR REPLACE INTO kv VALUES (?,?)', [KEY, JSON.stringify(data)]),
        clear: () => sqlite.exec('DELETE FROM kv WHERE key = ?', [KEY])
      };
  */

  function detectAdapter() {
    try {
      var k = '__smivai_probe__';
      global.localStorage.setItem(k, '1');
      global.localStorage.removeItem(k);
      return LocalStorageAdapter;
    } catch (e) {
      return MemoryAdapter;
    }
  }

  /* ---------------- DB ---------------- */

  var DB = {
    adapter: detectAdapter(),
    data: emptyData(),
    ready: false,

    pk: function (table) { return PK[table] || 'id'; },
    isSyncable: function (table) { return SYNCABLE.indexOf(table) !== -1; },
    tables: function () { return Object.keys(PK); },

    load: function () {
      var stored = this.adapter.read();
      if (stored && stored.patients) {
        var base = emptyData();
        Object.keys(base).forEach(function (t) { base[t] = stored[t] || []; });
        this.data = base;
        this.ready = true;
        return true;
      }
      this.data = emptyData();
      this.ready = false;
      return false;
    },

    save: function () { return this.adapter.write(this.data); },

    reset: function () {
      this.adapter.clear();
      this.data = emptyData();
      this.ready = false;
    },

    /* -------- reads -------- */
    all: function (table) { return (this.data[table] || []).slice(); },

    find: function (table, id) {
      var key = this.pk(table);
      var rows = this.data[table] || [];
      for (var i = 0; i < rows.length; i++) if (rows[i][key] === id) return rows[i];
      return null;
    },

    where: function (table, pred) {
      return (this.data[table] || []).filter(pred);
    },

    forPatient: function (table, patientId) {
      return (this.data[table] || []).filter(function (r) { return r.patient_id === patientId; });
    },

    count: function (table, pred) {
      return pred ? this.where(table, pred).length : (this.data[table] || []).length;
    },

    /* -------- writes -------- */
    insert: function (table, row, opts) {
      opts = opts || {};
      var key = this.pk(table);
      if (!row[key]) row[key] = S.uid(table.slice(0, 4));
      if (!row.updated_at) row.updated_at = S.stamp();
      (this.data[table] = this.data[table] || []).push(row);
      this.save();
      this._changed(table, 'insert', row, opts);
      return row;
    },

    update: function (table, id, patch, opts) {
      opts = opts || {};
      var row = this.find(table, id);
      if (!row) return null;
      Object.keys(patch).forEach(function (k) { row[k] = patch[k]; });
      row.updated_at = S.stamp();
      this.save();
      this._changed(table, 'update', row, opts);
      return row;
    },

    upsert: function (table, row, opts) {
      var key = this.pk(table);
      var existing = row[key] ? this.find(table, row[key]) : null;
      return existing ? this.update(table, row[key], row, opts) : this.insert(table, row, opts);
    },

    remove: function (table, id, opts) {
      opts = opts || {};
      var key = this.pk(table);
      var row = this.find(table, id);
      this.data[table] = (this.data[table] || []).filter(function (r) { return r[key] !== id; });
      this.save();
      if (row) this._changed(table, 'delete', row, opts);
      return !!row;
    },

    /** Bulk load used only by the seeder — does not raise sync events. */
    seedTable: function (table, rows) {
      this.data[table] = rows.slice();
    },

    _changed: function (table, op, row, opts) {
      if (!opts.silent && this.isSyncable(table)) {
        S.bus.emit('db:change', { table: table, op: op, row: row });
      }
      S.bus.emit('data:updated', { table: table, op: op });
    },

    /* -------- diagnostics (caregiver/doctor "storage" panel) -------- */
    stats: function () {
      var self = this;
      var out = { adapter: this.adapter.name, tables: [], total: 0 };
      SYNCABLE.concat(['sync_queue']).forEach(function (t) {
        var n = (self.data[t] || []).length;
        out.tables.push({ table: t, rows: n });
        out.total += n;
      });
      return out;
    },

    exportJSON: function () { return JSON.stringify(this.data, null, 2); }
  };

  S.DB = DB;
})(window);
