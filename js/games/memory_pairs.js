/* ============================================================
   SMIVAI — Activity 2 · Memory Pairs
   Short-term memory and recall.

   The cards are shown face-up first so the patient can study them, then
   turned over. There is no countdown: the study phase ends when the
   patient presses "I'm ready", or after a generous pause.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var LEVELS = {
    very_easy: { pairs: 2, cols: 2, study: 10000, similar: false },
    easy: { pairs: 3, cols: 3, study: 9000, similar: false },
    medium: { pairs: 4, cols: 4, study: 8000, similar: false },
    hard: { pairs: 6, cols: 4, study: 7000, similar: true },
    very_hard: { pairs: 8, cols: 4, study: 6000, similar: true }
  };

  S.Games.memory_pairs = {
    id: 'memory_pairs',

    start: function (ctx) {
      var cfg = LEVELS[ctx.difficulty] || LEVELS.medium;

      // Hard draws from a single category so the pictures look alike —
      // that is the difficulty lever, not a shorter study time.
      var poolOpts = { levels: S.M.isGentle(ctx.difficulty) ? [1] : [1, 2] };
      if (cfg.similar) {
        var cats = ['food', 'household', 'nature'];
        poolOpts.categories = [S.pick(cats)];
      }
      var items = S.Content.items(cfg.pairs, poolOpts);
      if (items.length < cfg.pairs) items = S.Content.items(cfg.pairs, { levels: [1, 2] });
      ctx.setContentLevel(2);

      var cards = [];
      items.forEach(function (it, i) {
        cards.push({ uid: 'a' + i, key: 'k' + i, item: it });
        cards.push({ uid: 'b' + i, key: 'k' + i, item: it });
      });
      cards = S.shuffle(cards);

      var matched = {}, first = null, locked = true, studyDone = false;

      ctx.setInstruction(S.t('remember_cards'), S.t('press_ready'));

      ctx.el.innerHTML =
        '<div class="tile-board" style="--cols:' + cfg.cols + '">' +
          cards.map(function (c) {
            return '<button class="tile" data-uid="' + c.uid + '" data-key="' + c.key + '">' +
              '<span class="t-face emoji">' + c.item.face + '</span>' +
              '<span class="t-label">' + S.esc(c.item.label) + '</span></button>';
          }).join('') +
        '</div>' +
        '<div style="margin-top:24px;text-align:center">' +
          '<button class="btn btn-xl" id="mp-ready"><span class="emoji">👍</span>' + S.esc(S.t('i_am_ready')) + '</button>' +
        '</div>';

      ctx.progress(0, cfg.pairs);

      function hideAll() {
        if (studyDone) return;
        studyDone = true;
        S.qsa('.tile', ctx.el).forEach(function (el) {
          if (!matched[el.getAttribute('data-key')]) el.setAttribute('data-state', 'hidden');
        });
        var btn = S.qs('#mp-ready');
        if (btn) btn.parentNode.removeChild(btn);
        ctx.setInstruction(S.t('find_pairs'), S.t('tap_then_pair'));
        ctx.calm(S.t('take_your_time'));
        ctx.lastActionAt = Date.now();
        locked = false;
      }

      var timer = setTimeout(hideAll, cfg.study);
      var readyBtn = S.qs('#mp-ready');
      if (readyBtn) readyBtn.addEventListener('click', function () { clearTimeout(timer); hideAll(); });

      function onPick(el) {
        if (locked || !studyDone) return;
        var key = el.getAttribute('data-key');
        var uid = el.getAttribute('data-uid');
        if (matched[key]) return;
        if (first && first.uid === uid) return;

        el.setAttribute('data-state', 'selected');

        if (!first) { first = { uid: uid, key: key, el: el }; ctx.clearFeedback(); return; }

        var correct = first.key === key;
        ctx.attempt(correct);
        locked = true;

        if (correct) {
          matched[key] = true;
          first.el.setAttribute('data-state', 'matched');
          el.setAttribute('data-state', 'matched');
          first.el.disabled = true; el.disabled = true;
          first = null; locked = false;
          ctx.praise();
          var done = Object.keys(matched).length;
          ctx.progress(done, cfg.pairs);
          if (done === cfg.pairs) {
            locked = true;
            setTimeout(function () { ctx.finish(); }, 700);
          }
        } else {
          ctx.encourage();
          var a = first.el, b = el;
          first = null;
          setTimeout(function () {
            a.setAttribute('data-state', 'hidden');
            b.setAttribute('data-state', 'hidden');
            locked = false;
          }, 1100);
        }
      }

      S.qsa('.tile', ctx.el).forEach(function (el) {
        el.addEventListener('click', function () { onPick(el); });
      });
    }
  };
})(window);
