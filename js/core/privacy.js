/* ============================================================
   SMIVAI — privacy.js
   The person's own data rights on this device: a copy of their data, and
   erasing their account. Mirrors GET /me/export and POST /me/erase in
   backend/app/main.py.

   Several people can use one tablet (a patient, then a caregiver), so an
   export holds only the signed-in person's records — never the whole
   device store, never identity hashes, never the sync queue.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  /* Device tables whose rows belong to one patient (by patient_id). */
  var PATIENT_TABLES = ['game_sessions', 'item_responses', 'reminders', 'reminder_events', 'memory_bank',
    'cognitive_scores', 'moods', 'care_notes', 'patient_notes', 'contacts', 'routines', 'daily_sessions',
    'links', 'appointments', 'vitals', 'notifications', 'alerts', 'orders', 'care_requests', 'activity_log',
    'conversation_turns', 'content_seen'];
  var ENTITY = { patient: ['patients', 'patient_id'], caregiver: ['caregivers', 'caregiver_id'], doctor: ['doctors', 'doctor_id'] };

  function cleanAccount(a) {
    if (!a) return null;
    var c = Object.assign({}, a);
    delete c.id_hash;                 // an identity hash is not "your data" to carry around
    return c;
  }

  function mine(sess) {
    var role = sess.role, id = sess.actor_id, out = {};
    var ent = ENTITY[role];
    out[ent[0]] = S.DB.where(ent[0], function (r) { return r[ent[1]] === id; });
    out.accounts = S.DB.where('accounts', function (a) { return a.entity_id === id && a.role === role; }).map(cleanAccount);
    if (role === 'patient') {
      PATIENT_TABLES.forEach(function (t) { out[t] = S.DB.where(t, function (r) { return r.patient_id === id; }); });
    } else {
      out.links = S.DB.where('links', function (l) { return l.actor_role === role && l.actor_id === id; });
      out.notifications = S.DB.where('notifications', function (n) { return n.recipient_role === role && n.recipient_id === id; });
    }
    return out;
  }

  function mediaIds(records) {
    var ids = [];
    ['memory_bank', 'vitals', 'orders'].forEach(function (t) {
      (records[t] || []).forEach(function (r) {
        [r.photo_media, r.media_id, r.prescription_media].forEach(function (m) { if (m) ids.push(m); });
      });
    });
    return ids;
  }

  function remote(sess) { return !!(sess && sess.mode === 'server' && S.Server.base(sess.role)); }

  /* The version agreed to at sign-up; recorded with the consent (server:
     auth.PRIVACY_NOTICE_VERSION). Change it whenever the notice changes. */
  S.PRIVACY_NOTICE_VERSION = '2026-10-09';

  var NOTICE = [
    ['What SMIVAI keeps', 'Your name, age, town and language; your reminders, memories and photos, games and progress, appointments, medicine orders, notes and readings. Not your Aadhaar or ABHA number — only its last 4 digits.'],
    ['Why', 'To remind you, talk with you, keep your mind active, and keep your family and doctor informed — nothing else. No advertising, and your data is not sold.'],
    ['Who sees it', 'You. And only the caregivers and doctors you add with your care code — each sees only what you choose under Caregiver Support → What they can see.'],
    ['Where it is kept', 'On this device. If a SMIVAI server is connected, also on that server. Photos stay on this device.'],
    ['HUN’s advanced conversations', 'Only with Premium and when the server is connected: your message and a short summary of your own reminders and memories are sent to the AI service (Anthropic) to write a reply.'],
    ['Your choices', 'Download your data or delete your account at any time in Settings. Remove anyone from your care team at any time.']
  ];

  var Privacy = {
    PATIENT_TABLES: PATIENT_TABLES,
    NOTICE: NOTICE,

    showNotice: function () {
      S.Modal.open({
        title: S.tx('privacy_notice', 'Privacy notice'),
        subtitle: S.tx('notice_version', 'Version {v} · draft, pending legal review', { v: S.PRIVACY_NOTICE_VERSION }),
        body: '<div class="stack stack-2">' + NOTICE.map(function (n) {
          return '<div><b>' + S.esc(n[0]) + '</b><p class="t-body" style="margin-top:.25rem">' + S.esc(n[1]) + '</p></div>';
        }).join('') + '</div>',
        footer: '<button class="btn btn-lg" data-modal-close>' + S.esc(S.tx('understood', 'I understand')) + '</button>'
      });
    },

    /** Everything this device holds about the signed-in person. */
    exportFor: function (sess) {
      return {
        exported_at: S.stamp(),
        role: sess.role,
        note: 'Your SMIVAI records on this device. Photos are not included; they stay on the device.',
        records: mine(sess)
      };
    },

    /**
     * Erase the signed-in person's account and records — on the server first
     * when there is one, then on this device. Cannot be undone.
     * @returns {Promise<{ok, error?, removed?}>}
     */
    erase: function (sess) {
      var first = remote(sess)
        ? fetch(S.Server.base(sess.role) + '/me/erase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sess.token },
            body: JSON.stringify({ confirm: 'DELETE' })
          }).then(function (r) {
            return r.ok ? { ok: true } : { ok: false, error: 'The SMIVAI server could not delete your account. Nothing was deleted. Please try again.' };
          }).catch(function () { return { ok: false, error: 'We could not reach the SMIVAI server. Nothing was deleted. Please try again when online.' }; })
        : Promise.resolve({ ok: true });

      return first.then(function (res) {
        if (!res.ok) return res;
        var records = mine(sess), removed = 0;
        Object.keys(records).forEach(function (t) {
          var pk = S.DB.pk(t);
          records[t].forEach(function (r) { if (r) { S.DB.remove(t, r[pk], { silent: true }); removed++; } });
        });
        if (sess.role === 'patient') {
          /* notifications sent to care-team members about this patient */
          S.DB.where('notifications', function (n) { return n.patient_id === sess.actor_id; })
            .forEach(function (n) { S.DB.remove('notifications', n.notification_id, { silent: true }); removed++; });
        }
        mediaIds(records).forEach(function (id) { try { S.Media.remove(id); } catch (e) { /* already gone */ } });
        /* nothing about this person should be waiting to sync */
        S.DB.where('sync_queue', function (q) {
          var pl = q.payload || {};
          return pl.patient_id === sess.actor_id || q.pk === sess.actor_id || pl.actor_id === sess.actor_id || pl.recipient_id === sess.actor_id;
        }).forEach(function (q) { S.DB.remove('sync_queue', q.queue_id, { silent: true }); });
        S.Auth.logout();
        return { ok: true, removed: removed };
      });
    }
  };

  S.Privacy = Privacy;
})(window);
