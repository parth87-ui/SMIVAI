/* ============================================================
   SMIVAI — ui/shell.js
   The persistent chrome around every signed-in screen:
     · sidebar      desktop (full) and tablet (compact rail)
     · top bar      greeting, search, connection, notifications, profile
     · bottom nav   phones
   One nav definition per role drives all three, so they never disagree.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  function tx(k, en, p) { return S.tx(k, en, p); }
  function esc(v) { return S.esc(v); }

  var NAV = {
    patient: [
      { id: 'home', key: 'nav_home', en: 'Home', ico: 'home', mobile: 1 },
      { id: 'talk', key: 'nav_talk', en: 'Talk with HUN', short: 'Talk', ico: 'talk', mobile: 2 },
      { id: 'games', key: 'nav_games', en: 'Brain Games', short: 'Games', ico: 'brain', mobile: 3 },
      { id: 'memories', key: 'nav_memories2', en: 'My Memories', short: 'Memories', ico: 'heart', mobile: 4 },
      { id: 'reminders', key: 'nav_reminders', en: 'Reminders', ico: 'bell' },
      { id: 'progress', key: 'nav_progress', en: 'My Progress', ico: 'chart' },
      { sep: true },
      { id: 'doctor', key: 'nav_doctor', en: 'Book a Doctor', ico: 'stethoscope' },
      { id: 'records', key: 'nav_records', en: 'Health Records', ico: 'records' },
      { id: 'caregiver', key: 'nav_caregiver', en: 'Caregiver Support', ico: 'users' },
      { id: 'support', key: 'help_charities', en: 'Helplines & charities', ico: 'heart' },
      { id: 'settings', key: 'nav_settings', en: 'Settings', ico: 'settings' },
      { id: 'more', key: 'nav_profile', en: 'Profile', ico: 'user', mobile: 5, mobileOnly: true }
    ],
    caregiver: [
      { id: 'dashboard', en: 'Home', ico: 'home', mobile: 1 },
      { id: 'patients', en: 'People I Support', short: 'People', ico: 'users', mobile: 2 },
      { id: 'activities', en: 'Progress', ico: 'chart' },
      { id: 'reminders', en: 'Reminders', ico: 'bell', mobile: 3 },
      { id: 'memory', en: 'Memories', ico: 'heart' },
      { id: 'alerts', en: 'Alerts & SOS', short: 'Alerts', ico: 'alert', mobile: 4, badge: 'alerts' },
      { id: 'guidance', en: 'Doctor Guidance', ico: 'stethoscope' },
      { sep: true },
      { id: 'language', en: 'Language', ico: 'globe' },
      { id: 'settings', en: 'Settings', ico: 'settings', mobile: 5 }
    ],
    /* Donors and charity reviewers (server accounts; screens/charity.js, screens/donor.js) */
    donor: [
      { id: 'dashboard', en: 'Donate', ico: 'heart', mobile: 1 },
      { id: 'history', en: 'My donations', ico: 'records', mobile: 2 }
    ],
    admin: [
      { id: 'dashboard', en: 'Applications', ico: 'records', mobile: 1 },
      { id: 'fund', en: 'Fund & ledger', ico: 'chart', mobile: 2 }
    ],
    charity_partner: [
      { id: 'dashboard', en: 'Applications', ico: 'records', mobile: 1 },
      { id: 'fund', en: 'Fund', ico: 'chart', mobile: 2 }
    ],
    doctor: [
      { id: 'dashboard', en: 'Home', ico: 'home', mobile: 1 },
      { id: 'patients', en: 'Patients', ico: 'users', mobile: 2 },
      { id: 'insights', en: 'Insights', ico: 'trend', mobile: 3 },
      { id: 'appointments', en: 'Appointments', ico: 'calendar', mobile: 4 },
      { id: 'reminders', en: 'Care Reminders', ico: 'bell' },
      { sep: true },
      { id: 'settings', en: 'Settings', ico: 'settings', mobile: 5 }
    ]
  };

  function label(it, short) {
    if (short && it.short) return it.key ? tx(it.key + '_s', it.short) : it.short;
    return it.key ? tx(it.key, it.en) : it.en;
  }

  /* A few of the app's own 3D objects sit in the background of each screen,
     chosen for what that screen is about. Decorative only: aria-hidden,
     behind the content, and never in the way of a tap or a word. */
  var DECOR = {
    'patient:home': ['water', 'plant', 'calendar', 'bulb', 'photos'],
    'patient:talk': ['bulb', 'shapes', 'book'],
    'patient:games': ['puzzle', 'cards', 'shapes', 'letters', 'bingo'],
    'patient:memories': ['photos', 'cards', 'calendar'],
    'patient:memory': ['photos', 'cards'],
    'patient:reminders': ['calendar', 'medicine', 'water', 'bulb'],
    'patient:notes': ['notepad', 'book', 'plant'],
    'patient:progress': ['trophy', 'shapes', 'plant'],
    'patient:doctor': ['stethoscope', 'calendar', 'shieldHeart'],
    'patient:medicines': ['medicine', 'folder', 'water'],
    'patient:caregiver': ['shieldHeart', 'phone', 'plant'],
    'patient:records': ['folder', 'medicine', 'shieldHeart'],
    'patient:settings': ['shieldHeart', 'bulb'],
    'patient:more': ['photos', 'plant', 'trophy'],
    'patient:fact': ['bulb', 'book'],
    'patient:skill': ['book', 'plant'],
    'caregiver:dashboard': ['shieldHeart', 'calendar', 'plant'],
    'caregiver:alerts': ['phone', 'shieldHeart'],
    'caregiver:memory': ['photos', 'cards'],
    'caregiver:guidance': ['stethoscope', 'folder'],
    'doctor:dashboard': ['stethoscope', 'folder', 'trophy'],
    'doctor:appointments': ['calendar', 'stethoscope'],
    'doctor:insights': ['trophy', 'shapes', 'folder']
  };
  var DECOR_DEFAULT = ['plant', 'bulb', 'calendar'];
  var SLOTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

  function greetKey() {
    var part = S.partOfDay();
    return part === 'Morning' ? 'good_morning' : part === 'Afternoon' ? 'good_afternoon' : 'good_evening';
  }

  function logoMark(size) {
    var id = 'lg' + Math.random().toString(36).slice(2, 7);
    return '<svg width="' + (size || 44) + '" height="' + (size || 44) + '" viewBox="0 0 48 48" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + 'a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7FA2DE"/><stop offset="1" stop-color="#4A70B3"/></linearGradient>' +
      '<linearGradient id="' + id + 'b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9FD6BA"/><stop offset="1" stop-color="#4F9D91"/></linearGradient></defs>' +
      '<circle cx="17" cy="11" r="5.2" fill="url(#' + id + 'a)"/><circle cx="31" cy="11" r="5.2" fill="url(#' + id + 'b)"/>' +
      '<path d="M24 43 C14 36 6 29 6 21 a7 7 0 0 1 11 -5.7 L24 21 l7 -5.7 A7 7 0 0 1 42 21 c0 8 -8 15 -18 22 Z" fill="url(#' + id + 'a)"/>' +
      '<path d="M24 43 C31 38 42 30 42 21 A7 7 0 0 0 31 15.3 L24 21 Z" fill="url(#' + id + 'b)" opacity=".95"/>' +
      '<path d="M12 21 a5 5 0 0 1 4 -4" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".7"/></svg>';
  }

  var Shell = {
    NAV: NAV,
    logoMark: logoMark,

    /** Call on every route change. */
    render: function () {
      var sess = S.Auth.session();
      var body = document.body;
      var sidebar = S.qs('#sidebar'), top = S.qs('#topbar'), bottom = S.qs('#bottomnav');
      var immersive = S.Router.inGame() || S.Router.parts()[1] === 'sos';

      if (!sess || S.Router.parts()[0] === 'login' || S.Router.parts()[0] === '') {
        body.classList.remove('has-shell', 'has-bottomnav');
        body.classList.add('no-shell');
        sidebar.hidden = true; top.hidden = true; bottom.hidden = true;
        this.decor(null);          // the welcome screen carries its own
        return;
      }
      body.classList.remove('no-shell');
      body.classList.toggle('has-shell', !immersive);
      body.classList.toggle('has-bottomnav', !immersive);
      sidebar.hidden = immersive; top.hidden = immersive; bottom.hidden = immersive;
      if (immersive) { this.decor(null); return; }   // games fill the screen

      this.decor(sess.role + ':' + this.current());
      this.sidebar(sess);
      this.topbar(sess);
      this.bottom(sess);
    },

    current: function () { return S.Router.parts()[1] || (S.State.role === 'patient' ? 'home' : 'dashboard'); },

    /**
     * Paint the background layer for a screen. `key` is "role:tab", or null
     * to clear it. Cheap to call on every route change — it only rebuilds
     * when the set of objects actually changes.
     */
    decor: function (key) {
      var host = S.qs('#decor');
      if (!host) return;
      if (!key) { host.hidden = true; host.innerHTML = ''; host.dataset.key = ''; return; }
      host.hidden = false;
      if (host.dataset.key === key) return;
      host.dataset.key = key;
      var set = DECOR[key] || DECOR[key.split(':')[0] + ':' + 'dashboard'] || DECOR_DEFAULT;
      // Fill up to twice the set so short screens still get a full spread,
      // but never so often that one object turns into wallpaper.
      var count = Math.min(SLOTS.length, set.length * 2);
      host.innerHTML = '<span class="ad-wash"></span><span class="ad-pattern"></span>' +
        SLOTS.slice(0, count).map(function (slot, i) {
          var name = set[i % set.length];
          return '<span class="ad-sticker s' + slot + '">' + (S.Art[name] ? S.Art[name]() : '') + '</span>';
        }).join('');
    },

    badgeFor: function (kind, sess) {
      if (kind === 'alerts') {
        var ids = {};
        S.Links.forActor(sess.role, sess.actor_id).forEach(function (l) { ids[l.patient_id] = true; });
        return S.DB.where('alerts', function (a) { return ids[a.patient_id] && a.status === 'open'; }).length;
      }
      return 0;
    },

    sidebar: function (sess) {
      var role = sess.role, cur = this.current(), self = this;
      var patient = role === 'patient' ? S.State.patient() : null;
      var plan = S.Plans.planOf(role, sess.actor_id);
      var remindersDue = role === 'patient' && patient
        ? S.Reminders.occurrencesOn(patient.patient_id, S.todayISO()).filter(function (o) { return o.status === 'upcoming' || o.status === 'missed'; }).length : 0;

      var html =
        '<button class="sb-brand" data-act="home" aria-label="SMIVAI home">' + logoMark(46) +
          '<span class="sb-words"><span class="logo-word" style="display:block">SMIVAI</span><span class="logo-tag">' + S.esc(tx('tagline', 'Care Closer to You')) + '</span></span>' +
        '</button>' +
        '<nav class="sb-nav" aria-label="Main">' +
          NAV[role].filter(function (it) { return !it.mobileOnly; }).map(function (it) {
            if (it.sep) return '<div class="sb-sep" role="presentation"></div>';
            var badge = it.badge ? self.badgeFor(it.badge, sess) : (it.id === 'reminders' && role === 'patient' ? remindersDue : 0);
            var locked = false;
            return '<button class="sb-link" data-act="go" data-arg="' + it.id + '" aria-current="' + (it.id === cur ? 'page' : 'false') + '">' +
              '<span class="sb-ico">' + S.icon(it.ico) + '</span><span class="sb-label">' + S.esc(label(it)) + '</span>' +
              (badge ? '<span class="sb-badge" aria-label="' + badge + ' waiting">' + badge + '</span>' : '') +
              (locked ? '<span class="sb-lock">' + S.icon('lock') + '</span>' : '') +
              '</button>';
          }).join('') +
        '</nav>' +
        '<div class="sb-foot">' +
          (role === 'patient'
            ? '<div class="sb-art" aria-hidden="true"><div class="sa-title">' + S.esc(tx('better_days', 'Better Days Together')) + '</div>' +
                S.Art.couple() +
                '<div class="sa-foot">' + S.esc(tx('your_health', 'Your health. Our priority.')) + '</div></div>'
            : '') +
          (!S.M.hasPlans(role) ? '' : plan === 'premium'
            ? '<div class="sb-plan"><div class="sp-title">' + S.icon('sparkle', '', { size: 18 }) + ' SMIVAI Premium</div>' +
                '<div class="sp-sub">' + S.esc(tx('premium_active', 'All your Premium features are on.')) + '</div></div>'
            : S.Prefs.get('premium_card') === 'hidden' ? ''
            : '<div class="sb-plan"><button type="button" class="sp-close" data-act="hidePremium" aria-label="' + S.esc(tx('hide_card', 'Hide this')) + '">' + S.icon('x') + '</button>' +
                '<div class="sp-title">' + S.esc(tx('unlock_premium', 'Unlock SMIVAI Premium')) + '</div>' +
                '<div class="sp-sub">' + S.esc(role === 'patient' ? tx('premium_pitch_p', 'All 8 brain games, deeper conversations and detailed progress.')
                  : role === 'caregiver' ? 'Support up to 6 people.' : 'Up to 500 patients.') + '</div>' +
                '<button class="btn btn-premium btn-sm" data-act="premium">' + S.icon('sparkle') + S.esc(tx('see_premium', 'See Premium')) + '</button></div>') +
          (role === 'patient'
            ? '<button class="sb-sos" data-act="sos">' + S.icon('phone') + '<span>' + S.esc(tx('sos_short', 'Emergency SOS')) + '</span></button>'
            : '<button class="sb-link" data-act="logout"><span class="sb-ico">' + S.icon('logout') + '</span><span class="sb-label">Sign out</span></button>') +
        '</div>';

      S.mount(S.qs('#sidebar'), html, {
        home: function () { S.Router.go(S.Router.homeFor(role)); },
        go: function (el) { S.Router.go('#/' + role + '/' + el.getAttribute('data-arg')); },
        premium: function () { S.Premium.open(); },
        hidePremium: function () {
          S.Prefs.set('premium_card', 'hidden');
          Shell.sidebar(sess);
          S.toast(tx('premium_hidden', 'Hidden. Premium is still in Settings whenever you want it.'), 'ok');
        },
        sos: function () { S.Router.go('#/patient/sos'); },
        logout: function () { Shell.confirmLogout(); }
      });
      this.fitSidebar();
    },

    /** The illustration is the first thing to go when the rail runs short,
        so the nav never has to scroll to reach Settings. */
    fitSidebar: function () {
      var bar = S.qs('#sidebar'), art = bar && bar.querySelector('.sb-art');
      if (!bar || !art) return;
      art.hidden = false;
      var nav = bar.querySelector('.sb-nav');
      if (nav && nav.scrollHeight > nav.clientHeight + 1) art.hidden = true;
    },

    /** The signed-in person as the picture slots need them: a record
        with a gender on it. Caregivers are stored without one, so the
        demo seed supplies it; a doctor's comes from the directory. */
    selfOf: function (sess, ent) {
      var self = ent || {};
      if (sess.role === 'doctor') {
        var d = S.Wellness.doctor && S.Wellness.doctor(sess.actor_id);
        if (d) return d;
      }
      return self;
    },

    topbar: function (sess) {
      var role = sess.role;
      var ent = S.Plans.entity(role, sess.actor_id) || {};
      var first = String(ent.name || sess.name || '').replace(/^Dr\.?\s+/i, '').split(' ')[0];
      var hello = role === 'patient'
        ? S.t(greetKey()) + ', ' + first + ' Ji! 👋'
        : S.t(greetKey()) + ', ' + (role === 'doctor' ? ent.name : first);
      var today = S.todayISO();
      var unread = S.Services.Notify.unreadCount();
      var planBadge = S.Plans.planOf(role, sess.actor_id) === 'premium';

      /* Reading comfort and language are one tap away on every patient
         screen, not buried in Settings. */
      var quick = role === 'patient' ? S.UI.readingControls() : '';

      var html =
        '<button class="tb-brand-m" data-act="home" aria-label="SMIVAI home">' + logoMark(36) + '<span class="logo-word">SMIVAI</span></button>' +
        '<div class="tb-greet"><div class="tg-hello">' + S.esc(hello) + '</div>' +
          '<div class="tg-date">' + S.esc(S.weekdayName(today) + ', ' + S.prettyDate(today)) + '</div></div>' +
        '<div class="tb-search" role="search">' +
          '<span class="ts-ico">' + S.icon('search') + '</span>' +
          '<label class="sr-only" for="tb-q">Search</label>' +
          '<input id="tb-q" type="search" autocomplete="off" placeholder="' + S.esc(role === 'patient'
            ? tx('search_ph', 'Search doctors, medicines, or health services…') : 'Search patients, reminders, memories…') + '">' +
          '<div id="tb-results" hidden></div>' +
        '</div>' +
        (quick ? '<div class="tb-reading">' + quick + '</div>' : '') +
        '<div class="tb-actions">' +
          '<button class="tb-icon tb-search-btn" data-act="openSearch" aria-label="Search">' + S.icon('search') + '</button>' +
          S.UI.statusPill(role === 'patient') +
          '<button class="tb-icon" data-act="notifs" aria-label="Notifications' + (unread ? ', ' + unread + ' new' : '') + '">' + S.icon('bell') +
            (unread ? '<span class="dot">' + unread + '</span>' : '') + '</button>' +
          '<button class="tb-profile" data-act="profile" aria-label="Your profile and settings">' +
            '<span class="avatar">' + (role === 'patient' ? S.Art.avatar(ent) : S.esc(S.initials(ent.name || sess.name))) + '</span>' +
            '<span class="tp-text"><span class="tp-name" style="display:block">' + S.esc(ent.name || sess.name) + '</span>' +
            '<span class="tp-sub">' + (planBadge ? '✦ Premium' : S.esc(role === 'patient' ? tx('stay_healthy', 'Stay healthy, stay happy!') : S.M.roleName(role))) + '</span></span>' +
            S.icon('chevronDown') +
          '</button>' +
        '</div>';

      var bar = S.qs('#topbar');
      S.mount(bar, html, Object.assign(S.UI.readingHandlers(function () {
        Shell.fitTopbar(); Shell.fitSidebar();
      }), {
        home: function () { S.Router.go(S.Router.homeFor(role)); },
        toggleOffline: function () { S.App.toggleOffline(); },
        notifs: function () { Shell.notifications(); },
        profile: function () { Shell.profileMenu(sess); },
        openSearch: function () {
          var box = S.qs('.tb-search', bar);
          box.classList.add('is-open');
          S.qs('#tb-q', bar).focus();
        }
      }));
      S.UI.syncReading(bar);
      S.Photo.avatarInto(S.qs('.tb-profile .avatar', bar), Shell.selfOf(sess, ent), role);
      this.wireSearch(bar, sess);
      this.fitTopbar();
    },

    /* The bar never lets one control sit on another. At large text sizes
       (or in a long language) it gives things up in this order: the
       search field folds into its button, the profile chip drops the name
       the greeting already says, then the greeting goes, then text size
       and Language move to a row of their own (a phone), and only then
       does "Language" drop its word for the globe alone. */
    fitTopbar: function () {
      var bar = S.qs('#topbar');
      if (!bar || bar.hidden) return;
      var steps = ['tb-fold-search', 'tb-fold-name', 'tb-fold-greet', 'tb-fold-row', 'tb-fold-words'];
      steps.forEach(function (c) { bar.classList.remove(c); });
      for (var i = 0; i < steps.length && Shell.barCrowded(bar); i++) bar.classList.add(steps[i]);
    },

    /** Crowded = spilling out of the bar, or any two things touching.
        The search is measured by its input, not its box: the box can be
        narrower than what it paints, and it is the paint that covers a
        button. */
    barCrowded: function (bar) {
      if (bar.scrollWidth > bar.clientWidth + 1) return true;
      var items = S.qsa('.tb-greet, .tb-search input, .tb-reading > *, .tb-actions > *', bar).filter(function (el) {
        return el.offsetWidth > 0 && getComputedStyle(el).display !== 'none';
      }).map(function (el) { return el.getBoundingClientRect(); });
      for (var i = 0; i < items.length; i++) {
        for (var j = i + 1; j < items.length; j++) {
          var a = items[i], b = items[j];
          if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) return true;
        }
      }
      return false;
    },

    bottom: function (sess) {
      var cur = this.current();
      var items = NAV[sess.role].filter(function (it) { return it.mobile; }).sort(function (a, b) { return a.mobile - b.mobile; });
      var moreIds = sess.role === 'patient' ? ['more', 'reminders', 'progress', 'doctor', 'records', 'caregiver', 'support', 'settings', 'premium', 'notifications'] : [];
      S.mount(S.qs('#bottomnav'), items.map(function (it) {
        var on = it.id === cur || (it.id === 'more' && moreIds.indexOf(cur) !== -1);
        return '<button data-act="go" data-arg="' + it.id + '" aria-current="' + (on ? 'page' : 'false') + '">' +
          S.icon(it.ico) + '<span>' + S.esc(label(it, true)) + '</span></button>';
      }).join(''), {
        go: function (el) { S.Router.go('#/' + sess.role + '/' + el.getAttribute('data-arg')); }
      });
    },

    /* ---------------- search ---------------- */
    index: function (sess) {
      var out = [];
      var role = sess.role;
      var add = function (group, title, sub, go, ico) { out.push({ group: group, title: title, sub: sub || '', go: go, ico: ico || 'arrowRight', hay: (title + ' ' + (sub || '')).toLowerCase() }); };
      NAV[role].forEach(function (it) { if (!it.sep) add('Pages', label(it), '', '#/' + role + '/' + it.id, it.ico); });
      if (role === 'patient') {
        add('Services', tx('order_medicines', 'Order Medicines'), tx('om_sub', 'Get medicines at your doorstep'), '#/patient/medicines', 'pill');
        add('Services', tx('request_caregiver', 'Request a Caregiver'), 'Home help, nurse visit, companionship', '#/patient/caregiver', 'users');
        add('Services', 'Emergency SOS', 'Call for help now', '#/patient/sos', 'phone');
        add('Services', tx('daily_fact', 'Daily Fact'), '', '#/patient/fact', 'bulb');
        add('Services', tx('learn_skill', 'Learn a New Skill'), '', '#/patient/skill', 'book');
        S.Wellness.DOCTORS.forEach(function (d) { add('Doctors', d.name, d.speciality + ' · ' + d.city, '#/patient/doctor/' + d.id, 'stethoscope'); });
        var p = S.State.patient();
        if (p) {
          S.DB.forPatient('memory_bank', p.patient_id).forEach(function (m) { add('Memories', m.title, m.place || '', '#/patient/memory/' + m.memory_id, 'heart'); });
          S.Reminders.forPatient(p.patient_id).forEach(function (r) {
            add(r.category === 'medicine' ? 'Medicines' : 'Reminders', r.title, S.prettyTime(r.time), r.category === 'medicine' ? '#/patient/medicines' : '#/patient/reminders', r.category === 'medicine' ? 'pill' : 'bell');
          });
        }
        S.M.GAMES.forEach(function (g) { add('Brain Games', S.M.gameName(g.id), g.short, '#/patient/games', 'brain'); });
      } else {
        S.State.patients().forEach(function (p) { add('Patients', p.name, (p.age ? p.age + ' years · ' : '') + (p.district || ''), '#/' + role + '/dashboard?p=' + p.patient_id, 'user'); });
      }
      return out;
    },

    wireSearch: function (bar, sess) {
      var input = S.qs('#tb-q', bar), pop = S.qs('#tb-results', bar), box = S.qs('.tb-search', bar);
      var idx = null;
      var close = function () { pop.hidden = true; pop.className = ''; };
      input.addEventListener('input', function () {
        var q = input.value.trim().toLowerCase();
        if (!q) { close(); return; }
        idx = idx || Shell.index(sess);
        var hits = idx.filter(function (r) { return r.hay.indexOf(q) !== -1; }).slice(0, 12);
        var groups = {};
        hits.forEach(function (h) { (groups[h.group] = groups[h.group] || []).push(h); });
        pop.hidden = false; pop.className = 'search-pop';
        pop.innerHTML = hits.length
          ? Object.keys(groups).map(function (g) {
              return '<div class="sp-group">' + S.esc(g) + '</div>' + groups[g].map(function (h) {
                return '<button class="sp-item" data-go="' + S.esc(h.go) + '"><span class="list-icon blue" style="width:2.5rem;height:2.5rem">' + S.icon(h.ico) + '</span>' +
                  '<span>' + S.esc(h.title) + (h.sub ? '<small>' + S.esc(h.sub) + '</small>' : '') + '</span></button>';
              }).join('');
            }).join('')
          : '<div class="sp-empty">' + S.esc(tx('no_results', 'Nothing found. Try another word.')) + '</div>';
        S.qsa('[data-go]', pop).forEach(function (b) {
          b.addEventListener('click', function () {
            var go = b.getAttribute('data-go');
            var m = go.match(/\?p=(.+)$/);
            if (m) { S.State.setPatient(m[1]); go = go.replace(/\?p=.+$/, ''); }
            input.value = ''; close(); box.classList.remove('is-open');
            S.Router.go(go);
          });
        });
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { input.value = ''; close(); box.classList.remove('is-open'); input.blur(); }
        if (e.key === 'Enter') { var first = S.qs('[data-go]', pop); if (first) first.click(); }
      });
      input.addEventListener('blur', function () { setTimeout(function () { close(); if (!input.value) box.classList.remove('is-open'); }, 180); });
    },

    /** Text size, right where the patient is reading. Applies instantly. */

    /* ---------------- notifications ---------------- */
    notifications: function () {
      var list = S.Services.Notify.forMe();
      var icoFor = { sos: ['phone', 'red'], appointment: ['calendar', 'blue'], memory: ['heart', 'peach'], plan: ['sparkle', 'lav'],
        link: ['users', 'green'], reminder: ['bell', 'peach'], order: ['truck', 'green'], request: ['users', 'peach'], message: ['message', 'blue'] };
      S.Modal.open({
        title: tx('notifications', 'Notifications'),
        body: list.length
          ? '<div class="list">' + list.slice(0, 30).map(function (n) {
              var ic = icoFor[n.kind] || ['info', 'blue'];
              return '<button class="list-item notif-row' + (n.read ? '' : ' is-unread') + '" data-act="open" data-arg="' + S.esc(n.notification_id) + '">' +
                '<span class="list-icon ' + ic[1] + '">' + S.icon(ic[0]) + '</span>' +
                '<span class="grow" style="text-align:left"><b style="display:block">' + S.esc(n.title) + '</b>' +
                '<span class="t-small muted">' + S.esc(n.body) + '</span><br><span class="t-mini">' + S.esc(S.prettyStamp(n.created_at)) + '</span></span>' +
                (n.read ? '' : '<span class="chip chip-peach">New</span>') + '</button>';
            }).join('') + '</div>'
          : S.UI.empty(S.icon('bell'), tx('no_notifications', 'You are all caught up'), tx('no_notifications_sub', 'New messages and updates will appear here.')),
        footer: list.length ? '<button class="btn btn-outline" data-act="readAll">' + S.icon('check') + S.esc(tx('mark_read', 'Mark all as read')) + '</button>' +
          '<button class="btn" data-modal-close>' + S.esc(S.t('close')) + '</button>' : '<button class="btn" data-modal-close>' + S.esc(S.t('close')) + '</button>',
        handlers: {
          open: function (el, ev, id) {
            var n = S.DB.find('notifications', id);
            if (!n) return;
            S.DB.update('notifications', id, { read: true }, { silent: true });
            S.Modal.close();
            if (n.link) S.Router.go(n.link); else Shell.render();
          },
          readAll: function () { S.Services.Notify.markAllRead(); S.Modal.close(); Shell.render(); }
        }
      });
    },

    profileMenu: function (sess) {
      var ent = S.Plans.entity(sess.role, sess.actor_id) || {};
      var plan = S.Plans.planOf(sess.role, sess.actor_id);
      S.Modal.open({
        title: ent.name || sess.name,
        subtitle: S.M.roleName(sess.role) + (S.M.hasPlans(sess.role) ? ' · ' + (plan === 'premium' ? 'SMIVAI Premium' : 'SMIVAI Free') : ''),
        body: '<div class="stack stack-1">' +
          menuBtn('settings', 'settings', tx('nav_settings', 'Settings')) +
          menuBtn('premium', 'sparkle', plan === 'premium' ? 'My plan' : tx('see_premium', 'See Premium')) +
          (sess.role === 'patient' ? menuBtn('account', 'user', tx('my_account', 'My account & care code')) : '') +
          menuBtn('logout', 'logout', 'Sign out') +
          '</div>',
        footer: '<button class="btn btn-outline" data-modal-close>' + S.esc(S.t('close')) + '</button>',
        handlers: {
          settings: function () { S.Modal.close(); S.Router.go('#/' + sess.role + '/settings'); },
          account: function () { S.Modal.close(); S.Router.go('#/' + sess.role + '/settings'); },
          premium: function () { S.Modal.close(); S.Premium.open(); },
          logout: function () { S.Modal.close(); Shell.confirmLogout(); }
        }
      });
      function menuBtn(act, ico, text) {
        return '<button class="action-card" data-act="' + act + '" style="min-height:4.25rem;padding:.75rem 1rem">' +
          '<span class="ac-icon" style="width:3rem;height:3rem;border-radius:.875rem">' + S.icon(ico) + '</span>' +
          '<span class="ac-body"><span class="ac-title" style="font-size:1.125rem">' + S.esc(text) + '</span></span>' +
          '<span class="ac-chev">' + S.icon('chevronRight') + '</span></button>';
      }
    },

    confirmLogout: function () {
      S.Modal.confirm({
        title: tx('signout_q', 'Sign out of SMIVAI?'),
        message: tx('signout_msg', 'You will need your ID and a one-time code to sign in again. Your information stays safely on this device.'),
        okText: 'Sign out'
      }).then(function (ok) {
        if (!ok) return;
        S.Auth.logout();
        S.toast(tx('signed_out', 'You have signed out.'), 'ok');
        S.Router.go('#/');
      });
    }
  };

  S.Shell = Shell;

  /* A rail that fits at one window height may not fit at the next. */
  var fitTimer = null;
  global.addEventListener('resize', function () {
    if (fitTimer) clearTimeout(fitTimer);
    fitTimer = setTimeout(function () { Shell.fitSidebar(); Shell.fitTopbar(); }, 120);
  });

  /* The window's resize event can arrive before the new layout exists, and
     then the bar keeps the folds of the old width. Watching the bar and the
     rail themselves refits them once their real size is known. Only a change
     of width (bar) or height (rail) counts, so a fold that changes the bar's
     height cannot set off another round. */
  if (global.ResizeObserver) {
    var seen = { topbar: 0, sidebar: 0 };
    var ro = new global.ResizeObserver(function (entries) {
      var due = {};
      entries.forEach(function (en) {
        var id = en.target.id, size = Math.round(id === 'topbar' ? en.contentRect.width : en.contentRect.height);
        if (!size || size === seen[id]) return;
        seen[id] = size;
        due[id] = true;
      });
      /* refit on the next frame, not inside the callback: a fold changes
         the bar's height, and changing an observed box mid-callback is what
         makes browsers report an undelivered-notification loop */
      if (due.topbar || due.sidebar) {
        global.requestAnimationFrame(function () {
          if (due.topbar) Shell.fitTopbar();
          if (due.sidebar) Shell.fitSidebar();
        });
      }
    });
    ['#topbar', '#sidebar'].forEach(function (sel) { var el = S.qs(sel); if (el) ro.observe(el); });
  }
})(window);
