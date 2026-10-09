/* ============================================================
   SMIVAI — content.js
   The item bank behind every activity.

   Three content levels, exactly as specified:
     LEVEL 1  general familiar objects
     LEVEL 2  North-Eastern everyday objects (ordinary things people
              actually keep and eat, not costume-book stereotypes)
     LEVEL 3  the patient's own Memory Bank entries

   Everything is emoji + label so the whole bank ships offline with zero
   image downloads, stays crisp at any size, and can be swapped for
   photographs later by giving an item an `img` field.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  /* id, face, label, category, level */
  var ITEMS = [
    /* ---------- LEVEL 1 · general ---------- */
    { id: 'apple', face: '🍎', label: 'Apple', category: 'food', level: 1 },
    { id: 'banana', face: '🍌', label: 'Banana', category: 'food', level: 1 },
    { id: 'rice', face: '🍚', label: 'Rice', category: 'food', level: 1 },
    { id: 'bread', face: '🍞', label: 'Bread', category: 'food', level: 1 },
    { id: 'egg', face: '🥚', label: 'Egg', category: 'food', level: 1 },
    { id: 'milk', face: '🥛', label: 'Milk', category: 'food', level: 1 },
    { id: 'dal', face: '🍲', label: 'Dal', category: 'food', level: 1 },
    { id: 'fish', face: '🐟', label: 'Fish', category: 'food', level: 1 },
    { id: 'mango', face: '🥭', label: 'Mango', category: 'food', level: 1 },
    { id: 'potato', face: '🥔', label: 'Potato', category: 'food', level: 1 },

    { id: 'shirt', face: '👕', label: 'Shirt', category: 'clothes', level: 1 },
    { id: 'shoes', face: '👞', label: 'Shoes', category: 'clothes', level: 1 },
    { id: 'socks', face: '🧦', label: 'Socks', category: 'clothes', level: 1 },
    { id: 'cap', face: '🧢', label: 'Cap', category: 'clothes', level: 1 },
    { id: 'coat', face: '🧥', label: 'Coat', category: 'clothes', level: 1 },
    { id: 'scarf', face: '🧣', label: 'Scarf', category: 'clothes', level: 1 },
    { id: 'saree', face: '🥻', label: 'Saree', category: 'clothes', level: 1 },

    { id: 'cup', face: '☕', label: 'Cup', category: 'household', level: 1 },
    { id: 'spoon', face: '🥄', label: 'Spoon', category: 'household', level: 1 },
    { id: 'plate', face: '🍽️', label: 'Plate', category: 'household', level: 1 },
    { id: 'chair', face: '🪑', label: 'Chair', category: 'household', level: 1 },
    { id: 'bed', face: '🛏️', label: 'Bed', category: 'household', level: 1 },
    { id: 'key', face: '🔑', label: 'Key', category: 'household', level: 1 },
    { id: 'broom', face: '🧹', label: 'Broom', category: 'household', level: 1 },
    { id: 'clock', face: '⏰', label: 'Clock', category: 'household', level: 1 },
    { id: 'bucket', face: '🪣', label: 'Bucket', category: 'household', level: 1 },
    { id: 'umbrella', face: '☂️', label: 'Umbrella', category: 'household', level: 1 },
    { id: 'radio', face: '📻', label: 'Radio', category: 'household', level: 1 },
    { id: 'glasses', face: '👓', label: 'Glasses', category: 'household', level: 1 },
    { id: 'book', face: '📖', label: 'Book', category: 'household', level: 1 },
    { id: 'candle', face: '🕯️', label: 'Candle', category: 'household', level: 1 },
    { id: 'lamp', face: '💡', label: 'Lamp', category: 'household', level: 1 },
    { id: 'needle', face: '🪡', label: 'Needle', category: 'household', level: 1 },
    { id: 'thread', face: '🧵', label: 'Thread', category: 'household', level: 1 },
    { id: 'phone', face: '📞', label: 'Telephone', category: 'household', level: 1 },
    { id: 'comb', face: '🪥', label: 'Toothbrush', category: 'household', level: 1 },

    { id: 'tree', face: '🌳', label: 'Tree', category: 'nature', level: 1 },
    { id: 'leaf', face: '🌿', label: 'Leaf', category: 'nature', level: 1 },
    { id: 'flower', face: '🌼', label: 'Flower', category: 'nature', level: 1 },
    { id: 'plant', face: '🪴', label: 'Plant', category: 'nature', level: 1 },
    { id: 'sun', face: '🌤️', label: 'Sunshine', category: 'nature', level: 1 },
    { id: 'rain', face: '🌧️', label: 'Rain', category: 'nature', level: 1 },

    { id: 'cow', face: '🐄', label: 'Cow', category: 'animals', level: 1 },
    { id: 'hen', face: '🐓', label: 'Hen', category: 'animals', level: 1 },
    { id: 'goat', face: '🐐', label: 'Goat', category: 'animals', level: 1 },
    { id: 'cat', face: '🐈', label: 'Cat', category: 'animals', level: 1 },
    { id: 'dog', face: '🐕', label: 'Dog', category: 'animals', level: 1 },
    { id: 'duck', face: '🦆', label: 'Duck', category: 'animals', level: 1 },

    /* ---------- LEVEL 2 · North-Eastern everyday ---------- */
    { id: 'tea', face: '🍵', label: 'Tea', category: 'food', level: 2 },
    { id: 'pitha', face: '🍘', label: 'Pitha', category: 'food', level: 2 },
    { id: 'momo', face: '🥟', label: 'Momos', category: 'food', level: 2 },
    { id: 'bamboo_shoot', face: '🌱', label: 'Bamboo shoot', category: 'food', level: 2 },
    { id: 'orange', face: '🍊', label: 'Orange', category: 'food', level: 2 },
    { id: 'pineapple', face: '🍍', label: 'Pineapple', category: 'food', level: 2 },
    { id: 'coconut', face: '🥥', label: 'Coconut', category: 'food', level: 2 },
    { id: 'greens', face: '🥬', label: 'Green leaves', category: 'food', level: 2 },
    { id: 'gamosa', face: '🧶', label: 'Gamosa', category: 'clothes', level: 2 },
    { id: 'mekhela', face: '👘', label: 'Mekhela sador', category: 'clothes', level: 2 },
    { id: 'shawl', face: '🧣', label: 'Woven shawl', category: 'clothes', level: 2 },
    { id: 'basket', face: '🧺', label: 'Bamboo basket', category: 'household', level: 2 },
    { id: 'dhol', face: '🪘', label: 'Dhol', category: 'household', level: 2 },
    { id: 'mat', face: '🟫', label: 'Reed mat', category: 'household', level: 2 },
    { id: 'kettle', face: '🫖', label: 'Kettle', category: 'household', level: 2 },
    { id: 'bamboo', face: '🎋', label: 'Bamboo', category: 'nature', level: 2 },
    { id: 'paddy', face: '🌾', label: 'Paddy field', category: 'nature', level: 2 },
    { id: 'hills', face: '⛰️', label: 'Hills', category: 'nature', level: 2 },
    { id: 'river', face: '🏞️', label: 'River', category: 'nature', level: 2 },
    { id: 'boat', face: '🛶', label: 'Boat', category: 'household', level: 2 },
    { id: 'hut', face: '🛖', label: 'Village home', category: 'household', level: 2 },
    { id: 'elephant', face: '🐘', label: 'Elephant', category: 'animals', level: 2 },
    { id: 'rhino', face: '🦏', label: 'Rhino', category: 'animals', level: 2 },
    { id: 'butterfly', face: '🦋', label: 'Butterfly', category: 'animals', level: 2 }
  ];

  /* Semantically related pairs — used by Picture Matching so the task is
     "which two go together", not just "spot the twin". */
  var RELATED = [
    ['cup', 'tea'], ['cow', 'milk'], ['hen', 'egg'], ['paddy', 'rice'],
    ['rain', 'umbrella'], ['fish', 'boat'], ['plate', 'spoon'],
    ['tree', 'leaf'], ['candle', 'lamp'], ['needle', 'thread'],
    ['book', 'glasses'], ['bamboo', 'basket'], ['flower', 'plant'],
    ['shoes', 'socks'], ['kettle', 'tea'], ['dhol', 'gamosa']
  ];

  var CATEGORY_META = {
    food: { name: 'Food', icon: '🍲' },
    clothes: { name: 'Clothes', icon: '👕' },
    household: { name: 'Household', icon: '🏠' },
    nature: { name: 'Plants & Nature', icon: '🌿' },
    animals: { name: 'Animals', icon: '🐄' }
  };

  function get(id) {
    for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i];
    return null;
  }

  var Content = {
    ITEMS: ITEMS,
    RELATED: RELATED,
    CATEGORY_META: CATEGORY_META,
    get: get,

    categoryMeta: function (id) { return CATEGORY_META[id] || { name: S.titleCase(id), icon: '📦' }; },

    /**
     * Pool of items for a patient.
     * Level 2 (local) content is mixed in for patients in the NER cohort,
     * which is every demo patient — the flag exists so the bank stays
     * expandable to other regions.
     */
    pool: function (opts) {
      opts = opts || {};
      var levels = opts.levels || [1, 2];
      var cats = opts.categories;
      return ITEMS.filter(function (it) {
        if (levels.indexOf(it.level) === -1) return false;
        if (cats && cats.indexOf(it.category) === -1) return false;
        return true;
      });
    },

    /** N distinct items. */
    items: function (n, opts) {
      opts = opts || {};
      return S.sample(this.pool(opts), n, opts.rand);
    },

    /**
     * Build matching pairs.
     * mode 'identical' → the same picture twice (Easy)
     * mode 'related'   → two pictures that belong together (Medium/Hard)
     */
    pairs: function (n, opts) {
      opts = opts || {};
      var rand = opts.rand || Math.random;
      var out = [];
      if (opts.mode === 'related') {
        var rel = S.shuffle(RELATED, rand).slice(0, n);
        rel.forEach(function (p, i) {
          var a = get(p[0]), b = get(p[1]);
          if (a && b) out.push({ key: 'p' + i, a: a, b: b, relation: 'goes with' });
        });
      }
      if (out.length < n) {
        var used = {};
        out.forEach(function (p) { used[p.a.id] = 1; used[p.b.id] = 1; });
        var extra = S.shuffle(this.pool(opts).filter(function (it) { return !used[it.id]; }), rand)
          .slice(0, n - out.length);
        extra.forEach(function (it, i) {
          out.push({ key: 'i' + i, a: it, b: it, relation: 'same' });
        });
      }
      return out.slice(0, n);
    },

    /* ---------- LEVEL 3 · the patient's own memories ---------- */
    personalItems: function (patientId) {
      return S.DB.forPatient('memory_bank', patientId).map(function (m) {
        return {
          id: 'mem_' + m.memory_id,
          face: m.icon || S.M.memoryCategory(m.category).icon,
          label: m.title,
          category: m.category === 'food' ? 'food' : 'personal',
          level: 3,
          memory: m
        };
      });
    },

    /**
     * Blended pool for a patient: general + local, plus their own memory
     * items when the caller asks for level 3. Personal items never cross
     * patients — they are read with patient_id every single time.
     */
    poolFor: function (patient, opts) {
      opts = opts || {};
      var levels = opts.levels || [1, 2];
      var pool = this.pool({ levels: levels, categories: opts.categories });
      if (levels.indexOf(3) !== -1 && patient) {
        pool = pool.concat(this.personalItems(patient.patient_id).filter(function (it) {
          return !opts.categories || opts.categories.indexOf(it.category) !== -1;
        }));
      }
      return pool;
    },

    /** Which content level a session actually used (for the session record). */
    levelOf: function (items) {
      var max = 1;
      items.forEach(function (i) { if (i.level > max) max = i.level; });
      return max;
    }
  };

  S.Content = Content;
})(window);
