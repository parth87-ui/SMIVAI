/* ============================================================
   SMIVAI — Activity 5 · Simple Jigsaw
   Visual processing and simple problem solving.

   Tap one piece, tap another, they swap. No dragging, no rotation, no
   small pieces. The finished picture is always visible beside the board
   so the task is "put it right", never "guess what it is".
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var LEVELS = {
    very_easy: { cols: 2, rows: 1 },
    easy: { cols: 2, rows: 2 },
    medium: { cols: 3, rows: 2 },
    hard: { cols: 3, rows: 3 },
    very_hard: { cols: 4, rows: 3 }
  };

  S.Games.jigsaw = {
    id: 'jigsaw',

    start: function (ctx) {
      var cfg = LEVELS[ctx.difficulty] || LEVELS.medium;
      var cols = cfg.cols, rows = cfg.rows, count = cols * rows;
      var scene = S.Pictures.random();
      var uri = S.Pictures.dataURI(scene.id);
      ctx.setContentLevel(2);

      ctx.setInstruction(S.t('build_picture'), S.t('take_your_time'));

      /* order[slotIndex] = pieceIndex currently sitting in that slot */
      var order = shuffled(count);

      ctx.el.innerHTML =
        '<div class="jig-stage">' +
          '<div class="jig-preview">' +
            '<img src="' + uri + '" alt="The finished picture: ' + S.esc(scene.name) + '">' +
            '<div class="jp-label">' + S.esc(scene.name) + '</div>' +
          '</div>' +
          '<div class="grow" style="min-width:260px">' +
            '<div class="jig-board" id="jig-board" style="grid-template-columns:repeat(' + cols + ',1fr);' +
              'grid-template-rows:repeat(' + rows + ',1fr);aspect-ratio:' + cols + '/' + rows + '"></div>' +
          '</div>' +
        '</div>';

      var board = S.qs('#jig-board');
      var selected = null;

      function pieceStyle(pieceIndex) {
        var c = pieceIndex % cols, r = Math.floor(pieceIndex / cols);
        var px = cols > 1 ? (c / (cols - 1)) * 100 : 0;
        var py = rows > 1 ? (r / (rows - 1)) * 100 : 0;
        return 'background-image:url(' + uri + ');' +
          'background-size:' + (cols * 100) + '% ' + (rows * 100) + '%;' +
          'background-position:' + px.toFixed(3) + '% ' + py.toFixed(3) + '%;';
      }

      function correctCount() {
        var n = 0;
        for (var i = 0; i < count; i++) if (order[i] === i) n++;
        return n;
      }

      function render() {
        board.innerHTML = '';
        order.forEach(function (pieceIndex, slot) {
          var btn = document.createElement('button');
          btn.className = 'jig-piece';
          btn.setAttribute('data-slot', String(slot));
          btn.setAttribute('aria-pressed', 'false');
          btn.setAttribute('aria-label', 'Piece ' + (slot + 1));
          btn.setAttribute('style', pieceStyle(pieceIndex));
          btn.addEventListener('click', function () { onPick(slot, btn); });
          board.appendChild(btn);
        });
      }

      function onPick(slot, btn) {
        if (selected === null) {
          selected = slot;
          btn.setAttribute('aria-pressed', 'true');
          ctx.clearFeedback();
          return;
        }
        if (selected === slot) {
          btn.setAttribute('aria-pressed', 'false');
          selected = null;
          return;
        }

        var before = correctCount();
        var t = order[selected]; order[selected] = order[slot]; order[slot] = t;
        var after = correctCount();
        selected = null;
        render();

        // A swap that puts at least one piece home counts as a good move.
        var good = after > before;
        ctx.attempt(good);
        ctx.progress(after, count);

        if (after === count) {
          S.qsa('.jig-piece', board).forEach(function (p) { p.classList.add('locked'); p.disabled = true; });
          ctx.praise(S.t('well_done'));
          setTimeout(function () { ctx.finish(); }, 900);
        } else if (good) {
          ctx.praise();
        } else {
          ctx.encourage();
        }
      }

      render();
      ctx.progress(correctCount(), count);

      /* ---- helpers ---- */
      function shuffled(n) {
        var arr = [];
        for (var i = 0; i < n; i++) arr.push(i);
        var out, tries = 0;
        do {
          out = S.shuffle(arr);
          tries++;
        } while (tries < 20 && solvedTooMuch(out));
        return out;
      }
      function solvedTooMuch(arr) {
        var right = 0;
        for (var i = 0; i < arr.length; i++) if (arr[i] === i) right++;
        return right > Math.max(0, Math.floor(arr.length / 3));
      }
    }
  };
})(window);
