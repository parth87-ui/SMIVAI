/* ============================================================
   SMIVAI — screens/talk.js
   Talk with HUN: a full screen conversation, by voice or by typing.

   The DONE button is the important control on this screen. Pressing it
   immediately:
     · stops the microphone and releases it (tracks stopped)
     · cancels any recognition in progress
     · stops any audio HUN is speaking
     · ends the voice session, so a reply that arrives late is dropped
   and the screen then says "Conversation ended" — the microphone is not
   left live. Leaving the screen does the same thing.

   Hands-free "Hey HUN" (core/wakeword.js) is opt-in, works only while this
   screen is open, pauses while HUN speaks or a turn is being heard, and is
   switched off by DONE and by leaving. "Hear again" replays HUN's last
   answer; "Stop voice" silences it.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;
  function tx(k, en, p) { return S.tx(k, en, p); }
  function esc(s) { return S.esc(s); }

  var Talk = {
    active: false,          // a voice session is running
    token: 0,               // invalidates in-flight promises after DONE
    thread: [],             // {who, text, sub}
    ctx: {},
    busy: false,
    seed: null,             // a question handed over from another screen
    lastSpoken: null,       // {speech, lang} — what "Hear again" replays
    wakeState: 'off',       // off · listening · paused · denied · error
    wakeNote: '',
    _unsub: [],

    render: function (opts) {
      opts = opts || {};
      var p = S.State.patient();
      var lang = p.language || 'en';
      var engine = S.Companion.engine(p);
      var canListen = S.LangService.canListen(lang);
      this.ctx = { memory: opts.memoryId ? S.DB.find('memory_bank', opts.memoryId) : null, pendingNote: null };
      if (!opts.keepThread) this.thread = [];
      this.active = false;
      this.busy = false;
      S.WakeWord.stop();               // a fresh screen starts from a known state

      var mem = this.ctx.memory;
      var opener = mem
        ? tx('talk_mem_open', 'Let’s talk about “{t}”. What do you remember about that day?', { t: mem.title })
        : tx('talk_open', 'Hello {name} Ji 👋 I’m HUN, and I’m here to talk with you. What would you like to talk about today?', { name: String(p.name).split(' ')[0] });
      if (!this.thread.length) this.thread.push({ who: 'smivai', text: opener });

      var html =
        '<div class="talk">' +
          '<div class="talk-head">' +
            '<button class="btn btn-ghost" data-act="back">' + S.icon('arrowLeft') + esc(S.t('back')) + '</button>' +
            '<span class="chip chip-lav">' + S.icon('sparkle') + esc(engine.label) + '</span>' +
          '</div>' +

          '<section class="talk-stage">' +
            '<div class="orb-wrap" id="orb-wrap">' +
              '<span class="orb-ring r1"></span><span class="orb-ring r2"></span>' +
              '<span class="orb">' + S.Art.orb() + '</span>' +
            '</div>' +
            '<h1 class="talk-state" id="talk-state">' + esc(canListen ? tx('tap_to_talk', 'Tap the microphone and talk to me') : tx('type_to_talk', 'Type your message below and I will answer')) + '</h1>' +
            (mem ? '<div class="talk-mem">' + S.Media.memoryImg(mem) + '<span><b>' + esc(mem.title) + '</b><small>' + esc([mem.memory_date ? S.prettyDate(mem.memory_date) : '', mem.place].filter(Boolean).join(' · ')) + '</small></span></div>' : '') +
          '</section>' +

          '<div class="talk-thread" id="talk-thread" aria-live="polite" aria-label="Conversation"></div>' +

          '<div class="talk-controls">' +
            '<div class="tc-main" id="tc-main"></div>' +
            '<div class="tc-play row" id="tc-play" style="gap:.75rem;justify-content:center;flex-wrap:wrap;margin:.75rem 0"></div>' +
            '<div class="tc-wake" id="tc-wake" style="text-align:center;margin-bottom:.75rem"></div>' +
            '<form class="tc-type" id="tc-form">' +
              '<label class="sr-only" for="tc-input">' + esc(tx('type_message', 'Type a message')) + '</label>' +
              '<input class="input" id="tc-input" autocomplete="off" placeholder="' + esc(tx('type_ph', 'Or type here…')) + '">' +
              '<button class="btn" type="submit" aria-label="' + esc(tx('send', 'Send')) + '">' + S.icon('send') + '</button>' +
            '</form>' +
            '<div class="tc-suggest" id="tc-suggest"></div>' +
          '</div>' +

          (!canListen
            ? '<div class="demo-note" style="margin-top:1.25rem">' + S.icon('mic') + '<span>' + esc(S.LangService.explainNoAsr(lang)) + ' ' + esc(tx('type_instead', 'You can type instead — I will still answer and read it aloud.')) + '</span></div>'
            : '') +
          '<div class="disclaimer">' + S.icon('info') + '<span>' + esc(tx('talk_disc', 'HUN is a companion, not a doctor. It answers from your own reminders, memories and activity, and never gives medical advice.')) + '</span></div>' +
        '</div>';

      S.mount(S.qs('#app'), html, {
        back: function () { Talk.end(true); S.Router.go('#/patient/home'); }
      });

      this.paintThread();
      this.paintControls();
      this.paintSuggestions();
      S.Media.hydrate(S.qs('#app'));

      /* HUN's own voice must not wake HUN, and the buttons follow it. */
      this._unsub.forEach(function (off) { off(); });
      this._unsub = [S.bus.on('voice:state', function (st) {
        Talk.paintPlayback();
        if (st && st.speaking) S.WakeWord.pause();
        else if (!Talk.active && !Talk.busy) setTimeout(function () { if (!S.Voice.speaking) S.WakeWord.resume(); }, 400);
      })];
      this.paintPlayback();
      this.wakeState = 'off'; this.wakeNote = '';
      if (S.Prefs.get('wake_word') && S.WakeWord.supported(lang)) this.wakeOn();
      else this.paintWake();

      var form = S.qs('#tc-form');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var el = S.qs('#tc-input');
        var v = el.value.trim();
        if (!v) return;
        el.value = '';
        Talk.handle(v, { typed: true });
      });

      if (this.seed) { var q = this.seed; this.seed = null; setTimeout(function () { Talk.handle(q, { typed: true, chip: true }); }, 400); }
      S.scrollTop();
    },

    /** What the screen says when nothing is happening. */
    idleHint: function () {
      var p = S.State.patient();
      return S.LangService.canListen(p && p.language || 'en')
        ? tx('tap_to_talk', 'Tap the microphone and talk to me')
        : tx('type_to_talk', 'Type your message below and I will answer');
    },

    /* ---------------- painting ---------------- */
    state: function (text, cls) {
      var el = S.qs('#talk-state');
      if (el) el.textContent = text;
      var wrap = S.qs('#orb-wrap');
      if (wrap) wrap.className = 'orb-wrap' + (cls ? ' ' + cls : '');
    },

    paintThread: function () {
      var el = S.qs('#talk-thread');
      if (!el) return;
      el.innerHTML = this.thread.map(function (m) {
        return '<div class="tl ' + m.who + '"><div class="tl-bubble">' + esc(m.text) + '</div>' +
          (m.sub ? '<div class="tl-sub">' + esc(m.sub) + '</div>' : '') + '</div>';
      }).join('');
      el.scrollTop = el.scrollHeight;
    },

    say: function (who, text, sub) {
      this.thread.push({ who: who, text: text, sub: sub });
      var p = S.State.patient();
      if (p) S.Companion.remember(p.patient_id, who === 'user' ? 'user' : 'assistant', text);
      this.paintThread();
    },

    paintControls: function () {
      var p = S.State.patient();
      var canListen = S.LangService.canListen(p.language || 'en');
      var el = S.qs('#tc-main');
      if (!el) return;
      var html;
      if (this.active) {
        html = '<button class="mic-btn is-live" data-act="stopMic" aria-label="' + esc(tx('stop_listening', 'Stop listening')) + '">' + S.icon('mic') + '</button>' +
          '<button class="btn btn-dark btn-xl done-btn" data-act="done">' + S.icon('stop') + esc(tx('done_btn2', 'DONE')) + '</button>';
      } else {
        html = '<button class="mic-btn" data-act="startMic"' + (canListen ? '' : ' disabled aria-disabled="true"') + ' aria-label="' + esc(tx('start_talking', 'Start talking')) + '">' +
            S.icon(canListen ? 'mic' : 'micOff') + '</button>' +
          '<div class="mic-hint">' + esc(canListen ? tx('tap_mic', 'Tap to speak') : tx('mic_unavailable', 'Microphone not available')) + '</div>';
      }
      S.mount(el, html, {
        startMic: function () { Talk.start(); },
        stopMic: function () { Talk.stopSpeakingTurn(); },
        done: function () { Talk.end(); }
      });
    },

    /** Large replay / stop controls for HUN's spoken answer. */
    paintPlayback: function () {
      var el = S.qs('#tc-play');
      if (!el) return;
      var html = '';
      if (this.lastSpoken) html += '<button class="btn btn-outline btn-lg" data-act="replay">' + S.icon('volume') + esc(tx('hear_again', 'Hear again')) + '</button>';
      if (S.Voice.speaking) html += '<button class="btn btn-dark btn-lg" data-act="hush">' + S.icon('stop') + esc(tx('stop_voice', 'Stop voice')) + '</button>';
      S.mount(el, html, {
        replay: function () {
          var l = Talk.lastSpoken;
          if (!l) return;
          S.Voice.speak(l.speech, l.lang).then(function (r) { if (!r.spoken && r.note) S.toast(r.note, 'warn', 5000); });
        },
        hush: function () { S.Voice.stop(); }
      });
    },

    /* ---------------- hands-free "Hey HUN" ---------------- */
    paintWake: function () {
      var el = S.qs('#tc-wake');
      if (!el) return;
      var p = S.State.patient();
      if (!S.WakeWord.supported(p.language || 'en')) { el.innerHTML = ''; return; }
      var on = this.wakeState === 'listening' || this.wakeState === 'paused';
      var status = this.wakeState === 'listening' ? tx('wake_listening', 'Listening for “Hey HUN”…')
        : this.wakeState === 'paused' ? tx('wake_paused', '“Hey HUN” paused while we talk')
        : this.wakeNote || tx('wake_off', 'Hands-free is off');
      S.mount(el,
        '<button class="btn ' + (on ? 'btn-dark' : 'btn-outline') + ' btn-lg" data-act="toggle" aria-pressed="' + on + '">' +
          S.icon(on ? 'mic' : 'micOff') + esc(on ? tx('wake_turn_off', 'Turn off “Hey HUN”') : tx('wake_turn_on', 'Hands-free: say “Hey HUN”')) + '</button>' +
        '<div class="t-small muted" role="status" style="margin-top:.4rem">' + esc(status) +
          (on ? '' : ' · ' + esc(tx('wake_only_here', 'Only while this screen is open.'))) + '</div>', {
        toggle: function () {
          if (on) { S.Prefs.set('wake_word', false); Talk.wakeOff(); }
          else { S.Prefs.set('wake_word', true); Talk.wakeOn(); }
        }
      });
    },

    wakeOn: function () {
      var p = S.State.patient();
      var self = this;
      this.wakeNote = '';
      S.WakeWord.start(this.convLang || p.language || 'en', {
        onWake: function (rest) { self.onWake(rest); },
        onState: function (state, note) {
          self.wakeState = state === 'stopped' ? 'off' : state;
          if (note) { self.wakeNote = note; S.toast(note, 'warn', 5000); }
          if (state === 'denied' || state === 'error') S.Prefs.set('wake_word', false);
          self.paintWake();
        }
      });
      if (this.wakeState === 'off') this.paintWake();
    },

    wakeOff: function () {
      S.WakeWord.stop();
      this.wakeState = 'off';
      this.paintWake();
    },

    /** "Hey HUN" was heard. Anything said after it is the message. */
    onWake: function (rest) {
      S.Voice.stop();
      if (rest && rest.length > 1) this.handle(rest, { provider: tx('via_wake', '“Hey HUN”') });
      else this.start();
    },

    paintSuggestions: function () {
      var p = S.State.patient();
      var el = S.qs('#tc-suggest');
      if (!el) return;
      var list = S.Companion.suggestions(p, this.ctx);
      S.mount(el, '<div class="t-mini">' + esc(S.t('try_asking')) + '</div><div class="suggest-wrap">' +
        list.map(function (q, i) { return '<button class="suggest" data-act="ask" data-arg="' + i + '">' + esc(q) + '</button>'; }).join('') + '</div>', {
        ask: function (el2, ev, i) { Talk.handle(list[+i], { typed: true, chip: true }); }
      });
    },

    /* ---------------- voice session ---------------- */
    start: function () {
      var p = S.State.patient();
      var lang = p.language || 'en';
      var self = this;
      S.WakeWord.pause();             // one recogniser at a time
      this.active = true;
      this.token += 1;
      this.paintControls();
      this.state(tx('listening_now', 'Listening… speak whenever you are ready'), 'is-listening');
      this.listen(lang, this.token);
    },

    listen: function (lang, token) {
      var self = this;
      if (!this.active || token !== this.token) return;
      S.LangService.startListening(lang).then(function (res) {
        if (!self.active || token !== self.token) { S.LangService.cancelListening(); return; }
        if (!res.ok) {
          self.active = false;
          self.paintControls();
          self.state(res.note || tx('mic_denied', 'I could not use the microphone. You can type instead.'));
          if (res.reason === 'microphone-denied') S.toast(tx('mic_perm', 'HUN needs permission to use the microphone.'), 'warn', 5000);
          return;
        }
        self.mode = res.mode;
        self.state(tx('listening_now', 'Listening… speak whenever you are ready'), 'is-listening');
        if (res.mode === 'browser') {
          S.LangService.whenHeard().then(function (heard) { self.heard(heard, lang, token); });
        }
        /* cloud mode: the patient taps the mic (or DONE) to finish the turn */
      });
    },

    /** Finish this speaking turn (cloud recorder) without ending the session. */
    stopSpeakingTurn: function () {
      var p = S.State.patient();
      var lang = p.language || 'en';
      var token = this.token, self = this;
      if (!this.active) return;
      this.state(tx('thinking', 'One moment…'), 'is-thinking');
      S.LangService.stopListening(lang).then(function (res) { self.heard(res, lang, token); });
    },

    heard: function (res, lang, token) {
      if (!this.active || token !== this.token) return;     // DONE was pressed
      if (!res || !res.ok || !res.text) {
        this.state(tx('didnt_catch2', 'I did not quite catch that. Please try again.'), 'is-listening');
        var self = this;
        setTimeout(function () { self.listen(lang, token); }, 600);
        return;
      }
      this.handle(res.text, { provider: res.provider, token: token });
    },

    /* ---------------- one exchange ---------------- */
    handle: function (text, opts) {
      opts = opts || {};
      var self = this;
      var p = S.State.patient();
      var lang = p.language || 'en';
      var token = opts.token !== undefined ? opts.token : this.token;
      if (this.busy) return;
      this.busy = true;

      this.say('user', text, opts.provider ? tx('heard_via', 'heard via {p}', { p: opts.provider }) : null);
      this.state(tx('thinking', 'One moment…'), 'is-thinking');

      /* Answer in the language of this message, not only the profile's.
         Suggestion chips are written in English but stand for the person's
         own language, so they keep the profile's. */
      var det = opts.chip
        ? { lang: lang, script: null, variant: { en: 1, hi: 1, as: 1, bn: 1 }[lang] ? lang : null }
        : S.LangDetect.detect(text, lang);
      var understand = opts.chip
        ? Promise.resolve({ ok: true, text: String(text).toLowerCase() })
        : (det.variant || det.lang === 'en')
          ? Promise.resolve({ ok: true, text: S.LangDetect.toPivot(text, det) })   // understood on this device
          : S.LangService.translate(text, det.lang, 'en');                          // needs Bhashini / AI4Bharat
      /* Saved turns of this patient (this visit and earlier ones). */
      var history = S.Companion.recent(p.patient_id, 16);

      understand.then(function (tr) {
        var pivot = (tr && tr.ok && tr.text) ? tr.text : text;
        return S.Companion.answer(p, pivot, self.ctx, history, { det: det, original: text });
      }).then(function (ans) {
        var toPerson = ans.localized
          ? Promise.resolve({ ok: true, text: ans.localized.text, speech: ans.localized.speech, lang: ans.localized.speechLang })
          : det.lang === 'en'
            ? Promise.resolve({ ok: true, text: ans.text, speech: ans.text, lang: 'en' })
            : S.LangService.translate(ans.text, 'en', det.lang).then(function (out) {
                return out && out.ok && out.text
                  ? { ok: true, text: out.text, speech: out.text, lang: det.lang, provider: out.provider }
                  : { ok: false, text: ans.text, speech: ans.text, lang: 'en' };
              });
        return toPerson.then(function (out) {
          var sub = [];
          if (out.provider) sub.push(tx('translated_by', 'translated by {p}', { p: out.provider }));
          if (!out.ok) sub.push(tx('reply_english', 'Answered in English — on this device HUN can reply in English, Hindi, Assamese and Bengali. Connect a language service in Settings for {lang}.', { lang: S.I18N.lang(det.lang).native }));
          if (ans.note) sub.push(ans.note);
          self.say('smivai', out.text, sub.join(' · ') || null);
          self.busy = false;

          /* keep listening in the language the person is actually using */
          if (det.variant && !opts.chip) self.convLang = det.lang;
          var listenLang = self.convLang || lang;

          if (ans.action === 'end') { self.end(); return; }
          self.state(self.active ? tx('listening_soon', 'I’m listening…') : self.idleHint(), self.active ? 'is-speaking' : '');

          /* speak the answer, then listen again if the session is still on */
          self.lastSpoken = { speech: out.speech, lang: out.lang };
          self.paintPlayback();
          S.Voice.speak(out.speech, out.lang).then(function (r) {
            if (!r.spoken && r.note) S.toast(r.note, 'warn', 5000);
            if (self.active && token === self.token) setTimeout(function () { self.listen(listenLang, token); }, 350);
            else if (!self.active) S.WakeWord.resume();       // back to waiting for "Hey HUN"
          });

          if (ans.action && ans.action !== 'end') self.offerAction(ans.action);
          self.paintSuggestions();
        });
      }).catch(function (err) {
        console.warn('[SMIVAI] talk', err);
        self.busy = false;
        self.say('smivai', tx('talk_error', 'Something went wrong on my side. Please say that again.'));
        self.state(self.idleHint());
      });
    },

    /** A gentle, optional shortcut — never a jump the patient did not ask for. */
    offerAction: function (action) {
      var el = S.qs('#tc-suggest');
      if (!el) return;
      var map = {
        sos: ['Open Emergency SOS', '#/patient/sos', 'phone'],
        reminders: ['Open my reminders', '#/patient/reminders', 'bell'],
        games: ['Open brain games', '#/patient/games', 'brain'],
        memories: ['Open my memories', '#/patient/memories', 'heart'],
        progress: ['Open my progress', '#/patient/progress', 'chart'],
        doctor: ['Open doctors', '#/patient/doctor', 'stethoscope'],
        caregiver: ['Open caregiver support', '#/patient/caregiver', 'users'],
        fact: ['Read today’s fact', '#/patient/fact', 'bulb'],
        skill: ['Open today’s lesson', '#/patient/skill', 'book']
      };
      var go, text, ico;
      if (action.indexOf('memory:') === 0) { go = '#/patient/memory/' + action.split(':')[1]; text = 'Open that memory'; ico = 'heart'; }
      else if (map[action]) { text = map[action][0]; go = map[action][1]; ico = map[action][2]; }
      else return;
      var wrap = document.createElement('div');
      wrap.className = 'talk-action' + (action === 'sos' ? ' urgent' : '');
      wrap.innerHTML = '<button class="btn ' + (action === 'sos' ? 'btn-sos' : 'btn-outline') + ' btn-lg">' + S.icon(ico) + esc(text) + '</button>';
      wrap.querySelector('button').addEventListener('click', function () { Talk.end(true); S.Router.go(go); });
      el.parentNode.insertBefore(wrap, el);
    },

    /* ---------------- ending ---------------- */
    /**
     * Stop everything. `silent` is used when leaving the screen.
     * After this the microphone is released and no late reply can arrive.
     */
    end: function (silent) {
      var was = this.active || this.wakeState === 'listening' || this.wakeState === 'paused';
      this.active = false;
      this.token += 1;                 // invalidate anything still in flight
      this.busy = false;
      try { S.LangService.cancelListening(); } catch (e) { /* ignore */ }
      S.WakeWord.stop();               // DONE and leaving both release the microphone
      this.wakeState = 'off';
      S.Voice.stop();
      if (silent) {
        this._unsub.forEach(function (off) { off(); });
        this._unsub = [];
        return;
      }
      this.paintWake();
      if (!was) { this.state(this.idleHint()); this.paintControls(); return; }
      this.say('smivai', tx('conv_ended', 'Conversation ended. I am here whenever you want to talk again.'));
      this.state(tx('conv_ended_state', 'Conversation ended'), 'is-ended');
      this.paintControls();
      S.toast(tx('mic_off', 'Microphone off.'), 'ok');
    }
  };

  S.Talk = Talk;
})(window);
