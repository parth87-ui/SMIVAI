/* ============================================================
   SMIVAI — screens/landing.js
   Welcome: who SMIVAI is for, and the three ways in.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;
  function tx(k, en, p) { return S.tx(k, en, p); }

  var Landing = {

    render: function () {
      document.body.classList.remove('role-patient');
      var html =
        '<div class="welcome">' +
          decor() +
          '<header class="wl-top">' +
            '<div class="wl-brand">' + S.Shell.logoMark(52) +
              '<div><div class="logo-word">SMIVAI</div><div class="logo-tag">' + S.esc(tx('tagline', 'Care Closer to You')) + '</div></div></div>' +
            '<div class="wl-top-actions">' + S.UI.readingControls() +
              '<button class="btn btn-ghost" data-act="about">' + S.icon('info') + 'About</button></div>' +
          '</header>' +

          '<section class="wl-hero">' +
            '<div class="wl-copy anim-in">' +
              '<span class="chip chip-lav chip-lg">' + S.icon('sparkle') + S.esc(tx('wl_kicker', 'Healthcare that feels human')) + '</span>' +
              '<h1 class="t-display">' + S.esc(tx('wl_title', 'Simple, caring support — every day.')) + '</h1>' +
              '<p class="wl-lead">' + S.esc(tx('wl_lead', 'SMIVAI talks with you, keeps your mind active, remembers what matters, and keeps your family and doctor close.')) + '</p>' +
              '<div class="wl-points">' +
                point('talk', 'blue', tx('wl_p1', 'Talk with HUN')) +
                point('brain', 'lav', tx('wl_p2', 'Brain games')) +
                point('heart', 'peach', tx('wl_p3', 'Photo memories')) +
                point('bell', 'green', tx('wl_p4', 'Gentle reminders')) +
              '</div>' +
            '</div>' +
            '<div class="wl-art anim-in-2">' +
              '<div class="wl-frame">' + S.Art.neCouple() + '</div>' +
              '<span class="wl-chip c1" aria-hidden="true"><span class="wc-ico tone-peach">' + S.icon('smile') + '</span></span>' +
              '<span class="wl-chip c2" aria-hidden="true"><span class="wc-ico tone-rose">' + S.icon('heart') + '</span></span>' +
              '<span class="wl-chip c3" aria-hidden="true"><span class="wc-ico">' + S.icon('talk') + '</span>' +
                '<span class="wc-msg"><b>' + S.esc(tx('wl_chip_hi', 'Hello! I\u2019m HUN')) + '</b>' +
                '<small>' + S.esc(tx('wl_chip_help', 'How can I help?')) + '</small></span></span>' +
              '<span class="wl-chip c4" aria-hidden="true"><span class="wc-leaf">' + S.Art.plant() + '</span></span>' +
            '</div>' +
          '</section>' +

          '<section class="wl-roles anim-in-3" aria-labelledby="wl-who">' +
            '<h2 id="wl-who" class="t-h2">' + S.esc(tx('wl_who2', 'Who are you using SMIVAI as?')) + '</h2>' +
            '<p class="wl-roles-sub">' + S.esc(tx('wl_who_sub', 'Different roles, a common purpose — a happier, healthier tomorrow.')) + '</p>' +
            '<span class="wl-rule" aria-hidden="true"></span>' +
            '<div class="role-grid">' +
              roleCard('patient', 'lav', 'user', S.Art.hero({ gender: 'male', patient_id: 'demo-a', district: 'Jorhat' }),
                tx('role_patient', 'I am a Patient'),
                tx('role_patient_sub2', 'Learn, play, keep memories alive, set reminders and have a friendly voice by your side.')) +
              roleCard('caregiver', 'peach', 'users', S.Art.caregiver(),
                tx('role_caregiver', 'I am a Caregiver'),
                tx('role_caregiver_sub2', 'Support your loved one, from near or far.')) +
              roleCard('doctor', 'blue', 'stethoscope', S.Art.doctor(),
                tx('role_doctor', 'I am a Doctor'),
                tx('role_doctor_sub2', 'See your patients’ activity, progress and well-being.')) +
            '</div>' +
            '<div class="row" style="flex-wrap:wrap;justify-content:center;margin-top:1rem">' +
              '<button class="btn btn-ghost btn-sm" data-act="role" data-arg="donor">' + S.icon('heart') + S.esc(tx('role_donor', 'I want to donate')) + '</button>' +
              '<button class="btn btn-ghost btn-sm" data-act="role" data-arg="staff">' + S.icon('shield') + S.esc(tx('role_staff', 'Charity staff sign-in')) + '</button>' +
            '</div>' +
          '</section>' +

          '<footer class="wl-foot">' +
            '<div class="demo-note">' + S.icon('info') + '<span><b>Demo mode.</b> Identity checks, OTP, payments and emergency alerts are demonstrations — ' +
              'SMIVAI is not connected to UIDAI, ABDM, the NMC, an SMS gateway or emergency services. All people shown are fictional.</span></div>' +
            '<div class="row" style="flex-wrap:wrap;justify-content:center">' +
              '<button class="btn btn-ghost btn-sm" data-act="reset">' + S.icon('refresh') + 'Reset demo data</button>' +
            '</div>' +
            S.UI.disclaimer() +
          '</footer>' +
        '</div>';

      S.mount(S.qs('#app'), html, Object.assign(S.UI.readingHandlers(), {
        role: function (el) { S.Router.go('#/login/' + el.getAttribute('data-arg')); },
        about: function () { Landing.about(); },
        reset: function () {
          S.Modal.confirm({
            title: 'Reset demo data?',
            message: 'This restores the demo people and their fictional history, and signs everyone out on this device. Anything created during this demo will be removed.',
            okText: 'Reset', danger: true
          }).then(function (ok) {
            if (!ok) return;
            S.Auth.logout();
            S.Seed.reset();
            S.SeedV2.run().then(function () {
              S.toast('Demo data restored.', 'ok');
              S.Router.go('#/');
            });
          });
        }
      }));
      S.UI.syncReading(S.qs('#app'));
      Landing.usePhoto();
      Landing.useRoleScenes();
      S.scrollTop();
    },

    /* If a real photograph has been placed in assets/ it replaces the drawn
       welcome scene. Nothing is fetched from the internet: the file either
       sits in the app folder or it does not, and the drawing stays until it
       has actually loaded, so a missing or broken file changes nothing.
       See docs/ASSETS.md for the file name and what it should show. */
    PHOTO: 'assets/welcome.jpg',

    /* An illustration placed in assets/ fills a role card's panel edge to
       edge, in place of the drawn figure. Only the ones listed here are
       looked for, so no card asks for a file that was never made. */
    SCENES: {
      patient: 'assets/role-patient.jpg',
      caregiver: 'assets/role-caregiver.jpg',
      doctor: 'assets/role-doctor.jpg'
    },

    useRoleScenes: function () {
      Object.keys(Landing.SCENES).forEach(function (role) {
        var host = S.qs('.role-card[data-arg="' + role + '"] .rc-scene');
        if (!host) return;
        S.Photo.load([Landing.SCENES[role]], function (file) {
          if (!document.body.contains(host)) return;
          host.innerHTML = '<img src="' + S.esc(file) + '" alt="">';
          host.classList.add('has-photo');
        });
      });
    },

    usePhoto: function () {
      S.Photo.into(S.qs('.wl-frame'), {
        file: Landing.PHOTO,
        ratio: '5x3',
        alt: tx('wl_photo_alt', 'An older couple in a hill village looking at SMIVAI together on a tablet'),
        title: tx('wl_cap_title', 'Care that feels human.'),
        sub: tx('wl_cap_sub', 'Warm, simple, and built around everyday life.')
      });
    },

    about: function () {
      var st = S.Sync.status();
      S.Modal.open({
        title: 'About SMIVAI',
        subtitle: 'Care Closer to You',
        body:
          '<div class="stack-2">' +
            '<p class="t-body">SMIVAI is a companion for older adults: conversation, brain games, photo memories, reminders and a simple view of progress — ' +
              'with caregivers and doctors kept close through one shared, permission-based record.</p>' +
            '<div class="card card-tint card-flat">' +
              '<div class="card-title" style="margin-bottom:8px">How it works</div>' +
              '<ul style="margin:0;padding-left:20px;line-height:1.8" class="t-small">' +
                '<li><b>Adaptive difficulty</b> — a Rasch / Item-Response-Theory ability estimate per game chooses the next level.</li>' +
                '<li><b>Offline-first</b> — every action is saved on the device first and synced when there is a connection.</li>' +
                '<li><b>Care links</b> — caregivers and doctors see a patient only after the patient shares their care code.</li>' +
                '<li><b>Free & Premium</b> — plan limits are enforced by the app and the API, not just hidden buttons.</li>' +
              '</ul>' +
            '</div>' +
            '<div class="card card-flat">' +
              '<div class="sync-row"><span>Local storage</span><b>' + S.esc(S.DB.adapter.name) + '</b></div>' +
              '<div class="sync-row"><span>Sync transport</span><b>' + S.esc(st.adapter) + (st.simulated ? ' (simulated)' : '') + '</b></div>' +
              '<div class="sync-row"><span>Photo storage</span><b>' + (S.Media.persistent ? 'IndexedDB (on this device)' : 'this session only') + '</b></div>' +
              '<div class="sync-row"><span>Speech output</span><b>' + (S.Voice.available() ? 'Web Speech API' : 'not available on this device') + '</b></div>' +
              '<div class="sync-row"><span>Advanced AI</span><b>' + (S.Services.AI.available() ? 'via SMIVAI server' : 'not connected (basic on-device companion)') + '</b></div>' +
            '</div>' +
            '<p class="t-small muted">Encryption of local data is part of the intended mobile architecture and is <b>not</b> implemented in this web version.</p>' +
            S.UI.disclaimer() +
          '</div>',
        footer: '<button class="btn" data-modal-close>Close</button>'
      });
    }
  };

  /**
   * The soft layer behind the welcome screen: ambient colour blooms and a
   * scatter of the app's own 3D objects, each one standing for something
   * SMIVAI actually does. Decorative only — hidden from screen readers,
   * never over text, and still on a phone (no animation there).
   */
  function decor() {
    var stickers = [
      ['water', 'd1'],        // hydration reminders
      ['puzzle', 'd2'],       // brain games
      ['calendar', 'd3'],     // appointments
      ['photos', 'd4'],       // memories
      ['medicine', 'd5'],     // medicines
      ['plant', 'd6'],        // wellness
      ['bulb', 'd7'],         // daily fact
      ['stethoscope', 'd8'],  // doctors
      ['cards', 'd9'],        // memory pairs
      ['orb', 'd10']          // talking with HUN
    ];
    return '<div class="wl-decor" aria-hidden="true">' +
      '<span class="wl-bloom b1"></span><span class="wl-bloom b2"></span><span class="wl-bloom b3"></span>' +
      '<span class="ad-pattern"></span>' +
      stickers.map(function (s2) {
        return '<span class="wl-sticker ' + s2[1] + '">' + S.Art[s2[0]]() + '</span>';
      }).join('') +
      '</div>';
  }

  function point(ico, tone, text) {
    return '<span class="wl-point"><span class="list-icon ' + tone + '">' + S.icon(ico) + '</span>' + S.esc(text) + '</span>';
  }

  function roleCard(id, tone, ico, art, name, desc) {
    return '<button class="role-card tone-' + tone + '" data-act="role" data-arg="' + id + '">' +
      '<span class="rc-scene">' + art + '</span>' +
      '<span class="rc-badge">' + S.icon(ico) + '</span>' +
      '<span class="rc-name">' + S.esc(name) + '</span>' +
      '<span class="rc-desc">' + S.esc(desc) + '</span>' +
      '<span class="rc-cta">' + S.esc(S.tx('continue_btn', 'Continue')) + S.icon('arrowRight') + '</span>' +
      '</button>';
  }

  S.Landing = Landing;
})(window);
