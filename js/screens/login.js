/* ============================================================
   SMIVAI — screens/login.js
   Role → identity (mock Aadhaar / ABHA / medical licence) → OTP → in.
   First-time members add a short profile.

   Every mock is labelled on screen. No identity number is kept: Auth
   stores a salted hash and the last four digits only.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;
  function tx(k, en, p) { return S.tx(k, en, p); }

  var ROLE = {
    patient: {
      title: 'Patient', ids: ['aadhaar', 'abha'],
      art: function () { return S.Art.avatar({ gender: 'male', patient_id: 'demo-a', district: 'Jorhat' }); },
      photoAlt: function () { return tx('lg_alt_patient', 'An older couple using SMIVAI on a tablet at home'); }
    },
    caregiver: {
      title: 'Caregiver', ids: ['aadhaar'],
      art: function () { return S.Art.caregiver(); },
      photoAlt: function () { return tx('lg_alt_caregiver', 'A caregiver sitting with an older adult'); }
    },
    doctor: {
      title: 'Doctor', ids: ['license'],
      art: function () { return S.Art.stethoscope(); },
      photoAlt: function () { return tx('lg_alt_doctor', 'A doctor at work'); }
    },
    /* Server-only accounts: they exist on the Smivai server, never just on a device. */
    donor: {
      title: 'Donor', ids: ['mobile'], server: true,
      art: function () { return S.Art.shieldHeart ? S.Art.shieldHeart() : S.Art.caregiver(); },
      photoAlt: function () { return tx('lg_alt_donor', 'Hands holding a heart'); }
    },
    admin: {
      title: 'Smivai administrator', ids: ['mobile'], server: true, staff: true,
      art: function () { return S.Art.stethoscope(); },
      photoAlt: function () { return tx('lg_alt_staff', 'A reviewer at work'); }
    },
    charity_partner: {
      title: 'Charity partner', ids: ['mobile'], server: true, staff: true,
      art: function () { return S.Art.stethoscope(); },
      photoAlt: function () { return tx('lg_alt_staff', 'A reviewer at work'); }
    }
  };
  var ID = {
    aadhaar: { name: 'Aadhaar', label: 'Your 12-digit Aadhaar number', ph: '1234 5678 9012', mode: 'numeric', max: 14 },
    abha: { name: 'ABHA', label: 'Your 14-digit ABHA number', ph: '12-3456-7890-1234', mode: 'numeric', max: 17 },
    license: { name: 'Medical registration', label: 'Your medical registration number', ph: 'e.g. ASMC-45821', mode: 'text', max: 24 },
    mobile: { name: 'Mobile number', label: 'Your 10-digit mobile number', ph: '98XXXXXXXX', mode: 'numeric', max: 13 }
  };

  var st = null;

  var Login = {
    render: function (role, step) {
      if (role === 'staff') return this.staffChooser();
      if (!ROLE[role]) { S.Router.go('#/'); return; }
      if (ROLE[role].server && !S.Server.base(role)) return this.needsServer(role, step);
      var existing = S.Auth.session();
      if (existing && existing.role === role) { S.Router.go(S.Router.homeFor(role)); return; }
      document.body.classList.toggle('role-patient', role === 'patient');
      st = { role: role, idType: ROLE[role].ids[0], step: 'id', busy: false };
      this.draw();
    },

    /** Charity reviewers pick which kind of staff account they have. */
    staffChooser: function () {
      S.mount(S.qs('#app'),
        '<div class="state-screen anim-in"><h1>' + S.esc(tx('staff_signin', 'Staff sign-in')) + '</h1>' +
          '<p>' + S.esc(tx('staff_signin_s', 'For Smivai administrators and charity partners who review assistance applications. These accounts are created by Smivai; there is no sign-up.')) + '</p>' +
          '<div class="row" style="gap:.75rem;justify-content:center;flex-wrap:wrap">' +
            '<button class="btn btn-lg" data-act="go" data-arg="admin">' + S.esc(ROLE.admin.title) + '</button>' +
            '<button class="btn btn-lg btn-outline" data-act="go" data-arg="charity_partner">' + S.esc(ROLE.charity_partner.title) + '</button>' +
            '<button class="btn btn-lg btn-ghost" data-act="home">' + S.esc(S.t('back')) + '</button></div></div>',
        { go: function (el, ev, r) { S.Router.go('#/login/' + r); }, home: function () { S.Router.go('#/'); } });
    },

    /** Donor and staff accounts live on the Smivai server only. */
    needsServer: function (role, step, checked) {
      var self = this;
      if (!checked) {
        S.mount(S.qs('#app'), '<div class="state-screen anim-in"><h1>' + S.esc(ROLE[role].title) + '</h1>' +
          '<p>' + S.esc(tx('finding_server', 'Connecting to the Smivai server…')) + '</p></div>', {});
        S.Server.detect(true).then(function (url) {
          if (!url) return self.needsServer(role, step, true);
          var s = S.Auth.session();
          return s && s.role === role ? S.Router.handle() : self.render(role, step);   // already signed in: open their screen
        });
        return;
      }
      S.mount(S.qs('#app'),
        '<div class="state-screen anim-in"><h1>' + S.esc(ROLE[role].title) + '</h1>' +
          '<p>' + S.esc(tx('needs_server', 'This account works with the Smivai server, which is not running or not reachable. Nothing can be saved here without it.')) + '</p>' +
          '<p class="t-small muted" style="margin-top:.5rem">' + S.esc(tx('start_server', 'On this computer, start it from the project folder:')) + '<br><code>python backend/run_local.py</code></p>' +
          '<div class="row" style="gap:.75rem;justify-content:center;flex-wrap:wrap;margin-top:1rem">' +
            '<button class="btn btn-lg" data-act="retry">' + S.icon('refresh') + S.esc(tx('try_again', 'Try again')) + '</button>' +
            '<button class="btn btn-lg btn-ghost" data-act="home">' + S.icon('home') + S.esc(tx('go_home', 'Go home')) + '</button></div></div>',
        { retry: function () { self.needsServer(role, step); }, home: function () { S.Router.go('#/'); } });
    },

    frame: function (inner) {
      var r = ROLE[st.role];
      var steps = [tx('st_verify', 'Verify your ID'), tx('st_code', 'Enter the code'), tx('st_ready', 'You’re in')];
      var idx = st.step === 'id' ? 0 : st.step === 'otp' ? 1 : 2;
      return '<div class="login">' +
        '<aside class="lg-side">' +
          '<button class="wl-brand" data-act="home" style="background:none;border:0;cursor:pointer;padding:0;text-align:left">' + S.Shell.logoMark(46) +
            '<span><span class="logo-word" style="display:block">SMIVAI</span><span class="logo-tag">' + S.esc(tx('tagline', 'Care Closer to You')) + '</span></span></button>' +
          '<div class="lg-art">' + r.art() + '</div>' +
          '<ol class="lg-steps">' + steps.map(function (s, i) {
            return '<li class="' + (i < idx ? 'done' : i === idx ? 'on' : '') + '"><span class="n">' + (i < idx ? S.icon('check') : i + 1) + '</span>' + S.esc(s) + '</li>';
          }).join('') + '</ol>' +
        '</aside>' +
        '<main class="lg-main anim-in">' +
          '<div class="lg-top">' +
            '<button class="btn btn-ghost lg-back" data-act="back">' + S.icon('arrowLeft') + S.esc(S.t('back')) + '</button>' +
            '<div class="lg-reading">' + S.UI.readingControls() + '</div>' +
          '</div>' +
          '<div class="lg-card">' + inner + '</div>' +
        '</main>' +
      '</div>';
    },

    draw: function () {
      var html = st.step === 'id' ? this.idStep() : st.step === 'otp' ? this.otpStep() : this.profileStep();
      S.mount(S.qs('#app'), this.frame(html), Object.assign(S.UI.readingHandlers(), this.handlers()));
      S.UI.syncReading(S.qs('#app'));
      var first = S.qs('.lg-card input, .lg-card select', S.qs('#app'));
      if (first) setTimeout(function () { first.focus(); }, 80);
      Login.usePhoto();
      S.scrollTop();
    },

    /* A photograph for this role, if one has been placed in assets/
       (login-patient.jpg, login-caregiver.jpg, login-doctor.jpg).
       Without it the drawn figure stays. See docs/ASSETS.md. */
    usePhoto: function () {
      S.Photo.into(S.qs('.lg-art'), {
        file: 'assets/login-' + st.role + '.jpg',
        ratio: '1x1',
        alt: ROLE[st.role].photoAlt()
      });
    },

    idStep: function () {
      var r = ROLE[st.role], id = ID[st.idType];
      var demos = S.SeedV2.credentials().filter(function (c) { return c.role === st.role && (st.role !== 'patient' || true); });
      return '<span class="chip chip-blue">' + S.esc(r.title) + '</span>' +
        '<h1 class="t-h1" style="margin-top:.75rem">' + S.esc(st.role === 'doctor' ? tx('lg_doc_t', 'Welcome, Doctor') : tx('lg_t', 'Let’s sign you in')) + '</h1>' +
        '<p class="lg-sub">' + S.esc(st.role === 'doctor'
          ? tx('lg_doc_s', 'Confirm your medical registration, then enter the code sent to your mobile.')
          : tx('lg_s', 'Confirm who you are, then enter the code sent to your mobile.')) + '</p>' +
        (demos.length
          ? '<section class="lg-demo" aria-labelledby="lg-demo-t">' +
              '<div class="lg-demo-head" id="lg-demo-t">' + S.icon('user') + S.esc(tx('demo_accounts', 'Use a demo account')) + '</div>' +
              '<p class="lg-demo-sub">' + S.esc(tx('demo_fictional', 'Fictional people and numbers, for trying SMIVAI. Tap one to fill in the ID.')) + '</p>' +
              '<div class="lg-demo-grid">' + demos.map(function (d, i) {
                return '<button type="button" class="demo-acct" data-act="demo" data-arg="' + i + '" aria-pressed="false">' +
                  '<span><b>' + S.esc(d.name) + '</b><small>' + S.esc(ID[d.idType].name + ' · ' + d.display) + '</small></span>' +
                  '<span class="plan-badge ' + d.plan + '">' + (d.plan === 'premium' ? '✦ Premium' : 'Free') + '</span></button>';
              }).join('') + '</div>' +
            '</section>' +
            '<div class="lg-or" role="presentation"><span>' + S.esc(tx('or_own_id', 'or sign in with your own ID')) + '</span></div>'
          : '') +
        (r.ids.length > 1
          ? '<div class="segmented" role="tablist" style="margin-top:1.25rem">' + r.ids.map(function (k) {
              return '<button role="tab" data-act="idType" data-arg="' + k + '" aria-selected="' + (k === st.idType) + '">' + S.esc(ID[k].name) + '</button>';
            }).join('') + '</div>'
          : '') +
        '<form class="stack stack-2" style="margin-top:1.25rem" data-form="id" novalidate>' +
          '<div class="field"><label for="lg-id">' + S.esc(id.label) + '</label>' +
            '<input class="input input-xl" id="lg-id" inputmode="' + id.mode + '" autocomplete="off" maxlength="' + id.max + '" placeholder="' + S.esc(id.ph) + '"' +
              (st.idType === 'license' ? ' style="text-transform:uppercase"' : '') + '>' +
            '<div class="err" id="lg-err" role="alert" hidden></div></div>' +
          '<button class="btn btn-xl btn-block" type="submit">' + S.esc(tx('send_code', 'Send me a code')) + S.icon('arrowRight') + '</button>' +
        '</form>' +
        '<div class="demo-note" style="margin-top:1.25rem">' + S.icon('shield') + '<span>' +
          S.esc(st.idType === 'mobile' ? tx('mobile_demo', 'Demo mode — no SMS provider is connected; the code is shown on screen') : st.idType === 'license' ? S.Services.Identity.checkLicense('X').label || 'Demo mode — not checked against the NMC register' : S.Services.Identity.label) +
          '. ' + S.esc(tx('no_store', 'SMIVAI keeps only the last 4 digits.')) + '</span></div>';
    },

    otpStep: function () {
      return '<span class="chip chip-green">' + S.icon('check') + S.esc(tx('id_checked', 'ID checked')) + '</span>' +
        '<h1 class="t-h1" style="margin-top:.75rem">' + S.esc(tx('enter_code', 'Enter your code')) + '</h1>' +
        '<p class="lg-sub">' + S.esc(tx('code_sent', 'We sent a 6-digit code to the mobile number ending in {n}.', { n: st.mobileTail })) + '</p>' +
        (st.demoCode ? '<div class="otp-demo" role="note">' + S.icon('message') + '<span><b>' + S.esc(st.otpLabel || S.Services.Otp.label) + '.</b> ' +
          'Your code is <b class="otp-code">' + S.esc(st.demoCode) + '</b></span></div>' : '') +
        '<form class="stack stack-2" style="margin-top:1.25rem" data-form="otp" novalidate>' +
          '<div class="field"><label for="lg-otp">' + S.esc(tx('six_digit', '6-digit code')) + '</label>' +
            '<input class="input input-otp" id="lg-otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••">' +
            '<div class="err" id="lg-err" role="alert" hidden></div></div>' +
          '<button class="btn btn-xl btn-block" type="submit">' + S.esc(tx('verify_btn', 'Verify and continue')) + S.icon('arrowRight') + '</button>' +
        '</form>' +
        '<div class="row" style="margin-top:1rem;justify-content:space-between;flex-wrap:wrap">' +
          '<button class="link-btn" data-act="resend">' + S.icon('refresh') + S.esc(tx('resend', 'Send a new code')) + '</button>' +
          '<button class="link-btn" data-act="changeId">' + S.icon('edit') + S.esc(tx('change_id', 'Use a different number')) + '</button>' +
        '</div>';
    },

    profileStep: function () {
      var role = st.role;
      var groups = S.I18N.forPicker();
      var langOpts = '<optgroup label="North-East India">' + groups.ner.map(function (l) {
          return '<option value="' + l.code + '">' + S.esc(l.native + ' — ' + l.name) + '</option>';
        }).join('') + '</optgroup><optgroup label="Other">' + groups.other.map(function (l) {
          return '<option value="' + l.code + '"' + (l.code === 'en' ? ' selected' : '') + '>' + S.esc(l.native + ' — ' + l.name) + '</option>';
        }).join('') + '</optgroup>';
      return '<span class="chip chip-green">' + S.icon('check') + S.esc(tx('verified_demo', 'Format checked (demo mode)')) + '</span>' +
        '<h1 class="t-h1" style="margin-top:.75rem">' + S.esc(tx('about_you', 'Tell us a little about you')) + '</h1>' +
        '<p class="lg-sub">' + S.esc(tx('about_you_s', 'This helps SMIVAI greet you properly. You can change it later in Settings.')) + '</p>' +
        '<form class="form-grid" style="margin-top:1.25rem" data-form="profile" novalidate>' +
          '<div class="field full"><label for="pf-name">' + S.esc(tx('full_name', 'Full name')) + '</label><input class="input" id="pf-name" autocomplete="name" placeholder="' + (role === 'doctor' ? 'e.g. Dr. Rupam Bora' : 'e.g. Hemanta Baruah') + '"></div>' +
          (role === 'patient'
            ? '<div class="field"><label for="pf-age">' + S.esc(tx('age', 'Age')) + '</label><input class="input" id="pf-age" type="number" inputmode="numeric" min="40" max="115" placeholder="70"></div>' +
              '<div class="field"><label for="pf-gender">' + S.esc(tx('you_are', 'You are')) + '</label><select class="select" id="pf-gender"><option value="">Prefer not to say</option><option value="female">A woman</option><option value="male">A man</option></select></div>' +
              '<div class="field full"><label for="pf-lang">' + S.esc(S.t('language')) + '</label><select class="select" id="pf-lang">' + langOpts + '</select></div>' +
              '<div class="field full"><label for="pf-district">' + S.esc(tx('where_live', 'Where do you live? (town or district)')) + '</label><input class="input" id="pf-district" placeholder="e.g. Dibrugarh, Assam"></div>'
            : role === 'donor' ? ''
            : role === 'caregiver'
              ? '<div class="field full"><label for="pf-rel">' + S.esc(tx('you_care_as', 'You care for someone as their…')) + '</label><select class="select" id="pf-rel"><option>Son or daughter</option><option>Spouse or partner</option><option>Relative</option><option>Neighbour or friend</option><option>Professional caregiver</option></select></div>'
              : '<div class="field full"><label for="pf-spec">Speciality</label><input class="input" id="pf-spec" placeholder="e.g. General Physician"></div>') +
          '<div class="full"><label class="row" style="gap:.75rem;align-items:flex-start;cursor:pointer;margin:.25rem 0 .75rem">' +
            '<input type="checkbox" id="pf-consent" style="width:1.5rem;height:1.5rem;flex:none;margin-top:.1rem">' +
            '<span>' + S.esc(tx('consent_line', 'I agree that SMIVAI keeps my information to help me, and shares it only with the care team I choose.')) +
            ' <button type="button" class="btn-link" data-act="notice">' + S.esc(tx('read_notice', 'Read the privacy notice')) + '</button></span></label></div>' +
          '<div class="full"><div class="err" id="lg-err" role="alert" hidden></div>' +
          '<button class="btn btn-xl btn-block" type="submit" style="margin-top:.5rem">' + S.esc(tx('start_smivai', 'Start using SMIVAI')) + S.icon('arrowRight') + '</button></div>' +
        '</form>';
    },

    error: function (msg) {
      var el = S.qs('#lg-err');
      if (!el) { S.toast(msg, 'warn'); return; }
      el.textContent = msg; el.hidden = !msg;
      var input = S.qs('.lg-card input');
      if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    },

    busy: function (on, btn) {
      st.busy = on;
      var b = btn || S.qs('.lg-card [type=submit]');
      if (!b) return;
      if (on) { b.dataset.label = b.innerHTML; b.innerHTML = '<span class="spinner" style="border-top-color:#fff;border-color:rgba(255,255,255,.35)"></span>' + S.esc(tx('please_wait', 'Please wait…')); b.disabled = true; }
      else if (b.dataset.label) { b.innerHTML = b.dataset.label; b.disabled = false; }
    },

    handlers: function () {
      var self = this;
      var root = S.qs('#app');
      /* forms submit on Enter as well as the button */
      setTimeout(function () {
        S.qsa('form[data-form]', root).forEach(function (f) {
          f.addEventListener('submit', function (e) {
            e.preventDefault();
            var k = f.getAttribute('data-form');
            if (k === 'id') self.submitId(); else if (k === 'otp') self.submitOtp(); else self.submitProfile();
          });
        });
        var otp = S.qs('#lg-otp', root);
        if (otp) otp.addEventListener('input', function () { otp.value = otp.value.replace(/\D/g, '').slice(0, 6); if (otp.value.length === 6) self.submitOtp(); });
        var id = S.qs('#lg-id', root);
        if (id && st.idType !== 'license') id.addEventListener('input', function () {
          var d = id.value.replace(/\D/g, '');
          id.value = st.idType === 'aadhaar' ? d.slice(0, 12).replace(/(\d{4})(?=\d)/g, '$1 ') : d.slice(0, 14).replace(/^(\d{2})(\d{0,4})(\d{0,4})(\d{0,4}).*/, function (m, a, b, c, e) { return [a, b, c, e].filter(Boolean).join('-'); });
        });
      }, 0);
      return {
        notice: function () { S.Privacy.showNotice(); },
        home: function () { S.Router.go('#/'); },
        back: function () {
          if (st.step === 'otp') { st.step = 'id'; self.draw(); }
          else S.Router.go('#/');
        },
        idType: function (el, ev, arg) { st.idType = arg; self.draw(); },
        demo: function (el, ev, i) {
          var d = S.SeedV2.credentials().filter(function (c) { return c.role === st.role; })[+i];
          if (!d) return;
          if (st.idType !== d.idType) { st.idType = d.idType; self.draw(); }
          var input = S.qs('#lg-id');
          input.value = d.display;
          /* show which one was picked — the list stays open above */
          S.qsa('.demo-acct').forEach(function (b) {
            b.setAttribute('aria-pressed', b.getAttribute('data-arg') === String(i) ? 'true' : 'false');
          });
          input.focus();
        },
        resend: function () {
          S.Auth.resend(st.challengeId).then(function (r) {
            if (!r.ok) { self.error(r.error); return; }
            st.challengeId = r.challengeId; st.demoCode = r.demoCode; st.otpLabel = r.otpLabel || null;
            self.draw();
            S.toast(tx('new_code', 'A new code was sent.'), 'ok');
          });
        },
        changeId: function () { st.step = 'id'; self.draw(); }
      };
    },

    submitId: function () {
      if (st.busy) return;
      var self = this, raw = S.qs('#lg-id').value;
      if (!raw.trim()) { this.error(tx('need_id', 'Please enter your number first.')); return; }
      this.error(''); this.busy(true);
      S.Auth.begin(st.role, st.idType, raw).then(function (r) {
        self.busy(false);
        if (!r.ok) { self.error(r.error); return; }
        st.challengeId = r.challengeId; st.demoCode = r.demoCode; st.mobileTail = r.mobileTail; st.existing = r.existing;
        st.otpLabel = r.otpLabel || null;
        st.step = 'otp'; self.draw();
      });
    },

    submitOtp: function () {
      if (st.busy) return;
      var self = this, code = S.qs('#lg-otp').value;
      if (code.replace(/\D/g, '').length !== 6) { this.error(tx('need_6', 'The code has 6 digits.')); return; }
      this.error(''); this.busy(true);
      S.Auth.confirm(st.challengeId, code).then(function (r) {
        self.busy(false);
        if (!r.ok) {
          self.error(r.error);
          if (r.expired) { var b = S.qs('[data-act="resend"]'); if (b) b.classList.add('pulse'); }
          var i = S.qs('#lg-otp'); if (i) { i.value = ''; i.focus(); }
          return;
        }
        if (r.needsProfile) { st.ticket = r.ticket; st.step = 'profile'; self.draw(); return; }
        self.welcome(r.session);
      });
    },

    submitProfile: function () {
      if (st.busy) return;
      var v = function (id) { var el = S.qs('#' + id); return el ? el.value.trim() : ''; };
      var age = v('pf-age');
      if (st.role === 'patient' && age && (+age < 18 || +age > 120)) { this.error(tx('age_check', 'Please check your age.')); return; }
      var consent = S.qs('#pf-consent');
      if (!consent || !consent.checked) { this.error(tx('need_consent', 'Please read the privacy notice and tick the box to agree.')); return; }
      var self = this;
      Promise.resolve(S.Auth.createProfile(st.ticket, {
        name: v('pf-name'), age: age, gender: v('pf-gender'), language: v('pf-lang'), district: v('pf-district'),
        relation: v('pf-rel'), speciality: v('pf-spec'), consent: true, notice_version: S.PRIVACY_NOTICE_VERSION
      })).then(function (r) {
        if (!r.ok) { self.error(r.error); return; }
        self.welcome(r.session, true);
      });
    },

    welcome: function (sess, isNew) {
      S.State.fromSession(sess);
      var ent = S.Plans.entity(sess.role, sess.actor_id) || {};
      S.toast((isNew ? tx('welcome_new', 'Welcome to SMIVAI, {name}!', { name: String(ent.name || '').split(' ')[0] })
        : tx('welcome_back', 'Welcome back, {name}!', { name: String(ent.name || '').replace(/^Dr\.?\s+/i, '').split(' ')[0] })), 'ok');
      S.Router.go(S.Router.homeFor(sess.role));
    }
  };

  S.Login = Login;
})(window);
