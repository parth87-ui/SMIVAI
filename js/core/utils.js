/* ============================================================
   SMIVAI — utils.js
   Tiny helpers shared by every layer. No framework, no build step:
   the whole app must run from a static folder, even offline.
   ============================================================ */
(function (global) {
  'use strict';

  var S = global.S || (global.S = {});

  /* ---------------- DOM ---------------- */
  S.qs = function (sel, root) { return (root || document).querySelector(sel); };
  S.qsa = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  S.esc = function (str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  /**
   * Render an HTML string into a container and wire up [data-act] handlers.
   * handlers: { actionName: function(element, event, arg) }
   */
  S.mount = function (container, html, handlers) {
    if (!container) return;
    container.innerHTML = html;
    S.bind(container, handlers);
    /* Photographs take the place of drawn avatars wherever one exists.
       Done here so every screen gets it without asking. */
    if (S.Photo && S.Photo.sweep) S.Photo.sweep(container);
    return container;
  };

  S.bind = function (root, handlers) {
    if (!handlers) return;
    S.qsa('[data-act]', root).forEach(function (el) {
      var name = el.getAttribute('data-act');
      var fn = handlers[name];
      if (!fn) return;
      var evName = el.getAttribute('data-on') || (el.tagName === 'SELECT' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ? 'change' : 'click');
      el.addEventListener(evName, function (ev) {
        fn(el, ev, el.getAttribute('data-arg'));
      });
    });
  };

  S.scrollTop = function () {
    try { window.scrollTo({ top: 0, behavior: 'instant' }); }
    catch (e) { window.scrollTo(0, 0); }
  };

  /* ---------------- Ids ---------------- */
  var counter = 0;
  S.uid = function (prefix) {
    counter += 1;
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + counter.toString(36) +
      Math.random().toString(36).slice(2, 6);
  };

  /* ---------------- Numbers ---------------- */
  S.clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
  S.round = function (v, dp) { var m = Math.pow(10, dp || 0); return Math.round(v * m) / m; };
  S.pct = function (v) { return Math.round(v * 100); };
  S.avg = function (arr) {
    if (!arr || !arr.length) return 0;
    return arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
  };
  S.sum = function (arr) { return (arr || []).reduce(function (a, b) { return a + b; }, 0); };

  /* ---------------- Random (seedable, so demo data is stable) ---------------- */
  S.rng = function (seed) {
    var s = seed >>> 0 || 12345;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return (s >>> 0) / 4294967296;
    };
  };
  S.hashSeed = function (str) {
    var h = 2166136261;
    for (var i = 0; i < String(str).length; i++) {
      h ^= String(str).charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h >>> 0;
  };
  S.shuffle = function (arr, rand) {
    var r = rand || Math.random;
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  S.sample = function (arr, n, rand) { return S.shuffle(arr, rand).slice(0, n); };
  S.pick = function (arr, rand) { return arr[Math.floor((rand || Math.random)() * arr.length)]; };

  /* ---------------- Dates ---------------- */
  S.todayISO = function () { return S.toISO(new Date()); };
  S.toISO = function (d) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  };
  S.fromISO = function (iso) {
    var parts = String(iso).split('-');
    return new Date(+parts[0], +parts[1] - 1, +parts[2]);
  };
  S.addDays = function (iso, n) {
    var d = S.fromISO(iso); d.setDate(d.getDate() + n); return S.toISO(d);
  };
  S.dayOfWeek = function (iso) { return S.fromISO(iso).getDay(); }; // 0=Sun
  S.prettyDate = function (iso) {
    var d = S.fromISO(iso);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  };
  S.shortDate = function (iso) {
    var d = S.fromISO(iso);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return d.getDate() + ' ' + months[d.getMonth()];
  };
  S.weekdayName = function (iso) {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][S.dayOfWeek(iso)];
  };
  S.relativeDay = function (iso) {
    var t = S.todayISO();
    if (iso === t) return 'Today';
    if (iso === S.addDays(t, -1)) return 'Yesterday';
    if (iso === S.addDays(t, 1)) return 'Tomorrow';
    return S.prettyDate(iso);
  };

  /** "08:30" -> "8:30 AM" */
  S.prettyTime = function (hhmm) {
    if (!hhmm) return '';
    var p = String(hhmm).split(':');
    var h = parseInt(p[0], 10), m = p[1] || '00';
    var ap = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + ':' + m + ' ' + ap;
  };
  S.nowHHMM = function () {
    var d = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getHours()) + ':' + p(d.getMinutes());
  };
  S.minutesOf = function (hhmm) {
    var p = String(hhmm || '00:00').split(':');
    return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
  };
  S.partOfDay = function () {
    var h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  };
  S.stamp = function () { return new Date().toISOString(); };
  S.prettyStamp = function (isoStamp) {
    var d = new Date(isoStamp);
    if (isNaN(d.getTime())) return '';
    return S.shortDate(S.toISO(d)) + ' · ' + S.prettyTime(
      (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes()
    );
  };

  /* ---------------- Text ---------------- */
  S.initials = function (name) {
    return String(name || '?').split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  };
  S.titleCase = function (s) {
    return String(s || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  };
  S.plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); };

  /* ---------------- Events ---------------- */
  S.emitter = function () {
    var map = {};
    return {
      on: function (evt, fn) { (map[evt] = map[evt] || []).push(fn); return function () { map[evt] = map[evt].filter(function (f) { return f !== fn; }); }; },
      emit: function (evt, payload) { (map[evt] || []).forEach(function (fn) { try { fn(payload); } catch (e) { console.warn('[SMIVAI] listener error', e); } }); }
    };
  };

  S.bus = S.emitter();

  /* ---------------- Safe async ---------------- */
  S.delay = function (ms) { return new Promise(function (res) { setTimeout(res, ms); }); };

  /* ---------------- Friendly error wrapper ----------------
     Elderly users must never see a stack trace or an API code. */
  S.safe = function (fn, friendlyMessage) {
    try { return fn(); }
    catch (err) {
      console.error('[SMIVAI]', err);
      if (S.toast) S.toast(friendlyMessage || 'Something went wrong. Please try again.', 'warn');
      return null;
    }
  };
})(window);
