/* ============================================================
   SMIVAI — wakeword.js
   Hands-free "Hey HUN" — only while the Talk screen is open, and only
   after the person switches it on.

   What this is, honestly:
     · It uses the browser's own speech recogniser (Chrome / Edge), the
       same one push-to-talk uses. Audio handling is the browser's — Chrome
       sends it to its speech service — so this is not an on-device,
       always-on wake-word engine.
     · It listens only while the Talk screen is open, shows that it is
       listening, pauses while HUN is speaking (so HUN does not wake itself)
       and while a normal turn is being heard, and stops when the person
       leaves the screen or presses DONE.
     · It does NOT run in the background, with the screen off, or in
       other apps. Nothing here claims otherwise.

   Why a two-word phrase: "hun" alone is everyday Hindi ("main theek hun"
   — "I am fine"; see langdetect.js). Matching a bare "hun" would wake HUN
   in the middle of ordinary Hindi speech, so the phrase must START with a
   greeting — "Hey HUN", "Hi HUN", "OK HUN", "हे हुन" — and anything said
   after it is taken as the message.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  /* Greeting + name at the very start of what was heard. Recognisers
     spell the name several ways ("hun", "hoon", "hon", "हन", "हुन").
     A lookahead instead of \b, because \b does not work for Devanagari. */
  var PATTERN = new RegExp(
    '^\\s*(?:hey|hi|hello|ok|okay|हे|है|हाय|ओके)[\\s,.!]*' +
    '(?:hun|hunn|hoon|hon|हन|हुन|हून)' +
    '(?=$|[\\s,.!?:;\\-])[\\s,.!?:;\\-]*([\\s\\S]*)$', 'i');

  var MAX_RESTARTS_PER_MINUTE = 8;

  function SR() { return global.SpeechRecognition || global.webkitSpeechRecognition || null; }

  var WakeWord = {
    PATTERN: PATTERN,

    /** @returns {{hit:boolean, rest:string}} */
    match: function (text) {
      var m = PATTERN.exec(String(text || ''));
      return m ? { hit: true, rest: (m[1] || '').trim() } : { hit: false, rest: '' };
    },

    /** The browser recogniser exists and genuinely supports this language. */
    supported: function (lang) {
      return !!SR() && S.LangService.providers.local.supportsAsr(lang);
    },

    /* ---------------- listener ---------------- */
    _rec: null,
    _on: false,          // the person switched it on for this visit
    _paused: false,
    _restarts: [],
    _handlers: null,

    listening: function () { return this._on && !this._paused; },

    /**
     * @param {string} lang
     * @param {{onWake:function(string), onState:function(string, string=)}} handlers
     *   onState('listening'|'paused'|'stopped'|'denied'|'error', note)
     */
    start: function (lang, handlers) {
      this.stop();
      if (!this.supported(lang)) { handlers.onState('error', 'This browser cannot listen for “Hey HUN” in this language.'); return false; }
      this._on = true;
      this._paused = false;
      this._lang = lang;
      this._handlers = handlers;
      this._restarts = [];
      this._open();
      return true;
    },

    _open: function () {
      var self = this, Rec = SR();
      if (!this._on || this._paused || !Rec) return;
      var rec = new Rec();
      rec.lang = S.I18N.lang(this._lang).bcp47 || 'en-IN';
      rec.continuous = true;
      rec.interimResults = false;
      rec.maxAlternatives = 3;
      rec.onresult = function (ev) {
        for (var i = ev.resultIndex; i < ev.results.length; i++) {
          if (!ev.results[i].isFinal) continue;
          for (var a = 0; a < ev.results[i].length; a++) {
            var hit = WakeWord.match(ev.results[i][a].transcript);
            if (hit.hit) { self.pause(); self._handlers.onWake(hit.rest); return; }
          }
        }
      };
      rec.onerror = function (ev) {
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
          self._on = false;
          self._handlers.onState('denied', 'HUN needs permission to use the microphone.');
        }
        /* 'no-speech', 'aborted', 'network': onend decides whether to reopen */
      };
      rec.onend = function () {
        if (self._rec !== rec) return;
        self._rec = null;
        if (!self._on || self._paused) return;
        var now = Date.now();
        self._restarts = self._restarts.filter(function (t) { return now - t < 60000; });
        if (self._restarts.length >= MAX_RESTARTS_PER_MINUTE) {
          self._on = false;
          self._handlers.onState('error', 'Listening for “Hey HUN” stopped because the microphone kept closing. Tap the microphone to talk instead.');
          return;
        }
        self._restarts.push(now);
        setTimeout(function () { self._open(); }, 300);    // Chrome ends sessions on its own; reopen
      };
      try {
        rec.start();
        this._rec = rec;
        this._handlers.onState('listening');
      } catch (e) {
        this._on = false;
        this._handlers.onState('error', 'The microphone could not be started.');
      }
    },

    _close: function () {
      var rec = this._rec;
      this._rec = null;
      if (rec) { try { rec.abort(); } catch (e) { /* ignore */ } }
    },

    /** Stop listening for a moment (HUN speaking, or a normal turn running). */
    pause: function () {
      if (!this._on || this._paused) return;
      this._paused = true;
      this._close();
      if (this._handlers) this._handlers.onState('paused');
    },

    resume: function () {
      if (!this._on || !this._paused) return;
      this._paused = false;
      this._open();
    },

    /** Switch off and release the microphone. */
    stop: function () {
      var was = this._on;
      this._on = false;
      this._paused = false;
      this._close();
      if (was && this._handlers) this._handlers.onState('stopped');
    }
  };

  S.WakeWord = WakeWord;
})(window);
