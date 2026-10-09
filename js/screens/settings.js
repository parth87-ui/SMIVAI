/* ============================================================
   SMIVAI — screens/settings.js
   Settings for all three roles: reading comfort, language, voice,
   notifications, plan, account and data.

   Font size, contrast and motion apply to the whole app immediately
   (they are stored on the account, so they follow the person).
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;
  function tx(k, en, p) { return S.tx(k, en, p); }
  function esc(s) { return S.esc(s); }

  var FONTS = [
    { id: 'md', name: 'Standard', px: '16px' },
    { id: 'lg', name: 'Large', px: '18px' },
    { id: 'xl', name: 'Extra large', px: '20px' },
    { id: 'xxl', name: 'Largest', px: '22px' }
  ];

  var Settings = {
    render: function (role) {
      var sess = S.Auth.session();
      role = role || sess.role;
      var ent = S.Plans.entity(role, sess.actor_id) || {};
      var acct = S.Auth.account() || {};
      var prefs = S.Prefs.all();
      var plan = S.Plans.planOf(role, sess.actor_id);
      var isPatient = role === 'patient';
      var p = isPatient ? S.State.patient() : null;

      var html =
        '<div class="page page-narrow anim-in settings">' +
          '<section class="page-hero tone-blue">' +
            '<div class="grow"><h1>' + esc(tx('nav_settings', 'Settings')) + '</h1>' +
              '<p>' + esc(tx('settings_sub', 'Make SMIVAI comfortable for you.')) + '</p></div>' +
            '<div class="ph-art">' + S.Art.shieldHeart() + '</div>' +
          '</section>' +

          card('type', tx('font_size', 'Font Size'), tx('font_size_sub', 'Everything in SMIVAI gets bigger.'),
            '<div class="font-picker">' + FONTS.map(function (f) {
              return '<button class="font-opt" data-act="font" data-arg="' + f.id + '" aria-pressed="' + (prefs.font === f.id) + '">' +
                '<span class="fo-a" style="font-size:' + f.px + '">Aa</span><span class="fo-n">' + esc(tx('font_' + f.id, f.name)) + '</span></button>';
            }).join('') + '</div>') +

          (isPatient ? Settings.languageCard(p) : '') +

          card('volume', tx('voice_sound', 'Voice & sound'), tx('voice_sub', 'How HUN speaks to you.'),
            row(tx('read_aloud_auto', 'Read answers aloud automatically'), 'voice_autoplay', prefs.voice_autoplay) +
            (isPatient ? Settings.fallbackRow(p, prefs) : '') +
            '<div class="t-small muted" style="margin-top:.75rem">' + S.icon('info') + ' ' + esc(isPatient ? S.Voice.status(p.language).note : (S.Voice.available() ? 'Speech is available on this device.' : 'This device cannot play speech.')) + '</div>') +

          card('bell', tx('notifications', 'Notifications'), tx('notif_sub', 'What SMIVAI tells you about.'),
            row(tx('n_reminders', 'Reminders when they are due'), 'notif_reminders', prefs.notif_reminders) +
            row(isPatient ? tx('n_caregiver', 'Messages from my care team') : tx('n_patient', 'Updates about the people I support'), 'notif_caregiver', prefs.notif_caregiver) +
            row(tx('n_appointments', 'Appointments'), 'notif_appointments', prefs.notif_appointments) +
            row(tx('n_system', 'Also show notifications outside SMIVAI'), 'notif_system', prefs.notif_system)) +

          card('eye', tx('accessibility', 'Accessibility'), tx('access_sub', 'Extra comfort options.'),
            row(tx('high_contrast', 'Stronger contrast'), 'contrast', prefs.contrast === 'high') +
            row(tx('reduce_motion', 'Reduce movement and animation'), 'motion', prefs.motion === 'reduce') +
            (isPatient ? row(tx('show_weather', 'Show the weather on my home screen'), 'show_weather', prefs.show_weather) : '')) +

          (!S.M.hasPlans(role) ? '' : card('sparkle', tx('your_plan_t', 'Your plan'), tx('plan_sub', 'What is included for you.'),
            '<div class="set-row"><div><span class="plan-badge ' + plan + '">' + (plan === 'premium' ? S.icon('sparkle') + 'Premium' : 'Free') + '</span>' +
              '<div class="t-small muted" style="margin-top:.5rem">' + esc(S.Plans.features(role, plan).perks.slice(0, 3).join(' · ')) + '</div></div>' +
              '<button class="btn ' + (plan === 'premium' ? 'btn-outline' : 'btn-premium') + '" data-act="premium">' + S.icon('sparkle') + esc(plan === 'premium' ? tx('manage_plan', 'Manage plan') : tx('see_premium', 'See Premium')) + '</button></div>')) +

          card('user', tx('account', 'Account'), tx('account_sub', 'Who you are on SMIVAI.'),
            '<div class="set-row"><div><b>' + esc(ent.name || acct.name) + '</b>' +
              '<div class="t-small muted">' + esc(S.M.roleName(role)) + (isPatient && p.age ? ' · ' + p.age + ' ' + tx('years', 'years') : '') + (isPatient && p.district ? ' · ' + p.district : '') + '</div>' +
              '<div class="t-small muted">' + esc(tx('verified_with', 'Verified with {t} ending {n}', { t: (acct.id_type || '').toUpperCase(), n: acct.id_last4 || '—' })) + ' · ' + esc(tx('demo_mode', 'demo mode')) + '</div></div>' +
              (isPatient ? '<button class="btn btn-outline" data-act="editProfile">' + S.icon('edit') + esc(tx('edit', 'Edit')) + '</button>' : '') + '</div>' +
            (isPatient ? '<div class="set-row"><div><div class="t-mini">' + esc(tx('your_code', 'Your care code')) + '</div>' +
              '<b class="share-code sm">' + esc(p.share_code || '') + '</b></div>' +
              '<button class="btn btn-outline" data-act="copyCode">' + S.icon('copy') + esc(tx('copy_code', 'Copy code')) + '</button></div>' : '') +
            linkedList(role, sess)) +

          card('shield', tx('data_storage', 'Data & storage'), tx('data_sub', 'Where your information lives.'),
            '<div class="sync-row"><span>' + esc(tx('on_device', 'On this device')) + '</span><b>' + esc(S.DB.adapter.name) + '</b></div>' +
            '<div class="sync-row"><span>' + esc(tx('photos', 'Photos')) + '</span><b>' + esc(S.Media.persistent ? 'IndexedDB' : tx('session_only', 'this session only')) + '</b></div>' +
            '<div class="sync-row"><span>' + esc(tx('sync_transport', 'Sync')) + '</span><b>' + esc(S.Sync.status().adapter + (S.Sync.status().simulated ? ' (simulated)' : '')) + '</b></div>' +
            '<div class="sync-row"><span>' + esc(tx('waiting_to_sync', 'Waiting to sync')) + '</span><b>' + S.Sync.pendingCount() + '</b></div>' +
            '<div class="row" style="flex-wrap:wrap;margin-top:1rem"><button class="btn btn-outline btn-sm" data-act="sync">' + S.icon('refresh') + esc(tx('sync_now', 'Sync now')) + '</button>' +
            '<button class="btn btn-outline btn-sm" data-act="export">' + S.icon('upload') + esc(tx('export_data', 'Export my data')) + '</button>' +
            '<button class="btn btn-danger btn-sm" data-act="erase">' + S.icon('trash') + esc(tx('erase_account', 'Delete my account')) + '</button></div>' +
            '<p class="t-small muted" style="margin-top:.5rem">' + esc(tx('export_scope', 'The export holds only your own records — not anyone else who uses this device.')) + '</p>') +

          '<button class="btn btn-outline btn-xl btn-block" style="margin-top:1.5rem" data-act="logout">' + S.icon('logout') + esc(tx('sign_out', 'Sign out')) + '</button>' +
          '<div class="disclaimer">' + S.icon('info') + '<span>' + esc(tx('settings_disc', 'SMIVAI stores data on this device. Encryption of local data is planned for the mobile build and is not implemented here.')) + '</span></div>' +
        '</div>';

      S.mount(S.qs('#app'), html, {
        font: function (el, ev, id) { S.Prefs.set('font', id); Settings.render(role); S.toast(tx('font_changed', 'Text size updated.'), 'ok'); },
        toggle: function (el, ev, key) {
          var on = el.querySelector('input').checked;
          if (key === 'contrast') S.Prefs.set('contrast', on ? 'high' : 'normal');
          else if (key === 'motion') S.Prefs.set('motion', on ? 'reduce' : 'auto');
          else if (key === 'notif_system' && on) {
            if (global.Notification && global.Notification.permission === 'granted') S.Prefs.set(key, true);
            else if (global.Notification) global.Notification.requestPermission().then(function (perm) {
              S.Prefs.set('notif_system', perm === 'granted');
              if (perm !== 'granted') { S.toast(tx('notif_denied', 'Your browser did not allow notifications.'), 'warn'); Settings.render(role); }
            });
            else S.toast(tx('notif_unsupported', 'This device cannot show notifications outside SMIVAI.'), 'warn');
          } else S.Prefs.set(key, on);
        },
        lang: function () { S.Patient.languagePicker(); },
        voiceFallback: function (el) {
          S.Prefs.set('voice_fallback', el.value);
          Settings.render(role);
          if (el.value !== 'off') {
            var name = S.I18N.lang(el.value).name;
            S.toast(tx('fallback_set', 'HUN will read aloud in {lang} when your language has no voice.', { lang: name }), 'ok', 5000);
            S.Voice.speak(S.t('hello', null, el.value) || 'Hello', el.value);
          }
        },
        testLang: function () { S.LanguageConsole.test(p.language); },
        fillGaps: function () { S.LanguageConsole.pretranslate(p.language, function () { Settings.render(role); }); },
        exportLang: function () { S.LanguageConsole.exportSheet(p.language); },
        connectLang: function () { Settings.languageService(role); },
        premium: function () { S.Premium.open(); },
        editProfile: function () { Settings.profileForm(p, role); },
        copyCode: function () {
          if (global.navigator.clipboard) global.navigator.clipboard.writeText(p.share_code);
          S.toast(tx('code_copied', 'Care code copied.') + ' ' + p.share_code, 'ok', 5000);
        },
        unlink: function (el, ev, id) {
          var l = S.DB.find('links', id);
          var who = l.actor_role === 'caregiver' ? S.DB.find('caregivers', l.actor_id) : l.actor_role === 'doctor' ? S.DB.find('doctors', l.actor_id) : S.DB.find('patients', l.patient_id);
          S.Modal.confirm({ title: tx('remove_access_q', 'Remove access?'), message: tx('remove_access_msg', '{n} will no longer see this information.', { n: (who || {}).name || 'They' }), okText: tx('remove', 'Remove'), danger: true })
            .then(function (ok) { if (!ok) return; S.Links.remove(id); S.toast(tx('removed', 'Removed.'), 'ok'); Settings.render(role); });
        },
        sync: function () { S.Sync.flush().then(function () { Settings.render(role); }); },
        export: function () {
          /* Only the signed-in person's records — the device may hold others'. */
          var sess = S.Auth.session();
          if (!sess) return;
          var blob = new Blob([JSON.stringify(S.Privacy.exportFor(sess), null, 2)], { type: 'application/json' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'smivai-my-data-' + S.todayISO() + '.json';
          a.click();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
          S.toast(tx('exported', 'Your data was downloaded.'), 'ok');
        },
        erase: function () {
          var sess = S.Auth.session();
          if (!sess) return;
          var what = sess.role === 'patient'
            ? tx('erase_what_p', 'Your account, reminders, memories and photos, games and progress, appointments, orders, notes and health readings will be deleted, and your care team will lose access.')
            : tx('erase_what_c', 'Your account and your links to the people you support will be deleted. Their own records stay with them.');
          S.Modal.confirm({
            title: tx('erase_q', 'Delete your account?'),
            message: what + ' ' + tx('erase_final', 'This cannot be undone. You may want to export your data first.'),
            okText: tx('erase_ok', 'Delete everything'), cancelText: tx('keep_account', 'Keep my account'), danger: true
          }).then(function (ok) {
            if (!ok) return;
            S.Privacy.erase(sess).then(function (res) {
              if (!res.ok) { S.toast(res.error, 'warn', 6000); return; }
              S.toast(tx('erased', 'Your account was deleted.'), 'ok', 5000);
              S.Router.go('#/');
            });
          });
        },
        logout: function () { S.Shell.confirmLogout(); }
      });
      S.scrollTop();

      function card(ico, title, sub, inner) {
        return '<section class="card set-card"><div class="set-head"><span class="list-icon blue">' + S.icon(ico) + '</span>' +
          '<div><h2 class="card-title">' + esc(title) + '</h2><p class="t-small muted">' + esc(sub) + '</p></div></div>' + inner + '</section>';
      }
      function row(label, key, on) {
        return '<div class="set-row"><span>' + esc(label) + '</span>' +
          '<label class="toggle" data-act="toggle" data-arg="' + key + '" data-on="change"><input type="checkbox"' + (on ? ' checked' : '') + '><span class="track"></span></label></div>';
      }
      function linkedList(role2, sess2) {
        var rows = [];
        if (role2 === 'patient') {
          S.Links.forPatient(sess2.actor_id).forEach(function (l) {
            var who = l.actor_role === 'caregiver' ? S.DB.find('caregivers', l.actor_id) : S.DB.find('doctors', l.actor_id);
            if (who) rows.push({ id: l.link_id, name: who.name, role: l.actor_role });
          });
        } else {
          S.Links.forActor(role2, sess2.actor_id).forEach(function (l) {
            var pt = S.DB.find('patients', l.patient_id);
            if (pt) rows.push({ id: l.link_id, name: pt.name, role: 'patient' });
          });
        }
        if (!rows.length) return '<p class="t-small muted" style="margin-top:.75rem">' + esc(tx('nobody_linked', 'Nobody is linked to your account yet.')) + '</p>';
        return '<div class="t-mini" style="margin-top:1rem">' + esc(role2 === 'patient' ? tx('who_can_see', 'Who can see my information') : tx('people_linked', 'People linked to me')) + '</div>' +
          '<div class="list">' + rows.map(function (r) {
            return '<div class="list-item"><span class="list-icon ' + (r.role === 'doctor' ? 'blue' : r.role === 'caregiver' ? 'peach' : 'green') + '">' + S.icon(r.role === 'doctor' ? 'stethoscope' : 'user') + '</span>' +
              '<div class="grow"><b>' + esc(r.name) + '</b><div class="t-small muted">' + esc(S.titleCase(r.role)) + '</div></div>' +
              '<button class="btn btn-sm btn-danger" data-act="unlink" data-arg="' + esc(r.id) + '">' + esc(tx('remove', 'Remove')) + '</button></div>';
          }).join('') + '</div>';
      }
    },

    /** What the patient's language can actually do on this device, and
        every control needed to improve it — so "connect a pipeline in
        Settings" points somewhere real. */
    languageCard: function (p) {
      var lang = S.I18N.lang(p.language);
      var caps = S.LangService.capabilities(p.language);
      var cov = S.I18N.coverage(p.language);
      var voice = S.Voice.status(p.language);
      var connected = caps.cloudProviders.length > 0;

      var state = function (label, ok, detail) {
        return '<div class="set-row"><div><b>' + esc(label) + '</b>' +
          '<div class="t-small muted">' + esc(detail) + '</div></div>' +
          '<span class="chip ' + (ok === true ? 'chip-green' : ok === 'partial' ? 'chip-amber' : 'chip-coral') + '">' +
          S.icon(ok === true ? 'check' : ok === 'partial' ? 'info' : 'x') +
          esc(ok === true ? tx('cap_on', 'Working') : ok === 'partial' ? tx('cap_partial', 'Partly') : tx('cap_off', 'Not available')) +
          '</span></div>';
      };

      return '<section class="card set-card"><div class="set-head"><span class="list-icon blue">' + S.icon('globe') + '</span>' +
          '<div><h2 class="card-title">' + esc(tx('lang_voice', 'Language & voice')) + '</h2>' +
          '<p class="t-small muted">' + esc(tx('lang_sub', 'The language you read and hear.')) + '</p></div></div>' +

        '<div class="set-row"><div><b style="font-size:1.25rem">' + esc(lang.native) + '</b>' +
          '<div class="t-small muted">' + esc(lang.name) + '</div></div>' +
          '<button class="btn btn-outline" data-act="lang">' + S.icon('globe') + esc(S.t('change_language')) + '</button></div>' +

        state(tx('interface_text', 'Interface text'),
          cov.percent >= 90 ? true : cov.percent >= 40 ? 'partial' : false,
          tx('cov_detail', '{p}% of the app is written in {lang}; the rest is shown in English.', { p: cov.percent, lang: lang.native })) +

        state(tx('spoken_voice', 'Spoken voice'),
          voice.canSpeak ? (voice.source === 'stand-in' ? 'partial' : true) : false,
          voice.canSpeak ? voice.note
            : tx('no_voice_here', 'This device has no {lang} voice, so HUN shows the words instead of reading them.', { lang: lang.native }) +
              ' ' + tx('connect_below', 'Connecting a language service below adds a real voice.')) +

        state(tx('speech_input', 'Speech recognition'),
          caps.asr === 'available' ? true : caps.asr === 'device-only' ? 'partial' : false,
          caps.asr === 'available' ? tx('asr_on', 'You can speak to HUN in {lang}.', { lang: lang.native })
            : caps.asr === 'device-only' ? tx('asr_device', 'This browser can hear {lang}. Accuracy varies.', { lang: lang.native })
            : tx('asr_off', 'HUN cannot hear {lang} on this device yet — you can type instead.', { lang: lang.native })) +

        '<div class="row" style="flex-wrap:wrap;margin-top:1rem">' +
          '<button class="btn ' + (connected ? 'btn-outline' : '') + '" data-act="connectLang">' + S.icon('link') +
            esc(connected ? tx('lang_change_conn', 'Change connection') : tx('lang_connect', 'Connect a language service')) + '</button>' +
          (connected ? '<button class="btn btn-outline" data-act="testLang">' + S.icon('refresh') + esc(tx('test_conn', 'Test it')) + '</button>' +
            '<button class="btn btn-outline" data-act="fillGaps">' + S.icon('sparkle') + esc(tx('fill_gaps', 'Fill the missing words')) + '</button>' : '') +
          '<button class="btn btn-ghost btn-sm" data-act="exportLang">' + S.icon('upload') + esc(tx('export_review', 'Export for review')) + '</button>' +
        '</div>' +

        '<div class="demo-note" style="margin-top:1rem">' + S.icon('info') + '<span>' +
          esc(tx('lang_honest', 'Every non-English line in SMIVAI is an AI-drafted seed awaiting a native speaker, and anything not yet translated is shown in English rather than guessed. Connecting Bhashini or AI4Bharat fills the gaps and adds a real voice.')) +
        '</span></div>' +
      '</section>';
    },

    /** Choose a stand-in voice — only offered, never assumed. */
    fallbackRow: function (p, prefs) {
      var installed = S.Voice.installedLanguages().filter(function (l) { return l.code !== p.language; });
      var lang = S.I18N.lang(p.language);
      if (S.Voice.voiceFor(p.language) || S.LangService.hasCloud(p.language)) return '';
      if (!installed.length) {
        return '<div class="set-row"><span class="t-small muted">' + S.icon('info') + ' ' +
          esc(tx('no_voices_at_all', 'This device has no speech voices installed at all, so HUN shows the words instead.')) + '</span></div>';
      }
      return '<div class="set-row"><div><b>' + esc(tx('read_fallback', 'If your language has no voice')) + '</b>' +
        '<div class="t-small muted">' + esc(tx('no_voice_here', 'This device has no {lang} voice, so HUN shows the words instead of reading them.', { lang: lang.native })) + '</div></div>' +
        '<select class="select" style="max-width:16rem" data-act="voiceFallback" data-on="change">' +
          '<option value="off"' + (prefs.voice_fallback === 'off' ? ' selected' : '') + '>' + esc(tx('dont_read', 'Show the text only')) + '</option>' +
          installed.map(function (l) {
            return '<option value="' + l.code + '"' + (prefs.voice_fallback === l.code ? ' selected' : '') + '>' +
              esc(tx('read_in', 'Read aloud in {lang}', { lang: l.name })) + '</option>';
          }).join('') +
        '</select></div>';
    },

    /** Bhashini / AI4Bharat credentials, the same fields the caregiver
        console offers — so the patient's own Settings can fix it too. */
    languageService: function (role) {
      var creds = S.LangService.creds();
      S.Modal.open({
        title: tx('lang_connect', 'Connect a language service'),
        subtitle: tx('lang_connect_sub', 'Bhashini (MeitY / ULCA) or a self-hosted AI4Bharat deployment gives SMIVAI translation, a real voice and speech recognition in India’s scheduled languages.'),
        body:
          '<div class="form-grid">' +
            '<div class="field"><label for="ls-user">Bhashini user ID</label>' +
              '<input class="input" id="ls-user" value="' + esc(creds.userId) + '" placeholder="ULCA userID"></div>' +
            '<div class="field"><label for="ls-key">Bhashini ULCA API key</label>' +
              '<input class="input" id="ls-key" type="password" value="' + esc(creds.ulcaApiKey) + '" placeholder="ulcaApiKey"></div>' +
            '<div class="field"><label for="ls-pipe">Pipeline ID</label>' +
              '<input class="input" id="ls-pipe" value="' + esc(creds.bhashiniPipelineId) + '"></div>' +
            '<div class="field"><label for="ls-gender">' + esc(tx('voice_kind', 'Voice')) + '</label>' +
              '<select class="select" id="ls-gender">' +
                '<option value="female"' + (creds.ttsGender === 'female' ? ' selected' : '') + '>' + esc(tx('voice_female', 'Female')) + '</option>' +
                '<option value="male"' + (creds.ttsGender === 'male' ? ' selected' : '') + '>' + esc(tx('voice_male', 'Male')) + '</option>' +
              '</select></div>' +
            '<div class="field full"><label for="ls-ai4b">AI4Bharat endpoint (optional)</label>' +
              '<input class="input" id="ls-ai4b" value="' + esc(creds.ai4bharatBase) + '" placeholder="https://your-host/ai4bharat"></div>' +
          '</div>' +
          '<div class="demo-note" style="margin-top:1rem">' + S.icon('shield') + '<span>' +
            esc(tx('creds_note', 'In a real deployment these credentials live on the SMIVAI server and never reach the device. These fields exist so the pipeline can be switched on without a backend running.')) +
          '</span></div>',
        footer: '<button class="btn btn-outline" data-modal-close>' + esc(S.t('cancel')) + '</button>' +
          '<button class="btn" data-act="save">' + S.icon('check') + esc(tx('save', 'Save')) + '</button>',
        handlers: {
          save: function (el) {
            var root = el.closest('.modal');
            S.LangService.setCreds({
              userId: S.qs('#ls-user', root).value.trim(),
              ulcaApiKey: S.qs('#ls-key', root).value.trim(),
              bhashiniPipelineId: S.qs('#ls-pipe', root).value.trim(),
              ttsGender: S.qs('#ls-gender', root).value,
              ai4bharatBase: S.qs('#ls-ai4b', root).value.trim()
            });
            S.Modal.close();
            S.toast(tx('conn_saved', 'Saved. Use “Test it” to check the connection.'), 'ok', 5000);
            Settings.render(role);
          }
        }
      });
    },

    profileForm: function (p, role) {
      S.Modal.open({
        title: tx('edit_profile', 'Edit your details'),
        body: '<div class="form-grid">' +
            '<div class="field full"><label for="sp-name">' + esc(tx('full_name', 'Full name')) + '</label><input class="input" id="sp-name" value="' + esc(p.name) + '"></div>' +
            '<div class="field"><label for="sp-age">' + esc(tx('age', 'Age')) + '</label><input class="input" id="sp-age" type="number" min="18" max="120" value="' + esc(p.age || '') + '"></div>' +
            '<div class="field"><label for="sp-gender">' + esc(tx('you_are', 'You are')) + '</label><select class="select" id="sp-gender">' +
              ['', 'female', 'male'].map(function (g) { return '<option value="' + g + '"' + (p.gender === g ? ' selected' : '') + '>' + (g === '' ? 'Prefer not to say' : g === 'female' ? 'A woman' : 'A man') + '</option>'; }).join('') + '</select></div>' +
            '<div class="field full"><label for="sp-district">' + esc(tx('where_live', 'Where do you live? (town or district)')) + '</label><input class="input" id="sp-district" value="' + esc(p.district || '') + '"></div>' +
          '</div><div class="err" id="sp-err" role="alert" hidden></div>',
        footer: '<button class="btn btn-outline" data-modal-close>' + esc(S.t('cancel')) + '</button><button class="btn" data-act="save">' + S.icon('check') + esc(tx('save', 'Save')) + '</button>',
        handlers: {
          save: function () {
            var name = S.qs('#sp-name').value.trim();
            var err = S.qs('#sp-err');
            if (name.length < 2) { err.textContent = tx('need_name', 'Please enter your name.'); err.hidden = false; return; }
            var age = parseInt(S.qs('#sp-age').value, 10);
            if (S.qs('#sp-age').value && (age < 18 || age > 120)) { err.textContent = tx('age_check', 'Please check your age.'); err.hidden = false; return; }
            S.DB.update('patients', p.patient_id, { name: name, age: age || null, gender: S.qs('#sp-gender').value, district: S.qs('#sp-district').value.trim() });
            S.DB.update('accounts', S.Auth.session().account_id, { name: name }, { silent: true });
            S.Modal.close();
            S.toast(tx('profile_saved', 'Your details were saved.'), 'ok');
            Settings.render(role);
          }
        }
      });
    }
  };

  S.Settings = Settings;
})(window);
