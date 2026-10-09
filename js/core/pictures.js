/* ============================================================
   SMIVAI — pictures.js
   Flat, high-contrast illustrations drawn as inline SVG and served as
   data URIs. Used by Simple Jigsaw.

   Why SVG and not photographs: they ship with the app (offline-first),
   stay sharp on any tablet, and use only the SMIVAI palette so the puzzle
   never turns into visual noise for a low-vision user.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var C = {
    sky: '#F2EFE7', sky2: '#E6EFE9',
    green: '#2F6F59', dark: '#245744', sage: '#DDEBE4', deep: '#C9E0D4',
    amber: '#E7A45B', warm: '#D98B38', ivory: '#F8F6F0', card: '#FFFFFF',
    brown: '#9C7A55', brown2: '#7E6144', text: '#27332E', water: '#BFD9CE'
  };

  function svg(body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">' +
      '<rect width="400" height="400" fill="' + C.ivory + '"/>' + body + '</svg>';
  }

  var SCENES = [
    {
      id: 'tea_garden',
      name: 'Tea garden',
      draw: function () {
        var rows = '';
        for (var r = 0; r < 4; r++) {
          var y = 250 + r * 34;
          for (var c = 0; c < 7; c++) {
            var x = 18 + c * 56 + (r % 2 ? 26 : 0);
            rows += '<ellipse cx="' + x + '" cy="' + y + '" rx="26" ry="15" fill="' + (r % 2 ? C.green : C.dark) + '"/>';
          }
        }
        return svg(
          '<rect width="400" height="240" fill="' + C.sky2 + '"/>' +
          '<circle cx="312" cy="70" r="38" fill="' + C.amber + '"/>' +
          '<path d="M0 200 L90 120 L170 200 Z" fill="' + C.deep + '"/>' +
          '<path d="M120 210 L230 108 L340 210 Z" fill="' + C.sage + '"/>' +
          '<path d="M250 214 L330 150 L400 214 Z" fill="' + C.deep + '"/>' +
          '<rect y="210" width="400" height="190" fill="' + C.sage + '"/>' + rows
        );
      }
    },
    {
      id: 'village_home',
      name: 'Village home',
      draw: function () {
        return svg(
          '<rect width="400" height="250" fill="' + C.sky2 + '"/>' +
          '<circle cx="76" cy="66" r="30" fill="' + C.amber + '"/>' +
          '<rect y="250" width="400" height="150" fill="' + C.sage + '"/>' +
          '<path d="M140 400 q60 -70 130 -70 l130 0 0 70 z" fill="' + C.deep + '"/>' +
          /* tree */
          '<rect x="60" y="230" width="20" height="90" rx="6" fill="' + C.brown2 + '"/>' +
          '<circle cx="70" cy="212" r="54" fill="' + C.green + '"/>' +
          '<circle cx="40" cy="238" r="34" fill="' + C.dark + '"/>' +
          '<circle cx="102" cy="240" r="32" fill="' + C.dark + '"/>' +
          /* house */
          '<rect x="150" y="212" width="190" height="120" fill="' + C.card + '" stroke="' + C.deep + '" stroke-width="4"/>' +
          '<path d="M132 214 L245 132 L358 214 Z" fill="' + C.warm + '"/>' +
          '<rect x="222" y="256" width="48" height="76" rx="6" fill="' + C.brown + '"/>' +
          '<rect x="168" y="244" width="42" height="40" rx="5" fill="' + C.sage + '" stroke="' + C.dark + '" stroke-width="3"/>' +
          '<rect x="284" y="244" width="42" height="40" rx="5" fill="' + C.sage + '" stroke="' + C.dark + '" stroke-width="3"/>' +
          '<rect x="150" y="326" width="190" height="10" fill="' + C.dark + '"/>'
        );
      }
    },
    {
      id: 'river_boat',
      name: 'River and boat',
      draw: function () {
        return svg(
          '<rect width="400" height="210" fill="' + C.sky2 + '"/>' +
          '<circle cx="320" cy="62" r="34" fill="' + C.amber + '"/>' +
          '<path d="M0 190 L80 120 L160 190 Z" fill="' + C.deep + '"/>' +
          '<path d="M130 192 L235 112 L340 192 Z" fill="' + C.sage + '"/>' +
          '<rect y="190" width="400" height="210" fill="' + C.water + '"/>' +
          '<path d="M0 232 q50 -14 100 0 t100 0 t100 0 t100 0" stroke="' + C.sage + '" stroke-width="8" fill="none"/>' +
          '<path d="M0 340 q50 -14 100 0 t100 0 t100 0 t100 0" stroke="' + C.sage + '" stroke-width="8" fill="none"/>' +
          '<path d="M96 300 l208 0 -34 46 -140 0 z" fill="' + C.brown + '"/>' +
          '<rect x="192" y="212" width="9" height="92" fill="' + C.brown2 + '"/>' +
          '<path d="M201 216 l62 74 -62 0 z" fill="' + C.card + '" stroke="' + C.dark + '" stroke-width="3"/>'
        );
      }
    },
    {
      id: 'flower_garden',
      name: 'Flowers',
      draw: function () {
        function flower(cx, cy, petal) {
          var p = '';
          for (var i = 0; i < 6; i++) {
            var a = (Math.PI * 2 / 6) * i;
            p += '<ellipse cx="' + (cx + Math.cos(a) * 30).toFixed(1) + '" cy="' + (cy + Math.sin(a) * 30).toFixed(1) +
              '" rx="20" ry="20" fill="' + petal + '"/>';
          }
          return '<rect x="' + (cx - 5) + '" y="' + cy + '" width="10" height="' + (360 - cy) + '" fill="' + C.green + '"/>' +
            p + '<circle cx="' + cx + '" cy="' + cy + '" r="19" fill="' + C.warm + '"/>';
        }
        return svg(
          '<rect width="400" height="300" fill="' + C.sky2 + '"/>' +
          '<rect y="300" width="400" height="100" fill="' + C.sage + '"/>' +
          '<circle cx="60" cy="60" r="28" fill="' + C.amber + '"/>' +
          flower(112, 190, C.card) +
          flower(280, 160, C.amber) +
          flower(198, 250, C.deep) +
          '<ellipse cx="70" cy="352" rx="52" ry="18" fill="' + C.deep + '"/>' +
          '<ellipse cx="330" cy="360" rx="60" ry="20" fill="' + C.deep + '"/>'
        );
      }
    },
    {
      id: 'morning_tea',
      name: 'Morning tea',
      draw: function () {
        return svg(
          '<rect width="400" height="400" fill="' + C.sky2 + '"/>' +
          '<rect y="290" width="400" height="110" fill="' + C.brown + '"/>' +
          '<rect y="286" width="400" height="10" fill="' + C.brown2 + '"/>' +
          /* steam */
          '<path d="M150 120 q22 -26 0 -52 q-22 -26 0 -50" stroke="' + C.deep + '" stroke-width="9" fill="none" stroke-linecap="round"/>' +
          '<path d="M196 118 q22 -26 0 -52 q-22 -26 0 -50" stroke="' + C.deep + '" stroke-width="9" fill="none" stroke-linecap="round"/>' +
          /* cup */
          '<path d="M108 160 l152 0 -18 118 -116 0 z" fill="' + C.card + '" stroke="' + C.dark + '" stroke-width="5"/>' +
          '<path d="M262 186 q46 6 40 44 q-6 36 -48 32" fill="none" stroke="' + C.dark + '" stroke-width="12" stroke-linecap="round"/>' +
          '<rect x="118" y="176" width="132" height="20" fill="' + C.warm + '"/>' +
          '<ellipse cx="184" cy="288" rx="106" ry="16" fill="' + C.sage + '" stroke="' + C.dark + '" stroke-width="4"/>' +
          /* kettle */
          '<rect x="298" y="196" width="78" height="76" rx="16" fill="' + C.green + '"/>' +
          '<rect x="320" y="176" width="34" height="16" rx="7" fill="' + C.dark + '"/>' +
          '<path d="M298 214 l-26 -16 0 26 z" fill="' + C.dark + '"/>'
        );
      }
    }
  ];

  /* ---------- Memory "photographs" ----------
     Softer, warmer scenes used as placeholder photos for the demo Memory
     Bank, so memories look like memories without shipping real photos of
     real people. A patient's own uploads replace these. */
  function photo(body, sky) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">' +
      '<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + sky[0] + '"/><stop offset="1" stop-color="' + sky[1] + '"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#sk)"/>' + body + '</svg>';
  }
  function pine(x, y, h, c) {
    return '<path d="M' + x + ' ' + (y - h) + ' l' + (h * 0.32) + ' ' + h + ' h-' + (h * 0.64) + ' Z" fill="' + c + '"/>' +
      '<rect x="' + (x - 3) + '" y="' + y + '" width="6" height="10" fill="#6B5846"/>';
  }
  SCENES.push(
    {
      photo: true, id: 'shillong_hills', name: 'Hills of Shillong',
      draw: function () {
        var trees = '';
        for (var i = 0; i < 9; i++) trees += pine(20 + i * 46, 250 + (i % 2) * 10, 60 + (i % 3) * 14, i % 2 ? '#3F7E66' : '#2F6A55');
        return photo(
          '<circle cx="300" cy="70" r="30" fill="#FCE3B0"/>' +
          '<ellipse cx="110" cy="70" rx="46" ry="14" fill="#fff" opacity=".85"/><ellipse cx="150" cy="62" rx="30" ry="12" fill="#fff" opacity=".85"/>' +
          '<path d="M0 190 Q80 110 170 160 T400 140 V300 H0 Z" fill="#9DB9D9"/>' +
          '<path d="M0 220 Q110 150 220 196 T400 186 V300 H0 Z" fill="#7FA6A0"/>' +
          '<path d="M0 250 Q140 210 260 236 T400 232 V300 H0 Z" fill="#5E927C"/>' + trees,
          ['#CFE0F4', '#F6EEDD']);
      }
    },
    {
      photo: true, id: 'brahmaputra_sunset', name: 'Evening by the river',
      draw: function () {
        return photo(
          '<circle cx="200" cy="170" r="54" fill="#F7C47E"/>' +
          '<path d="M0 170 Q100 150 200 164 T400 160 V300 H0 Z" fill="#8FA9C9"/>' +
          '<g stroke="#FCE3B0" stroke-width="5" stroke-linecap="round" opacity=".8"><path d="M150 196 h100M170 214 h60M186 232 h28"/></g>' +
          '<path d="M60 236 q40 14 80 0 l-8 10 h-64 Z" fill="#5A4636"/><path d="M98 236 v-40 l22 28 Z" fill="#F2E6D0"/>' +
          '<path d="M0 170 Q60 140 120 160 L120 170 Z" fill="#6D8E7C"/>',
          ['#F4B99A', '#FBE6CF']);
      }
    },
    {
      photo: true, id: 'festival_lamps', name: 'Festival lamps',
      draw: function () {
        var lamps = '';
        for (var i = 0; i < 7; i++) {
          var x = 40 + i * 54;
          lamps += '<ellipse cx="' + x + '" cy="232" rx="20" ry="9" fill="#C9844F"/>' +
            '<path d="M' + x + ' 206 q8 12 0 22 q-8 -10 0 -22 Z" fill="#FFD27A"/>' +
            '<circle cx="' + x + '" cy="214" r="22" fill="#FFD27A" opacity=".18"/>';
        }
        return photo(
          '<path d="M0 0 Q200 60 400 0" stroke="#E7B35A" stroke-width="3" fill="none"/>' +
          '<g fill="#F29E7A">' + [60, 130, 200, 270, 340].map(function (x) { return '<path d="M' + x + ' 24 l10 18 h-20 Z"/>'; }).join('') + '</g>' +
          '<rect y="244" width="400" height="56" fill="#7A4E3A"/>' + lamps,
          ['#3F4C74', '#8B6F8E']);
      }
    },
    {
      photo: true, id: 'family_picnic', name: 'Family picnic',
      draw: function () {
        var fig = function (x, h, c, head) {
          return '<rect x="' + (x - 14) + '" y="' + (250 - h) + '" width="28" height="' + h + '" rx="14" fill="' + c + '"/>' +
            '<circle cx="' + x + '" cy="' + (238 - h) + '" r="13" fill="' + (head || '#D9A07A') + '"/>';
        };
        return photo(
          '<circle cx="330" cy="60" r="26" fill="#FCE3B0"/>' +
          '<path d="M0 200 Q200 160 400 196 V300 H0 Z" fill="#A9CFA0"/>' +
          '<ellipse cx="200" cy="262" rx="150" ry="22" fill="#F4E1C1"/>' +
          '<circle cx="70" cy="150" r="46" fill="#6FA57F"/><rect x="64" y="170" width="12" height="70" fill="#7C6450"/>' +
          fig(150, 64, '#5B82C4') + fig(190, 48, '#EFA57A') + fig(226, 70, '#9C8BD8', '#C98F66') + fig(262, 40, '#4F9D91', '#E8B993'),
          ['#CDE3F2', '#F5F1E4']);
      }
    }
  );

  var cache = {};

  var Pictures = {
    SCENES: SCENES,
    has: function (id) {
      for (var i = 0; i < SCENES.length; i++) if (SCENES[i].id === id) return true;
      return false;
    },
    scene: function (id) {
      for (var i = 0; i < SCENES.length; i++) if (SCENES[i].id === id) return SCENES[i];
      return SCENES[0];
    },
    dataURI: function (id) {
      if (cache[id]) return cache[id];
      var sc = this.scene(id);
      var uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sc.draw());
      cache[id] = uri;
      return uri;
    },
    random: function (rand) { return S.pick(SCENES.filter(function (s) { return !s.photo; }), rand); }
  };

  S.Pictures = Pictures;
})(window);
