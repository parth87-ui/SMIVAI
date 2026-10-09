/* ============================================================
   SMIVAI — Activity 7 · Complete the Pattern  (Premium)
   Reasoning and sustained attention.

   A short row of shapes with the last one missing. Everything stays on
   screen, there is no countdown, and a wrong choice is only ever "not
   that one" — the row never disappears or resets.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  S.tx('pattern_instruction', 'Choose the shape that comes next.');
  S.tx('pattern_sub', 'Look at the row, then tap your answer below.');

  var LEVELS = {
    very_easy: { rounds: 4, len: 4, options: 2, kinds: ['AB'] },
    easy: { rounds: 5, len: 5, options: 3, kinds: ['AB'] },
    medium: { rounds: 6, len: 6, options: 3, kinds: ['AB', 'ABC', 'AABB'] },
    hard: { rounds: 7, len: 7, options: 4, kinds: ['ABC', 'AABB', 'ABB', 'ABCB'] },
    very_hard: { rounds: 8, len: 8, options: 4, kinds: ['ABC', 'AABB', 'ABB', 'ABCB'] }
  };

  var SHAPES = ['circle', 'square', 'triangle', 'diamond', 'flower'];
  var COLORS = [
    { id: 'blue', a: '#9FB8E8', b: '#5B82C4' },
    { id: 'peach', a: '#F8CCAC', b: '#EFA57A' },
    { id: 'green', a: '#A9D6C0', b: '#4F9D91' },
    { id: 'lav', a: '#C6BBEE', b: '#9C8BD8' },
    { id: 'cream', a: '#F6E2B8', b: '#E4A84A' }
  ];

  function shapeSvg(tok, size) {
    var c = tok.color, id = 'pg' + Math.random().toString(36).slice(2, 7);
    var fill = 'url(#' + id + ')';
    var body = {
      circle: '<circle cx="50" cy="50" r="34" fill="' + fill + '"/>',
      square: '<rect x="18" y="18" width="64" height="64" rx="14" fill="' + fill + '"/>',
      triangle: '<path d="M50 14 86 82H14Z" fill="' + fill + '" stroke-linejoin="round"/>',
      diamond: '<path d="M50 12 88 50 50 88 12 50Z" fill="' + fill + '"/>',
      flower: '<g fill="' + fill + '"><circle cx="50" cy="26" r="17"/><circle cx="50" cy="74" r="17"/><circle cx="26" cy="50" r="17"/><circle cx="74" cy="50" r="17"/></g><circle cx="50" cy="50" r="12" fill="#FFFFFF" opacity=".75"/>'
    }[tok.shape];
    return '<svg viewBox="0 0 100 100" width="' + (size || 76) + '" height="' + (size || 76) + '" aria-hidden="true">' +
      '<defs><radialGradient id="' + id + '" cx="35%" cy="30%" r="80%">' +
      '<stop offset="0" stop-color="' + c.a + '"/><stop offset="1" stop-color="' + c.b + '"/></radialGradient></defs>' + body + '</svg>';
  }

  function tokenName(tok) { return tok.color.id + ' ' + tok.shape; }
  function same(a, b) { return a.shape === b.shape && a.color.id === b.color.id; }

  S.Games.pattern = {
    id: 'pattern',

    start: function (ctx) {
      var cfg = LEVELS[ctx.difficulty] || LEVELS.medium;
      var round = 0, locked = false;
      ctx.setContentLevel(1);

      function makeRound() {
        var kind = S.pick(cfg.kinds);
        var palette = S.shuffle(COLORS).slice(0, 3);
        var shapes = S.shuffle(SHAPES).slice(0, 3);
        var atoms = [0, 1, 2].map(function (i) { return { shape: shapes[i], color: palette[i] }; });
        var order = { AB: [0, 1], ABC: [0, 1, 2], AABB: [0, 0, 1, 1], ABB: [0, 1, 1], ABCB: [0, 1, 2, 1] }[kind];

        var seq = [];
        for (var i = 0; i < cfg.len; i++) seq.push(atoms[order[i % order.length]]);
        var answer = seq[seq.length - 1];
        var shown = seq.slice(0, seq.length - 1);

        /* distractors: the other atoms, plus a mixed-up version of the answer */
        var pool = atoms.filter(function (a) { return !same(a, answer); });
        pool.push({ shape: answer.shape, color: S.pick(COLORS.filter(function (c) { return c.id !== answer.color.id; })) });
        pool.push({ shape: S.pick(SHAPES.filter(function (s2) { return s2 !== answer.shape; })), color: answer.color });
        var options = S.shuffle([answer].concat(S.shuffle(pool).slice(0, cfg.options - 1)));
        return { shown: shown, answer: answer, options: options };
      }

      function draw() {
        var r = makeRound();
        ctx.setInstruction(S.t('pattern_instruction'), S.tx('pattern_sub', 'Look at the row, then tap your answer below.'));
        ctx.progress(round, cfg.rounds);

        ctx.el.innerHTML =
          '<div class="pattern-row" role="img" aria-label="' + S.esc(r.shown.map(tokenName).join(', ') + ', then?') + '">' +
            r.shown.map(function (t) { return '<span class="pt">' + shapeSvg(t) + '</span>'; }).join('') +
            '<span class="pt pt-q">?</span>' +
          '</div>' +
          '<div class="opt-grid pattern-opts">' +
            r.options.map(function (t, i) {
              return '<button class="opt" data-i="' + i + '" aria-label="' + S.esc(tokenName(t)) + '">' + shapeSvg(t, 86) + '</button>';
            }).join('') +
          '</div>';

        locked = false;
        S.qsa('.opt', ctx.el).forEach(function (btn, i) {
          btn.addEventListener('click', function () {
            if (locked) return;
            var correct = same(r.options[i], r.answer);
            ctx.attempt(correct);
            if (correct) {
              locked = true;
              btn.setAttribute('data-state', 'correct');
              ctx.praise();
              round += 1;
              ctx.progress(round, cfg.rounds);
              setTimeout(function () {
                if (round >= cfg.rounds) ctx.finish();
                else draw();
              }, 800);
            } else {
              btn.setAttribute('data-state', 'soft');
              ctx.encourage();
              setTimeout(function () { btn.removeAttribute('data-state'); }, 900);
            }
          });
        });
      }

      draw();
    }
  };
})(window);
