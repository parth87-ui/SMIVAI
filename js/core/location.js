/* ============================================================
   SMIVAI — location.js
   Where the person is, to the nearest town SMIVAI knows — for sorting
   doctors and showing the weather. Nothing more precise is kept.

     · "Use my location" asks the browser, which asks the person. Only the
       matched town name is stored; the coordinates are dropped at once.
     · If permission is refused, the position is unavailable, or no known
       town is within MAX_KM, the person picks their town from a list.
     · Without either, the district on their profile is used.

   No maps or geocoding provider is connected: towns and their
   coordinates are the fixed table in services.js (Weather.CITY), so this
   works offline and sends the position nowhere.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var MAX_KM = 150;          // farther than this from every known town → ask instead
  var TIMEOUT_MS = 10000;

  function cities() { return S.Services.Weather.CITY; }

  function km(lat1, lon1, lat2, lon2) {
    var R = 6371, toRad = Math.PI / 180;
    var dLat = (lat2 - lat1) * toRad, dLon = (lon2 - lon1) * toRad;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function keyOf(name) {
    var c = cities(), want = String(name || '').toLowerCase();
    for (var k in c) if (k === want || c[k][2].toLowerCase() === want) return k;
    return null;
  }

  var Location = {
    MAX_KM: MAX_KM,
    km: km,

    /* The precise position from "Use my location", held in memory for this
       visit only — used to measure distance to doctors, never saved or sent. */
    here: null,

    /** Coordinates of a known town, or null. */
    cityCoords: function (name) {
      var k = keyOf(name);
      return k ? { lat: cities()[k][0], lon: cities()[k][1], name: cities()[k][2] } : null;
    },

    /** Where distances are measured from: {lat, lon, precise, label} or null. */
    origin: function (patient) {
      if (this.here) return { lat: this.here.lat, lon: this.here.lon, precise: true, label: S.tx('loc_current', 'your current location') };
      var cur = this.current(patient);
      if (!cur) return null;
      var c = cities()[cur.key];
      return { lat: c[0], lon: c[1], precise: false, label: cur.name };
    },

    /** Every known town, for the manual picker: [{key, name}] sorted by name. */
    towns: function () {
      var c = cities();
      return Object.keys(c).map(function (k) { return { key: k, name: c[k][2] }; })
        .sort(function (a, b) { return a.name < b.name ? -1 : 1; });
    },

    /** The nearest known town to a point, or null if none is within MAX_KM. */
    nearest: function (lat, lon) {
      var c = cities(), best = null;
      Object.keys(c).forEach(function (k) {
        var d = km(lat, lon, c[k][0], c[k][1]);
        if (!best || d < best.km) best = { key: k, name: c[k][2], km: d };
      });
      return best && best.km <= MAX_KM ? best : null;
    },

    /** Distance in km between two known towns (by key or name), or null. */
    between: function (a, b) {
      var c = cities(), ka = keyOf(a), kb = keyOf(b);
      if (!ka || !kb) return null;
      return Math.round(km(c[ka][0], c[ka][1], c[kb][0], c[kb][1]));
    },

    /**
     * The town to use now.
     * @returns {{key, name, source:'gps'|'manual'|'profile'}|null}
     */
    current: function (patient) {
      var saved = S.Prefs.get('location');
      if (saved && keyOf(saved.key)) return { key: saved.key, name: cities()[saved.key][2], source: saved.source };
      var fromProfile = patient && S.Services.Weather.cityFor(patient.district);
      if (fromProfile) { var k = keyOf(fromProfile[2]); if (k) return { key: k, name: fromProfile[2], source: 'profile' }; }
      return null;
    },

    choose: function (key) {
      if (!keyOf(key)) return false;
      S.Prefs.set('location', { key: keyOf(key), source: 'manual' });
      return true;
    },

    clear: function () { S.Prefs.set('location', null); },

    /**
     * Ask the browser for the position, match it to a town, keep only the town.
     * @returns {Promise<{ok:true, key, name, km}|{ok:false, reason, message}>}
     */
    detect: function () {
      var geo = global.navigator && global.navigator.geolocation;
      if (!geo) return Promise.resolve({ ok: false, reason: 'unsupported', message: S.tx('loc_unsupported', 'This device cannot share its location. Please choose your town.') });
      return new Promise(function (resolve) {
        geo.getCurrentPosition(function (pos) {
          Location.here = { lat: pos.coords.latitude, lon: pos.coords.longitude };   // memory only
          var hit = Location.nearest(pos.coords.latitude, pos.coords.longitude);
          if (!hit) {
            resolve({ ok: false, reason: 'far', message: S.tx('loc_far', 'We could not match your location to a town SMIVAI knows. Please choose the nearest one.') });
            return;
          }
          S.Prefs.set('location', { key: hit.key, source: 'gps' });
          resolve({ ok: true, key: hit.key, name: hit.name, km: Math.round(hit.km) });
        }, function (err) {
          var reason = err && err.code === 1 ? 'denied' : err && err.code === 3 ? 'timeout' : 'unavailable';
          resolve({ ok: false, reason: reason, message: reason === 'denied'
            ? S.tx('loc_denied', 'Location permission was not given. You can choose your town instead.')
            : S.tx('loc_unavailable', 'Your location could not be found right now. Please choose your town.') });
        }, { enableHighAccuracy: false, timeout: TIMEOUT_MS, maximumAge: 10 * 60 * 1000 });
      });
    }
  };

  S.Location = Location;
})(window);
