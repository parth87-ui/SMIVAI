/* ============================================================
   SMIVAI — screens/memories.js
   My Memories: browse, look at one closely, talk about it, add a new one.

   A memory is a photo (optional), a title, the story, a date and the
   people, place or occasion. Photos stay on the device in IndexedDB;
   only the memory record syncs.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;
  function tx(k, en, p) { return S.tx(k, en, p); }
  function esc(s) { return S.esc(s); }

  /** Memories with a photograph lead, then the most recent first. */
  function sorted(pid) {
    var when = function (m) { return m.memory_date || String(m.created_at || '').slice(0, 10); };
    var hasPhoto = function (m) { return S.Media.hasPhoto(m) ? 1 : 0; };
    return S.DB.forPatient('memory_bank', pid).sort(function (a, b) {
      if (hasPhoto(a) !== hasPhoto(b)) return hasPhoto(b) - hasPhoto(a);
      return when(a) < when(b) ? 1 : -1;
    });
  }

  var Memories = {

    list: function (groupId) {
      var p = S.State.patient();
      var all = sorted(p.patient_id);
      var group = S.M.MEMORY_GROUPS.filter(function (g) { return g.id === groupId; })[0];
      var mems = group ? all.filter(function (m) { return S.M.groupOf(m) === group.id; }) : all;
      var counts = {};
      all.forEach(function (m) { var g = S.M.groupOf(m); counts[g] = (counts[g] || 0) + 1; });

      var html =
        '<div class="page anim-in">' +
          '<section class="page-hero tone-cream">' +
            '<div class="grow"><span class="chip chip-peach">' + S.icon('heart') + esc(tx('n_memories', '{n} memories', { n: all.length })) + '</span>' +
              '<h1>' + esc(tx('nav_memories2', 'My Memories')) + '</h1>' +
              '<p>' + esc(tx('mem_sub', 'The people, places and moments that matter to you — kept safe, ready to share.')) + '</p>' +
              '<button class="btn btn-lg" data-act="add">' + S.icon('plus') + esc(tx('add_memory', 'Add a Memory')) + '</button></div>' +
            '<div class="ph-art float">' + S.Art.photos() + '</div>' +
          '</section>' +

          '<div class="filter-row" role="tablist" aria-label="Memory groups">' +
            '<button class="filter-chip" role="tab" data-act="group" data-arg="" aria-selected="' + (!group) + '">' + S.icon('grid') + esc(tx('all', 'All')) + ' (' + all.length + ')</button>' +
            S.M.MEMORY_GROUPS.map(function (g) {
              return '<button class="filter-chip" role="tab" data-act="group" data-arg="' + g.id + '" aria-selected="' + (group && group.id === g.id) + '">' +
                S.icon(g.ico) + esc(tx('mg_' + g.id, g.name)) + ' (' + (counts[g.id] || 0) + ')</button>';
            }).join('') + '</div>' +

          (mems.length
            ? '<div class="mem-grid">' + mems.map(card).join('') + '</div>'
            : S.UI.empty(S.icon('camera'), tx('no_mem', 'No memories here yet'),
                tx('no_mem_sub', 'Add a photo and the story behind it. HUN can talk with you about it later.'),
                '<button class="btn btn-lg" data-act="add">' + S.icon('plus') + esc(tx('add_memory', 'Add a Memory')) + '</button>')) +

          (all.length >= 3 ? '<section class="p-sec"><button class="wellness tone-lav" data-act="quiz">' +
              '<span class="w-art">' + S.Art.cards() + '</span>' +
              '<span class="grow"><b>' + esc(tx('memory_lane', 'Play Memory Lane')) + '</b><span>' + esc(tx('memory_lane_sub', 'Gentle questions made from your own memories.')) + '</span></span>' +
              '<span class="arrow-btn">' + S.icon('play') + '</span></button></section>' : '') +
          '<div class="disclaimer">' + S.icon('info') + '<span>' + esc(tx('mem_privacy', 'Photos stay on this device. Your caregivers can see the memory titles and stories you share with them.')) + '</span></div>' +
        '</div>';

      S.mount(S.qs('#app'), html, {
        add: function () { S.Router.go('#/patient/memories/new'); },
        group: function (el, ev, g) { S.Router.go('#/patient/memories' + (g ? '/' + g : '')); },
        open: function (el, ev, id) { S.Router.go('#/patient/memory/' + id); },
        more: function (el, ev, id) { Memories.actions(id); },
        quiz: function () {
          if (!S.Plans.canPlay(p, 'my_memories')) { S.Premium.locked(S.M.gameName('my_memories')); return; }
          S.Router.go('#/patient/game/my_memories');
        }
      });
      S.Media.hydrate(S.qs('#app'));
      S.scrollTop();

      /* Photo, then one line under it: the memory's own icon, its title and
         date, and ⋮ for the things you can do with it. */
      function card(m) {
        var g = S.M.memoryGroup(S.M.groupOf(m));
        var img = S.Media.memoryImg(m);
        var tone = m.tone || g.tone;
        return '<article class="mem-card' + (img ? ' has-photo' : '') + '">' +
          '<button class="mc-open" data-act="open" data-arg="' + esc(m.memory_id) + '">' +
            '<span class="mc-photo">' + (img || '<span class="mc-fallback">' + (m.icon && m.icon !== '📷' ? '<span class="emoji">' + m.icon + '</span>' : S.icon('image')) + '</span>') + '</span>' +
            '<span class="mc-body">' +
              '<span class="mc-ico tone-' + esc(tone) + '">' + S.icon(m.ico || g.ico) + '</span>' +
              '<span class="mc-text"><b>' + esc(m.title) + '</b>' +
                '<small>' + esc(m.memory_date ? S.prettyDate(m.memory_date) : tx('mg_' + g.id, g.name)) + '</small></span>' +
            '</span>' +
          '</button>' +
          '<button class="mc-more" data-act="more" data-arg="' + esc(m.memory_id) + '" aria-label="' + esc(tx('mem_more', 'More for {title}', { title: m.title })) + '">' + S.icon('more') + '</button>' +
        '</article>';
      }
    },

    actions: function (id) {
      var m = S.DB.find('memory_bank', id);
      if (!m) return;
      S.Modal.open({
        title: m.title,
        subtitle: m.memory_date ? S.prettyDate(m.memory_date) : '',
        body: '<div class="mem-actions">' +
          '<button class="btn btn-lg btn-block" data-act="talk">' + S.icon('talk') + esc(tx('talk_about_memory', 'Talk about this memory')) + '</button>' +
          '<button class="btn btn-lg btn-block btn-outline" data-act="open">' + S.icon('image') + esc(tx('open_memory', 'Open this memory')) + '</button>' +
          '<button class="btn btn-lg btn-block btn-outline" data-act="edit">' + S.icon('edit') + esc(tx('edit', 'Edit')) + '</button>' +
          '<button class="btn btn-lg btn-block btn-outline btn-quiet-danger" data-act="del">' + S.icon('trash') + esc(tx('delete', 'Delete')) + '</button>' +
        '</div>',
        handlers: {
          talk: function () { S.Modal.close(); S.Router.go('#/patient/talk/memory/' + m.memory_id); },
          open: function () { S.Modal.close(); S.Router.go('#/patient/memory/' + m.memory_id); },
          edit: function () { S.Modal.close(); S.Router.go('#/patient/memory/' + m.memory_id + '/edit'); },
          del: function () {
            S.Modal.confirm({ title: tx('del_mem_q', 'Delete this memory?'), message: '“' + m.title + '” ' + tx('del_mem_msg', 'will be removed from SMIVAI. This cannot be undone.'), okText: tx('delete', 'Delete'), danger: true })
              .then(function (ok) {
                if (!ok) return;
                if (m.photo_media) S.Media.remove(m.photo_media);
                S.DB.remove('memory_bank', m.memory_id);
                S.toast(tx('mem_deleted', 'Memory deleted.'), 'ok');
                Memories.list(S.Router.parts()[2]);
              });
          }
        }
      });
    },

    detail: function (id) {
      var p = S.State.patient();
      var m = S.DB.find('memory_bank', id);
      if (!m || m.patient_id !== p.patient_id) { S.toast(tx('mem_missing', 'That memory is no longer here.'), 'warn'); S.Router.go('#/patient/memories'); return; }
      var g = S.M.memoryGroup(S.M.groupOf(m));
      var img = S.Media.memoryImg(m, m.title);
      var others = sorted(p.patient_id).filter(function (x) { return x.memory_id !== m.memory_id; }).slice(0, 6);

      var html =
        '<div class="page anim-in">' +
          '<button class="btn btn-ghost" data-act="back">' + S.icon('arrowLeft') + esc(tx('all_memories', 'All memories')) + '</button>' +
          '<article class="mem-detail">' +
            (img ? '<div class="md-photo has-photo">' + img + '</div>' : '<div class="md-photo md-art">' + S.Art.photos() + '</div>') +
            '<div class="md-body">' +
              '<span class="chip chip-' + (g.tone === 'cream' ? 'peach' : g.tone) + '">' + S.icon(g.ico) + esc(tx('mg_' + g.id, g.name)) + '</span>' +
              '<h1>' + esc(m.title) + '</h1>' +
              '<div class="md-facts">' +
                (m.memory_date ? fact('calendar', S.prettyDate(m.memory_date)) : '') +
                (m.place ? fact('pin', m.place) : '') +
                (m.people ? fact('users', m.people) : '') +
                (m.event ? fact('sparkle', m.event) : '') +
              '</div>' +
              (m.content ? '<p class="md-story">' + esc(m.content).replace(/\n/g, '<br>') + '</p>' : '') +
              '<div class="md-actions">' +
                '<button class="btn btn-xl" data-act="talk">' + S.icon('talk') + esc(tx('talk_about_memory', 'Talk about this memory')) + '</button>' +
                '<button class="listen-btn" data-act="listen">' + S.icon('volume') + esc(S.t('listen')) + '</button>' +
                '<button class="btn btn-outline" data-act="edit">' + S.icon('edit') + esc(tx('edit', 'Edit')) + '</button>' +
                '<button class="btn btn-danger" data-act="del">' + S.icon('trash') + esc(tx('delete', 'Delete')) + '</button>' +
              '</div>' +
              '<div class="md-prompts"><div class="t-mini">' + esc(tx('ask_smivai', 'Ask HUN')) + '</div>' +
                '<div class="suggest-wrap">' +
                  ['Who is in this photo?', 'Tell me about this memory', 'What happened that day?'].map(function (q, i) {
                    return '<button class="suggest" data-act="ask" data-arg="' + i + '">' + esc(q) + '</button>';
                  }).join('') + '</div></div>' +
            '</div>' +
          '</article>' +
          (others.length ? '<section class="p-sec"><div class="sec-head"><div><h2>' + esc(tx('more_memories', 'More memories')) + '</h2></div></div>' +
            '<div class="mem-strip">' + others.map(function (x) {
              var im = S.Media.memoryImg(x);
              return '<button class="ms-card' + (im ? ' has-photo' : '') + '" data-act="open" data-arg="' + esc(x.memory_id) + '">' +
                (im || '<span class="mc-fallback">' + S.icon('image') + '</span>') + '<span>' + esc(x.title) + '</span></button>';
            }).join('') + '</div></section>' : '') +
        '</div>';

      var qs = ['Who is in this photo?', 'Tell me about this memory', 'What happened that day?'];
      S.mount(S.qs('#app'), html, {
        back: function () { S.Router.go('#/patient/memories'); },
        open: function (el, ev, mid) { S.Router.go('#/patient/memory/' + mid); },
        talk: function () { S.Router.go('#/patient/talk/memory/' + m.memory_id); },
        ask: function (el, ev, i) { S.Talk.seed = qs[+i]; S.Router.go('#/patient/talk/memory/' + m.memory_id); },
        edit: function () { S.Router.go('#/patient/memory/' + m.memory_id + '/edit'); },
        listen: function (el) {
          var text = m.title + '. ' + (m.memory_date ? S.prettyDate(m.memory_date) + '. ' : '') + (m.people ? 'With ' + m.people + '. ' : '') + (m.place ? 'At ' + m.place + '. ' : '') + (m.content || '');
          el.classList.add('is-speaking');
          S.Voice.speak(text, p.language).then(function (r) { el.classList.remove('is-speaking'); if (!r.spoken && r.note) S.toast(r.note, 'warn', 5000); });
        },
        del: function () {
          S.Modal.confirm({ title: tx('del_mem_q', 'Delete this memory?'), message: '“' + m.title + '” ' + tx('del_mem_msg', 'will be removed from SMIVAI. This cannot be undone.'), okText: tx('delete', 'Delete'), danger: true })
            .then(function (ok) {
              if (!ok) return;
              if (m.photo_media) S.Media.remove(m.photo_media);
              S.DB.remove('memory_bank', m.memory_id);
              S.toast(tx('mem_deleted', 'Memory deleted.'), 'ok');
              S.Router.go('#/patient/memories');
            });
        }
      });
      S.Media.hydrate(S.qs('#app'));
      S.scrollTop();

      function fact(ico, text) { return '<span class="md-fact">' + S.icon(ico) + esc(text) + '</span>'; }
    },

    /** Add (id = null) or edit one memory. */
    form: function (id) {
      var p = S.State.patient();
      var m = id ? S.DB.find('memory_bank', id) : null;
      if (id && (!m || m.patient_id !== p.patient_id)) { S.Router.go('#/patient/memories'); return; }
      var draft = {
        group: m ? S.M.groupOf(m) : 'family',
        photoData: null,                    // newly chosen photo
        photoRemoved: false
      };

      var html =
        '<div class="page page-narrow anim-in">' +
          '<button class="btn btn-ghost" data-act="back">' + S.icon('arrowLeft') + esc(S.t('back')) + '</button>' +
          '<div class="card form-card">' +
            '<h1 class="t-h1">' + esc(m ? tx('edit_memory', 'Edit memory') : tx('add_memory', 'Add a Memory')) + '</h1>' +
            '<p class="muted" style="margin-top:.5rem">' + esc(tx('add_mem_sub', 'A photo and a few words are all it takes.')) + '</p>' +

            '<div class="photo-pick" id="photo-pick">' + photoBox() + '</div>' +
            '<input type="file" id="mem-file" accept="image/*" class="sr-only">' +

            '<div class="stack stack-2" style="margin-top:1.5rem">' +
              '<div class="field"><label for="mem-title">' + esc(tx('mem_title_l', 'What is this memory called?')) + '</label>' +
                '<input class="input" id="mem-title" maxlength="70" value="' + esc(m ? m.title : '') + '" placeholder="e.g. Family Trip to Shillong"></div>' +
              '<div class="field"><span class="field-label">' + esc(tx('mem_group_l', 'What kind of memory is it?')) + '</span>' +
                '<div class="choice-grid">' + S.M.MEMORY_GROUPS.map(function (g) {
                  return '<button class="choice" data-act="group" data-arg="' + g.id + '" aria-pressed="' + (draft.group === g.id) + '">' + S.icon(g.ico) + esc(tx('mg_' + g.id, g.name)) + '</button>';
                }).join('') + '</div></div>' +
              '<div class="field"><label for="mem-story">' + esc(tx('mem_story_l', 'Tell the story (optional)')) + '</label>' +
                '<textarea class="textarea" id="mem-story" maxlength="900" placeholder="' + esc(tx('mem_story_ph', 'What happened? Who was there? What do you remember most?')) + '">' + esc(m ? m.content : '') + '</textarea></div>' +
              '<div class="form-grid">' +
                '<div class="field"><label for="mem-date">' + esc(tx('when_was_it', 'When was it?')) + '</label><input class="input" id="mem-date" type="date" max="' + S.todayISO() + '" value="' + esc(m ? m.memory_date : '') + '"></div>' +
                '<div class="field"><label for="mem-people">' + esc(tx('who_with', 'Who was with you?')) + '</label><input class="input" id="mem-people" maxlength="80" value="' + esc(m ? m.people : '') + '" placeholder="e.g. Sabita and the grandchildren"></div>' +
                '<div class="field"><label for="mem-place">' + esc(tx('where_was_it', 'Where was it?')) + '</label><input class="input" id="mem-place" maxlength="80" value="' + esc(m ? m.place : '') + '" placeholder="e.g. Shillong, Meghalaya"></div>' +
                '<div class="field"><label for="mem-event">' + esc(tx('occasion', 'Occasion (optional)')) + '</label><input class="input" id="mem-event" maxlength="60" value="' + esc(m ? m.event : '') + '" placeholder="e.g. Bihu"></div>' +
              '</div>' +
              '<div class="err" id="mem-err" role="alert" hidden></div>' +
              '<div class="row" style="flex-wrap:wrap">' +
                '<button class="btn btn-xl grow" data-act="save">' + S.icon('check') + esc(tx('save_memory', 'Save memory')) + '</button>' +
                '<button class="btn btn-outline btn-xl" data-act="back">' + esc(S.t('cancel')) + '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      S.mount(S.qs('#app'), html, {
        back: function () { S.Router.go(m ? '#/patient/memory/' + m.memory_id : '#/patient/memories'); },
        pick: function () { S.qs('#mem-file').click(); },
        removePhoto: function () {
          draft.photoData = null; draft.photoRemoved = true;
          S.qs('#photo-pick').innerHTML = photoBox();
          S.bind(S.qs('#photo-pick'), handlers());
        },
        group: function (el, ev, g) {
          draft.group = g;
          S.qsa('.choice', S.qs('#app')).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-arg') === g ? 'true' : 'false'); });
        },
        save: function () { save(); }
      });

      S.qs('#mem-file').addEventListener('change', function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        var box = S.qs('#photo-pick');
        box.innerHTML = '<div class="pp-loading"><span class="spinner"></span>' + esc(tx('preparing_photo', 'Preparing your photo…')) + '</div>';
        S.Media.fromFile(f).then(function (dataUrl) {
          draft.photoData = dataUrl; draft.photoRemoved = false;
          box.innerHTML = photoBox(dataUrl);
          S.bind(box, handlers());
        }).catch(function (err) {
          box.innerHTML = photoBox();
          S.bind(box, handlers());
          S.toast(err.message || tx('photo_failed', 'That photo could not be added.'), 'warn', 5000);
        });
        e.target.value = '';
      });
      S.Media.hydrate(S.qs('#app'));
      S.scrollTop();

      function handlers() {
        return {
          pick: function () { S.qs('#mem-file').click(); },
          removePhoto: function () {
            draft.photoData = null; draft.photoRemoved = true;
            var box = S.qs('#photo-pick');
            box.innerHTML = photoBox();
            S.bind(box, handlers());
          }
        };
      }

      function photoBox(dataUrl) {
        var existing = m && !draft.photoRemoved ? S.Media.memoryImg(m, m.title) : '';
        var shown = dataUrl ? '<img src="' + dataUrl + '" alt="">' : (draft.photoData ? '<img src="' + draft.photoData + '" alt="">' : existing);
        if (shown) {
          return '<div class="pp-preview has-photo">' + shown +
            '<div class="pp-tools"><button class="btn btn-outline btn-sm" data-act="pick">' + S.icon('camera') + esc(tx('change_photo', 'Change photo')) + '</button>' +
            '<button class="btn btn-danger btn-sm" data-act="removePhoto">' + S.icon('trash') + esc(tx('remove_photo', 'Remove')) + '</button></div></div>';
        }
        return '<button class="pp-empty" data-act="pick">' + S.icon('camera', '', { size: 40 }) +
          '<b>' + esc(tx('add_photo', 'Add a photo')) + '</b><small>' + esc(tx('add_photo_sub', 'Take one now or choose from your device (optional)')) + '</small>' +
          (S.Media.persistent === false ? '<small class="warn-note">' + esc(tx('photo_session', 'Photos cannot be stored permanently in this browser window.')) + '</small>' : '') + '</button>';
      }

      function save() {
        var title = S.qs('#mem-title').value.trim();
        var err = S.qs('#mem-err');
        if (!title) { err.textContent = tx('need_mem_title', 'Please give this memory a name.'); err.hidden = false; S.qs('#mem-title').focus(); return; }
        var date = S.qs('#mem-date').value;
        if (date && date > S.todayISO()) { err.textContent = tx('date_future', 'That date is in the future — please check it.'); err.hidden = false; return; }
        err.hidden = true;

        var data = {
          title: title,
          content: S.qs('#mem-story').value.trim(),
          group: draft.group,
          category: S.M.memoryGroup(draft.group).category,
          memory_date: date,
          people: S.qs('#mem-people').value.trim(),
          place: S.qs('#mem-place').value.trim(),
          event: S.qs('#mem-event').value.trim()
        };

        var photoStep = draft.photoData ? S.Media.put(draft.photoData) : Promise.resolve(null);
        photoStep.then(function (stored) {
          if (stored) {
            data.photo_media = stored.id;
            data.photo_scene = ''; data.photo_url = '';
            if (m && m.photo_media) S.Media.remove(m.photo_media);
            if (!stored.persisted) S.toast(tx('photo_session2', 'This photo is kept for this session only — this browser cannot store it permanently.'), 'warn', 6000);
          } else if (draft.photoRemoved) {
            if (m && m.photo_media) S.Media.remove(m.photo_media);
            data.photo_media = ''; data.photo_scene = ''; data.photo_url = '';
          }
          if (m) {
            S.DB.update('memory_bank', m.memory_id, data);
            S.toast(tx('mem_saved', 'Memory updated.'), 'ok');
            S.Router.go('#/patient/memory/' + m.memory_id);
          } else {
            var row = S.DB.insert('memory_bank', S.M.newMemory(Object.assign({ patient_id: p.patient_id, created_by: 'patient', icon: '📷' }, data)));
            S.Links.forPatient(p.patient_id, 'caregiver').forEach(function (l) {
              S.Services.Notify.push({ recipient_role: 'caregiver', recipient_id: l.actor_id, patient_id: p.patient_id, kind: 'memory',
                title: String(p.name).split(' ')[0] + ' added a memory', body: '“' + title + '”', link: '#/caregiver/memory' });
            });
            S.toast(tx('mem_added', 'Memory saved.'), 'ok');
            S.Router.go('#/patient/memory/' + row.memory_id);
          }
        });
      }
    }
  };

  S.Memories = Memories;
})(window);
