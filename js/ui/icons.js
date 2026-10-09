/* ============================================================
   SMIVAI — ui/icons.js
   One consistent rounded line-icon family (24px grid, 2px stroke,
   round caps and joins). Every important action pairs an icon with a
   text label — icons here are never the only cue.

   Usage: S.icon('home')  →  '<svg …>'   ·   S.icon('home', 'ico-lg')
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var P = {
    home: '<path d="M3.5 10.5 12 3.8l8.5 6.7"/><path d="M5.5 9v10a1.5 1.5 0 0 0 1.5 1.5h3.5v-6h3v6H17a1.5 1.5 0 0 0 1.5-1.5V9"/>',
    talk: '<path d="M20.5 11.6c0 4.2-3.8 7.4-8.5 7.4-1.2 0-2.3-.2-3.4-.6L4 20l1.2-3.7C4.1 15 3.5 13.4 3.5 11.6 3.5 7.4 7.3 4.2 12 4.2s8.5 3.2 8.5 7.4Z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" stroke-width="2.6"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
    micOff: '<path d="M3 3l18 18"/><path d="M9 9v2a3 3 0 0 0 5.1 2.1M15 10V6a3 3 0 0 0-5.7-1.3"/><path d="M18.5 11a6.5 6.5 0 0 1-.7 3M5.5 11a6.5 6.5 0 0 0 10.4 5.2M12 17.5V21M8.5 21h7"/>',
    brain: '<path d="M9.5 4.2a2.8 2.8 0 0 0-2.8 2.4A3 3 0 0 0 4.8 11a3 3 0 0 0 .6 4.6 2.9 2.9 0 0 0 4.1 3.6V4.8a2.8 2.8 0 0 0 0-.6Z"/><path d="M14.5 4.2a2.8 2.8 0 0 1 2.8 2.4 3 3 0 0 1 1.9 4.4 3 3 0 0 1-.6 4.6 2.9 2.9 0 0 1-4.1 3.6V4.8a2.8 2.8 0 0 1 0-.6Z"/><path d="M9.5 10H8M14.5 10H16M9.5 14.5H8.2M14.5 14.5h1.3"/>',
    games: '<path d="M10 3.5h4v3.2a1.8 1.8 0 1 0 3.3 1h3.2v4h-3.2a1.8 1.8 0 1 1-1 3.3v3.5H3.5v-4h3.2a1.8 1.8 0 1 0-1-3.3H3.5V7.5H10Z"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 7.5 2.9C19.5 15.4 12 20 12 20Z"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m4 17.5 4.8-4.3 3.4 3 3-2.6 4.8 4.1"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2H4.5Z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
    chart: '<path d="M4 20h16"/><rect x="5.5" y="11" width="3" height="6.5" rx="1"/><rect x="10.5" y="7" width="3" height="10.5" rx="1"/><rect x="15.5" y="4" width="3" height="13.5" rx="1"/>',
    trend: '<path d="M3.5 17 9 11.5l4 4 7.5-8"/><path d="M15 7.5h5.5V13"/>',
    stethoscope: '<path d="M6 3.5H4.5v5a5 5 0 0 0 10 0v-5H13"/><path d="M9.5 13.5v1.8a4.7 4.7 0 0 0 9.4 0v-2.1"/><circle cx="18.9" cy="11" r="2.2"/>',
    records: '<path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5Z"/><path d="M14 3.5v5h5"/><path d="M12 11.5v5M9.5 14h5"/>',
    users: '<circle cx="9" cy="8.5" r="3.3"/><path d="M3 19.5c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="16.8" cy="9.3" r="2.6"/><path d="M16.5 14.1c2.6.2 4.5 2.1 4.5 4.9"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.2 13.5a7.4 7.4 0 0 0 0-3l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-2.6-1.5L13.8 2.5h-3.6L9.8 5a7.4 7.4 0 0 0-2.6 1.5l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 2.6 1.5l.4 2.5h3.6l.4-2.5a7.4 7.4 0 0 0 2.6-1.5l2.4 1 2-3.4Z"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 5 5"/>',
    arrowRight: '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19.5 12h-15M10.5 6l-6 6 6 6"/>',
    chevronRight: '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
    chevronLeft: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    chevronDown: '<path d="m5.5 9.5 6.5 6.5 6.5-6.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="m4.5 12.5 4.8 4.8L19.5 7"/>',
    checkCircle: '<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.3 2.6 2.6 5-5.3"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    phone: '<path d="M8.4 3.5H5.6a1.6 1.6 0 0 0-1.6 1.8A16.4 16.4 0 0 0 18.7 20a1.6 1.6 0 0 0 1.8-1.6v-2.8l-4-1.7-2 2a12.3 12.3 0 0 1-5.4-5.4l2-2Z"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><path d="M12 14.5v2"/>',
    sparkle: '<path d="M12 3.5c.6 3.9 2.6 5.9 6.5 6.5-3.9.6-5.9 2.6-6.5 6.5-.6-3.9-2.6-5.9-6.5-6.5 3.9-.6 5.9-2.6 6.5-6.5Z"/><path d="M18.5 15.5c.3 1.6 1 2.3 2.5 2.5-1.5.2-2.2.9-2.5 2.5-.3-1.6-1-2.3-2.5-2.5 1.5-.2 2.2-.9 2.5-2.5Z"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    pill: '<rect x="2.9" y="8.3" width="18.2" height="7.4" rx="3.7" transform="rotate(-40 12 12)"/><path d="m9.2 9.1 5.6 5.8"/>',
    droplet: '<path d="M12 3.5s6 6.3 6 10.6a6 6 0 0 1-12 0C6 9.8 12 3.5 12 3.5Z"/>',
    pulse: '<path d="M3 12h4l2.5-6 4.5 12 2.5-6H21"/>',
    weight: '<rect x="3.5" y="4" width="17" height="16.5" rx="4"/><path d="M8.5 10.5a3.5 3.5 0 0 1 7 0"/><path d="m12 10.5 1.4-1.8"/>',
    steps: '<path d="M7.5 3.5c1.7 0 2.7 1.9 2.7 4.3S9 12 7.5 12 4.8 10 4.8 7.8 5.8 3.5 7.5 3.5Z"/><path d="M5.2 14.5h4.6v2a2.3 2.3 0 0 1-4.6 0Z"/><path d="M16.5 6.5c1.7 0 2.7 1.9 2.7 4.3S18 15 16.5 15s-2.7-2-2.7-4.2 1-4.3 2.7-4.3Z"/><path d="M14.2 17.5h4.6v1a2.3 2.3 0 0 1-4.6 0Z"/>',
    camera: '<path d="M4 8.5a2 2 0 0 1 2-2h2l1.5-2h5L16 6.5h2a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><circle cx="12" cy="13" r="3.5"/>',
    edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/>',
    trash: '<path d="M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l.9 12.2a2 2 0 0 0 2 1.8h5.2a2 2 0 0 0 2-1.8l.9-12.2"/><path d="M10 10.5v6M14 10.5v6"/>',
    logout: '<path d="M14 4.5H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h7"/><path d="M11 12h9.5M17 8.5l3.5 3.5-3.5 3.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.6 3.5 5.4 3.5 8.5s-1.1 5.9-3.5 8.5c-2.4-2.6-3.5-5.4-3.5-8.5s1.1-5.9 3.5-8.5Z"/>',
    type: '<path d="M4.5 7V5h11v2M10 5v14M7.5 19h5"/><path d="M14.5 12v-1.5h6V12M17.5 10.5V19M16 19h3"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    shield: '<path d="M12 3.5 5 6v5.5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    star: '<path d="m12 3.8 2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5 2.7.9-5.6-4-3.9 5.6-.8Z"/>',
    play: '<path d="M7.5 5.2v13.6a1 1 0 0 0 1.5.9l11-6.8a1 1 0 0 0 0-1.8L9 4.3a1 1 0 0 0-1.5.9Z"/>',
    refresh: '<path d="M20 11.5A8 8 0 0 0 5.6 6.8L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 12.5a8 8 0 0 0 14.4 4.7l1.6-1.7"/><path d="M20 20v-4.5h-4.5"/>',
    volume: '<path d="M4 9.5v5h3.5L12.5 19V5L7.5 9.5Z"/><path d="M16 9a4.2 4.2 0 0 1 0 6M18.8 6.5a7.8 7.8 0 0 1 0 11"/>',
    bulb: '<path d="M9 17.5h6M10 20.5h4"/><path d="M12 3.5a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V17h5.2v-.7c0-.8.4-1.5 1-2A6 6 0 0 0 12 3.5Z"/>',
    book: '<path d="M12 6.5c-1.8-1.4-4.3-2-7.5-2v13c3.2 0 5.7.6 7.5 2 1.8-1.4 4.3-2 7.5-2v-13c-3.2 0-5.7.6-7.5 2Z"/><path d="M12 6.5v13"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.4-9 6 6 0 0 1 11.5 1.5A3.8 3.8 0 0 1 17.5 18.5Z"/>',
    alert: '<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.5M12 17.2h.01"/>',
    sos: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5M12 16.2h.01" stroke-width="2.4"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8h.01" stroke-width="2.2"/>',
    pin: '<path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
    mountain: '<path d="M2.5 19.5 9 8.5l4 6.2 2.8-3.9 5.7 8.7Z"/><circle cx="17" cy="5.8" r="1.7"/>',
    music: '<path d="M9 17.5V5.5l10.5-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17" cy="15" r="2.5"/>',
    waves: '<path d="M3 8.5c1.5 0 2.2-1.5 4.5-1.5S10.5 8.5 12 8.5s2.2-1.5 4.5-1.5S19.5 8.5 21 8.5"/><path d="M3 13.5c1.5 0 2.2-1.5 4.5-1.5s3 1.5 4.5 1.5 2.2-1.5 4.5-1.5 3 1.5 4.5 1.5"/><path d="M3 18.5c1.5 0 2.2-1.5 4.5-1.5s3 1.5 4.5 1.5 2.2-1.5 4.5-1.5 3 1.5 4.5 1.5"/>',
    radio: '<rect x="3" y="8" width="18" height="12" rx="2.5"/><path d="M7.5 8 16.5 3.5"/><circle cx="15.5" cy="14" r="2.6"/><path d="M6.5 12.2h4.5M6.5 15.8h4.5"/>',
    sprout: '<path d="M12 21v-9"/><path d="M12 12C12 8.2 9.2 6 5 6c0 3.9 2.8 6 7 6Z"/><path d="M12 14.5c0-3.6 2.6-5.8 6.8-5.8 0 3.7-2.6 5.8-6.8 5.8Z"/>',
    cap: '<path d="M2 9.5 12 5l10 4.5L12 14Z"/><path d="M6 11.6V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.4"/><path d="M22 9.5v5.5"/>',
    more: '<circle cx="12" cy="5.5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="18.5" r="1.4" fill="currentColor"/>',
    leaf: '<path d="M5 19c0-8 5-13.5 14.5-14 0 9.5-5.5 14-14.5 14Z"/><path d="M5 19c3-4 6-6.5 9.5-8.5"/>',
    trophy: '<path d="M8 4.5h8v5a4 4 0 0 1-8 0Z"/><path d="M8 6.5H4.5a3.5 3.5 0 0 0 3.8 4M16 6.5h3.5a3.5 3.5 0 0 1-3.8 4M12 13.5v3.5M8.5 20.5h7M9.5 17h5v3.5h-5z"/>',
    wifiOff: '<path d="M3 3l18 18"/><path d="M8.5 16.5a5 5 0 0 1 7 0M5 12.8a10 10 0 0 1 4.5-2.5M19 12.8a10 10 0 0 0-2.4-1.7M2 9.3a15 15 0 0 1 4.2-2.6M22 9.3A15 15 0 0 0 11 5.5M12 20h.01" />',
    message: '<path d="M4 6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9.5L5 20.5v-3H6a2 2 0 0 1-2-2Z"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
    upload: '<path d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4.5 15v2.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15"/>',
    video: '<rect x="3" y="6" width="12.5" height="12" rx="2.5"/><path d="m15.5 10.5 5.5-3v9l-5.5-3"/>',
    truck: '<path d="M2.5 6.5h11v10h-11zM13.5 10h4l3.5 3.5v3h-7.5"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" stroke-width="2.8"/>',
    moon: '<path d="M19.5 14.5A7.8 7.8 0 0 1 9.5 4.5a7.8 7.8 0 1 0 10 10Z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2.5"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"/>',
    note: '<path d="M5 4.5h14v11l-4.5 4.5H5Z"/><path d="M14.5 20v-4.5H19M8.5 9h7M8.5 12.5h4"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    smile: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14.2a4.3 4.3 0 0 0 7 0M9 9.8h.01M15 9.8h.01" stroke-width="2.3"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="3"/>',
    send: '<path d="M4 11.8 20 4.5l-5.5 16-3.2-6.8Z"/><path d="m11.3 13.7 3.9-3.9"/>',
    headset: '<path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2"/><rect x="3.5" y="13" width="4" height="6" rx="1.8"/><rect x="16.5" y="13" width="4" height="6" rx="1.8"/><path d="M18.5 19c0 1.2-1.5 2-4 2h-1.5"/>',
    timer: '<circle cx="12" cy="13.5" r="7"/><path d="M12 10v3.5l2 1.5M9.5 3.5h5M19 6.5l-1.5 1.5"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
    flame: '<path d="M12 21a6 6 0 0 0 6-6c0-3.5-2.5-5.5-3.5-8.5-1 1.5-1.5 2.5-3 3.5C11.5 7 10 5 8.5 3.5 8 7.5 6 10 6 14.5a6 6 0 0 0 6 6.5Z"/>',
    gift: '<rect x="3.5" y="8.5" width="17" height="4" rx="1.2"/><path d="M5 12.5v7h14v-7M12 8.5v11"/><path d="M12 8.5C10.5 5 7 4.5 7 6.8S10 8.5 12 8.5c2 0 5 .1 5-1.7s-3.5-1.7-5 1.7Z"/>',
    crownless: '<path d="M4.5 18.5 3 8.5l5 3.5 4-6.5 4 6.5 5-3.5-1.5 10Z"/>'
  };

  /**
   * @param {string} name
   * @param {string} [cls]  extra class
   * @param {object} [o]    { title, size }
   */
  S.icon = function (name, cls, o) {
    o = o || {};
    var body = P[name] || P.info;
    var size = o.size ? ' width="' + o.size + '" height="' + o.size + '"' : '';
    return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24"' + size +
      ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' +
      (o.title ? ' role="img" aria-label="' + S.esc(o.title) + '"' : ' aria-hidden="true" focusable="false"') + '>' +
      body + '</svg>';
  };
  S.icon.names = Object.keys(P);
})(window);
