/* ============================================================
   SMIVAI — Activity 1 · Picture Matching
   Attention and visual recognition.

   Every picture stays visible the whole time — this is a scanning and
   association task, not a memory task. Easy pairs identical pictures;
   Medium and Hard pair pictures that belong together (cup ↔ tea).
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var LEVELS = {
    very_easy: { pairs: 2, cols: 2, mode: 'identical' },
    easy: { pairs: 3, cols: 3, mode: 'identical' },
    medium: { pairs: 5, cols: 4, mode: 'related' },
    hard: { pairs: 7, cols: 4, mode: 'related' },
    very_hard: { pairs: 8, cols: 4, mode: 'related' }
  };

  S.Games.picture_matching = {
    id: 'picture_matching',
    LEVELS: LEVELS,            // what each level really serves (read by tests)

    start: function (ctx) {
      var cfg = LEVELS[ctx.difficulty] || LEVELS.medium;
      var levels = S.M.isGentle(ctx.difficulty) ? [1] : [1, 2];
      var pairs = S.Content.pairs(cfg.pairs, { mode: cfg.mode, levels: levels });

      ctx.setContentLevel(cfg.mode === 'related' ? 2 : 1);
      ctx.setInstruction(
        S.t(cfg.mode === 'identical' ? 'match_same' : 'match_pictures'),
        S.t('tap_then_pair')
      );

      var tiles = [];
      pairs.forEach(function (p, i) {
        tiles.push({ uid: 'a' + i, key: 'k' + i, item: p.a });
        tiles.push({ uid: 'b' + i, key: 'k' + i, item: p.b });
      });
      tiles = S.shuffle(tiles);

      var matched = {};
      var selected = null;
      var locked = false;

      ctx.el.innerHTML = '<div class="tile-board" style="--cols:' + cfg.cols + '">' +
        tiles.map(function (t) {
          return '<button class="tile" data-uid="' + t.uid + '" data-key="' + t.key + '">' +
            '<span class="t-face emoji">' + t.item.face + '</span>' +
            '<span class="t-label">' + S.esc(t.item.label) + '</span></button>';
        }).join('') + '</div>';

      ctx.progress(0, cfg.pairs);

      function tileEl(uid) { return S.qs('[data-uid="' + uid + '"]', ctx.el); }

      function onPick(el) {
        if (locked) return;
        var uid = el.getAttribute('data-uid');
        var key = el.getAttribute('data-key');
        if (matched[key]) return;

        if (!selected) {
          selected = { uid: uid, key: key, el: el };
          el.setAttribute('data-state', 'selected');
          ctx.clearFeedback();
          return;
        }

        if (selected.uid === uid) {           // tapped the same tile again
          el.removeAttribute('data-state');
          selected = null;
          return;
        }

        var correct = selected.key === key;
        ctx.attempt(correct);

        if (correct) {
          matched[key] = true;
          selected.el.setAttribute('data-state', 'matched');
          el.setAttribute('data-state', 'matched');
          selected.el.disabled = true;
          el.disabled = true;
          selected = null;
          ctx.praise();
          var done = Object.keys(matched).length;
          ctx.progress(done, cfg.pairs);
          if (done === cfg.pairs) {
            locked = true;
            setTimeout(function () { ctx.finish(); }, 700);
          }
        } else {
          locked = true;
          el.setAttribute('data-state', 'nudge');
          selected.el.setAttribute('data-state', 'nudge');
          ctx.encourage();
          var a = selected.el, b = el;
          selected = null;
          setTimeout(function () {
            a.removeAttribute('data-state');
            b.removeAttribute('data-state');
            locked = false;
          }, 750);
        }
      }

      S.qsa('.tile', ctx.el).forEach(function (el) {
        el.addEventListener('click', function () { onPick(el); });
      });
    }
  };
})(window);
