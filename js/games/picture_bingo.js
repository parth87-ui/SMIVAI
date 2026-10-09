/* ============================================================
   SMIVAI — Activity 3 · Picture Bingo
   Recognition, attention and listening.

   SMIVAI names an everyday object; the patient taps it on the board.
   Non-competitive, no timer, no score shown during play.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var LEVELS = {
    very_easy: { tiles: 4, cols: 2, rounds: 4, similar: false },
    easy: { tiles: 6, cols: 3, rounds: 5, similar: false },
    medium: { tiles: 9, cols: 3, rounds: 6, similar: false },
    hard: { tiles: 12, cols: 4, rounds: 8, similar: true },
    very_hard: { tiles: 16, cols: 4, rounds: 10, similar: true }
  };

  S.Games.picture_bingo = {
    id: 'picture_bingo',

    start: function (ctx) {
      var cfg = LEVELS[ctx.difficulty] || LEVELS.medium;

      var opts = { levels: S.M.isGentle(ctx.difficulty) ? [1] : [1, 2] };
      if (cfg.similar) opts.categories = ['food', 'household'];   // lookalike neighbours
      var items = S.Content.items(cfg.tiles, opts);
      if (items.length < cfg.tiles) items = S.Content.items(cfg.tiles, { levels: [1, 2] });
      ctx.setContentLevel(2);

      var order = S.shuffle(items).slice(0, Math.min(cfg.rounds, items.length));
      var round = 0, locked = false, found = 0;

      ctx.el.innerHTML =
        '<div class="bingo-prompt" id="bingo-prompt">' +
          '<div class="bp-q" id="bingo-q"></div>' +
          '<div class="bp-hint">' + S.esc(S.t('find_object')) + '</div>' +
        '</div>' +
        '<div class="tile-board" style="--cols:' + cfg.cols + '">' +
          items.map(function (it) {
            return '<button class="tile" data-id="' + S.esc(it.id) + '">' +
              '<span class="t-face emoji">' + it.face + '</span>' +
              '<span class="t-label">' + S.esc(it.label) + '</span></button>';
          }).join('') +
        '</div>';

      function ask() {
        if (round >= order.length) { ctx.finish(); return; }
        var target = order[round];
        var question = S.t('can_you_find', { item: target.label.toLowerCase() });
        S.qs('#bingo-q').textContent = question;
        ctx.setInstruction(question, S.t('find_object'));
        ctx.lastActionAt = Date.now();
        locked = false;
      }

      function onPick(el) {
        if (locked) return;
        var id = el.getAttribute('data-id');
        var target = order[round];
        var correct = id === target.id;
        ctx.attempt(correct);

        if (correct) {
          el.setAttribute('data-state', 'matched');
          el.disabled = true;
          found += 1;
          round += 1;
          locked = true;
          ctx.praise();
          ctx.progress(found, order.length);
          setTimeout(function () { ctx.clearFeedback(); ask(); }, 900);
        } else {
          locked = true;
          el.setAttribute('data-state', 'nudge');
          ctx.encourage();
          setTimeout(function () { el.removeAttribute('data-state'); locked = false; }, 800);
        }
      }

      S.qsa('.tile', ctx.el).forEach(function (el) {
        el.addEventListener('click', function () { onPick(el); });
      });

      ctx.progress(0, order.length);
      ask();
    }
  };
})(window);
