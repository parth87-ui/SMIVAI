/* ============================================================
   SMIVAI — screens/language_console.js
   The caregiver's Language tab.

   Three jobs:
     1. choose the language this patient reads and hears
     2. report honestly what actually works in that language
     3. connect Bhashini / AI4Bharat and manage the translation review

   Attaches onto S.Caregiver so the tab lives beside the others.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  function stateCell(v) {
    var map = {
      'available':      ['available', 'Available'],
      'device-voice':   ['partial', 'Device voice only'],
      'device-only':    ['partial', 'Device only'],
      'not-configured': ['none', 'Not configured'],
      'unavailable':    ['unavailable', 'No model exists']
    };
    var m = map[v] || ['none', v];
    return '<span class="cap-state ' + m[0] + '"><i></i>' + m[1] + '</span>';
  }

  function langButton(l, current) {
    var c = S.LangService.capabilities(l.code);
    return '<button class="lang-card" data-act="setLang" data-arg="' + l.code + '" ' +
      'aria-pressed="' + (l.code === current ? 'true' : 'false') + '">' +
      '<span class="lc-body">' +
        '<span class="lc-native">' + S.esc(l.native) + '</span>' +
        '<span class="lc-name">' + S.esc(l.name) + (l.community ? ' · text only' : '') + '</span>' +
        '<span class="lc-caps">' +
          '<span class="cap-dot ' + (c.interface.percent >= 80 ? 'on' : c.interface.percent >= 40 ? 'partial' : 'off') +
            '"><i></i>' + c.interface.percent + '%</span>' +
          '<span class="cap-dot ' + (c.tts === 'available' ? 'on' : c.tts === 'device-voice' ? 'partial' : 'off') + '"><i></i>🔊</span>' +
          '<span class="cap-dot ' + (c.asr === 'available' ? 'on' : c.asr === 'device-only' ? 'partial' : 'off') + '"><i></i>🎤</span>' +
        '</span>' +
      '</span><span class="lc-check">✓</span></button>';
  }

  var LanguageConsole = {

    /** Rendered as the caregiver "Language" tab. */
    render: function (patient) {
      var code = patient.language || 'en';
      var caps = S.LangService.capabilities(code);
      var cov = caps.interface;
      var creds = S.LangService.creds();
      var groups = S.I18N.forPicker();
      var pct = function (n) { return (cov.total ? (n / cov.total) * 100 : 0).toFixed(1); };

      return '' +
        /* ---- 1 · choose ---- */
        '<div class="section">' +
          S.UI.sectionTitle(patient.name.split(' ')[0] + '’s language') +
          '<div class="card">' +
            '<div class="lang-group">' +
              '<div class="lang-group-head">North-East India</div>' +
              '<div class="lang-grid">' + groups.ner.map(function (l) { return langButton(l, code); }).join('') + '</div>' +
            '</div>' +
            '<div class="lang-group">' +
              '<div class="lang-group-head">Other</div>' +
              '<div class="lang-grid">' + groups.other.map(function (l) { return langButton(l, code); }).join('') + '</div>' +
            '</div>' +
            '<p class="t-small muted" style="margin-top:16px">Changing this changes every screen, prompt and spoken ' +
              'message the patient receives. ' +
              (patient.language_confirmed
                ? 'This choice has been confirmed with the patient.'
                : '<b>Not yet confirmed with the patient.</b>') +
            '</p>' +
          '</div>' +
        '</div>' +

        /* ---- 2 · what actually works ---- */
        '<div class="section grid-2">' +
          '<div class="card">' +
            '<div class="card-title" style="margin-bottom:14px">What works in ' + S.esc(caps.language.name) + '</div>' +
            '<div class="table-scroll"><table class="data cap-table">' +
              '<thead><tr><th>Capability</th><th>Status</th><th>Served by</th></tr></thead><tbody>' +
              '<tr><td><b>Interface text</b><div class="t-small muted">Screens, buttons, prompts</div></td>' +
                '<td class="state">' + stateCell(cov.percent >= 80 ? 'available' : cov.percent > 0 ? 'device-voice' : 'not-configured') + '</td>' +
                '<td class="t-small muted">' + cov.bundled + ' bundled · ' + cov.machine + ' machine · ' + cov.missing + ' English</td></tr>' +
              '<tr><td><b>Translation</b><div class="t-small muted">Live text into this language</div></td>' +
                '<td class="state">' + stateCell(caps.translation) + '</td>' +
                '<td class="t-small muted">' + S.esc(caps.cloudProviders.join(', ') || '—') + '</td></tr>' +
              '<tr><td><b>Text to speech</b><div class="t-small muted">Spoken prompts and reminders</div></td>' +
                '<td class="state">' + stateCell(caps.tts) + '</td>' +
                '<td class="t-small muted">' + S.esc(caps.cloudProviders[0] || (S.Voice.voiceFor(code) ? 'device voice' : '—')) + '</td></tr>' +
              '<tr><td><b>Speech to text</b><div class="t-small muted">Voice input for Ask HUN</div></td>' +
                '<td class="state">' + stateCell(caps.asr) + '</td>' +
                '<td class="t-small muted">' + S.esc(caps.cloudProviders[0] || 'browser') + '</td></tr>' +
              '</tbody></table></div>' +
            '<div class="alert ' + (caps.language.community ? 'attention' : 'info') + '" style="margin-top:16px">' +
              '<span class="al-ico emoji">' + (caps.language.community ? '⚠️' : 'ℹ️') + '</span><div>' +
              '<div class="al-title">' + S.esc(caps.language.name) + '</div>' +
              '<div class="al-body">' + S.esc(caps.reason) + '</div></div></div>' +
          '</div>' +

          '<div class="card">' +
            '<div class="card-title" style="margin-bottom:6px">Interface coverage</div>' +
            '<p class="t-small muted" style="margin-bottom:14px">' + cov.total + ' translatable strings.</p>' +
            '<div class="cov-bar">' +
              '<span class="cov-bundled" style="width:' + pct(cov.bundled) + '%"></span>' +
              '<span class="cov-machine" style="width:' + pct(cov.machine) + '%"></span>' +
            '</div>' +
            '<div class="cov-legend">' +
              '<span><i style="background:var(--green)"></i>Bundled ' + cov.bundled + '</span>' +
              '<span><i style="background:var(--amber)"></i>Machine ' + cov.machine + '</span>' +
              '<span><i style="background:var(--ivory-sunk);border:1px solid var(--divider)"></i>English ' + cov.missing + '</span>' +
            '</div>' +
            '<div class="alert" style="margin-top:16px"><span class="al-ico emoji">📝</span><div>' +
              '<div class="al-title">Bundled strings are drafts</div>' +
              '<div class="al-body">Every non-English string shipped with SMIVAI is an AI-drafted seed and has ' +
                '<b>not</b> been reviewed by a native speaker. Export the sheet below and have it checked before ' +
                'this language is used with a real patient.</div></div></div>' +
            '<div class="row" style="margin-top:16px;gap:10px;flex-wrap:wrap">' +
              '<button class="btn btn-sm" data-act="pretranslate"><span class="emoji">⚡</span>Fill gaps with Bhashini</button>' +
              '<button class="btn btn-sm btn-secondary" data-act="exportLang"><span class="emoji">⬇️</span>Export for review</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* ---- 3 · connection ---- */
        '<div class="section card">' +
          '<div class="card-title" style="margin-bottom:6px">Language service connection</div>' +
          '<p class="t-small muted" style="margin-bottom:18px">SMIVAI uses <b>Bhashini (MeitY / ULCA)</b> for translation, ' +
            'speech recognition and speech synthesis in India’s scheduled languages, and can use a self-hosted ' +
            '<b>AI4Bharat</b> deployment (IndicTrans2, IndicConformer, IndicTTS) instead or as a fallback. ' +
            'In a real deployment these credentials live on the server and never reach the browser — the fields below ' +
            'exist so the pipeline can be demonstrated on a machine with no backend running.</p>' +
          '<div class="form-grid">' +
            '<div class="field"><label for="lg-user">Bhashini user ID</label>' +
              '<input class="input" id="lg-user" value="' + S.esc(creds.userId) + '" placeholder="ULCA userID"></div>' +
            '<div class="field"><label for="lg-key">Bhashini ULCA API key</label>' +
              '<input class="input" id="lg-key" type="password" value="' + S.esc(creds.ulcaApiKey) + '" placeholder="ulcaApiKey"></div>' +
            '<div class="field"><label for="lg-pipe">Pipeline ID</label>' +
              '<input class="input" id="lg-pipe" value="' + S.esc(creds.bhashiniPipelineId) + '"></div>' +
            '<div class="field"><label for="lg-gender">Voice</label>' +
              '<select class="select" id="lg-gender">' +
                '<option value="female"' + (creds.ttsGender === 'female' ? ' selected' : '') + '>Female</option>' +
                '<option value="male"' + (creds.ttsGender === 'male' ? ' selected' : '') + '>Male</option>' +
              '</select></div>' +
            '<div class="field full"><label for="lg-ai4b">AI4Bharat endpoint (optional)</label>' +
              '<input class="input" id="lg-ai4b" value="' + S.esc(creds.ai4bharatBase) + '" placeholder="https://your-host/ai4bharat"></div>' +
          '</div>' +
          '<div class="row" style="margin-top:18px;gap:10px;flex-wrap:wrap">' +
            '<button class="btn" data-act="saveCreds"><span class="emoji">✅</span>Save</button>' +
            '<button class="btn btn-secondary" data-act="testLang"><span class="emoji">🧪</span>Test connection</button>' +
          '</div>' +
          '<div class="sync-row" style="margin-top:18px"><span>Active providers</span><b>' +
            S.esc(caps.cloudProviders.join(', ') || 'none — using bundled text and device voices') + '</b></div>' +
          '<div class="sync-row"><span>Credentials held</span><b>' +
            (S.CONFIG.apiBase ? 'server-side (SMIVAI API)' : (creds.userId ? 'in this browser — demo only' : 'none')) + '</b></div>' +
          '<div class="sync-row"><span>Cached machine translations</span><b>' + S.DB.count('translations') + ' strings</b></div>' +
        '</div>';
    },

    /* ---------------- actions ---------------- */

    test: function (code) {
      var lang = S.I18N.lang(code);
      S.Modal.open({
        title: 'Testing ' + lang.name,
        body: '<div id="lg-test"><div class="row"><span class="spinner"></span>' +
          '<span>Translating a sample phrase…</span></div></div>',
        footer: '<button class="btn" data-modal-close>Close</button>'
      });
      var out = function (html) { var el = S.qs('#lg-test'); if (el) el.innerHTML = html; };

      if (!S.LangService.hasCloud(code)) {
        out('<div class="alert attention"><span class="al-ico emoji">⚠️</span><div>' +
          '<div class="al-title">No pipeline for ' + S.esc(lang.name) + '</div>' +
          '<div class="al-body">' + S.esc(S.LangService.explainNoVoice(code)) + '</div></div></div>');
        return;
      }

      var sample = 'It is time to take your medicine.';
      S.LangService.translate(sample, 'en', code).then(function (res) {
        if (!res.ok) {
          out('<div class="alert attention"><span class="al-ico emoji">⚠️</span><div>' +
            '<div class="al-title">Translation failed</div>' +
            '<div class="al-body">' + S.esc(res.reason || 'The service did not respond.') +
            ' Check the credentials, and that this machine can reach the service.</div></div></div>');
          return null;
        }
        var head = '<div class="alert info"><span class="al-ico emoji">✅</span><div>' +
          '<div class="al-title">Connected via ' + S.esc(res.provider) + '</div>' +
          '<div class="al-body">English: &ldquo;' + S.esc(sample) + '&rdquo;<br>' +
          S.esc(lang.name) + ': &ldquo;' + S.esc(res.text) + '&rdquo;</div></div></div>';
        out(head + '<div class="row" style="margin-top:14px"><span class="spinner"></span><span>Testing the voice…</span></div>');
        return S.Voice.speak(res.text, code).then(function (v) {
          out(head +
            '<div class="alert ' + (v.spoken ? 'info' : 'attention') + '" style="margin-top:12px">' +
            '<span class="al-ico emoji">' + (v.spoken ? '🔊' : '⚠️') + '</span><div>' +
            '<div class="al-title">' + (v.spoken ? 'Voice played via ' + S.esc(v.provider || 'device') : 'No voice available') + '</div>' +
            '<div class="al-body">' + S.esc(v.note || 'Spoken prompts will work for this patient.') + '</div></div></div>');
        });
      }).catch(function (err) {
        out('<div class="alert attention"><span class="al-ico emoji">⚠️</span><div>' +
          '<div class="al-title">Could not reach the service</div>' +
          '<div class="al-body">' + S.esc(String((err && err.message) || err)) + '</div></div></div>');
      });
    },

    pretranslate: function (code, onDone) {
      var lang = S.I18N.lang(code);
      if (!S.LangService.hasCloud(code)) {
        S.toast('No translation service is connected for ' + lang.name + '.', 'warn', 5000);
        return;
      }
      S.Modal.open({
        title: 'Filling gaps in ' + lang.name,
        body: '<div class="row"><span class="spinner"></span><span id="pt-status">Starting…</span></div>' +
          '<p class="t-small muted" style="margin-top:14px">Machine translations are cached on this device, so they ' +
          'keep working with the network off. Each one is marked as machine-translated and still needs review.</p>',
        footer: '<button class="btn" data-modal-close>Run in background</button>'
      });
      S.I18N.pretranslate(code, function (done, total) {
        var el = S.qs('#pt-status');
        if (el) el.textContent = 'Translated ' + done + ' of ' + total + '…';
      }).then(function (r) {
        S.Modal.close();
        if (r.skipped) S.toast('No machine pipeline exists for ' + lang.name + '.', 'warn', 5000);
        else S.toast('Filled ' + r.translated + ' of ' + r.total + ' strings in ' + lang.name + '.', 'ok', 5000);
        if (onDone) onDone();
      }).catch(function () {
        S.Modal.close();
        S.toast('Could not reach the translation service.', 'warn');
      });
    },

    exportSheet: function (code) {
      var rows = S.I18N.exportForReview(code);
      var lang = S.I18N.lang(code);
      var q = function (v) { return '"' + String(v === undefined || v === null ? '' : v).replace(/"/g, '""') + '"'; };
      var csv = ['key,english,' + code + ',provenance,reviewed_by,approved'];
      rows.forEach(function (r) {
        csv.push([q(r.key), q(r.english), q(r.translation), q(r.provenance), q(''), q('')].join(','));
      });
      S.Modal.open({
        title: 'Review sheet · ' + lang.name,
        subtitle: rows.length + ' strings. Send this to a native speaker and paste the approved column back.',
        body: '<textarea class="textarea" style="min-height:340px;font-family:ui-monospace,monospace;font-size:12px" readonly>' +
          S.esc(csv.join('\n')) + '</textarea>',
        footer: '<button class="btn" data-modal-close>Close</button>'
      });
    }
  };

  S.LanguageConsole = LanguageConsole;

  /* Attach to the caregiver dashboard once it has loaded. */
  if (S.Caregiver) {
    S.Caregiver.language = function (patient) { return LanguageConsole.render(patient); };
    S.Caregiver.testLanguageService = function (code) { return LanguageConsole.test(code); };
    S.Caregiver.pretranslate = function (code) {
      var self = this;
      return LanguageConsole.pretranslate(code, function () { self.render('language'); });
    };
    S.Caregiver.exportTranslations = function (code) { return LanguageConsole.exportSheet(code); };
  }
})(window);
