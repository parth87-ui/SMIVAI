/* ============================================================
   SMIVAI — router.js
   Hash routing with role guards. Every screen is reachable by URL, and
   every URL checks the signed-in role before rendering anything — a
   caregiver typing a patient URL, or a signed-out visitor typing any URL,
   is stopped here, not by hidden buttons.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var Router = {
    current: '',

    start: function () {
      var self = this;
      global.addEventListener('hashchange', function () { self.handle(); });
      if (!location.hash) location.hash = '#/';
      this.handle();
    },

    go: function (hash) {
      if (location.hash === hash) this.handle();
      else location.hash = hash;
    },

    parts: function () {
      var raw = (location.hash || '#/').replace(/^#\/?/, '').replace(/\?.*$/, '');
      return raw.split('/').filter(function (p) { return p.length; });
    },

    homeFor: function (role) {
      return role === 'patient' ? '#/patient/home' : role ? '#/' + role + '/dashboard' : '#/';
    },

    handle: function () {
      var p = this.parts();
      var prev = this.current;
      this.current = '#/' + p.join('/');
      S.Modal.close();
      S.Voice.stop();
      /* Leaving Talk releases the microphone: a voice session or the
         hands-free "Hey HUN" listener, whichever is on. */
      if (S.Talk && p[1] !== 'talk' && (S.Talk.active || (S.WakeWord && S.WakeWord._on))) S.Talk.end(true);
      if (S.GameShell && S.GameShell.active && !(p[0] === 'patient' && p[1] === 'game')) S.GameShell.abandon();

      var root = p[0] || '';
      try {
        if (root === '' ) return this.welcome();
        if (root === 'login') return S.Login.render(p[1], p[2]);
        if (root === 'patient' || root === 'caregiver' || root === 'doctor') {
          var g = S.Auth.require(root);
          if (!g.ok) return this.denied(g, root);
          S.State.fromSession(g.session);
          if (root === 'patient') return this.patient(p);
          if (p[1] === 'settings') return S.Settings.render(root);
          if (root === 'caregiver') return S.Caregiver.render(p[1] || 'dashboard');
          return S.Doctor.render(p[1] || 'dashboard');
        }
        /* Donors and charity reviewers: server accounts only (core/charity_api.js). */
        if (root === 'donor' || root === 'staff' || root === 'admin' || root === 'charity_partner') {
          var s = S.Auth.session();
          var allowed = s && (root === 'staff' ? (s.role === 'admin' || s.role === 'charity_partner') : s.role === root);
          if (!allowed) return s ? this.denied({ ok: false, reason: 'wrong-role', session: s }, root) : S.Login.render(root === 'donor' ? 'donor' : 'staff');
          /* After a reload the server is looked up again before these screens load. */
          if (!S.Server.base(s.role)) return S.Login.needsServer(s.role === 'donor' ? 'donor' : s.role, null);
          S.State.fromSession(s);
          if (p[1] === 'settings') return S.Settings.render(s.role);
          return root === 'donor' ? S.Donor.render(p[1] || 'dashboard') : S.Staff.render(p[1] || 'dashboard', p[2]);
        }
        return this.notFound();
      } catch (err) {
        console.error('[SMIVAI] route error', err);
        this.failure();
      } finally {
        S.Shell.render();
        if (prev !== this.current) {
          var main = S.qs('#app');
          if (main) try { main.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
        }
      }
    },

    welcome: function () {
      var s = S.Auth.session();
      if (s) { this.go(this.homeFor(s.role)); return; }
      S.Landing.render();
    },

    /** Signed out, expired, or signed in as someone else. */
    denied: function (g, wanted) {
      if (g.reason === 'expired') {
        S.toast(S.tx('session_expired', 'For your safety you were signed out. Please sign in again.'), 'warn', 5000);
        S.Auth.lastExpired = false;
        S.Login.render(wanted);
        return;
      }
      if (g.reason === 'signed-out') { S.Login.render(wanted); return; }
      var mine = g.session.role;
      S.mount(S.qs('#app'),
        '<div class="state-screen anim-in">' +
          '<div class="empty-ico" style="margin:0 auto;width:5.5rem;height:5.5rem;border-radius:1.75rem;display:grid;place-items:center;background:var(--lav-50);color:var(--lav-ink)">' + S.icon('lock', '', { size: 40 }) + '</div>' +
          '<h1>' + S.esc(S.tx('not_allowed', 'This page is not part of your account')) + '</h1>' +
          '<p>You are signed in as a ' + S.esc(mine) + '. ' + S.esc(wanted === 'patient' ? 'Patient pages' : S.titleCase(wanted) + ' pages') + ' are only shown to that role.</p>' +
          '<button class="btn btn-lg" data-act="home">' + S.icon('home') + 'Go to my home</button>' +
        '</div>',
        { home: function () { S.Router.go(S.Router.homeFor(mine)); } });
    },

    notFound: function () {
      var s = S.Auth.session();
      S.mount(S.qs('#app'),
        '<div class="state-screen anim-in"><div style="width:9rem;margin:0 auto">' + S.Art.photos() + '</div>' +
          '<h1>' + S.esc(S.tx('not_found', 'We could not find that page')) + '</h1>' +
          '<p>' + S.esc(S.tx('not_found_sub', 'It may have moved. Let’s go back home.')) + '</p>' +
          '<button class="btn btn-lg" data-act="home">' + S.icon('home') + S.esc(S.tx('go_home', 'Go home')) + '</button></div>',
        { home: function () { S.Router.go(S.Router.homeFor(s && s.role)); } });
    },

    failure: function () {
      var s = S.Auth.session();
      S.mount(S.qs('#app'),
        '<div class="state-screen anim-in"><div class="empty-ico" style="margin:0 auto;width:5.5rem;height:5.5rem;border-radius:1.75rem;display:grid;place-items:center;background:var(--peach-50);color:var(--peach-ink)">' + S.icon('refresh', '', { size: 40 }) + '</div>' +
          '<h1>' + S.esc(S.tx('went_wrong', 'Something went wrong')) + '</h1>' +
          '<p>' + S.esc(S.tx('went_wrong_sub', 'This was not your fault. Your information is safe. Please try again.')) + '</p>' +
          '<button class="btn btn-lg" data-act="retry">' + S.icon('refresh') + S.esc(S.tx('try_again', 'Try again')) + '</button> ' +
          '<button class="btn btn-lg btn-outline" data-act="home">' + S.icon('home') + S.esc(S.tx('go_home', 'Go home')) + '</button></div>',
        { retry: function () { S.Router.handle(); }, home: function () { S.Router.go(S.Router.homeFor(s && s.role)); } });
    },

    patient: function (p) {
      var sub = p[1] || 'home';
      var P = S.Patient;
      switch (sub) {
        case 'home': return P.home();
        case 'talk': return S.Talk.render(p[2] === 'memory' ? { memoryId: p[3] } : {});
        case 'games': case 'play': return P.games();
        case 'game': return S.GameShell.open(p[2], { returnTo: '#/patient/games' });
        case 'memories': return p[2] === 'new' ? S.Memories.form(null) : S.Memories.list(p[2]);
        case 'memory': return p[3] === 'edit' ? S.Memories.form(p[2]) : S.Memories.detail(p[2]);
        case 'reminders': return P.reminders();
        case 'notes': return P.notes();
        case 'progress': return P.progress();
        case 'doctor': return S.Care.doctor(p[2]);
        case 'medicines': return S.Care.medicines();
        case 'caregiver': return S.Care.caregiver();
        case 'records': return S.Care.records();
        case 'settings': return S.Settings.render('patient');
        case 'more': return P.more();
        case 'sos': return S.Care.sos();
        case 'support': return S.Care.support();
        case 'charity': return S.Charity.render();
        case 'fact': return P.fact();
        case 'skill': return P.skill(p[2]);
        case 'family': return S.Care.caregiver();
        case 'premium': S.Premium.open(); return P.home();
        default: return this.notFound();
      }
    },

    /** True while a cognitive activity is on screen. */
    inGame: function () {
      var p = this.parts();
      return p[0] === 'patient' && p[1] === 'game';
    },

    tab: function () {
      var p = this.parts();
      return p[1] || '';
    }
  };

  S.Router = Router;
})(window);
