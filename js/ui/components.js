/* ============================================================
   SMIVAI — ui/components.js
   Shared building blocks: toasts, modals, rings, chips, the disclaimer.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  /* ---------------- Toast ---------------- */
  S.toast = function (message, kind, ms) {
    var root = S.qs('#toast-root');
    if (!root) return;
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    var icon = kind === 'ok' ? '✓' : kind === 'warn' ? '⚠' : kind === 'err' ? '!' : 'ℹ';
    el.innerHTML = '<span class="emoji">' + icon + '</span><span>' + S.esc(message) + '</span>';
    root.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    }, ms || 3200);
  };

  /* ---------------- Modal ---------------- */
  var Modal = {
    _last: null,
    open: function (opts) {
      this.close();
      var root = S.qs('#modal-root');
      var wrap = document.createElement('div');
      wrap.className = 'modal-backdrop';
      wrap.innerHTML =
        '<div class="modal" role="dialog" aria-modal="true" aria-label="' + S.esc(opts.title || 'Dialog') + '">' +
          '<div class="modal-head">' +
            '<div><h2 class="t-h2">' + S.esc(opts.title || '') + '</h2>' +
              (opts.subtitle ? '<p class="t-small muted" style="margin-top:6px">' + S.esc(opts.subtitle) + '</p>' : '') +
            '</div>' +
            '<button class="icon-btn" data-modal-close aria-label="Close">✕</button>' +
          '</div>' +
          '<div class="modal-body">' + (opts.body || '') + '</div>' +
          (opts.footer ? '<div class="modal-foot">' + opts.footer + '</div>' : '') +
        '</div>';
      root.appendChild(wrap);
      this._last = wrap;

      wrap.addEventListener('mousedown', function (ev) {
        if (ev.target === wrap) Modal.close();
      });
      S.qsa('[data-modal-close]', wrap).forEach(function (b) {
        b.addEventListener('click', function () { Modal.close(); });
      });
      document.addEventListener('keydown', Modal._esc);

      if (opts.handlers) S.bind(wrap, opts.handlers);
      if (opts.onMount) opts.onMount(wrap);

      var focusable = S.qs('input,select,textarea,button:not([data-modal-close])', wrap);
      if (focusable && !opts.noAutofocus) setTimeout(function () { focusable.focus(); }, 60);
      return wrap;
    },
    _esc: function (ev) { if (ev.key === 'Escape') Modal.close(); },
    close: function () {
      if (this._last && this._last.parentNode) this._last.parentNode.removeChild(this._last);
      this._last = null;
      document.removeEventListener('keydown', Modal._esc);
    },
    confirm: function (opts) {
      return new Promise(function (resolve) {
        Modal.open({
          title: opts.title,
          body: '<p class="t-body">' + S.esc(opts.message) + '</p>',
          footer:
            '<button class="btn btn-secondary" data-act="no">' + S.esc(opts.cancelText || 'Cancel') + '</button>' +
            '<button class="btn ' + (opts.danger ? 'btn-danger' : '') + '" data-act="yes">' + S.esc(opts.okText || 'Confirm') + '</button>',
          handlers: {
            no: function () { Modal.close(); resolve(false); },
            yes: function () { Modal.close(); resolve(true); }
          }
        });
      });
    }
  };
  S.Modal = Modal;

  /* ---------------- Pieces ---------------- */
  var UI = {

    /** Circular progress ring (SVG string). */
    ring: function (value, max, opts) {
      opts = opts || {};
      var size = opts.size || 108;
      var stroke = opts.stroke || 11;
      var r = (size - stroke) / 2;
      var c = 2 * Math.PI * r;
      var pct = max ? S.clamp(value / max, 0, 1) : 0;
      var color = opts.color || 'var(--green)';
      return '' +
        '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="' +
          S.esc(opts.aria || (value + ' of ' + max)) + '">' +
          '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--ivory-sunk)" stroke-width="' + stroke + '"/>' +
          '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + stroke + '"' +
            ' stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - pct)).toFixed(1) + '"' +
            ' transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' +
          '<text x="50%" y="50%" text-anchor="middle" dy=".05em" font-size="' + (opts.fontSize || 26) + '"' +
            ' font-weight="900" fill="var(--text)" font-family="var(--font)">' + S.esc(opts.center !== undefined ? opts.center : value) + '</text>' +
          (opts.sub ? '<text x="50%" y="68%" text-anchor="middle" font-size="12" font-weight="800" fill="var(--muted)" font-family="var(--font)">' + S.esc(opts.sub) + '</text>' : '') +
        '</svg>';
    },

    bar: function (pct, cls) {
      return '<div class="bar ' + (cls || '') + '"><span style="width:' + S.clamp(pct, 0, 100) + '%"></span></div>';
    },

    chip: function (text, cls, icon) {
      return '<span class="chip ' + (cls || '') + '">' + (icon ? '<span class="emoji">' + icon + '</span>' : '') + S.esc(text) + '</span>';
    },

    /** Initials in a circle. Pass the person too and a photograph of them
        replaces it wherever one exists. */
    avatar: function (name, cls, person) {
      var who = person || {};
      var id = who.patient_id || who.doctor_id || who.caregiver_id || who.id || '';
      return '<div class="' + (cls || 'ps-avatar') + '"' +
        (id ? ' data-person="' + S.esc(id) + '" data-gender="' + S.esc(who.gender || '') + '"' : '') +
        '>' + S.esc(S.initials(name)) + '</div>';
    },

    trend: function (trend) {
      var t = S.Scoring.trendLabel(trend);
      return '<span class="trend ' + t.cls + '"><span aria-hidden="true">' + t.icon + '</span>' + S.esc(t.text) + '</span>';
    },

    empty: function (icon, title, text, actionHtml) {
      return '<div class="empty">' +
        '<div class="empty-ico emoji">' + icon + '</div>' +
        '<div class="empty-title">' + S.esc(title) + '</div>' +
        (text ? '<p>' + S.esc(text) + '</p>' : '') +
        (actionHtml ? '<div style="margin-top:20px">' + actionHtml + '</div>' : '') +
        '</div>';
    },

    /** Shown wherever progress, scores or ability estimates are displayed. */
    progressDisclaimer: function () {
      return '<div class="disclaimer" role="note"><span class="emoji">ℹ️</span><span><b>' +
        S.esc(S.tx('progress_disc', 'This is a progress-tracking aid, not a medical diagnosis.')) +
        '</b></span></div>';
    },

    disclaimer: function (extra) {
      return '<div class="disclaimer"><span class="emoji">ℹ️</span><span>' +
        'SMIVAI provides cognitive activity and performance insights. It does not replace professional medical diagnosis.' +
        (extra ? ' ' + S.esc(extra) : '') +
        '</span></div>';
    },

    /** 🔊 LISTEN button. `data-act` is wired by the caller. */
    listen: function (act, label) {
      return '<button class="listen-btn" data-act="' + S.esc(act || 'listen') + '">' +
        '<span class="emoji">🔊</span><span>' + S.esc(label || 'Listen') + '</span></button>';
    },

    stat: function (label, value, foot, unit) {
      return '<div class="stat">' +
        '<div class="st-label">' + S.esc(label) + '</div>' +
        '<div class="st-value">' + S.esc(value) + (unit ? '<small>' + S.esc(unit) + '</small>' : '') + '</div>' +
        (foot ? '<div class="st-foot">' + foot + '</div>' : '') +
        '</div>';
    },

    sectionTitle: function (title, actionsHtml) {
      return '<div class="section-title"><h2 class="t-h2">' + S.esc(title) + '</h2>' +
        (actionsHtml ? '<div class="st-actions">' + actionsHtml + '</div>' : '') + '</div>';
    },

    /* ---------- Text size stepper + Language ----------
       One piece, used in the patient top bar and on the welcome and
       sign-in screens. The page reflows by itself (every size is in rem),
       so nothing is re-rendered: only the buttons' states change. */
    FONT_STEPS: ['md', 'lg', 'xl', 'xxl'],

    readingControls: function () {
      var t = function (k, en) { return S.tx(k, en); };
      var lang = S.I18N.lang(S.I18N.current());
      return '<div class="fz-group" role="group" aria-label="' + S.esc(t('font_size', 'Font Size')) + '">' +
          '<button type="button" class="fz-step" data-act="fontDown" aria-label="' + S.esc(t('font_smaller', 'Smaller text')) + '">' + S.icon('minus') + '</button>' +
          '<span class="fz-aa" aria-hidden="true">Aa</span>' +
          '<button type="button" class="fz-step" data-act="fontUp" aria-label="' + S.esc(t('font_larger', 'Larger text')) + '">' + S.icon('plus') + '</button>' +
          '<span class="sr-only" aria-live="polite" data-fz-live></span>' +
        '</div>' +
        '<button type="button" class="lang-btn" data-act="langMenu" aria-label="' + S.esc(t('language', 'Language') + ': ' + lang.native) + '">' +
          S.icon('globe') + '<span class="lb-label">' + S.esc(t('language', 'Language')) + '</span></button>';
    },

    /** Disable − at the smallest size and + at the largest. */
    syncReading: function (root) {
      var steps = UI.FONT_STEPS, i = Math.max(0, steps.indexOf(S.Prefs.get('font')));
      S.qsa('[data-act="fontDown"]', root || document).forEach(function (b) { b.disabled = i <= 0; });
      S.qsa('[data-act="fontUp"]', root || document).forEach(function (b) { b.disabled = i >= steps.length - 1; });
    },

    /** Handlers for the controls. after() runs once the size has changed. */
    readingHandlers: function (after) {
      function step(dir, btn) {
        var steps = UI.FONT_STEPS, i = Math.max(0, steps.indexOf(S.Prefs.get('font')));
        var n = Math.max(0, Math.min(steps.length - 1, i + dir));
        if (n === i) return;
        S.Prefs.set('font', steps[n]);
        UI.syncReading();
        var names = { md: S.tx('font_md', 'Standard'), lg: S.tx('font_lg', 'Large'), xl: S.tx('font_xl', 'Extra large'), xxl: S.tx('font_xxl', 'Largest') };
        S.qsa('[data-fz-live]').forEach(function (el) { el.textContent = S.tx('font_size', 'Font Size') + ': ' + names[steps[n]]; });
        /* at either end the pressed button switches off; keep focus in the group */
        if (btn && btn.disabled) { var other = btn.parentNode.querySelector('.fz-step:not([disabled])'); if (other) other.focus(); }
        if (after) after();
      }
      return {
        fontDown: function (el) { step(-1, el); },
        fontUp: function (el) { step(1, el); },
        langMenu: function () { S.Patient.languagePicker(); }
      };
    },

    /** Small pill with the current connectivity + sync state. */
    statusPill: function (patientVoice) {
      var lbl = patientVoice ? S.Sync.patientLabel() : S.Sync.label();
      return '<button class="status-pill" data-act="toggleOffline" data-state="' + lbl.state + '" ' +
        'title="Demo control: switch the device between online and offline">' +
        '<span class="status-dot"></span><span class="sp-text">' + S.esc(lbl.text) + '</span></button>';
    },

    languageNote: function (patient) {
      var st = S.Voice.status(patient.language);
      if (st.canSpeak) return '';
      return '<div class="alert info" style="margin-top:16px"><span class="al-ico emoji">🔊</span><div>' +
        '<div class="al-title">Voice for ' + S.esc(st.lang.name) + '</div>' +
        '<div class="al-body">' + S.esc(st.note) + '</div></div></div>';
    }
  };

  S.UI = UI;

  /* ============================================================
     Photo slots
     A slot holds drawn art until a real photograph turns up beside the
     app. Nothing is fetched from the internet: the file either sits in
     assets/ or it does not, and the drawing stays put until the image
     has actually decoded, so a missing or broken file changes nothing.
     ============================================================ */
  S.Photo = {
    /** el: the element holding the drawing.
        o: { file, alt, ratio, title, sub }, where file is one path or a
        list tried in order — a photograph for this particular person
        first, a general one behind it, the drawing if neither is there. */
    into: function (el, o) {
      if (!el || !o || !o.file) return;
      var list = [].concat(o.file), i = 0;
      function attempt() {
        if (i >= list.length) return;            // no file: the drawing stays
        var file = list[i++];
        var img = new Image();
        img.onerror = attempt;
        img.onload = function () {
          if (!document.body.contains(el)) return;
          el.innerHTML =
            '<figure class="ph-shot ratio-' + (o.ratio || '5x3') + (o.cls ? ' ' + o.cls : '') + '">' +
              '<img src="' + S.esc(file) + '" alt="' + S.esc(o.alt || '') + '">' +
              (o.title
                ? '<figcaption class="ph-cap"><b>' + S.esc(o.title) + '</b>' +
                    (o.sub ? '<span>' + S.esc(o.sub) + '</span>' : '') + '</figcaption>'
                : '') +
            '</figure>';
        };
        img.src = file;
      }
      attempt();
    },

    /* Photographs of particular people, by their id. Empty by default:
       fill it in when you have a real photograph of that person, e.g.
       S.Photo.PEOPLE['dir_neha'] = 'assets/doctor-dir_neha.jpg'; */
    PEOPLE: {},

    /** patient | caregiver | doctor | '' — read from the id the app uses. */
    kindOf: function (id) {
      if (/^dr_|^dir_/.test(id)) return 'doctor';
      if (/^cg_/.test(id)) return 'caregiver';
      if (/^pat_/.test(id)) return 'patient';
      return '';
    },

    /** Turn every drawn avatar under root into a photograph where one
        exists. Called after each mount, so no screen has to ask. */
    sweep: function (root) {
      var self = this;
      S.qsa('[data-person]', root || document).forEach(function (node) {
        var id = node.getAttribute('data-person') || '';
        var kind = self.kindOf(id);
        if (!kind) return;                       // family contacts keep their drawing
        /* the marker sits on the drawing itself, or on the circle holding
           the initials — either way the circle is what gets the photo */
        var box = node.tagName.toLowerCase() === 'svg' ? node.parentNode : node;
        if (!box) return;
        var files = [];
        if (self.PEOPLE[id]) files.push(self.PEOPLE[id]);
        files = files.concat(self.avatarFiles({ gender: node.getAttribute('data-gender') }, kind));
        self.load(files, function (file) {
          if (!document.body.contains(box)) return;
          box.innerHTML = '<img src="' + S.esc(file) + '" alt="">';
          box.classList.add('has-photo');
        });
      });
    },

    /** First file in the list that actually loads. */
    load: function (files, done) {
      var i = 0;
      (function attempt() {
        if (i >= files.length) return;
        var file = files[i++];
        var img = new Image();
        img.onerror = attempt;
        img.onload = function () { done(file); };
        img.src = file;
      })();
    },

    /** Which headshots could belong to this person, best match first.
        A doctor is not drawn from the patients' pictures and vice versa:
        a caregiver wearing the patient's face would be worse than no
        photograph at all. */
    avatarFiles: function (person, role) {
      var g = String((person && person.gender) || '').toLowerCase();
      g = g === 'female' || g === 'f' ? 'female' : g === 'male' || g === 'm' ? 'male' : '';
      if (role && role !== 'patient') {
        return (g ? ['assets/avatar-' + role + '-' + g + '.jpg'] : [])
          .concat('assets/avatar-' + role + '.jpg');
      }
      return ['assets/avatar-' + (g || 'male') + '.jpg'];
    },

    /** Fill an .avatar with that headshot. The circle and the crop come
        from the .avatar box itself, so nothing else has to change.
        Use it only for the person whose name sits beside it: one photo
        per gender would turn a list of people into a row of twins. */
    avatarInto: function (el, person, role) {
      if (!el) return;
      var list = this.avatarFiles(person, role), i = 0;
      function attempt() {
        if (i >= list.length) return;      // no photograph: initials or the drawing stay
        var file = list[i++];
        var img = new Image();
        img.onerror = attempt;
        img.onload = function () {
          if (!document.body.contains(el)) return;
          /* alt is empty on purpose: the name is right next to it, so a
             screen reader would otherwise read the person twice. */
          el.innerHTML = '<img src="' + S.esc(file) + '" alt="">';
          el.classList.add('has-photo');
        };
        img.src = file;
      }
      attempt();
    }
  };
})(window);
