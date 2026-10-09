/* ============================================================
   SMIVAI — langservice.js
   Speech and translation for Indian languages.

   Four providers, tried in order of preference:

     1. ProxyProvider     — our own FastAPI service holds the credentials
                            and forwards to Bhashini. This is the only
                            arrangement fit for a real deployment.
     2. BhashiniProvider  — direct browser → Bhashini ULCA calls, for
                            demo machines with no backend running.
     3. AI4BharatProvider — a self-hosted IndicTrans2 / IndicConformer /
                            IndicTTS endpoint.
     4. LocalProvider     — the browser's own Web Speech API. No Indian
                            language models, but it always exists.

   Every call returns { ok, ..., provider, note } and never throws at the
   UI. When no provider can serve a language, the caller is told which
   language and why, so the interface can say so honestly instead of
   silently substituting English.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var CREDS_KEY = 'smivai.lang.creds.v1';

  var DEFAULTS = {
    bhashiniAuthUrl: 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline',
    bhashiniPipelineId: '64392f96daac500b55c543cd',   // MeitY / Bhashini default pipeline
    userId: '',
    ulcaApiKey: '',
    ai4bharatBase: '',
    ttsGender: 'female',
    enabled: true
  };

  function loadCreds() {
    try {
      var raw = global.localStorage.getItem(CREDS_KEY);
      return Object.assign({}, DEFAULTS, raw ? JSON.parse(raw) : {});
    } catch (e) { return Object.assign({}, DEFAULTS); }
  }
  function saveCreds(c) {
    try { global.localStorage.setItem(CREDS_KEY, JSON.stringify(c)); } catch (e) { /* ignore */ }
  }

  /* ============================================================
     WAV recorder

     Bhashini ASR accepts wav / flac / mp3. MediaRecorder gives webm/opus,
     which the pipeline rejects, so we capture raw PCM, downsample to
     16 kHz mono and write the WAV header ourselves.
     ============================================================ */
  var Recorder = {
    ctx: null, stream: null, node: null, source: null,
    chunks: [], recording: false, sampleRate: 16000,

    supported: function () {
      return !!(global.navigator.mediaDevices && global.navigator.mediaDevices.getUserMedia &&
        (global.AudioContext || global.webkitAudioContext));
    },

    start: function () {
      var self = this;
      if (!this.supported()) return Promise.reject(new Error('no-audio-input'));
      return global.navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        var AC = global.AudioContext || global.webkitAudioContext;
        self.stream = stream;
        self.ctx = new AC();
        self.source = self.ctx.createMediaStreamSource(stream);
        self.node = self.ctx.createScriptProcessor(4096, 1, 1);
        self.chunks = [];
        self.recording = true;
        self.node.onaudioprocess = function (ev) {
          if (!self.recording) return;
          self.chunks.push(new Float32Array(ev.inputBuffer.getChannelData(0)));
        };
        self.source.connect(self.node);
        self.node.connect(self.ctx.destination);
        return true;
      });
    },

    stop: function () {
      if (!this.recording) return null;
      this.recording = false;
      var inputRate = this.ctx ? this.ctx.sampleRate : 48000;

      try { this.node.disconnect(); this.source.disconnect(); } catch (e) { /* ignore */ }
      if (this.stream) this.stream.getTracks().forEach(function (t) { t.stop(); });
      if (this.ctx && this.ctx.close) this.ctx.close();

      var flat = flatten(this.chunks);
      this.chunks = [];
      if (!flat.length) return null;
      var pcm = downsample(flat, inputRate, this.sampleRate);
      return { base64: encodeWavBase64(pcm, this.sampleRate), samples: pcm.length };
    },

    cancel: function () {
      this.recording = false;
      try { if (this.node) this.node.disconnect(); if (this.source) this.source.disconnect(); } catch (e) { /* ignore */ }
      if (this.stream) this.stream.getTracks().forEach(function (t) { t.stop(); });
      if (this.ctx && this.ctx.close) this.ctx.close();
      this.chunks = [];
    }
  };

  function flatten(chunks) {
    var len = 0, i;
    for (i = 0; i < chunks.length; i++) len += chunks[i].length;
    var out = new Float32Array(len), off = 0;
    for (i = 0; i < chunks.length; i++) { out.set(chunks[i], off); off += chunks[i].length; }
    return out;
  }

  function downsample(buf, from, to) {
    if (to >= from) return buf;
    var ratio = from / to;
    var outLen = Math.round(buf.length / ratio);
    var out = new Float32Array(outLen);
    var oi = 0, i = 0;
    while (oi < outLen) {
      var next = Math.round((oi + 1) * ratio);
      var sum = 0, n = 0;
      for (i = Math.round(oi * ratio); i < next && i < buf.length; i++) { sum += buf[i]; n++; }
      out[oi] = n ? sum / n : 0;
      oi++;
    }
    return out;
  }

  function encodeWavBase64(samples, rate) {
    var bytes = samples.length * 2;
    var buffer = new ArrayBuffer(44 + bytes);
    var view = new DataView(buffer);
    var writeStr = function (off, s) { for (var i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };

    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + bytes, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);       // PCM chunk size
    view.setUint16(20, 1, true);        // PCM
    view.setUint16(22, 1, true);        // mono
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * 2, true); // byte rate
    view.setUint16(32, 2, true);        // block align
    view.setUint16(34, 16, true);       // bits per sample
    writeStr(36, 'data');
    view.setUint32(40, bytes, true);

    var off = 44;
    for (var i = 0; i < samples.length; i++, off += 2) {
      var s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return arrayBufferToBase64(buffer);
  }

  function arrayBufferToBase64(buf) {
    var bytes = new Uint8Array(buf), bin = '', chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return global.btoa(bin);
  }

  function base64ToBlobUrl(b64, mime) {
    var bin = global.atob(b64);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([arr], { type: mime || 'audio/wav' }));
  }

  /* ============================================================
     Provider 1 — via our own backend (credentials stay server-side)
     ============================================================ */
  var ProxyProvider = {
    name: 'smivai-api',
    available: function () { return !!(S.CONFIG && S.CONFIG.apiBase); },
    supports: function (code) { return S.I18N.isSupportedByBhashini(code); },

    _post: function (path, body) {
      /* The service spends its Bhashini quota only for a signed-in account. */
      var sess = S.Auth && S.Auth.session();
      var headers = { 'Content-Type': 'application/json' };
      if (sess && sess.mode === 'server') headers.Authorization = 'Bearer ' + sess.token;
      return fetch(S.CONFIG.apiBase + path, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      }).then(function (r) {
        if (r.status === 401) S.Auth.expire();
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
    },

    translate: function (text, from, to) {
      return this._post('/language/translate', { text: text, source: from, target: to })
        .then(function (d) { return { ok: true, text: d.text, provider: 'smivai-api' }; });
    },
    tts: function (text, lang, gender) {
      return this._post('/language/tts', { text: text, language: lang, gender: gender })
        .then(function (d) { return { ok: true, audioUrl: base64ToBlobUrl(d.audio_base64), provider: 'smivai-api' }; });
    },
    asr: function (audioBase64, lang) {
      return this._post('/language/asr', { audio_base64: audioBase64, language: lang })
        .then(function (d) { return { ok: true, text: d.text, provider: 'smivai-api' }; });
    }
  };

  /* ============================================================
     Provider 2 — Bhashini ULCA, called directly from the browser
     ============================================================ */
  var BhashiniProvider = {
    name: 'bhashini',
    _pipelines: {},   // cache keyed by task + language pair

    creds: function () { return loadCreds(); },
    available: function () {
      var c = this.creds();
      return !!(c.enabled && c.userId && c.ulcaApiKey);
    },
    supports: function (code) { return S.I18N.isSupportedByBhashini(code); },

    /** Resolve serviceIds and the inference endpoint for a set of tasks. */
    pipeline: function (tasks, source, target) {
      var c = this.creds();
      var key = tasks.join(',') + '|' + source + '|' + (target || '');
      if (this._pipelines[key]) return Promise.resolve(this._pipelines[key]);

      var self = this;
      var body = {
        pipelineTasks: tasks.map(function (taskType) {
          var langCfg = { sourceLanguage: source };
          if (taskType === 'translation') langCfg.targetLanguage = target;
          return { taskType: taskType, config: { language: langCfg } };
        }),
        pipelineRequestConfig: { pipelineId: c.bhashiniPipelineId }
      };

      return fetch(c.bhashiniAuthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'userID': c.userId,
          'ulcaApiKey': c.ulcaApiKey
        },
        body: JSON.stringify(body)
      }).then(function (r) {
        if (!r.ok) throw new Error('pipeline config failed: HTTP ' + r.status);
        return r.json();
      }).then(function (d) {
        var ep = d.pipelineInferenceAPIEndPoint || {};
        var resolved = {
          callbackUrl: ep.callbackUrl,
          authName: (ep.inferenceApiKey || {}).name,
          authValue: (ep.inferenceApiKey || {}).value,
          services: {}
        };
        (d.pipelineResponseConfig || []).forEach(function (cfg) {
          var first = (cfg.config || [])[0] || {};
          resolved.services[cfg.taskType] = first.serviceId;
        });
        if (!resolved.callbackUrl) throw new Error('pipeline config returned no endpoint');
        self._pipelines[key] = resolved;
        return resolved;
      });
    },

    compute: function (pipe, pipelineTasks, inputData) {
      var headers = { 'Content-Type': 'application/json' };
      if (pipe.authName) headers[pipe.authName] = pipe.authValue;
      return fetch(pipe.callbackUrl, {
        method: 'POST', headers: headers,
        body: JSON.stringify({ pipelineTasks: pipelineTasks, inputData: inputData })
      }).then(function (r) {
        if (!r.ok) throw new Error('compute failed: HTTP ' + r.status);
        return r.json();
      });
    },

    translate: function (text, from, to) {
      var self = this;
      return this.pipeline(['translation'], from, to).then(function (pipe) {
        return self.compute(pipe, [{
          taskType: 'translation',
          config: {
            language: { sourceLanguage: from, targetLanguage: to },
            serviceId: pipe.services.translation
          }
        }], { input: [{ source: text }] });
      }).then(function (d) {
        var out = ((d.pipelineResponse || [])[0] || {}).output || [];
        var target = (out[0] || {}).target;
        if (!target) throw new Error('no translation returned');
        return { ok: true, text: target, provider: 'bhashini' };
      });
    },

    tts: function (text, lang, gender) {
      var self = this;
      var c = this.creds();
      return this.pipeline(['tts'], lang).then(function (pipe) {
        return self.compute(pipe, [{
          taskType: 'tts',
          config: {
            language: { sourceLanguage: lang },
            serviceId: pipe.services.tts,
            gender: gender || c.ttsGender,
            samplingRate: 8000
          }
        }], { input: [{ source: text }] });
      }).then(function (d) {
        var block = (d.pipelineResponse || [])[0] || {};
        var audio = (block.audio || [])[0] || {};
        if (!audio.audioContent) throw new Error('no audio returned');
        return { ok: true, audioUrl: base64ToBlobUrl(audio.audioContent), provider: 'bhashini' };
      });
    },

    asr: function (audioBase64, lang) {
      var self = this;
      return this.pipeline(['asr'], lang).then(function (pipe) {
        return self.compute(pipe, [{
          taskType: 'asr',
          config: {
            language: { sourceLanguage: lang },
            serviceId: pipe.services.asr,
            audioFormat: 'wav',
            samplingRate: 16000
          }
        }], { audio: [{ audioContent: audioBase64 }] });
      }).then(function (d) {
        var out = ((d.pipelineResponse || [])[0] || {}).output || [];
        var source = (out[0] || {}).source;
        if (source === undefined || source === null) throw new Error('no transcript returned');
        return { ok: true, text: source, provider: 'bhashini' };
      });
    }
  };

  /* ============================================================
     Provider 3 — self-hosted AI4Bharat models
     IndicTrans2 (translation) · IndicConformer (ASR) · IndicTTS
     ============================================================ */
  var AI4BharatProvider = {
    name: 'ai4bharat',
    available: function () { return !!loadCreds().ai4bharatBase; },
    supports: function (code) { return S.I18N.isSupportedByBhashini(code); },

    _post: function (path, body) {
      var base = loadCreds().ai4bharatBase.replace(/\/$/, '');
      return fetch(base + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
    },

    translate: function (text, from, to) {
      return this._post('/translate', { text: text, source_language: from, target_language: to })
        .then(function (d) { return { ok: true, text: d.text || d.translation, provider: 'ai4bharat' }; });
    },
    tts: function (text, lang, gender) {
      return this._post('/tts', { text: text, language: lang, gender: gender || 'female' })
        .then(function (d) { return { ok: true, audioUrl: base64ToBlobUrl(d.audio_base64 || d.audio), provider: 'ai4bharat' }; });
    },
    asr: function (audioBase64, lang) {
      return this._post('/asr', { audio_base64: audioBase64, language: lang })
        .then(function (d) { return { ok: true, text: d.text || d.transcript, provider: 'ai4bharat' }; });
    }
  };

  /* ============================================================
     Provider 4 — the browser itself
     ============================================================ */
  var LocalProvider = {
    name: 'browser',
    available: function () { return true; },

    /** True only if the device actually has a voice for this language. */
    supportsTts: function (code) { return !!S.Voice.voiceFor(code); },
    supportsAsr: function (code) {
      var SR = global.SpeechRecognition || global.webkitSpeechRecognition;
      if (!SR) return false;
      // Chrome's recogniser accepts a BCP-47 hint but only genuinely
      // supports a fixed list; Assamese, Bodo and Manipuri are not on it.
      return ['en', 'hi', 'bn', 'ne'].indexOf(code) !== -1;
    },

    translate: function () {
      return Promise.resolve({ ok: false, reason: 'no-translation', provider: 'browser' });
    },

    tts: function (text, lang) {
      return S.Voice.browserSpeak(text, lang).then(function (r) {
        return { ok: !!r.spoken, spoke: true, provider: 'browser', fallback: r.fallback, note: r.note };
      });
    },

    asr: function (_audio, lang) {
      var SR = global.SpeechRecognition || global.webkitSpeechRecognition;
      if (!SR) return Promise.resolve({ ok: false, reason: 'no-asr', provider: 'browser' });
      return new Promise(function (resolve) {
        var rec = new SR();
        rec.lang = S.I18N.lang(lang).bcp47 || 'en-IN';
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        var settled = false;
        rec.onresult = function (ev) {
          settled = true;
          resolve({ ok: true, text: ev.results[0][0].transcript, provider: 'browser' });
        };
        rec.onerror = function (ev) {
          if (settled) return;
          settled = true;
          resolve({ ok: false, reason: ev.error || 'asr-error', provider: 'browser' });
        };
        rec.onend = function () {
          if (!settled) { settled = true; resolve({ ok: false, reason: 'no-speech', provider: 'browser' }); }
        };
        try { rec.start(); } catch (e) { resolve({ ok: false, reason: 'asr-start-failed', provider: 'browser' }); }
        S.LangService._liveRecogniser = rec;
      });
    }
  };

  /* ============================================================
     Facade
     ============================================================ */
  var LangService = {
    Recorder: Recorder,
    providers: {
      proxy: ProxyProvider,
      bhashini: BhashiniProvider,
      ai4bharat: AI4BharatProvider,
      local: LocalProvider
    },
    _liveRecogniser: null,

    creds: loadCreds,
    setCreds: function (patch) {
      var c = Object.assign(loadCreds(), patch);
      saveCreds(c);
      BhashiniProvider._pipelines = {};    // credentials changed, drop cache
      S.bus.emit('lang:creds', c);
      return c;
    },

    /** Ordered list of providers that could serve this language. */
    chain: function (code) {
      var out = [];
      if (ProxyProvider.available() && ProxyProvider.supports(code)) out.push(ProxyProvider);
      if (BhashiniProvider.available() && BhashiniProvider.supports(code)) out.push(BhashiniProvider);
      if (AI4BharatProvider.available() && AI4BharatProvider.supports(code)) out.push(AI4BharatProvider);
      return out;
    },

    /** Does any cloud pipeline exist for this language right now? */
    hasCloud: function (code) { return this.chain(code).length > 0; },

    _tryChain: function (code, fn, fallbackReason) {
      var chain = this.chain(code);
      if (!chain.length) {
        return Promise.resolve({ ok: false, reason: fallbackReason, provider: null });
      }
      var i = 0;
      var attempt = function () {
        if (i >= chain.length) return Promise.resolve({ ok: false, reason: 'all-providers-failed', provider: null });
        var p = chain[i++];
        return fn(p).catch(function (err) {
          console.warn('[SMIVAI] ' + p.name + ' failed:', err && err.message);
          return attempt();
        });
      };
      return attempt();
    },

    /* ---------- translation ---------- */
    translate: function (text, from, to) {
      if (!text || from === to) return Promise.resolve({ ok: true, text: text, provider: 'none' });
      return this._tryChain(to, function (p) { return p.translate(text, from, to); }, 'no-pipeline-for-language');
    },

    /* ---------- text to speech ---------- */
    /**
     * Speak `text` in `lang`. Cloud voices first; the browser voice only
     * if it genuinely has that language. Never silently reads English
     * while claiming another language — the result says what happened.
     */
    speak: function (text, lang, opts) {
      opts = opts || {};
      var self = this;
      return this._tryChain(lang, function (p) { return p.tts(text, lang, opts.gender); }, 'no-tts-for-language')
        .then(function (res) {
          if (res.ok && res.audioUrl) {
            return self._play(res.audioUrl).then(function () { return res; });
          }
          // No cloud voice. Use the browser only if it has this language.
          if (LocalProvider.supportsTts(lang)) {
            return LocalProvider.tts(text, lang);
          }
          return {
            ok: false,
            provider: null,
            reason: res.reason || 'no-tts-for-language',
            note: self.explainNoVoice(lang)
          };
        });
    },

    _play: function (url) {
      var self = this;
      return new Promise(function (resolve) {
        try {
          if (self._audio) { self._audio.pause(); }
          var a = new Audio(url);
          self._audio = a;
          a.onended = function () { S.bus.emit('voice:state', { speaking: false }); resolve(true); };
          a.onerror = function () { S.bus.emit('voice:state', { speaking: false }); resolve(false); };
          S.bus.emit('voice:state', { speaking: true });
          a.play().catch(function () { resolve(false); });
        } catch (e) { resolve(false); }
      });
    },

    stop: function () {
      if (this._audio) { try { this._audio.pause(); } catch (e) { /* ignore */ } }
      if (this._liveRecogniser) { try { this._liveRecogniser.abort(); } catch (e) { /* ignore */ } }
      S.bus.emit('voice:state', { speaking: false });
    },

    /* ---------- speech to text ---------- */
    canListen: function (lang) {
      return this.hasCloud(lang) ? Recorder.supported() : LocalProvider.supportsAsr(lang);
    },

    startListening: function (lang) {
      if (this.hasCloud(lang) && Recorder.supported()) {
        this._mode = 'cloud';
        return Recorder.start().then(function () { return { ok: true, mode: 'cloud' }; })
          .catch(function () { return { ok: false, reason: 'microphone-denied' }; });
      }
      if (LocalProvider.supportsAsr(lang)) {
        this._mode = 'browser';
        this._browserPromise = LocalProvider.asr(null, lang);
        return Promise.resolve({ ok: true, mode: 'browser' });
      }
      return Promise.resolve({ ok: false, reason: 'no-asr-for-language', note: this.explainNoAsr(lang) });
    },

    /** Browser mode ends by itself when the speaker stops: this is that result. */
    whenHeard: function () { return this._browserPromise || Promise.resolve({ ok: false, reason: 'not-listening' }); },

    stopListening: function (lang) {
      var self = this;
      if (this._mode === 'cloud') {
        var wav = Recorder.stop();
        if (!wav) return Promise.resolve({ ok: false, reason: 'no-audio' });
        return this._tryChain(lang, function (p) { return p.asr(wav.base64, lang); }, 'no-asr-for-language');
      }
      if (this._mode === 'browser') {
        if (this._liveRecogniser) { try { this._liveRecogniser.stop(); } catch (e) { /* ignore */ } }
        return this._browserPromise || Promise.resolve({ ok: false, reason: 'no-asr' });
      }
      return Promise.resolve({ ok: false, reason: 'not-listening' });
    },

    cancelListening: function () {
      if (this._mode === 'cloud') Recorder.cancel();
      if (this._liveRecogniser) { try { this._liveRecogniser.abort(); } catch (e) { /* ignore */ } }
      this._mode = null;
    },

    /* ---------- honest capability reporting ---------- */
    explainNoVoice: function (code) {
      var l = S.I18N.lang(code);
      if (l.community) {
        return l.name + ' is not one of India’s scheduled languages, so neither Bhashini nor ' +
          'AI4Bharat publishes a voice for it. SMIVAI shows ' + l.name + ' text and plays recorded ' +
          'prompts where a speaker has contributed them.';
      }
      if (!this.hasCloud(code)) {
        return 'No Bhashini or AI4Bharat connection is configured, and this device has no ' +
          l.name + ' voice installed. Connect a pipeline in Settings to enable spoken ' + l.name + '.';
      }
      return 'The ' + l.name + ' voice could not be reached just now. The text is shown instead.';
    },

    explainNoAsr: function (code) {
      var l = S.I18N.lang(code);
      if (l.community) {
        return 'Speech recognition is not available for ' + l.name + '. Please use the buttons on screen.';
      }
      return 'Speech recognition for ' + l.name + ' needs a Bhashini or AI4Bharat connection. ' +
        'Please use the buttons on screen.';
    },

    /** Full capability matrix — powers the caregiver language panel. */
    capabilities: function (code) {
      var l = S.I18N.lang(code);
      var cloud = this.chain(code);
      var coverage = S.I18N.coverage(code);
      return {
        language: l,
        interface: coverage,
        cloudProviders: cloud.map(function (p) { return p.name; }),
        translation: cloud.length ? 'available' : (l.community ? 'unavailable' : 'not-configured'),
        tts: cloud.length ? 'available' : (LocalProvider.supportsTts(code) ? 'device-voice' : (l.community ? 'unavailable' : 'not-configured')),
        asr: cloud.length && Recorder.supported() ? 'available'
          : (LocalProvider.supportsAsr(code) ? 'device-only' : (l.community ? 'unavailable' : 'not-configured')),
        reason: l.community
          ? 'Not a scheduled language — no Bhashini or AI4Bharat model exists.'
          : (cloud.length ? 'Served by ' + cloud[0].name + '.' : 'No pipeline configured.')
      };
    }
  };

  S.LangService = LangService;
})(window);
