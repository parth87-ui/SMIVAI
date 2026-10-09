/* ============================================================
   SMIVAI — Activity 4 · Category Sorting
   Thinking, memory and language association.

   Tap-to-place instead of drag-and-drop: dragging is the single most
   common failure point for elderly users on a touchscreen.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var LEVELS = {
    very_easy: { categories: 2, perCategory: 2 },
    easy: { categories: 2, perCategory: 3 },
    medium: { categories: 3, perCategory: 3 },
    hard: { categories: 4, perCategory: 3 },
    very_hard: { categories: 4, perCategory: 4 }
  };

  var CATEGORY_ORDER = ['food', 'clothes', 'household', 'nature', 'animals'];

  S.Games.category_sorting = {
    id: 'category_sorting',

    start: function (ctx) {
      var cfg = LEVELS[ctx.difficulty] || LEVELS.medium;
      var levels = S.M.isGentle(ctx.difficulty) ? [1] : [1, 2];

      var cats = CATEGORY_ORDER.slice(0, cfg.categories);
      // Hard swaps in the two categories that are easiest to confuse.
      if (S.M.isHard(ctx.difficulty)) cats = ['food', 'clothes', 'household', 'nature'];

      var items = [];
      cats.forEach(function (c) {
        S.Content.items(cfg.perCategory, { levels: levels, categories: [c] }).forEach(function (it) {
          items.push(it);
        });
      });
      items = S.shuffle(items);
      ctx.setContentLevel(2);

      ctx.setInstruction(S.t('sort_items'), S.t('tap_then_group'));

      var placed = 0, selected = null;
      var total = items.length;

      ctx.el.innerHTML =
        '<div class="sort-tray" id="sort-tray">' +
          items.map(function (it) {
            return '<button class="sort-item" data-id="' + S.esc(it.id) + '" data-cat="' + S.esc(it.category) + '" aria-pressed="false">' +
              '<span class="si-face emoji">' + it.face + '</span>' +
              '<span class="si-label">' + S.esc(it.label) + '</span></button>';
          }).join('') +
        '</div>' +
        '<div class="bin-grid">' +
          cats.map(function (c) {
            var meta = S.Content.categoryMeta(c);
            return '<button class="bin" data-cat="' + S.esc(c) + '">' +
              '<div class="bin-head"><span class="bin-ico emoji">' + meta.icon + '</span>' +
              '<span class="bin-name">' + S.esc(meta.name) + '</span>' +
              '<span class="bin-count" data-count="' + S.esc(c) + '">0</span></div>' +
              '<div class="bin-items" data-items="' + S.esc(c) + '"></div></button>';
          }).join('') +
        '</div>';

      ctx.progress(0, total);

      function clearSelection() {
        S.qsa('.sort-item', ctx.el).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        S.qsa('.bin', ctx.el).forEach(function (b) { b.classList.remove('armed'); });
        selected = null;
      }

      S.qsa('.sort-item', ctx.el).forEach(function (el) {
        el.addEventListener('click', function () {
          var isSame = selected && selected.el === el;
          clearSelection();
          if (isSame) return;
          selected = { el: el, id: el.getAttribute('data-id'), cat: el.getAttribute('data-cat') };
          el.setAttribute('aria-pressed', 'true');
          S.qsa('.bin', ctx.el).forEach(function (b) { b.classList.add('armed'); });
          ctx.clearFeedback();
        });
      });

      S.qsa('.bin', ctx.el).forEach(function (bin) {
        bin.addEventListener('click', function () {
          if (!selected) {
            ctx.calm(S.t('tap_then_group'));
            return;
          }
          var binCat = bin.getAttribute('data-cat');
          var correct = binCat === selected.cat;
          ctx.attempt(correct);

          if (correct) {
            var face = S.qs('.si-face', selected.el).textContent;
            var slot = S.qs('[data-items="' + binCat + '"]', ctx.el);
            var chip = document.createElement('span');
            chip.className = 'bin-chip emoji';
            chip.textContent = face;
            slot.appendChild(chip);
            var counter = S.qs('[data-count="' + binCat + '"]', ctx.el);
            counter.textContent = String(slot.children.length);

            selected.el.parentNode.removeChild(selected.el);
            clearSelection();
            placed += 1;
            ctx.praise();
            ctx.progress(placed, total);

            if (placed === total) setTimeout(function () { ctx.finish(); }, 700);
          } else {
            ctx.encourage();
            clearSelection();
          }
        });
      });
    }
  };
})(window);
