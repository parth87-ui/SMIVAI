/* ============================================================
   SMIVAI — app.js
   Boot sequence and app-wide listeners. The chrome itself lives in
   ui/shell.js; routing and role guards in core/router.js.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var App = {

    boot: function () {
      /* 1 · local database (+ demo data on first run) */
      S.DB.load();
      if (S.Seed.needed()) S.Seed.run();

      /* 2 · v2 data (accounts, plans, links…) — also upgrades older devices */
      var ready = S.SeedV2.needed() ? S.SeedV2.run() : Promise.resolve();

      ready.catch(function (e) { console.error('[SMIVAI] upgrade failed', e); }).then(function () {
        /* 3 · who is signed in, and their display preferences */
        S.State.load();
        S.Prefs.apply();

        /* 4 · offline-first sync engine, photo store */
        S.Sync.init();
        S.Media.ready();

        /* 5 · listeners, then go */
        App.wire();
        S.Router.start();

        console.log('%cSMIVAI', 'color:#5B82C4;font-weight:800;font-size:16px',
          '· local store:', S.DB.adapter.name,
          '· sync:', S.Sync.status().adapter,
          '· patients:', S.DB.count('patients'));
      });
    },

    wire: function () {
      S.bus.on('sync:status', function () { if (S.Auth.session()) S.Shell.render(); });

      S.bus.on('sync:message', function (m) {
        if (m.kind === 'syncing') S.toast(S.tx('syncing', 'Saving your data…'));
        else if (m.kind === 'synced') S.toast(m.text, 'ok');
        else if (m.kind === 'restored') S.toast(S.tx('conn_restored', 'Connection restored.'), 'ok');
        else if (m.kind === 'offline') S.toast(m.text, 'warn');
        else if (m.kind === 'error') S.toast(m.text, 'warn', 4500);
      });

      S.bus.on('notifications:changed', function () { if (S.Auth.session()) S.Shell.render(); });
      S.bus.on('plan:changed', function () { S.Router.handle(); });

      /* A machine translation arriving in the background should appear
         without the patient doing anything. Coalesced so a burst of
         fetches repaints once — but never mid-game or mid-conversation. */
      var repaint = null;
      S.bus.on('i18n:updated', function () {
        clearTimeout(repaint);
        repaint = setTimeout(function () {
          if (S.Router.inGame() || (S.Talk && S.Talk.active)) return;
          S.Router.handle();
        }, 220);
      });

      /* Reminder due while the app is open: gentle notification + refresh. */
      setInterval(function () { App.checkDueReminders(); }, 60000);
      setTimeout(function () { App.checkDueReminders(); }, 4000);

      /* Session expiry while the app sits open */
      setInterval(function () {
        var p = S.Router.parts()[0];
        if ((p === 'patient' || p === 'caregiver' || p === 'doctor') && !S.Auth.session()) S.Router.handle();
      }, 30000);

      global.addEventListener('error', function (ev) { console.error('[SMIVAI]', ev.error || ev.message); });
      global.addEventListener('unhandledrejection', function (ev) { console.error('[SMIVAI] unhandled', ev.reason); });
    },

    /** Notify the patient once when a reminder reaches its time. */
    checkDueReminders: function () {
      var sess = S.Auth.session();
      if (!sess || sess.role !== 'patient' || !S.Prefs.get('notif_reminders')) return;
      var nowM = S.minutesOf(S.nowHHMM()), today = S.todayISO();
      S.Reminders.occurrencesOn(sess.actor_id, today).forEach(function (o) {
        var t = S.minutesOf(o.reminder.time);
        if (o.status !== 'upcoming' || nowM < t || nowM > t + 10) return;
        var key = 'rem:' + o.reminder.reminder_id + ':' + today;
        if (S.DB.where('notifications', function (n) { return n.dedupe === key; }).length) return;
        var n = S.Services.Notify.push({ recipient_role: 'patient', recipient_id: sess.actor_id, patient_id: sess.actor_id,
          kind: 'reminder', title: o.reminder.title, body: S.prettyTime(o.reminder.time) + ' — ' + S.tx('time_now', 'It is time now.'), link: '#/patient/reminders' });
        S.DB.update('notifications', n.notification_id, { dedupe: key }, { silent: true });
        S.toast('🔔 ' + o.reminder.title, 'ok', 6000);
        if (S.Router.current === '#/patient/reminders' || S.Router.current === '#/patient/home') S.Router.handle();
      });
    },

    toggleOffline: function () {
      var goingOffline = !S.Sync.forcedOffline;
      S.Sync.setOffline(goingOffline);
      S.Shell.render();
      if (!goingOffline) setTimeout(function () { if (!S.Router.inGame() && !(S.Talk && S.Talk.active)) S.Router.handle(); }, 1400);
    },

    exit: function () { S.Auth.logout(); S.Router.go('#/'); }
  };

  S.App = App;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { App.boot(); });
  } else {
    App.boot();
  }
})(window);
