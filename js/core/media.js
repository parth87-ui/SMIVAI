/* ============================================================
   SMIVAI — media.js
   Photos for memories and health documents.

   Images are resized on the device (long edge ≤ 1280px, JPEG) and kept
   in IndexedDB — not in the main record store, which is small and synced.
   A memory row only carries the media id. If IndexedDB is unavailable
   (some private windows) photos are kept for this session only, and the
   UI says so rather than pretending they were saved.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var DB_NAME = 'smivai-media', STORE = 'photos';
  var memory = {};          // fallback + read cache
  var dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (resolve) {
      try {
        if (!global.indexedDB) return resolve(null);
        var req = global.indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { resolve(null); };
      } catch (e) { resolve(null); }
    });
    return dbp;
  }

  function tx(mode, fn) {
    return open().then(function (db) {
      if (!db) return null;
      return new Promise(function (resolve) {
        try {
          var t = db.transaction(STORE, mode);
          var r = fn(t.objectStore(STORE));
          t.oncomplete = function () { resolve(r && r.result !== undefined ? r.result : true); };
          t.onerror = function () { resolve(null); };
        } catch (e) { resolve(null); }
      });
    });
  }

  var Media = {
    persistent: null,

    ready: function () {
      var self = this;
      return open().then(function (db) { self.persistent = !!db; return self.persistent; });
    },

    /** File → resized JPEG data URL. Rejects with a friendly message. */
    fromFile: function (file, maxDim) {
      maxDim = maxDim || 1280;
      return new Promise(function (resolve, reject) {
        if (!file) return reject(new Error('Please choose a photo.'));
        if (!/^image\//.test(file.type)) return reject(new Error('That file is not a photo. Please choose a picture.'));
        if (file.size > 25 * 1024 * 1024) return reject(new Error('That photo is too large. Please choose a smaller one.'));
        var reader = new FileReader();
        reader.onerror = function () { reject(new Error('We could not read that photo. Please try another.')); };
        reader.onload = function () {
          var img = new Image();
          img.onerror = function () { reject(new Error('We could not open that photo. Please try another.')); };
          img.onload = function () {
            try {
              var w = img.naturalWidth, h = img.naturalHeight;
              var k = Math.min(1, maxDim / Math.max(w, h));
              var c = document.createElement('canvas');
              c.width = Math.round(w * k); c.height = Math.round(h * k);
              var g = c.getContext('2d');
              g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
              g.drawImage(img, 0, 0, c.width, c.height);
              resolve(c.toDataURL('image/jpeg', 0.82));
            } catch (e) { reject(new Error('We could not prepare that photo. Please try another.')); }
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
    },

    put: function (dataUrl) {
      var id = S.uid('img');
      memory[id] = dataUrl;
      return tx('readwrite', function (st) { return st.put(dataUrl, id); }).then(function (ok) {
        return { id: id, persisted: !!ok };
      });
    },

    get: function (id) {
      if (!id) return Promise.resolve(null);
      if (memory[id]) return Promise.resolve(memory[id]);
      return tx('readonly', function (st) { return st.get(id); }).then(function (v) {
        if (v) memory[id] = v;
        return v || null;
      });
    },

    remove: function (id) {
      delete memory[id];
      return tx('readwrite', function (st) { return st.delete(id); });
    },

    /** Fill every <img data-media="id"> under root. */
    hydrate: function (root) {
      S.qsa('img[data-media]', root || document).forEach(function (img) {
        var id = img.getAttribute('data-media');
        Media.get(id).then(function (src) {
          if (src) { img.src = src; img.classList.add('is-loaded'); }
          else img.closest('.has-photo') && img.closest('.has-photo').classList.add('photo-missing');
        });
      });
    },

    /** Markup for a memory's picture: uploaded photo, demo scene, or illustration. */
    /** A photograph, the family's own or one that ships with the app, or a drawn scene. */
    hasPhoto: function (m) { return !!(m && (m.photo_media || m.photo_url || m.photo_scene)); },

    memoryImg: function (m, alt) {
      if (m.photo_media) return '<img data-media="' + S.esc(m.photo_media) + '" alt="' + S.esc(alt || m.title) + '" loading="lazy">';
      /* photographs bundled with the demo, in assets/memories/ */
      if (m.photo_url) return '<img src="' + S.esc(m.photo_url) + '" alt="' + S.esc(alt || m.title) + '" loading="lazy">';
      if (m.photo_scene && S.Pictures.has(m.photo_scene)) return '<img src="' + S.Pictures.dataURI(m.photo_scene) + '" alt="' + S.esc(alt || m.title) + '" loading="lazy">';
      return '';
    }
  };

  S.Media = Media;
})(window);
