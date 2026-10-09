/* ============================================================
   SMIVAI — voice.js
   Spoken output for patient screens.

   This module is now a thin, honest wrapper over LangService:

     Voice.speak(text, lang)  →  cloud voice (Bhashini / AI4Bharat)
                              →  else a real device voice for that language
                              →  else no audio, and the caller is told why

   The one rule this file exists to enforce: SMIVAI never plays English
   audio while presenting it as another language. If a language has no
   voice, the interface says so and shows the text large instead.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var synth = global.speechSynthesis || null;
  var voicesCache = [];

  function refreshVoices() {
    if (!synth) return;
    try { voicesCache = synth.getVoices() || []; } catch (e) { voicesCache = []; }
  }
  if (synth) {
    refreshVoices();
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', refreshVoices);
    }
  }

  var Voice = {
    enabled: true,
    speaking: false,

    available: function () { return !!synth; },
    voices: function () { if (!voicesCache.length) refreshVoices(); return voicesCache; },

    /** A genuinely installed device voice for this language, or null. */
    voiceFor: function (langCode) {
      var lang = S.I18N.lang(langCode);
      if (!lang.bcp47) return null;
      var want = lang.bcp47.toLowerCase();
      var base = want.split('-')[0];
      var list = this.voices();
      var exact = null, loose = null;
      list.forEach(function (v) {
        var vl = (v.lang || '').toLowerCase().replace('_', '-');
        if (vl === want) exact = exact || v;
        else if (vl.split('-')[0] === base) loose = loose || v;
      });
      return exact || loose;
    },

    /**
     * Speak text in a language.
     * @returns {Promise<{spoken, provider, usedLang, fallback, note}>}
     */
    speak: function (text, langCode, opts) {
      if (!this.enabled || !text) {
        return Promise.resolve({ spoken: false, note: 'Voice is switched off.' });
      }
      var self = this;
      return S.LangService.speak(text, langCode || 'en', opts).then(function (res) {
        self.speaking = false;
        if (res.ok) {
          return {
            spoken: true,
            provider: res.provider,
            usedLang: langCode,
            fallback: !!res.fallback,
            note: res.note || ''
          };
        }
        /* No voice for this language. SMIVAI still refuses to read one
           language in another *by default* — but the patient can choose a
           stand-in voice in Settings, and when they have, the result says
           plainly which language was actually spoken. */
        var alt = self.fallbackFor(langCode);
        if (alt) {
          return self.browserSpeak(text, alt.code).then(function (r) {
            if (!r.spoken) return { spoken: false, provider: null, usedLang: langCode, fallback: true, note: r.note || '' };
            return {
              spoken: true, provider: 'device', usedLang: alt.code, fallback: true,
              note: S.I18N.text('read_instead',
                { lang: S.I18N.lang(alt.code).native, missing: S.I18N.lang(langCode).native }, langCode)
            };
          });
        }
        return {
          spoken: false,
          provider: null,
          usedLang: langCode,
          fallback: true,
          note: res.note || S.LangService.explainNoVoice(langCode)
        };
      });
    },

    /**
     * Speak a catalogue key. Returns what was displayed as well as what was
     * spoken, so a screen can show the native text even when the audio for
     * that language is unavailable.
     */
    speakPhrase: function (key, langCode, params) {
      var p = S.I18N.resolve(key, langCode);
      var text = S.I18N.interpolate(p.text, params);
      return this.speak(text, p.lang).then(function (r) {
        r.displayText = text;
        r.textFallback = p.fallback;
        r.provenance = p.provenance;
        return r;
      });
    },

    /** Used by LangService's local provider — the raw Web Speech path. */
    browserSpeak: function (text, langCode, opts) {
      opts = opts || {};
      var self = this;
      if (!synth) {
        return Promise.resolve({ spoken: false, fallback: true, note: 'This device cannot play audio prompts.' });
      }
      var v = this.voiceFor(langCode);
      if (!v) {
        // Refuse rather than read the wrong language aloud.
        return Promise.resolve({
          spoken: false, fallback: true,
          note: 'No ' + S.I18N.lang(langCode).name + ' voice is installed on this device.'
        });
      }
      return new Promise(function (resolve) {
        try {
          synth.cancel();
          var u = new SpeechSynthesisUtterance(text);
          u.voice = v;
          u.lang = v.lang;
          u.rate = opts.rate || 0.88;      // slower, for elderly listeners
          u.pitch = opts.pitch || 1;
          u.volume = 1;
          u.onstart = function () { self.speaking = true; S.bus.emit('voice:state', { speaking: true }); };
          u.onend = function () {
            self.speaking = false;
            S.bus.emit('voice:state', { speaking: false });
            resolve({ spoken: true, fallback: false, note: '' });
          };
          u.onerror = function () {
            self.speaking = false;
            S.bus.emit('voice:state', { speaking: false });
            resolve({ spoken: false, fallback: true, note: 'Audio could not play.' });
          };
          synth.speak(u);
        } catch (e) {
          resolve({ spoken: false, fallback: true, note: 'Audio could not play.' });
        }
      });
    },

    stop: function () {
      try { if (synth) synth.cancel(); } catch (e) { /* ignore */ }
      if (S.LangService) S.LangService.stop();
      this.speaking = false;
      S.bus.emit('voice:state', { speaking: false });
    },

    /**
     * The stand-in voice the patient chose for languages this device
     * cannot speak — or null, which means "show the text instead".
     */
    fallbackFor: function (langCode) {
      var pick = S.Prefs && S.Prefs.get('voice_fallback');
      if (!pick || pick === 'off' || pick === langCode) return null;
      var v = this.voiceFor(pick);
      if (!v) return null;
      return { code: pick, name: S.I18N.lang(pick).name, voice: v.name };
    },

    /** Languages this device genuinely has a voice for. */
    installedLanguages: function () {
      var self = this;
      return S.I18N.languages.filter(function (l) { return !!self.voiceFor(l.code); });
    },

    /** Honest capability report for one language. */
    status: function (langCode) {
      var lang = S.I18N.lang(langCode);
      var caps = S.LangService.capabilities(langCode);
      var deviceVoice = this.voiceFor(langCode);

      var alt = this.fallbackFor(langCode);
      if (caps.cloudProviders.length) {
        return {
          lang: lang, voice: caps.cloudProviders[0], ttsAvailable: true, canSpeak: true,
          source: 'cloud',
          note: 'Spoken ' + lang.name + ' available via ' + caps.cloudProviders[0] + '.'
        };
      }
      if (deviceVoice) {
        return {
          lang: lang, voice: deviceVoice.name, ttsAvailable: true, canSpeak: true,
          source: 'device',
          note: 'Using the device voice (' + deviceVoice.name + ').'
        };
      }
      if (alt) {
        return {
          lang: lang, voice: alt.voice, ttsAvailable: true, canSpeak: true,
          source: 'stand-in',
          note: 'No ' + lang.name + ' voice is installed, so HUN reads aloud in ' + alt.name +
            ' — you chose this in Settings.'
        };
      }
      return {
        lang: lang, voice: null, ttsAvailable: !!synth, canSpeak: false,
        source: null,
        note: S.LangService.explainNoVoice(langCode)
      };
    }
  };

  S.Voice = Voice;
})(window);
