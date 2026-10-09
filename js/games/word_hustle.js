/* ============================================================
   SMIVAI — Activity 8 · Word Hustle  (Premium)
   Language and word finding.

   A picture, and the letters of its name jumbled underneath. Tap the
   letters in order to spell it. Tapping a placed letter takes it back,
   so nothing is ever lost by a mistaken tap.

   The words come from the same item bank as the other activities, so
   they are everyday objects the patient already recognises.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  S.tx('word_instruction', 'Spell the word in the picture.');
  S.tx('word_sub', 'Tap the letters in order. Tap a letter again to take it back.');
  S.tx('word_clue', 'Show me a clue');

  var LEVELS = {
    very_easy: { rounds: 3, min: 3, max: 4 },
    easy: { rounds: 4, min: 3, max: 5 },
    medium: { rounds: 5, min: 5, max: 6 },
    hard: { rounds: 6, min: 6, max: 9 },
    very_hard: { rounds: 7, min: 6, max: 10 }
  };

  S.Games.word_hustle = {
    id: 'word_hustle',

    start: function (ctx) {
      var cfg = LEVELS[ctx.difficulty] || LEVELS.medium;
      var pool = S.Content.pool({ levels: [1, 2] }).filter(function (it) {
        var w = String(it.label).replace(/[^A-Za-z]/g, '');
        return w.length >= cfg.min && w.length <= cfg.max && w === it.label.replace(/\s/g, '');
      });
      if (pool.length < cfg.rounds) pool = S.Content.pool({ levels: [1, 2] }).filter(function (it) { return /^[A-Za-z]{3,9}$/.test(it.label); });
      var items = S.sample(pool, cfg.rounds);
      ctx.setContentLevel(2);

      var round = 0, placed = [], locked = false, current = null;

      function draw() {
        current = items[round];
        var word = current.label.toUpperCase();
        placed = [];
        var letters = S.shuffle(word.split('')).map(function (ch, i) { return { ch: ch, id: i, used: false }; });
        locked = false;

        ctx.setInstruction(S.t('word_instruction'), S.t('word_sub'));
        ctx.progress(round, cfg.rounds);

        ctx.el.innerHTML =
          '<div class="word-stage">' +
            '<div class="word-pic"><span class="wp-face emoji">' + current.face + '</span>' +
              '<button class="listen-btn" id="wh-say">' + S.icon('volume') + S.esc(S.t('listen')) + '</button></div>' +
            '<div class="word-slots" id="wh-slots" aria-live="polite" aria-label="Your answer">' +
              word.split('').map(function (_, i) { return '<span class="slot-box" data-slot="' + i + '"></span>'; }).join('') +
            '</div>' +
            '<div class="word-tiles" id="wh-tiles">' +
              letters.map(function (l) {
                return '<button class="ltile" data-id="' + l.id + '">' + S.esc(l.ch) + '</button>';
              }).join('') +
            '</div>' +
            '<div class="row" style="justify-content:center;margin-top:1.25rem">' +
              '<button class="btn btn-outline" id="wh-clear">' + S.icon('refresh') + S.esc(S.tx('start_over', 'Start this word again')) + '</button>' +
            '</div>' +
          '</div>';

        var slots = S.qsa('.slot-box', ctx.el);
        var tiles = S.qsa('.ltile', ctx.el);

        function paint() {
          slots.forEach(function (s, i) {
            var p = placed[i];
            s.textContent = p ? p.ch : '';
            s.classList.toggle('filled', !!p);
          });
          tiles.forEach(function (t) {
            var id = +t.getAttribute('data-id');
            var used = placed.some(function (p) { return p && p.id === id; });
            t.disabled = used || locked;
            t.classList.toggle('is-used', used);
          });
        }

        function check() {
          if (placed.length < word.length || placed.some(function (p) { return !p; })) return;
          var guess = placed.map(function (p) { return p.ch; }).join('');
          var correct = guess === word;
          ctx.attempt(correct);
          if (correct) {
            locked = true;
            slots.forEach(function (s) { s.classList.add('right'); });
            ctx.praise(S.t('well_done') + ' — ' + current.label + '!');
            S.Voice.speak(current.label, ctx.patient.language);
            round += 1;
            ctx.progress(round, cfg.rounds);
            setTimeout(function () { if (round >= cfg.rounds) ctx.finish(); else draw(); }, 1100);
          } else {
            locked = true;
            slots.forEach(function (s) { s.classList.add('wrong'); });
            ctx.encourage();
            setTimeout(function () {
              slots.forEach(function (s) { s.classList.remove('wrong'); });
              placed = [];
              locked = false;
              paint();
            }, 1000);
          }
        }

        tiles.forEach(function (t) {
          t.addEventListener('click', function () {
            if (locked) return;
            var id = +t.getAttribute('data-id');
            var letter = letters.filter(function (l) { return l.id === id; })[0];
            var idx = placed.length;
            if (idx >= word.length) return;
            placed[idx] = letter;
            paint();
            check();
          });
        });

        slots.forEach(function (s, i) {
          s.addEventListener('click', function () {
            if (locked || !placed[i]) return;
            placed.splice(i, 1);
            paint();
          });
        });

        var say = S.qs('#wh-say', ctx.el);
        say.addEventListener('click', function () {
          say.classList.add('is-speaking');
          S.Voice.speak(current.label, ctx.patient.language).then(function (r) {
            say.classList.remove('is-speaking');
            if (!r.spoken && r.note) S.toast(r.note, 'warn', 4000);
          });
        });

        S.qs('#wh-clear', ctx.el).addEventListener('click', function () {
          if (locked) return;
          placed = [];
          paint();
          ctx.clearFeedback();
        });

        paint();
      }

      draw();
    }
  };
})(window);
