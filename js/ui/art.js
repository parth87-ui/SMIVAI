/* ============================================================
   SMIVAI — ui/art.js
   Soft-3D illustration library, drawn as inline SVG.

   Why SVG rather than downloaded renders: every illustration ships with
   the app (offline-first), is a few KB, stays sharp on any screen, and is
   drawn from the SMIVAI palette so nothing clashes. Depth comes from
   radial "key light" gradients (top-left), a soft ambient shadow below
   each object and a thin highlight edge — the same light model everywhere.

   People are drawn as warm, dignified elders — Indian, including North-East
   Indian — never as caricatures.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var uid = 0;
  function nid(p) { uid += 1; return (p || 'a') + uid; }

  /* ---------- light-model helpers ---------- */
  function rg(id, stops, cx, cy, r) {
    return '<radialGradient id="' + id + '" cx="' + (cx || '35%') + '" cy="' + (cy || '30%') + '" r="' + (r || '75%') + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] !== undefined ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') +
      '</radialGradient>';
  }
  function lg(id, stops, x1, y1, x2, y2) {
    return '<linearGradient id="' + id + '" x1="' + (x1 || 0) + '" y1="' + (y1 || 0) + '" x2="' + (x2 === undefined ? 0 : x2) + '" y2="' + (y2 === undefined ? 1 : y2) + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] !== undefined ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') +
      '</linearGradient>';
  }
  function shadow(cx, cy, rx, ry, op) {
    var id = nid('sh');
    return '<defs>' + rg(id, [[0, '#202A44', op || .22], [1, '#202A44', 0]], '50%', '50%', '50%') + '</defs>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="url(#' + id + ')"/>';
  }
  function svg(vb, body, cls, label) {
    return '<svg class="art ' + (cls || '') + '" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" ' +
      (label ? 'role="img" aria-label="' + S.esc(label) + '"' : 'aria-hidden="true" focusable="false"') + '>' + body + '</svg>';
  }

  /* ---------- palettes ---------- */
  var SKIN = {
    wheat: ['#F1C7A2', '#D99B6F', '#B97650'],
    warm: ['#E3AE85', '#C68258', '#9E613D'],
    deep: ['#C98F66', '#A06440', '#7A4A2C'],
    ne: ['#F4D2B0', '#DEAA80', '#BC845B']
  };
  var OUTFIT = {
    blue: ['#8EABDD', '#5B82C4', '#3F619E'],
    lav: ['#C6BBEE', '#9C8BD8', '#6F5FB3'],
    peach: ['#F9CDB0', '#EFA57A', '#C97B50'],
    green: ['#A9D6C0', '#6FB091', '#3F8467'],
    cream: ['#FFF6E4', '#F2DFB9', '#D6BC8A'],
    coat: ['#FFFFFF', '#F0F3F9', '#CFD7E6'],
    teal: ['#9CCFC7', '#5EA89C', '#3C7D72']
  };

  /* ============================================================
     PERSON (bust) — the building block for every human figure
     o: { skin, outfit, hair:'man'|'woman'|'ne-woman'|'young', glasses,
          mustache, wave:boolean, shawl, x, y, s (scale) }
     Drawn in a 200×230 box.
     ============================================================ */
  function person(o) {
    o = o || {};
    var sk = SKIN[o.skin || 'wheat'], of = OUTFIT[o.outfit || 'blue'];
    var gSkin = nid('sk'), gOut = nid('of'), gHair = nid('hr'), gCheek = nid('ck'), gShawl = nid('sw');
    var hairCol = o.hairColor || (o.hair === 'young' ? ['#4A3A33', '#2B211D'] : o.hair === 'ne-woman' ? ['#8E8A86', '#5E5A57'] : ['#FBFAF6', '#D8D4CA']);

    var defs = '<defs>' +
      rg(gSkin, [[0, sk[0]], [.62, sk[1]], [1, sk[2]]], '38%', '32%', '78%') +
      rg(gOut, [[0, of[0]], [.55, of[1]], [1, of[2]]], '35%', '20%', '90%') +
      rg(gHair, [[0, hairCol[0]], [1, hairCol[1]]], '40%', '25%', '80%') +
      rg(gCheek, [[0, '#F08F86', .55], [1, '#F08F86', 0]], '50%', '50%', '50%') +
      lg(gShawl, [[0, o.shawl ? o.shawl[0] : '#fff'], [1, o.shawl ? o.shawl[1] : '#eee']], 0, 0, 1, 1) +
      '</defs>';

    var body = '';
    /* shoulders / torso */
    body += '<path d="M22 232 C24 184 56 160 100 160 C144 160 176 184 178 232 Z" fill="url(#' + gOut + ')"/>';
    /* highlight rim on shoulders */
    body += '<path d="M40 190 C58 170 80 164 100 164" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/>';
    /* collar */
    if (o.hair === 'man' || o.hair === 'young') {
      body += '<path d="M78 162 L100 196 L122 162 Z" fill="#EAF0FA"/>' +
        '<path d="M78 162 L92 178 L100 196 Z" fill="#D6E1F3"/>';
    }
    /* shawl / drape */
    if (o.shawl) {
      body += '<path d="M40 196 C70 170 118 200 150 170 C164 186 172 206 176 232 L108 232 C96 214 70 204 40 196 Z" fill="url(#' + gShawl + ')" opacity=".96"/>';
      if (o.shawlBorder) {
        body += '<path d="M44 199 C72 178 118 206 150 176" stroke="' + o.shawlBorder + '" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="7 5"/>';
      }
    }
    /* neck */
    body += '<path d="M86 138 h28 v26 c0 8 -28 8 -28 0 Z" fill="' + sk[2] + '"/>';
    /* ears */
    body += '<ellipse cx="59" cy="104" rx="9" ry="12" fill="url(#' + gSkin + ')"/><ellipse cx="141" cy="104" rx="9" ry="12" fill="url(#' + gSkin + ')"/>';
    /* hair back layer */
    if (o.hair === 'woman' || o.hair === 'ne-woman') {
      body += '<ellipse cx="100" cy="92" rx="46" ry="50" fill="url(#' + gHair + ')"/>';
      body += '<circle cx="100" cy="38" r="17" fill="url(#' + gHair + ')"/>'; // bun
    }
    /* head */
    body += '<ellipse cx="100" cy="100" rx="41" ry="47" fill="url(#' + gSkin + ')"/>';
    /* hair front */
    if (o.hair === 'man') {
      body += '<path d="M60 96 C58 70 70 56 84 54 C78 62 74 72 74 84 C70 84 64 88 60 96 Z" fill="url(#' + gHair + ')"/>' +
        '<path d="M140 96 C142 70 130 56 116 54 C122 62 126 72 126 84 C130 84 136 88 140 96 Z" fill="url(#' + gHair + ')"/>' +
        '<path d="M80 58 C92 50 108 50 120 58 C110 56 90 56 80 58 Z" fill="url(#' + gHair + ')" opacity=".8"/>';
    } else if (o.hair === 'woman' || o.hair === 'ne-woman') {
      body += '<path d="M59 102 C56 66 76 50 100 50 C124 50 144 66 141 102 C134 80 120 66 100 64 C80 66 66 80 59 102 Z" fill="url(#' + gHair + ')"/>' +
        '<path d="M100 52 C96 58 94 62 94 66" stroke="' + hairCol[1] + '" stroke-width="2" fill="none" opacity=".6"/>';
    } else if (o.hair === 'young') {
      body += '<path d="M58 100 C54 64 76 48 102 48 C128 48 146 66 142 100 C136 78 124 70 104 70 C88 72 76 74 70 90 C66 92 62 96 58 100 Z" fill="url(#' + gHair + ')"/>';
    }
    /* brows */
    var browCol = o.hair === 'young' ? '#3A2D27' : (o.hair === 'ne-woman' ? '#6F6A66' : '#E9E6DE');
    body += '<path d="M73 84 q10 -7 20 -2" stroke="' + browCol + '" stroke-width="4.5" fill="none" stroke-linecap="round"/>' +
      '<path d="M107 82 q10 -5 20 2" stroke="' + browCol + '" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
    /* eyes — closed, smiling arcs read as warm and friendly */
    body += '<path d="M76 99 q7 -7 14 0" stroke="#2B2A33" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M110 99 q7 -7 14 0" stroke="#2B2A33" stroke-width="3.6" fill="none" stroke-linecap="round"/>';
    /* glasses */
    if (o.glasses) {
      body += '<g fill="#fff" fill-opacity=".14" stroke="#2F3446" stroke-width="3.4">' +
        '<rect x="67" y="86" width="30" height="24" rx="10"/><rect x="103" y="86" width="30" height="24" rx="10"/></g>' +
        '<path d="M97 96 q3 -3 6 0" stroke="#2F3446" stroke-width="3" fill="none"/>' +
        '<path d="M72 90 l6 -2" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M108 90 l6 -2" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>';
    }
    /* nose */
    body += '<path d="M100 104 q-5 12 1 14 q4 1 6 -1" stroke="' + sk[2] + '" stroke-width="3" fill="none" stroke-linecap="round" opacity=".75"/>';
    /* cheeks */
    body += '<circle cx="74" cy="118" r="10" fill="url(#' + gCheek + ')"/><circle cx="126" cy="118" r="10" fill="url(#' + gCheek + ')"/>';
    /* mustache */
    if (o.mustache) {
      body += '<path d="M84 124 C90 118 97 119 100 122 C103 119 110 118 116 124 C110 126 104 126 100 124 C96 126 90 126 84 124 Z" fill="' + hairCol[0] + '" stroke="' + hairCol[1] + '" stroke-width="1"/>';
    }
    /* smile */
    body += '<path d="M86 128 q14 15 28 0 q-14 5 -28 0 Z" fill="#8E3B3F"/>' +
      '<path d="M89 129 q11 4 22 0 v2.5 q-11 3.5 -22 0 Z" fill="#fff"/>';
    /* earrings */
    if (o.hair === 'woman' || o.hair === 'ne-woman') {
      body += '<circle cx="59" cy="118" r="3.5" fill="#E8B64C"/><circle cx="141" cy="118" r="3.5" fill="#E8B64C"/>';
    }
    /* waving hand */
    if (o.wave) {
      body += '<path d="M160 196 C170 176 176 158 178 140 L196 142 C194 164 186 190 176 210 Z" fill="url(#' + gOut + ')"/>' +
        '<g transform="rotate(-12 186 118)">' +
          '<rect x="171" y="92" width="9" height="28" rx="4.5" fill="url(#' + gSkin + ')"/>' +
          '<rect x="180" y="86" width="9" height="32" rx="4.5" fill="url(#' + gSkin + ')"/>' +
          '<rect x="189" y="88" width="9" height="30" rx="4.5" fill="url(#' + gSkin + ')"/>' +
          '<rect x="198" y="94" width="8.5" height="25" rx="4.25" fill="url(#' + gSkin + ')"/>' +
          '<rect x="170" y="108" width="36" height="32" rx="14" fill="url(#' + gSkin + ')"/>' +
          '<rect x="160" y="112" width="20" height="9" rx="4.5" transform="rotate(35 170 116)" fill="url(#' + gSkin + ')"/>' +
        '</g>';
    }

    var tf = 'translate(' + (o.x || 0) + ' ' + (o.y || 0) + ') scale(' + (o.s || 1) + ')';
    return defs + '<g transform="' + tf + '">' + body + '</g>';
  }

  /* ============================================================
     Public library
     ============================================================ */
  var Art = {

    person: person,

    /** Home hero: an elder waving hello from a warm living room. */
    hero: function (p) {
      var look = Art.lookFor(p);
      var gWin = nid('win'), gChair = nid('ch'), gChair2 = nid('ch2'), gPot = nid('pot'), gLeaf = nid('lf'), gGlow = nid('gl'), gHeart = nid('ht');
      var defs = '<defs>' +
        lg(gWin, [[0, '#EAF2FC'], [1, '#FFF7EA']]) +
        rg(gChair, [[0, '#FBE3CF'], [.6, '#F1C6A4'], [1, '#D99E78']], '35%', '25%', '85%') +
        rg(gChair2, [[0, '#F6D4B9'], [1, '#D8A07A']], '35%', '25%', '90%') +
        rg(gPot, [[0, '#FFFFFF'], [.6, '#F1ECE2'], [1, '#D8CFBF']], '30%', '30%', '80%') +
        rg(gLeaf, [[0, '#A7D7B8'], [.6, '#6FB091'], [1, '#3F8467']], '35%', '30%', '85%') +
        rg(gGlow, [[0, '#FFF3D9', .95], [1, '#FFF3D9', 0]], '50%', '50%', '50%') +
        rg(gHeart, [[0, '#9EB8E8'], [.6, '#5B82C4'], [1, '#3F619E']], '35%', '30%', '80%') +
        '</defs>';
      var b = '';
      /* sunlight bloom */
      b += '<circle cx="150" cy="80" r="150" fill="url(#' + gGlow + ')"/>';
      /* window */
      b += '<g opacity=".9"><rect x="60" y="24" width="150" height="170" rx="20" fill="url(#' + gWin + ')" stroke="#fff" stroke-width="8"/>' +
        '<path d="M135 28 v162 M64 110 h142" stroke="#fff" stroke-width="7"/>' +
        '<path d="M90 60 q20 -18 44 -8" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/></g>';
      /* plant */
      b += shadow(66, 330, 40, 8, .16) +
        '<g><path d="M66 250 C40 220 34 190 44 166 C60 188 68 216 66 250 Z" fill="url(#' + gLeaf + ')"/>' +
        '<path d="M68 252 C86 212 104 196 122 190 C116 220 96 242 68 252 Z" fill="url(#' + gLeaf + ')"/>' +
        '<path d="M64 252 C44 236 20 232 8 236 C22 252 42 258 64 252 Z" fill="url(#' + gLeaf + ')"/>' +
        '<path d="M66 250 C62 212 72 182 90 162 C94 196 84 228 66 250 Z" fill="url(#' + gLeaf + ')" opacity=".92"/>' +
        '<path d="M40 252 h54 l-8 76 h-38 Z" fill="url(#' + gPot + ')"/><rect x="36" y="246" width="62" height="12" rx="6" fill="#fff"/></g>';
      /* armchair */
      b += shadow(330, 344, 170, 14, .18) +
        '<path d="M200 350 V190 C200 130 240 104 330 104 C420 104 460 130 460 190 V350 Z" fill="url(#' + gChair + ')"/>' +
        '<path d="M232 180 C232 142 262 124 330 124 C398 124 428 142 428 180" stroke="#fff" stroke-opacity=".5" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        '<rect x="184" y="236" width="56" height="116" rx="26" fill="url(#' + gChair2 + ')"/>' +
        '<rect x="420" y="236" width="56" height="116" rx="26" fill="url(#' + gChair2 + ')"/>';
      /* elder */
      b += person({ skin: look.skin, outfit: look.outfit, hair: look.hair, glasses: true, mustache: look.mustache, wave: true, shawl: look.shawl, shawlBorder: look.shawlBorder, x: 222, y: 118, s: 1.02 });
      /* floating heart bubble */
      b += '<g class="float" style="transform-origin:470px 80px">' + shadow(478, 150, 22, 5, .14) +
        '<path d="M478 118 C458 104 446 90 446 76 A16 16 0 0 1 478 70 A16 16 0 0 1 510 76 C510 90 498 104 478 118 Z" fill="url(#' + gHeart + ')"/>' +
        '<path d="M456 76 a9 9 0 0 1 10 -8" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".75"/></g>';
      /* sparkles */
      b += '<path d="M520 180 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 Z" fill="#F2C96B" opacity=".9"/>' +
        '<path d="M430 40 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill="#B6A9E6"/>';
      return svg('0 0 560 360', defs + b, 'art-hero', 'An elder waving hello from a warm living room');
    },

    /** Two elders together — used on empty states and caregiver screens. */
    couple: function () {
      var b = shadow(200, 222, 150, 12, .18) +
        person({ skin: 'warm', outfit: 'blue', hair: 'man', glasses: true, mustache: true, x: 30, y: 0, s: 1 }) +
        person({ skin: 'ne', outfit: 'cream', hair: 'ne-woman', shawl: ['#FFF9EE', '#F1E3C5'], shawlBorder: '#D2484F', x: 170, y: 10, s: .94 });
      return svg('0 0 400 240', b, 'art-couple', 'An elderly couple smiling together');
    },

    /** Welcome screen: two North-East Indian elders reading SMIVAI
        together — she in a mekhela sador, he with a gamosa round his
        neck, the phone between them showing the app's own home screen. */
    neCouple: function () {
      var sk = nid('nsk'), fr = nid('nfr'), sc = nid('nsc'), hd = nid('nhd');
      var tone = SKIN.ne;
      var defs = '<defs>' +
        rg(sk, [[0, tone[0]], [.6, tone[1]], [1, tone[2]]], '38%', '32%', '78%') +
        lg(fr, [[0, '#46536F'], [1, '#202A44']], 0, 0, 1, 1) +
        lg(sc, [[0, '#FFFDF8'], [1, '#E9F0FA']], 0, 0, .3, 1) +
        lg(hd, [[0, '#7FA2DE'], [1, '#4A70B3']], 0, 0, 1, 1) +
        '</defs>';

      /* his gamosa: white cotton with the woven red bands at each end */
      var gamosa =
        '<path d="M258 158 C250 186 246 212 244 234 L266 234 C266 208 269 182 273 159 Z" fill="#FFFCF4"/>' +
        '<path d="M301 159 C307 186 311 212 313 234 L291 234 C291 208 289 182 286 158 Z" fill="#FFFCF4"/>' +
        '<g stroke="#D2484F" stroke-linecap="round">' +
          '<path d="M246 212 h20" stroke-width="7"/><path d="M291 212 h20" stroke-width="7"/>' +
          '<path d="M245 224 h20" stroke-width="3.5"/><path d="M291 224 h20" stroke-width="3.5"/>' +
        '</g>';

      /* the phone they are both looking at, held in her hand */
      var phone =
        '<g transform="rotate(-7 200 178)">' +
          '<rect x="154" y="198" width="30" height="20" rx="10" fill="url(#' + sk + ')"/>' +
          '<rect x="164" y="118" width="72" height="114" rx="15" fill="url(#' + fr + ')"/>' +
          '<rect x="170" y="124" width="60" height="102" rx="10" fill="url(#' + sc + ')"/>' +
          '<path d="M170 134 a10 10 0 0 1 10 -10 h40 a10 10 0 0 1 10 10 v13 h-60 Z" fill="url(#' + hd + ')"/>' +
          '<path d="M200 144 c-6 -4 -10.5 -7.4 -10.5 -11.3 a4 4 0 0 1 6.4 -3.2 L200 132 l4.1 -2.5 a4 4 0 0 1 6.4 3.2 c0 3.9 -4.5 7.3 -10.5 11.3 Z" fill="#fff" opacity=".95"/>' +
          '<rect x="176" y="154" width="48" height="24" rx="8" fill="#DFE8F6"/>' +
          '<rect x="182" y="161" width="26" height="4" rx="2" fill="#fff" opacity=".9"/>' +
          '<rect x="182" y="169" width="17" height="4" rx="2" fill="#fff" opacity=".65"/>' +
          '<rect x="176" y="182" width="48" height="24" rx="8" fill="#FADCC6"/>' +
          '<rect x="182" y="189" width="26" height="4" rx="2" fill="#fff" opacity=".9"/>' +
          '<rect x="182" y="197" width="17" height="4" rx="2" fill="#fff" opacity=".65"/>' +
          '<rect x="176" y="210" width="48" height="14" rx="7" fill="#5B82C4"/>' +
          '<g fill="url(#' + sk + ')">' +
            '<rect x="156" y="184" width="26" height="9" rx="4.5"/>' +
            '<rect x="155" y="196" width="27" height="9" rx="4.5"/>' +
            '<rect x="156" y="208" width="25" height="9" rx="4.5"/>' +
          '</g>' +
        '</g>';

      var b = defs + shadow(200, 230, 156, 12, .18) +
        person({ skin: 'ne', hair: 'ne-woman', outfit: 'cream', shawl: ['#FFF9EE', '#F1E3C5'], shawlBorder: '#D2484F', x: 6, y: 6, s: .94 }) +
        person({ skin: 'ne', hair: 'man', glasses: true, mustache: true, outfit: 'teal', x: 190, y: 12, s: .92 }) +
        gamosa + phone;
      return svg('0 0 400 240', b, 'art-couple',
        'Two North-East Indian elders looking at SMIVAI together on a phone');
    },

    /** A spiral notepad with a pencil across it. */
    notepad: function () {
      var pg = nid('np'), pc = nid('pc'), bd = nid('bd');
      var rings = '';
      for (var i = 0; i < 5; i++) rings += '<circle cx="' + (60 + i * 18) + '" cy="35" r="4.5" fill="#FFFFFF" opacity=".92"/>';
      var b = '<defs>' + lg(pg, [[0, '#FFFDF6'], [1, '#F3E7C9']]) +
        lg(pc, [[0, '#F9DE84'], [1, '#E4A84A']], 0, 0, 1, 0) +
        lg(bd, [[0, '#B3A6E6'], [1, '#8676CB']]) + '</defs>' +
        shadow(100, 186, 62, 8) +
        '<rect x="46" y="30" width="112" height="148" rx="14" fill="#E6D8B4"/>' +
        '<rect x="38" y="24" width="112" height="148" rx="14" fill="url(#' + pg + ')" stroke="#EADFC4" stroke-width="2"/>' +
        '<rect x="38" y="24" width="112" height="24" rx="12" fill="url(#' + bd + ')"/>' + rings +
        '<g stroke="#D8CAA4" stroke-width="4" stroke-linecap="round">' +
          '<path d="M56 74h76"/><path d="M56 94h76"/><path d="M56 114h56"/><path d="M56 134h66"/></g>' +
        '<g transform="rotate(35 140 120)">' +
          '<rect x="132" y="60" width="16" height="90" rx="4" fill="url(#' + pc + ')"/>' +
          '<rect x="132" y="56" width="16" height="11" rx="3" fill="#EFA57A"/>' +
          '<path d="M132 150 l8 18 l8 -18 Z" fill="#F4D2B0"/><path d="M137 161 l3 7 l3 -7 Z" fill="#3F4A66"/>' +
          '<path d="M136 66 v80" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/></g>';
      return svg('0 0 200 200', b, 'art-obj', 'A notepad and pencil');
    },

    /** A doctor in a white coat, stethoscope round the neck. */
    doctor: function () {
      var b = shadow(160, 240, 112, 12, .16) +
        person({ skin: 'wheat', outfit: 'coat', hair: 'man', glasses: true, x: 60, y: 6, s: 1 }) +
        '<g fill="none" stroke="#2F3446" stroke-width="7" stroke-linecap="round">' +
          '<path d="M138 176 C126 198 132 216 160 224"/>' +
          '<path d="M182 176 C194 198 188 216 160 224"/>' +
        '</g>' +
        '<circle cx="160" cy="230" r="11" fill="#C9D0DC" stroke="#9AA2B6" stroke-width="3"/>' +
        '<circle cx="160" cy="230" r="5" fill="#EEF1F6"/>';
      return svg('0 0 320 250', b, 'art-doctor', 'A doctor');
    },

    /** A caregiver beside an elder. */
    caregiver: function () {
      var b = shadow(160, 222, 120, 12, .16) +
        person({ skin: 'wheat', outfit: 'peach', hair: 'young', hairColor: ['#3E302A', '#221A16'], x: 150, y: 8, s: .92 }) +
        person({ skin: 'deep', outfit: 'lav', hair: 'woman', glasses: true, shawl: ['#E3DCF6', '#C6BBEE'], x: 10, y: 20, s: .9 });
      return svg('0 0 330 240', b, 'art-caregiver', 'A caregiver with an elder');
    },

    /** Head-and-shoulders avatar for a profile. */
    avatar: function (p) {
      var look = Art.lookFor(p);
      var bg = nid('avbg');
      var b = '<defs>' + lg(bg, [[0, look.bg[0]], [1, look.bg[1]]]) + '</defs>' +
        '<rect width="200" height="200" fill="url(#' + bg + ')"/>' +
        person({ skin: look.skin, outfit: look.outfit, hair: look.hair, glasses: look.glasses, mustache: look.mustache, shawl: look.shawl, shawlBorder: look.shawlBorder, x: 18, y: 26, s: .82 });
      var out = svg('0 0 200 200', b, 'art-avatar', p && p.name ? p.name : 'Profile picture');
      /* Who this is, so S.Photo can offer a photograph in its place. */
      var id = p && (p.patient_id || p.doctor_id || p.caregiver_id || p.id) || '';
      return out.replace('<svg ', '<svg data-person="' + S.esc(id) + '" data-gender="' + S.esc((p && p.gender) || '') + '" ');
    },

    /** Stable look per person so the same patient always looks the same. */
    lookFor: function (p) {
      p = p || {};
      var female = p.gender === 'female' || (!p.gender && p.voice_gender === 'female');
      var ne = /manipur|imphal|mizo|aizawl|khasi|shillong|meghalaya|naga|kohima|arunachal|sikkim|tripura|jorhat|assam|guwahati|dibrugarh|bodo|kokrajhar/i.test(p.district || '');
      var h = S.hashSeed(p.patient_id || p.name || 'x');
      var tones = ne ? ['ne', 'wheat'] : ['wheat', 'warm', 'deep'];
      var skin = p.skin || tones[h % tones.length];
      if (female) {
        return {
          skin: skin, hair: ne ? 'ne-woman' : 'woman', outfit: ['lav', 'peach', 'teal'][h % 3], glasses: h % 2 === 0,
          shawl: ne ? ['#FFF9EE', '#F1E3C5'] : ['#FBE3CF', '#F1C6A4'], shawlBorder: ne ? '#D2484F' : null,
          bg: ['#F2EFFB', '#FDF0E6']
        };
      }
      return {
        skin: skin, hair: 'man', outfit: ['blue', 'green', 'blue'][h % 3], glasses: true, mustache: h % 3 !== 1,
        bg: ['#EFF4FB', '#E3DCF6']
      };
    },

    /** Glassy AI orb for Talk with SMIVAI. */
    orb: function (cls) {
      var a = nid('orb'), c = nid('orc'), d = nid('ord');
      var b = '<defs>' +
        rg(a, [[0, '#FFFFFF'], [.25, '#DDE6FA'], [.6, '#9FB5EA'], [.85, '#8A79D6'], [1, '#6E62C2']], '35%', '28%', '80%') +
        rg(c, [[0, '#FFFFFF', .9], [1, '#FFFFFF', 0]], '50%', '50%', '50%') +
        lg(d, [[0, '#F7C3A4', .0], [1, '#F7C3A4', .55]], 0, 0, 1, 1) +
        '</defs>' +
        shadow(100, 188, 54, 9, .2) +
        '<circle cx="100" cy="96" r="78" fill="url(#' + a + ')"/>' +
        '<circle cx="100" cy="96" r="78" fill="url(#' + d + ')"/>' +
        '<ellipse cx="74" cy="62" rx="30" ry="18" fill="url(#' + c + ')" transform="rotate(-28 74 62)"/>' +
        '<path d="M52 118 q48 34 96 0" stroke="#fff" stroke-opacity=".35" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        '<g fill="#fff"><circle cx="82" cy="100" r="7"/><circle cx="118" cy="100" r="7"/></g>' +
        '<path d="M86 122 q14 10 28 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>';
      return svg('0 0 200 200', b, 'art-orb ' + (cls || ''), 'HUN');
    },

    /* ---------- objects ---------- */
    stethoscope: function () {
      var t = nid('st'), m = nid('stm');
      var b = '<defs>' + lg(t, [[0, '#7FA2DE'], [1, '#3F619E']], 0, 0, 1, 1) + rg(m, [[0, '#FFFFFF'], [.5, '#DADFEA'], [1, '#8D95AB']]) + '</defs>' +
        shadow(100, 186, 60, 9) +
        '<path d="M58 30 v52 a42 42 0 0 0 84 0 V30" stroke="url(#' + t + ')" stroke-width="14" fill="none" stroke-linecap="round"/>' +
        '<path d="M100 124 v18 a26 26 0 0 0 52 0 v-12" stroke="url(#' + t + ')" stroke-width="12" fill="none" stroke-linecap="round"/>' +
        '<circle cx="152" cy="118" r="20" fill="url(#' + m + ')"/><circle cx="152" cy="118" r="10" fill="#5E6780"/><circle cx="147" cy="113" r="4" fill="#fff" opacity=".8"/>' +
        '<rect x="48" y="18" width="20" height="22" rx="8" fill="url(#' + m + ')"/><rect x="132" y="18" width="20" height="22" rx="8" fill="url(#' + m + ')"/>';
      return svg('0 0 200 200', b, 'art-obj', 'Stethoscope');
    },

    medicine: function () {
      var bot = nid('bt'), cap = nid('cp'), pl = nid('pl'), pl2 = nid('pl2');
      var b = '<defs>' + lg(bot, [[0, '#FFFFFF'], [1, '#E7ECE9']], 0, 0, 1, 0) + rg(cap, [[0, '#9FD6BA'], [1, '#3F8467']]) +
        rg(pl, [[0, '#FFFFFF'], [1, '#E4E8F0']]) + rg(pl2, [[0, '#FBC6C9'], [1, '#E0707A']]) + '</defs>' +
        shadow(100, 186, 70, 9) +
        '<rect x="54" y="56" width="72" height="120" rx="20" fill="url(#' + bot + ')" stroke="#DCE3DE" stroke-width="2"/>' +
        '<rect x="50" y="30" width="80" height="32" rx="12" fill="url(#' + cap + ')"/>' +
        '<rect x="64" y="98" width="52" height="40" rx="8" fill="#DDEFE5"/><path d="M90 108 v20 M80 118 h20" stroke="#3F8467" stroke-width="6" stroke-linecap="round"/>' +
        '<rect x="62" y="64" width="8" height="96" rx="4" fill="#fff" opacity=".8"/>' +
        '<g transform="rotate(-35 150 150)"><rect x="124" y="136" width="56" height="28" rx="14" fill="url(#' + pl + ')"/><path d="M152 136 h14 a14 14 0 0 1 0 28 h-14 Z" fill="url(#' + pl2 + ')"/></g>';
      return svg('0 0 200 200', b, 'art-obj', 'Medicines');
    },

    folder: function () {
      var f1 = nid('f1'), f2 = nid('f2'), cr = nid('cr');
      var b = '<defs>' + lg(f1, [[0, '#9A8AD8'], [1, '#6F5FB3']]) + lg(f2, [[0, '#C6BBEE'], [1, '#9C8BD8']]) + rg(cr, [[0, '#FFFFFF'], [1, '#E8E3FA']]) + '</defs>' +
        shadow(100, 184, 70, 9) +
        '<path d="M30 52 a12 12 0 0 1 12 -12 h40 l14 14 h62 a12 12 0 0 1 12 12 v94 a12 12 0 0 1 -12 12 H42 a12 12 0 0 1 -12 -12 Z" fill="url(#' + f1 + ')"/>' +
        '<rect x="44" y="60" width="112" height="70" rx="8" fill="#fff" opacity=".9"/>' +
        '<path d="M26 86 a12 12 0 0 1 12 -12 h124 a12 12 0 0 1 12 12 l-6 76 a12 12 0 0 1 -12 11 H44 a12 12 0 0 1 -12 -11 Z" fill="url(#' + f2 + ')"/>' +
        '<circle cx="100" cy="124" r="24" fill="url(#' + cr + ')"/><path d="M100 112 v24 M88 124 h24" stroke="#6F5FB3" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M40 90 h60" stroke="#fff" stroke-opacity=".45" stroke-width="4" stroke-linecap="round"/>';
      return svg('0 0 200 200', b, 'art-obj', 'Health records folder');
    },

    water: function () {
      var gl = nid('gl'), wa = nid('wa');
      var b = '<defs>' + lg(gl, [[0, '#FFFFFF', .9], [1, '#DDEBF7', .6]], 0, 0, 1, 0) + lg(wa, [[0, '#A9C7EF'], [1, '#5B82C4']]) + '</defs>' +
        shadow(100, 186, 50, 8) +
        '<path d="M56 34 h88 l-12 140 a10 10 0 0 1 -10 9 H78 a10 10 0 0 1 -10 -9 Z" fill="url(#' + gl + ')" stroke="#C6D6EF" stroke-width="3"/>' +
        '<path d="M62 92 q38 -10 76 0 l-7 80 a8 8 0 0 1 -8 7 H77 a8 8 0 0 1 -8 -7 Z" fill="url(#' + wa + ')" opacity=".85"/>' +
        '<ellipse cx="100" cy="92" rx="38" ry="6" fill="#C6D6EF"/>' +
        '<rect x="68" y="44" width="8" height="120" rx="4" fill="#fff" opacity=".85"/>' +
        '<circle cx="118" cy="130" r="4" fill="#fff" opacity=".7"/><circle cx="108" cy="150" r="3" fill="#fff" opacity=".6"/>';
      return svg('0 0 200 200', b, 'art-obj', 'A glass of water');
    },

    plant: function () {
      var lf = nid('lf'), pt = nid('pt');
      var b = '<defs>' + rg(lf, [[0, '#B9E2C8'], [.6, '#6FB091'], [1, '#3F8467']]) + rg(pt, [[0, '#FBE3CF'], [.6, '#EFC09B'], [1, '#C98F66']]) + '</defs>' +
        shadow(100, 190, 56, 8) +
        '<path d="M100 130 C70 104 62 70 72 40 C92 62 104 94 100 130 Z" fill="url(#' + lf + ')"/>' +
        '<path d="M102 132 C120 94 142 76 168 70 C160 104 136 126 102 132 Z" fill="url(#' + lf + ')"/>' +
        '<path d="M98 132 C74 118 46 116 28 122 C44 140 70 144 98 132 Z" fill="url(#' + lf + ')"/>' +
        '<path d="M100 130 C98 92 110 60 132 30 C138 70 124 104 100 130 Z" fill="url(#' + lf + ')" opacity=".9"/>' +
        '<path d="M64 128 h72 l-10 56 a8 8 0 0 1 -8 6 H82 a8 8 0 0 1 -8 -6 Z" fill="url(#' + pt + ')"/>' +
        '<rect x="58" y="122" width="84" height="14" rx="7" fill="#FBEBDD"/>';
      return svg('0 0 200 200', b, 'art-obj', 'A potted plant');
    },

    bulb: function () {
      var g = nid('bl'), c = nid('bc');
      var b = '<defs>' + rg(g, [[0, '#FFF6D6'], [.5, '#F7D774'], [1, '#E4A84A']]) + lg(c, [[0, '#D8DCE6'], [1, '#9AA2B6']]) + '</defs>' +
        shadow(100, 188, 40, 7) +
        '<circle cx="100" cy="80" r="56" fill="#FFF3C4" opacity=".45"/>' +
        '<path d="M100 28 a50 50 0 0 1 30 90 c-6 5 -8 10 -8 16 v8 h-44 v-8 c0 -6 -2 -11 -8 -16 A50 50 0 0 1 100 28 Z" fill="url(#' + g + ')"/>' +
        '<rect x="76" y="142" width="48" height="12" rx="6" fill="url(#' + c + ')"/><rect x="80" y="156" width="40" height="12" rx="6" fill="url(#' + c + ')"/>' +
        '<path d="M92 170 h16 l-3 10 h-10 Z" fill="#7F879C"/>' +
        '<path d="M76 58 a28 28 0 0 1 20 -14" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".8"/>';
      return svg('0 0 200 200', b, 'art-obj', 'A light bulb');
    },

    puzzle: function () {
      var a = nid('pz'), c = nid('pz2');
      var piece = function (grad, x, y, r) {
        return '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ')">' +
          '<path d="M0 0 h24 a12 12 0 1 1 24 0 h24 v24 a12 12 0 1 0 0 24 v24 h-72 Z" fill="url(#' + grad + ')"/>' +
          '<path d="M6 8 h14" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/></g>';
      };
      var b = '<defs>' + rg(a, [[0, '#D8CFF7'], [.6, '#9C8BD8'], [1, '#6F5FB3']]) + rg(c, [[0, '#FDE0CC'], [.6, '#EFA57A'], [1, '#C97B50']]) + '</defs>' +
        shadow(100, 186, 70, 9) + piece(a, 30, 60, -8) + piece(c, 100, 76, 10);
      return svg('0 0 200 200', b, 'art-obj', 'Puzzle pieces');
    },

    cards: function () {
      var a = nid('cd'), c = nid('cd2');
      var b = '<defs>' + lg(a, [[0, '#FFFFFF'], [1, '#EDEAF7']], 0, 0, 1, 1) + lg(c, [[0, '#9C8BD8'], [1, '#6F5FB3']], 0, 0, 1, 1) + '</defs>' +
        shadow(100, 186, 72, 9) +
        '<g transform="rotate(-12 70 110)"><rect x="34" y="50" width="72" height="100" rx="14" fill="url(#' + c + ')"/><circle cx="70" cy="100" r="16" fill="none" stroke="#fff" stroke-width="5" opacity=".7"/></g>' +
        '<g transform="rotate(10 130 110)"><rect x="94" y="46" width="72" height="100" rx="14" fill="url(#' + a + ')" stroke="#E3DCF6" stroke-width="2"/>' +
        '<path d="M130 116 C116 106 110 98 110 90 a10 10 0 0 1 20 -4 a10 10 0 0 1 20 4 c0 8 -6 16 -20 26 Z" fill="#EFA57A"/></g>';
      return svg('0 0 200 200', b, 'art-obj', 'Memory cards');
    },

    shapes: function () {
      var a = nid('sa'), c = nid('sb'), d = nid('sc');
      var b = '<defs>' + rg(a, [[0, '#C3D4F3'], [1, '#5B82C4']]) + rg(c, [[0, '#FDE0CC'], [1, '#E0895B']]) + rg(d, [[0, '#BDE3CF'], [1, '#4F9D91']]) + '</defs>' +
        shadow(100, 184, 76, 9) +
        '<circle cx="54" cy="120" r="30" fill="url(#' + a + ')"/>' +
        '<rect x="82" y="80" width="54" height="54" rx="12" fill="url(#' + c + ')" transform="rotate(10 109 107)"/>' +
        '<path d="M150 150 l24 -46 24 46 Z" fill="url(#' + d + ')" transform="translate(-20 0)"/>';
      return svg('0 0 200 200', b, 'art-obj', 'Shapes');
    },

    letters: function () {
      var t = nid('lt');
      var tile = function (x, y, r, ch) {
        return '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ')"><rect x="-26" y="-26" width="52" height="52" rx="12" fill="url(#' + t + ')" stroke="#E6D6B8" stroke-width="2"/>' +
          '<text x="0" y="10" text-anchor="middle" font-family="Manrope,sans-serif" font-weight="800" font-size="30" fill="#56479A">' + ch + '</text></g>';
      };
      var b = '<defs>' + lg(t, [[0, '#FFFDF7'], [1, '#F2E6CC']]) + '</defs>' + shadow(100, 184, 76, 9) +
        tile(50, 110, -10, 'W') + tile(102, 96, 4, 'O') + tile(152, 116, 12, 'R');
      return svg('0 0 200 200', b, 'art-obj', 'Letter tiles');
    },

    bingo: function () {
      var a = nid('bg');
      var cells = '';
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
        var on = (r + c) % 2 === 0;
        cells += '<rect x="' + (52 + c * 34) + '" y="' + (48 + r * 34) + '" width="28" height="28" rx="8" fill="' + (on ? '#DFE8F6' : '#fff') + '"/>';
      }
      var b = '<defs>' + lg(a, [[0, '#9EB8E8'], [1, '#4A70B3']], 0, 0, 1, 1) + '</defs>' + shadow(100, 184, 66, 9) +
        '<rect x="40" y="36" width="120" height="120" rx="22" fill="url(#' + a + ')"/>' + cells +
        '<circle cx="134" cy="130" r="22" fill="#EFA57A"/><path d="M125 130 l6 6 12 -12" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>';
      return svg('0 0 200 200', b, 'art-obj', 'Picture bingo board');
    },

    sorting: function () {
      var a = nid('so'), c = nid('so2');
      var b = '<defs>' + lg(a, [[0, '#BDE3CF'], [1, '#4F9D91']]) + lg(c, [[0, '#FDE0CC'], [1, '#E0895B']]) + '</defs>' + shadow(100, 186, 76, 9) +
        '<path d="M26 100 h66 l-8 76 h-50 Z" fill="url(#' + a + ')"/><path d="M108 100 h66 l-8 76 h-50 Z" fill="url(#' + c + ')"/>' +
        '<circle cx="58" cy="76" r="18" fill="#F2C96B"/><rect x="124" y="56" width="34" height="34" rx="8" fill="#9C8BD8"/>' +
        '<path d="M34 104 h50 M116 104 h50" stroke="#fff" stroke-width="4" opacity=".5" stroke-linecap="round"/>';
      return svg('0 0 200 200', b, 'art-obj', 'Sorting bins');
    },

    matching: function () {
      var a = nid('mt');
      var b = '<defs>' + lg(a, [[0, '#FFFFFF'], [1, '#E9EEF8']], 0, 0, 1, 1) + '</defs>' + shadow(100, 186, 76, 9) +
        '<rect x="24" y="52" width="70" height="90" rx="16" fill="url(#' + a + ')" stroke="#DFE8F6" stroke-width="2" transform="rotate(-6 59 97)"/>' +
        '<rect x="106" y="52" width="70" height="90" rx="16" fill="url(#' + a + ')" stroke="#DFE8F6" stroke-width="2" transform="rotate(6 141 97)"/>' +
        '<circle cx="59" cy="96" r="18" fill="#F2A1A6"/><circle cx="141" cy="96" r="18" fill="#F2A1A6"/>' +
        '<path d="M80 150 q20 18 40 0" stroke="#5B82C4" stroke-width="6" fill="none" stroke-linecap="round"/>';
      return svg('0 0 200 200', b, 'art-obj', 'Matching cards');
    },

    photos: function () {
      var a = nid('ph'), s = nid('phs');
      var b = '<defs>' + lg(a, [[0, '#BFD6EE'], [1, '#EBD9BE']]) + lg(s, [[0, '#9FCFB4'], [1, '#5E9E80']]) + '</defs>' + shadow(100, 186, 76, 9) +
        '<g transform="rotate(-10 80 100)"><rect x="30" y="44" width="100" height="112" rx="10" fill="#fff" stroke="#EDE6DA" stroke-width="2"/><rect x="40" y="54" width="80" height="70" rx="6" fill="url(#' + a + ')"/></g>' +
        '<g transform="rotate(8 126 104)"><rect x="76" y="48" width="100" height="112" rx="10" fill="#fff" stroke="#EDE6DA" stroke-width="2"/><rect x="86" y="58" width="80" height="70" rx="6" fill="url(#' + a + ')"/>' +
        '<path d="M86 128 l24 -26 18 16 12 -10 26 20 Z" fill="url(#' + s + ')"/><circle cx="148" cy="76" r="8" fill="#F2C96B"/></g>';
      return svg('0 0 200 200', b, 'art-obj', 'Photographs');
    },

    calendar: function () {
      var a = nid('ca'), c = nid('cb');
      var b = '<defs>' + lg(a, [[0, '#8EABDD'], [1, '#4A70B3']]) + lg(c, [[0, '#FFFFFF'], [1, '#EEF2F9']]) + '</defs>' + shadow(100, 184, 66, 9) +
        '<rect x="36" y="40" width="128" height="130" rx="22" fill="url(#' + c + ')" stroke="#DFE8F6" stroke-width="2"/>' +
        '<path d="M36 62 a22 22 0 0 1 22 -22 h84 a22 22 0 0 1 22 22 v14 H36 Z" fill="url(#' + a + ')"/>' +
        '<rect x="62" y="28" width="12" height="26" rx="6" fill="#3F619E"/><rect x="126" y="28" width="12" height="26" rx="6" fill="#3F619E"/>' +
        '<g fill="#C6D6EF"><rect x="56" y="92" width="20" height="18" rx="5"/><rect x="90" y="92" width="20" height="18" rx="5"/><rect x="124" y="92" width="20" height="18" rx="5" fill="#EFA57A"/>' +
        '<rect x="56" y="124" width="20" height="18" rx="5"/><rect x="90" y="124" width="20" height="18" rx="5"/></g>';
      return svg('0 0 200 200', b, 'art-obj', 'Calendar');
    },

    trophy: function () {
      var a = nid('tr');
      var b = '<defs>' + rg(a, [[0, '#E9E3FB'], [.55, '#A99AE0'], [1, '#6F5FB3']]) + '</defs>' + shadow(100, 186, 50, 8) +
        '<path d="M60 36 h80 v40 a40 40 0 0 1 -80 0 Z" fill="url(#' + a + ')"/>' +
        '<path d="M60 48 H40 a22 22 0 0 0 24 30 M140 48 h20 a22 22 0 0 1 -24 30" stroke="#9C8BD8" stroke-width="8" fill="none"/>' +
        '<rect x="90" y="114" width="20" height="30" fill="#8C7BCB"/><rect x="66" y="142" width="68" height="24" rx="8" fill="url(#' + a + ')"/>' +
        '<path d="M100 52 l5 10 11 2 -8 8 2 11 -10 -5 -10 5 2 -11 -8 -8 11 -2 Z" fill="#fff"/>';
      return svg('0 0 200 200', b, 'art-obj', 'Trophy');
    },

    book: function () {
      var a = nid('bk'), c = nid('bk2');
      var b = '<defs>' + lg(a, [[0, '#C6BBEE'], [1, '#8A79D6']], 0, 0, 1, 1) + lg(c, [[0, '#FFFFFF'], [1, '#F3EEE4']]) + '</defs>' + shadow(100, 184, 74, 9) +
        '<path d="M100 60 C80 46 52 42 28 46 V160 C52 156 80 160 100 172 C120 160 148 156 172 160 V46 C148 42 120 46 100 60 Z" fill="url(#' + a + ')"/>' +
        '<path d="M100 64 C82 52 58 50 38 52 V150 C58 148 82 152 100 162 Z" fill="url(#' + c + ')"/><path d="M100 64 C118 52 142 50 162 52 V150 C142 148 118 152 100 162 Z" fill="url(#' + c + ')"/>' +
        '<path d="M52 80 h32 M52 96 h32 M52 112 h24 M116 80 h32 M116 96 h32" stroke="#D5CDEB" stroke-width="5" stroke-linecap="round"/>';
      return svg('0 0 200 200', b, 'art-obj', 'Book');
    },

    phone: function () {
      var a = nid('pn');
      var b = '<defs>' + rg(a, [[0, '#FF9AA2'], [.55, '#EF4D59'], [1, '#C42A36']]) + '</defs>' + shadow(100, 184, 56, 9) +
        '<circle cx="100" cy="96" r="70" fill="url(#' + a + ')"/>' +
        '<path d="M76 62 h12 l8 20 -9 7 a44 44 0 0 0 26 26 l7 -9 20 8 v12 a8 8 0 0 1 -9 8 A66 66 0 0 1 68 71 a8 8 0 0 1 8 -9 Z" fill="#fff"/>' +
        '<path d="M60 64 a50 50 0 0 1 30 -24" stroke="#fff" stroke-opacity=".5" stroke-width="6" stroke-linecap="round" fill="none"/>';
      return svg('0 0 200 200', b, 'art-obj', 'Emergency call');
    },

    shieldHeart: function () {
      var a = nid('sh');
      var b = '<defs>' + lg(a, [[0, '#9EB8E8'], [1, '#6F5FB3']], 0, 0, 1, 1) + '</defs>' + shadow(100, 186, 50, 8) +
        '<path d="M100 26 38 50 v42 c0 42 26 70 62 84 36 -14 62 -42 62 -84 V50 Z" fill="url(#' + a + ')"/>' +
        '<path d="M100 132 C80 118 70 106 70 94 a15 15 0 0 1 30 -6 a15 15 0 0 1 30 6 c0 12 -10 24 -30 38 Z" fill="#fff"/>' +
        '<path d="M56 60 l30 -12" stroke="#fff" stroke-opacity=".45" stroke-width="6" stroke-linecap="round"/>';
      return svg('0 0 200 200', b, 'art-obj', 'Shield with a heart');
    },

    weather: function (kind) {
      var s = nid('sun'), c = nid('cl');
      var sun = '<circle cx="' + (kind === 'sun' ? 100 : 84) + '" cy="' + (kind === 'sun' ? 96 : 80) + '" r="' + (kind === 'sun' ? 46 : 36) + '" fill="url(#' + s + ')"/>';
      var cloud = '<path d="M60 150 a28 28 0 0 1 4 -56 a38 38 0 0 1 72 8 a24 24 0 0 1 6 48 Z" fill="url(#' + c + ')"/>';
      var rain = kind === 'rain' ? '<g stroke="#5B82C4" stroke-width="6" stroke-linecap="round"><path d="M76 164 l-6 14M104 164 l-6 14M132 164 l-6 14"/></g>' : '';
      var b = '<defs>' + rg(s, [[0, '#FFF1C2'], [.6, '#F7C95B'], [1, '#E4A84A']]) + rg(c, [[0, '#FFFFFF'], [.7, '#EEF2F9'], [1, '#C6D6EF']]) + '</defs>' +
        (kind === 'cloud' || kind === 'rain' ? cloud + rain : kind === 'sun' ? sun : sun + cloud);
      return svg('0 0 200 200', b, 'art-obj', 'Weather');
    },

    /** Landscape "photo" used for seeded memories (no downloads needed). */
    scene: function (id) {
      if (S.Pictures && S.Pictures.dataURI && S.Pictures.has && S.Pictures.has(id)) {
        return '<img src="' + S.Pictures.dataURI(id) + '" alt="">';
      }
      return Art.photos();
    }
  };

  S.Art = Art;
})(window);
