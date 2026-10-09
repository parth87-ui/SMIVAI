/* ============================================================
   SMIVAI — screens/care.js
   Book a Doctor · Order Medicines · Caregiver Support · Health Records ·
   Emergency SOS.

   The doctor directory, pharmacy and emergency dispatch are demo
   services (see core/services.js); every screen here says so where the
   patient can see it. Appointments, orders, requests and readings are
   real records in the shared store, so caregivers and doctors see them.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;
  function tx(k, en, p) { return S.tx(k, en, p); }
  function esc(s) { return S.esc(s); }
  function head(title, actionHtml, sub) {
    return '<div class="sec-head"><div><h2>' + esc(title) + '</h2>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>' + (actionHtml || '') + '</div>';
  }
  function back(label, go) {
    return '<button class="btn btn-ghost" data-act="back">' + S.icon('arrowLeft') + esc(label || S.t('back')) + '</button>';
  }

  var Care = {

    /* ============================================================
       BOOK A DOCTOR
       ============================================================ */
    doctor: function (docId) {
      var p = S.State.patient();
      if (docId) return this.doctorDetail(docId);

      var today = S.todayISO();
      var appts = S.DB.forPatient('appointments', p.patient_id).sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
      var closed = { cancelled: 1, completed: 1, rescheduled: 1 };
      var upcoming = appts.filter(function (a) { return a.date >= today && !closed[a.status]; });
      var past = appts.filter(function (a) { return a.date < today || closed[a.status]; }).reverse();
      var myDoctors = S.Links.forPatient(p.patient_id, 'doctor').map(function (l) { return l.actor_id; });
      var here = S.Location.current(p);
      var myLang = S.I18N.lang(p.language || 'en').name;

      /* The chosen sort decides the order (core/doctors.js). "Recommended"
         keeps the earlier rule: your own doctors, then your language, then
         the nearest. Distance is measured from your current location if you
         allowed it (this visit only), otherwise from your town. */
      var sortBy = S.Doctors.CRITERIA[S.Prefs.get('doctor_sort')] ? S.Prefs.get('doctor_sort') : 'recommended';
      var origin = S.Location.origin(p);
      var rows = S.Doctors.annotate(S.Wellness.DOCTORS, origin);
      rows.forEach(function (r) { r.mine = myDoctors.indexOf(r.doctor.id) !== -1; r.speaks = r.doctor.languages.indexOf(myLang) !== -1; });
      if (sortBy === 'recommended') {
        rows.sort(function (a, b) {
          if (a.mine !== b.mine) return a.mine ? -1 : 1;
          if (a.speaks !== b.speaks) return a.speaks ? -1 : 1;
          return (a.distance == null ? 1e9 : a.distance) - (b.distance == null ? 1e9 : b.distance);
        });
      } else {
        rows = S.Doctors.sort(rows, sortBy);
      }
      var rowOf = {};
      rows.forEach(function (r) { rowOf[r.doctor.id] = r; });
      var list = rows.map(function (r) { return r.doctor; });
      function distanceText(r) {
        if (r.distance === null) return tx('distance_unknown', 'distance unknown');
        if (r.distance < 1) return tx('in_your_town', 'in your town');
        return tx('km_away', 'about {n} km away', { n: Math.round(r.distance) }) + (r.approx || !origin.precise ? ' ' + tx('approx', '(approx.)') : '');
      }

      var html =
        '<div class="page anim-in">' +
          '<section class="page-hero tone-blue">' +
            '<div class="grow"><span class="chip chip-blue">' + S.icon('stethoscope') + esc(tx('doctors_n', '{n} doctors available', { n: list.length })) + '</span>' +
              '<h1>' + esc(tx('book_doctor', 'Book a Doctor')) + '</h1>' +
              '<p>' + esc(tx('bd_hero', 'Talk to a doctor by video from home, visit a clinic, or ask for a home visit.')) + '</p></div>' +
            '<div class="ph-art float">' + S.Art.stethoscope() + '</div>' +
          '</section>' +

          (upcoming.length ? '<section class="p-sec">' + head(tx('upcoming_appts', 'Upcoming Appointments')) +
            '<div class="card"><div class="stack stack-2">' + upcoming.map(function (a) {
              return '<div class="appt-full">' + S.Patient.Bits.apptRow(a) +
                '<div class="row" style="gap:.5rem;flex-wrap:wrap;margin-top:.75rem">' +
                  (a.mode === 'video' ? '<button class="btn btn-sm" data-act="join" data-arg="' + esc(a.appointment_id) + '">' + S.icon('video') + esc(tx('join_call', 'Join video call')) + '</button>' : '') +
                  '<button class="btn btn-sm btn-outline" data-act="reschedule" data-arg="' + esc(a.appointment_id) + '">' + S.icon('calendar') + esc(tx('reschedule', 'Reschedule')) + '</button>' +
                  '<button class="btn btn-sm btn-danger" data-act="cancel" data-arg="' + esc(a.appointment_id) + '">' + S.icon('x') + esc(tx('cancel_appt', 'Cancel')) + '</button>' +
                '</div></div>';
            }).join('') + '</div></div></section>' : '') +

          '<section class="p-sec">' + head(tx('choose_doctor', 'Choose a doctor'), '', tx('choose_doctor_sub', 'Doctors who speak your language are listed first.')) +
            '<div class="card card-tint row" style="gap:.75rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem">' + S.icon('pin') +
              '<span class="grow">' + (origin
                ? esc(tx('dist_from', 'Distances from {town}', { town: origin.label })) +
                  (here && !origin.precise ? ' <small class="muted">(' + esc(here.source === 'gps' ? tx('loc_src_gps', 'from your location') : here.source === 'manual' ? tx('loc_src_manual', 'chosen by you') : tx('loc_src_profile', 'from your profile')) + ')</small>' : '')
                : esc(tx('no_town', 'Tell SMIVAI your town to see the nearest doctors first.'))) + '</span>' +
              '<button class="btn btn-outline" data-act="where">' + esc(origin ? tx('change', 'Change') : tx('set_town', 'Set my town')) + '</button>' +
              '<label class="row" style="gap:.5rem;align-items:center;width:100%"><span class="t-small"><b>' + esc(tx('sort_by', 'Sort by')) + '</b></span>' +
                '<select class="select" id="doc-sort" style="flex:1;min-width:0">' + Object.keys(S.Doctors.CRITERIA).map(function (k) {
                  return '<option value="' + k + '"' + (k === sortBy ? ' selected' : '') + '>' + esc(tx('sort_' + k, S.Doctors.CRITERIA[k].label)) + '</option>';
                }).join('') + '</select></label>' +
            '</div>' +
            '<div class="doc-grid">' + list.map(function (d) {
              var mine = myDoctors.indexOf(d.id) !== -1;
              return '<article class="doc-card">' +
                '<span class="avatar avatar-lg">' + S.Art.avatar({ name: d.name, gender: d.gender, patient_id: d.id }) + '</span>' +
                '<div class="grow"><h3>' + esc(d.name) + (mine ? ' <span class="chip chip-green">' + esc(tx('your_doctor', 'Your doctor')) + '</span>' : '') + '</h3>' +
                  '<div class="dc-spec">' + esc(d.speciality) + '</div>' +
                  '<div class="dc-meta">' + S.icon('pin') + esc(d.city) + ' · ' + esc(distanceText(rowOf[d.id])) +
                    (d.years ? ' · ' + esc(tx('years_exp', '{n} years', { n: d.years })) + '' : '') + '</div>' +
                  '<div class="dc-meta">' + esc(S.Doctors.ratingText(rowOf[d.id])) + '</div>' +
                  '<div class="row" style="gap:.375rem;flex-wrap:wrap;margin-top:.5rem">' +
                    d.modes.map(function (m) {
                      var mm = S.Wellness.VISIT_MODES.filter(function (x) { return x.id === m; })[0];
                      return S.UI.chip(mm.name, 'chip-blue', null).replace('<span class="chip', '<span class="chip').replace('>' + esc(mm.name), '>' + S.icon(mm.icon) + esc(mm.name));
                    }).join('') +
                    S.UI.chip(esc(d.languages.join(', ')), '') +
                  '</div>' +
                '</div>' +
                '<div class="dc-foot"><div class="dc-fee">' + esc(S.Doctors.feeText(rowOf[d.id].fee)) + (rowOf[d.id].fee ? '<small>' + esc(tx('per_visit', 'per visit')) + '</small>' : '') + '</div>' +
                  '<button class="btn" data-act="open" data-arg="' + d.id + '">' + S.icon('calendar') + esc(tx('book', 'Book')) + '</button></div>' +
              '</article>';
            }).join('') + '</div></section>' +

          (past.length ? '<section class="p-sec">' + head(tx('past_visits', 'Past visits')) +
            '<div class="card"><div class="list">' + past.slice(0, 6).map(function (a) {
              return '<div class="list-item"><span class="list-icon ' + (a.status === 'cancelled' ? 'coral' : 'blue') + '">' + S.icon('stethoscope') + '</span>' +
                '<div class="grow"><b>' + esc(a.doctor_name) + '</b><div class="t-small muted">' + esc(S.prettyDate(a.date) + ' · ' + a.speciality) + '</div></div>' +
                S.UI.chip(S.titleCase(a.status), a.status === 'cancelled' ? 'chip-coral' : 'chip-green') +
                (S.Doctors.canReview(p.patient_id, a) ? '<button class="btn btn-sm btn-outline" data-act="rate" data-arg="' + esc(a.appointment_id) + '">★ ' + esc(tx('rate_visit', 'Rate this visit')) + '</button>' : '') +
                '</div>';
            }).join('') + '</div></div></section>' : '') +

          '<div class="demo-note">' + S.icon('info') + '<span>' + esc(tx('doc_demo', 'Demo directory: these doctors are fictional and no real appointment is made. Your booking is saved in SMIVAI so your caregiver and doctor can see it.')) + '</span></div>' +
        '</div>';

      S.mount(S.qs('#app'), html, {
        open: function (el, ev, id) { Care._rescheduleId = null; S.Router.go('#/patient/doctor/' + id); },
        where: function () { Care.townPicker(function () { Care.doctor(); }); },
        rate: function (el, ev, id) {
          var a = S.DB.find('appointments', id);
          S.Modal.open({
            title: tx('rate_visit', 'Rate this visit'),
            subtitle: a.doctor_name + ' · ' + S.prettyDate(a.date),
            body: '<div class="row" style="gap:.5rem;flex-wrap:wrap;justify-content:center">' + [1, 2, 3, 4, 5].map(function (n) {
              return '<button class="btn btn-lg btn-outline" data-act="stars" data-arg="' + n + '" aria-label="' + n + ' ' + (n === 1 ? 'star' : 'stars') + '">' + n + ' ★</button>';
            }).join('') + '</div><p class="t-small muted" style="margin-top:1rem;text-align:center">' +
              esc(tx('rate_note', 'Your rating is shown as part of this doctor’s average. You can rate each completed visit once.')) + '</p>',
            handlers: {
              stars: function (b, e, n) {
                var res = S.Doctors.review(p.patient_id, a, +n);
                S.Modal.close();
                S.toast(res.ok ? tx('rated', 'Thank you — your rating was saved.') : res.error, res.ok ? 'ok' : 'warn');
                Care.doctor();
              }
            }
          });
        },
        join: function () { S.toast(tx('video_demo', 'Video calling is not available yet (demo mode).'), 'warn', 4500); },
        reschedule: function (el, ev, id) {
          var a = S.DB.find('appointments', id);
          /* The old booking is replaced only when the new one is made. */
          if (a) { Care._rescheduleId = id; S.Router.go('#/patient/doctor/' + a.doctor_id); }
        },
        cancel: function (el, ev, id) {
          var a = S.DB.find('appointments', id);
          S.Modal.confirm({ title: tx('cancel_appt_q', 'Cancel this appointment?'), message: a.doctor_name + ' · ' + S.prettyDate(a.date) + ' ' + S.prettyTime(a.time), okText: tx('cancel_appt', 'Cancel'), cancelText: tx('keep_it', 'Keep it'), danger: true })
            .then(function (ok) {
              if (!ok) return;
              S.DB.update('appointments', id, { status: 'cancelled' });
              S.Services.Notify.push({ recipient_role: 'patient', recipient_id: p.patient_id, patient_id: p.patient_id, kind: 'appointment',
                title: tx('appt_cancelled', 'Appointment cancelled'), body: a.doctor_name + ' · ' + S.prettyDate(a.date) });
              S.toast(tx('appt_cancelled', 'Appointment cancelled'), 'ok');
              Care.doctor();
            });
        }
      });
      Care._wireSort();
      S.scrollTop();
    },

    /** Wire the "Sort by" control (called after the list is drawn). */
    _wireSort: function () {
      var sel = S.qs('#doc-sort');
      if (sel) sel.addEventListener('change', function () { S.Prefs.set('doctor_sort', sel.value); Care.doctor(); });
    },

    doctorDetail: function (docId) {
      var p = S.State.patient();
      var d = S.Wellness.doctor(docId);
      if (!d) { S.Router.go('#/patient/doctor'); return; }
      var mode = d.modes[0];
      var date = S.addDays(S.todayISO(), 1);
      var slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
      var days = [];
      for (var i = 0; i < 10; i++) days.push(S.addDays(S.todayISO(), i));
      var replacing = Care._rescheduleId ? S.DB.find('appointments', Care._rescheduleId) : null;
      if (replacing && (replacing.patient_id !== p.patient_id || replacing.doctor_id !== d.id)) replacing = null;

      function taken(dd, s) {
        return S.DB.where('appointments', function (a) {
          return a.doctor_id === d.id && a.date === dd && a.time === s &&
            a.status !== 'cancelled' && a.status !== 'rescheduled' && (!replacing || a.appointment_id !== replacing.appointment_id);
        }).length > 0;
      }
      function firstFree(dd) { return slots.filter(function (s) { return !taken(dd, s); })[0] || null; }
      var time = firstFree(date);

      function draw() {
        var html =
          '<div class="page page-narrow anim-in">' + back(tx('all_doctors', 'All doctors')) +
            '<article class="card doc-hero">' +
              '<span class="avatar avatar-xl">' + S.Art.avatar({ name: d.name, gender: d.gender, patient_id: d.id }) + '</span>' +
              '<div class="grow"><h1 class="t-h1">' + esc(d.name) + '</h1><p class="muted">' + esc(d.speciality) + '</p>' +
                '<div class="row" style="gap:.5rem;flex-wrap:wrap;margin-top:.75rem">' +
                  S.UI.chip(d.city, 'chip-blue') + (d.years ? S.UI.chip(tx('years_exp', '{n} years', { n: d.years }), '') : '') +
                  S.UI.chip(d.languages.join(', '), '') + (d.fee ? S.UI.chip('₹' + d.fee, 'chip-green') : '') +
                '</div></div>' +
            '</article>' +

            '<section class="card" style="margin-top:1.25rem">' +
              '<h2 class="card-title">' + esc(tx('how_to_meet', 'How would you like to meet?')) + '</h2>' +
              '<div class="choice-grid" style="margin-top:1rem">' + d.modes.map(function (m) {
                var mm = S.Wellness.VISIT_MODES.filter(function (x) { return x.id === m; })[0];
                return '<button class="choice" data-act="mode" data-arg="' + m + '" aria-pressed="' + (m === mode) + '">' + S.icon(mm.icon) + esc(mm.name) + '</button>';
              }).join('') + '</div>' +

              '<h2 class="card-title" style="margin-top:1.75rem">' + esc(tx('pick_day', 'Pick a day')) + '</h2>' +
              '<div class="day-strip">' + days.map(function (dd) {
                return '<button class="day-chip" data-act="day" data-arg="' + dd + '" aria-pressed="' + (dd === date) + '">' +
                  '<span>' + esc(S.weekdayName(dd).slice(0, 3)) + '</span><b>' + esc(String(S.fromISO(dd).getDate())) + '</b>' +
                  '<small>' + esc(S.prettyDate(dd).split(' ')[1]) + '</small></button>';
              }).join('') + '</div>' +

              '<h2 class="card-title" style="margin-top:1.75rem">' + esc(tx('pick_time', 'Pick a time')) + '</h2>' +
              '<div class="slot-grid">' + slots.map(function (s) {
                var isTaken = taken(date, s);
                return '<button class="slot' + (isTaken ? ' is-taken' : '') + '" data-act="slot" data-arg="' + s + '" aria-pressed="' + (s === time) + '"' + (isTaken ? ' disabled' : '') + '>' +
                  esc(S.prettyTime(s)) + (isTaken ? '<small>' + esc(tx('taken', 'taken')) + '</small>' : '') + '</button>';
              }).join('') + '</div>' +
              (time ? '' : '<p class="t-small" style="margin-top:.75rem">' + esc(tx('day_full', 'No free times on this day. Please pick another day.')) + '</p>') +

              '<div class="field" style="margin-top:1.5rem"><label for="ap-reason">' + esc(tx('reason_visit', 'What is the visit about? (optional)')) + '</label>' +
                '<input class="input" id="ap-reason" maxlength="90" placeholder="' + esc(tx('reason_ph', 'e.g. Monthly check-in, knee pain')) + '"></div>' +

              (replacing ? '<div class="demo-note" style="margin-top:1.25rem">' + S.icon('calendar') + '<span>' +
                esc(tx('replacing', 'This will replace your booking on {d} at {t}.', { d: S.prettyDate(replacing.date), t: S.prettyTime(replacing.time) })) + '</span></div>' : '') +
              '<div class="book-bar"><div><b>' + esc(S.prettyDate(date)) + (time ? ' · ' + esc(S.prettyTime(time)) : '') + '</b>' +
                '<small>' + esc(S.Wellness.VISIT_MODES.filter(function (x) { return x.id === mode; })[0].name) + (d.fee ? ' · ₹' + d.fee : '') + '</small></div>' +
                '<button class="btn btn-xl" data-act="confirm"' + (time ? '' : ' disabled') + '>' + S.icon('check') +
                  esc(replacing ? tx('request_change', 'Request this new time') : tx('request_booking', 'Request appointment')) + '</button></div>' +
            '</section>' +
            '<div class="demo-note">' + S.icon('info') + '<span>' + esc(tx('doc_demo2', 'Demo booking — no real clinic is contacted. The appointment is saved in SMIVAI and shared with your care team.')) + '</span></div>' +
          '</div>';

        S.mount(S.qs('#app'), html, {
          back: function () { S.Router.go('#/patient/doctor'); },
          mode: function (el, ev, m) { mode = m; draw(); },
          day: function (el, ev, dd) { date = dd; if (!time || taken(date, time)) time = firstFree(date); draw(); },
          slot: function (el, ev, s) { time = s; draw(); },
          confirm: function (el) {
            /* Checked again now, not only when the page was drawn. */
            if (!time || taken(date, time)) {
              S.toast(tx('slot_gone', 'That time has just been taken. Please pick another.'), 'warn', 4500);
              time = firstFree(date); draw(); return;
            }
            var clash = S.DB.where('appointments', function (a) {
              return a.patient_id === p.patient_id && a.date === date && a.time === time &&
                a.status !== 'cancelled' && a.status !== 'rescheduled' && (!replacing || a.appointment_id !== replacing.appointment_id);
            })[0];
            if (clash) {
              S.toast(tx('you_have_one', 'You already have an appointment at that time ({n}).', { n: clash.doctor_name }), 'warn', 5000);
              return;
            }
            el.disabled = true;
            var reason = S.qs('#ap-reason').value.trim();
            var linked = S.Links.exists('doctor', d.id, p.patient_id);
            /* Always a request: only the doctor confirms it (doctor dashboard).
               A directory doctor is fictional, so nobody ever will. */
            var row = S.DB.insert('appointments', {
              appointment_id: S.uid('apt'), patient_id: p.patient_id, doctor_id: d.id, doctor_name: d.name,
              speciality: d.speciality, date: date, time: time, mode: mode,
              status: 'scheduled', reason: reason, fee: d.fee || null, created_at: S.stamp(),
              replaces: replacing ? replacing.appointment_id : null
            });
            if (replacing) {
              S.DB.update('appointments', replacing.appointment_id, { status: 'rescheduled', replaced_by: row.appointment_id });
              S.DB.where('reminders', function (r) {
                return r.patient_id === p.patient_id && r.category === 'appointment' && r.date === replacing.date && r.time === replacing.time && r.repeat === 'once';
              }).forEach(function (r) { S.Reminders.update(r.reminder_id, { status: 'paused' }); });
              Care._rescheduleId = null;
            }
            S.Reminders.create({
              patient_id: p.patient_id, title: tx('appt_with', 'Appointment with {n}', { n: d.name }),
              description: S.Wellness.VISIT_MODES.filter(function (x) { return x.id === mode; })[0].name,
              category: 'appointment', date: date, time: time, repeat: 'once',
              created_by_role: 'patient', created_by_id: p.patient_id, created_by_name: p.name
            });
            S.Services.Notify.push({ recipient_role: 'patient', recipient_id: p.patient_id, patient_id: p.patient_id, kind: 'appointment',
              title: tx('appt_requested', 'Appointment requested'),
              body: d.name + ' · ' + S.prettyDate(date) + ' ' + S.prettyTime(time) + ' — ' +
                (linked ? tx('awaiting_doctor', 'waiting for the doctor to confirm') : tx('demo_no_clinic', 'demo: no clinic is contacted')),
              link: '#/patient/doctor' });
            if (linked) {
              S.Services.Notify.push({ recipient_role: 'doctor', recipient_id: d.id, patient_id: p.patient_id, kind: 'appointment',
                title: 'Appointment request: ' + p.name, body: S.prettyDate(date) + ' ' + S.prettyTime(time), link: '#/doctor/appointments' });
            }
            S.Links.forPatient(p.patient_id, 'caregiver').forEach(function (l) {
              S.Services.Notify.push({ recipient_role: 'caregiver', recipient_id: l.actor_id, patient_id: p.patient_id, kind: 'appointment',
                title: String(p.name).split(' ')[0] + ': ' + d.name, body: S.prettyDate(date) + ' ' + S.prettyTime(time), link: '#/caregiver/guidance' });
            });
            Care.bookingDone(row, d, linked);
          }
        });
        S.scrollTop();
      }
      draw();
    },

    /** Choose the town doctors are sorted from: device location or a list. */
    townPicker: function (done) {
      var p = S.State.patient();
      var here = S.Location.current(p);
      S.Modal.open({
        title: tx('your_town', 'Your town'),
        subtitle: tx('your_town_sub', 'Used to show the nearest doctors first. SMIVAI keeps only the town name.'),
        body: '<button class="btn btn-lg btn-block" data-act="gps">' + S.icon('pin') + esc(tx('use_location', 'Use my location')) + '</button>' +
          '<p class="t-small muted" style="margin:.5rem 0 1.25rem">' + esc(tx('use_location_sub', 'Your phone will ask first. The exact position is not saved or sent anywhere.')) + '</p>' +
          '<div class="err" id="town-err" role="alert" hidden></div>' +
          '<div class="field"><label for="town-sel">' + esc(tx('or_choose', 'Or choose your town')) + '</label>' +
            '<select class="input" id="town-sel"><option value="">—</option>' + S.Location.towns().map(function (t) {
              return '<option value="' + esc(t.key) + '"' + (here && here.key === t.key ? ' selected' : '') + '>' + esc(t.name) + '</option>';
            }).join('') + '</select></div>',
        footer: '<button class="btn btn-outline" data-modal-close>' + esc(S.t('cancel')) + '</button>' +
                '<button class="btn" data-act="save">' + S.icon('check') + esc(tx('save', 'Save')) + '</button>',
        handlers: {
          gps: function (el) {
            var errEl = S.qs('#town-err');
            el.disabled = true;
            el.lastChild.textContent = tx('finding', 'Finding you…');
            S.Location.detect().then(function (r) {
              el.disabled = false;
              el.lastChild.textContent = tx('use_location', 'Use my location');
              if (r.ok) { S.Modal.close(); S.toast(tx('town_set', 'Showing doctors near {town}.', { town: r.name }), 'ok'); done(); return; }
              errEl.textContent = r.message; errEl.hidden = false;
              S.qs('#town-sel').focus();
            });
          },
          save: function () {
            var v = S.qs('#town-sel').value;
            if (v) S.Location.choose(v); else S.Location.clear();
            S.Modal.close(); done();
          }
        }
      });
    },

    /* ============================================================
       HELPLINES & CHARITIES — official contacts only. SMIVAI takes no
       donations and makes no calls; links open the organisations' own sites.
       ============================================================ */
    SUPPORT_LINKS: [
      { name: 'Elderline — National Helpline for Senior Citizens', by: 'Ministry of Social Justice & Empowerment, Government of India',
        what: 'Free help for older people: information, guidance, emotional support, and help with abuse or neglect. Every day, 8 AM – 8 PM.',
        tel: '14567' },
      { name: 'HelpAge India', by: 'Registered charity', url: 'https://www.helpageindia.org',
        what: 'Care and support for older people across India, including an elder helpline. Donations are made on their own website.' },
      { name: 'Alzheimer’s & Related Disorders Society of India (ARDSI)', by: 'Registered charity', url: 'http://www.ardsi.org',
        what: 'Dementia care, caregiver support, helplines and local chapters.' }
    ],

    support: function () {
      var html =
        '<div class="page page-narrow anim-in">' +
          '<section class="page-hero tone-peach"><div class="grow">' +
            '<h1>' + esc(tx('help_charities', 'Helplines & charities')) + '</h1>' +
            '<p>' + esc(tx('help_charities_sub', 'People who can help, and organisations you may want to support.')) + '</p></div></section>' +
          '<article class="card" style="margin-bottom:1rem"><h2 class="card-title">' + esc(tx('apply_charity', 'Apply for Charity Assistance')) + '</h2>' +
            '<p class="t-body" style="margin:.5rem 0 1rem">' + esc(tx('apply_charity_sub', 'Help with doctor fees for families with a low annual income. The income limit and the rules are on the next page. Checked and approved by Smivai and a charity partner.')) + '</p>' +
            '<button class="btn btn-lg" data-act="charity">' + S.icon('arrowRight') + esc(tx('apply_charity_go', 'See if I can apply')) + '</button></article>' +
          '<div class="stack stack-2">' + Care.SUPPORT_LINKS.map(function (o) {
            return '<article class="card">' +
              '<h2 class="card-title">' + esc(o.name) + '</h2>' +
              '<div class="t-small muted">' + esc(o.by) + '</div>' +
              '<p class="t-body" style="margin:.5rem 0 1rem">' + esc(o.what) + '</p>' +
              (o.tel ? '<a class="btn btn-lg" href="tel:' + esc(o.tel) + '">' + S.icon('phone') + esc(tx('call_n', 'Call {n}', { n: o.tel })) + '</a>' : '') +
              (o.url ? '<a class="btn btn-lg btn-outline" href="' + esc(o.url) + '" target="_blank" rel="noopener noreferrer">' + S.icon('arrowRight') + esc(tx('open_site', 'Open their website')) + '</a>' : '') +
            '</article>';
          }).join('') + '</div>' +
          '<div class="demo-note" style="margin-top:1.25rem">' + S.icon('info') + '<span>' +
            esc(tx('support_note', 'SMIVAI does not pass on your details. Calls go through your phone, and donations to these organisations are made only on their own website. Contacts were checked in October 2026 — please confirm on the official site before you give.')) +
          '</span></div>' +
        '</div>';
      S.mount(S.qs('#app'), html, { charity: function () { S.Router.go('#/patient/charity'); } });
      S.scrollTop();
    },

    bookingDone: function (row, d, linked) {
      S.Modal.open({
        title: tx('request_sent', 'Request saved'),
        body: '<div class="center"><div style="width:8rem;margin:0 auto">' + S.Art.calendar() + '</div>' +
          '<p class="t-lg" style="margin-top:1rem">' + esc(tx('requested_msg', 'You asked to see {n} on {d} at {t}.', { n: d.name, d: S.prettyDate(row.date), t: S.prettyTime(row.time) })) + '</p>' +
          '<p class="t-body" style="margin-top:.5rem">' + esc(linked
            ? tx('awaiting_doctor_long', 'It is not confirmed yet. You will be told here when the doctor confirms it.')
            : tx('demo_booking_long', 'Demo mode: this doctor is fictional and no clinic is contacted, so it will not be confirmed.')) + '</p>' +
          '<p class="t-small muted" style="margin-top:.5rem">' + esc(tx('booked_rem', 'A reminder has been added, and your care team can see it.')) + '</p></div>',
        footer: '<button class="btn btn-lg btn-block" data-act="ok">' + S.icon('check') + esc(tx('lets_go', 'Let’s go')) + '</button>',
        handlers: { ok: function () { S.Modal.close(); S.Router.go('#/patient/doctor'); } }
      });
    },

    /* ============================================================
       ORDER MEDICINES
       ============================================================ */
    medicines: function () {
      var p = S.State.patient();
      var meds = S.Reminders.forPatient(p.patient_id).filter(function (r) { return r.category === 'medicine'; });
      var cart = Care._cart = Care._cart && Care._cart.pid === p.patient_id ? Care._cart : { pid: p.patient_id, items: [], prescription: null };
      var orders = S.DB.forPatient('orders', p.patient_id).sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; });

      function inCart(name) { return cart.items.some(function (i) { return i.name === name; }); }

      var html =
        '<div class="page anim-in">' +
          '<section class="page-hero tone-green">' +
            '<div class="grow"><span class="chip chip-green">' + S.icon('truck') + esc(tx('home_delivery_demo', 'Home delivery · demo')) + '</span>' +
              '<h1>' + esc(tx('order_medicines', 'Order Medicines')) + '</h1>' +
              '<p>' + esc(tx('om_hero2', 'Get an order ready from your medicine list. No pharmacy is connected yet, so orders are saved as demos only.')) + '</p></div>' +
            '<div class="ph-art float">' + S.Art.medicine() + '</div>' +
          '</section>' +

          '<div class="duo">' +
            '<section class="card">' +
              '<h2 class="card-title">' + esc(tx('your_medicines', 'Your medicines')) + '</h2>' +
              (meds.length
                ? '<div class="list" style="margin-top:.5rem">' + meds.map(function (r) {
                    var on = inCart(r.title);
                    return '<div class="list-item"><span class="list-icon peach">' + S.icon('pill') + '</span>' +
                      '<div class="grow"><b>' + esc(r.title) + '</b><div class="t-small muted">' + esc(S.prettyTime(r.time) + ' · ' + S.Reminders.repeatText(r)) + '</div></div>' +
                      '<button class="btn btn-sm ' + (on ? 'btn-success' : 'btn-outline') + '" data-act="toggle" data-arg="' + esc(r.title) + '">' +
                        S.icon(on ? 'check' : 'plus') + esc(on ? tx('added', 'Added') : tx('add', 'Add')) + '</button></div>';
                  }).join('') + '</div>'
                : S.UI.empty(S.icon('pill'), tx('no_meds', 'No medicines listed yet'), tx('no_meds_sub', 'Add a medicine reminder and it will appear here.'),
                    '<button class="btn" data-act="reminders">' + S.icon('plus') + esc(tx('add_reminder', 'Add a Reminder')) + '</button>')) +
              '<div class="divider"></div>' +
              '<div class="field"><label for="md-other">' + esc(tx('something_else', 'Something else?')) + '</label>' +
                '<div class="row"><input class="input grow" id="md-other" maxlength="60" placeholder="' + esc(tx('med_ph', 'e.g. Calcium tablets')) + '">' +
                '<button class="btn" data-act="addOther">' + S.icon('plus') + esc(tx('add', 'Add')) + '</button></div></div>' +
              '<div class="rx-box">' + (cart.prescription
                ? '<div class="row"><span class="list-icon green">' + S.icon('records') + '</span><div class="grow"><b>' + esc(tx('rx_added', 'Prescription photo added')) + '</b></div>' +
                  '<button class="btn btn-sm btn-danger" data-act="rxRemove">' + S.icon('trash') + esc(tx('remove', 'Remove')) + '</button></div>'
                : '<button class="btn btn-outline btn-block" data-act="rx">' + S.icon('camera') + esc(tx('upload_rx_req', 'Add a photo of your prescription (needed)')) + '</button>' +
                  '<p class="t-small muted" style="margin-top:.5rem">' + esc(tx('rx_why', 'A pharmacy must see a prescription before giving medicines. The photo stays on this device.')) + '</p>') +
                '<input type="file" id="md-file" accept="image/*" class="sr-only"></div>' +
            '</section>' +

            '<section class="card cart-card">' +
              '<h2 class="card-title">' + esc(tx('your_order', 'Your order')) + '</h2>' +
              (cart.items.length
                ? '<div class="list" style="margin-top:.5rem">' + cart.items.map(function (it, i) {
                    return '<div class="list-item"><span class="list-icon green">' + S.icon('pill') + '</span>' +
                      '<div class="grow"><b>' + esc(it.name) + '</b>' +
                        (it.custom ? '<div class="t-small muted">' + esc(tx('not_on_list', 'Not on your medicine list — the pharmacist checks it against your prescription.')) + '</div>' : '') + '</div>' +
                      '<div class="qty"><button data-act="less" data-arg="' + i + '" aria-label="Fewer">−</button><span>' + it.qty + '</span>' +
                      '<button data-act="more" data-arg="' + i + '" aria-label="More">+</button></div>' +
                      '<button class="icon-btn" data-act="remove" data-arg="' + i + '" aria-label="' + esc(tx('remove', 'Remove')) + '">' + S.icon('x') + '</button></div>';
                  }).join('') + '</div>' +
                  '<div class="field" style="margin-top:1rem"><label for="md-addr">' + esc(tx('deliver_to', 'Deliver to')) + '</label>' +
                    '<textarea class="textarea" id="md-addr" style="min-height:5rem">' + esc(p.district || '') + '</textarea></div>' +
                  '<div class="field"><span class="field-label">' + esc(tx('payment', 'Payment')) + '</span>' +
                    '<div class="choice-grid"><button class="choice" data-act="pay" data-arg="cod" aria-pressed="true">' + S.icon('truck') + esc(tx('cod', 'Cash on delivery')) + '</button>' +
                    '<button class="choice" data-act="pay" data-arg="upi" aria-pressed="false">' + S.icon('card') + 'UPI</button></div></div>' +
                  '<button class="btn btn-xl btn-block" style="margin-top:1rem" data-act="place"' + (cart.prescription ? '' : ' disabled aria-describedby="md-need-rx"') + '>' + S.icon('truck') + esc(tx('save_demo_order', 'Save demo order')) + '</button>' +
                  (cart.prescription ? '' : '<p class="t-small" id="md-need-rx" style="margin-top:.5rem">' + esc(tx('need_rx_first', 'Add your prescription photo first.')) + '</p>') +
                  '<div class="err" id="md-err" role="alert" hidden></div>'
                : S.UI.empty(S.icon('truck'), tx('cart_empty', 'Nothing added yet'), tx('cart_empty_sub', 'Tap Add next to a medicine to start your order.'))) +
            '</section>' +
          '</div>' +

          (orders.length ? '<section class="p-sec">' + head(tx('past_orders', 'Your orders')) +
            '<div class="card"><div class="list">' + orders.slice(0, 5).map(function (o) {
              return '<div class="list-item"><span class="list-icon green">' + S.icon('truck') + '</span>' +
                '<div class="grow"><b>' + esc(o.items.map(function (i) { return i.name; }).join(', ')) + '</b>' +
                '<div class="t-small muted">' + esc(S.prettyStamp(o.created_at) + ' · ' + o.reference) + '</div></div>' +
                S.UI.chip(o.status === 'demo' || o.status === 'placed' ? tx('demo_not_sent', 'Demo · not sent') : S.titleCase(o.status), o.status === 'delivered' ? 'chip-green' : '') +
                '<button class="btn btn-sm btn-outline" data-act="reorder" data-arg="' + esc(o.order_id) + '">' + S.icon('refresh') + esc(tx('reorder', 'Reorder')) + '</button></div>';
            }).join('') + '</div></div></section>' : '') +

          '<div class="demo-note">' + S.icon('info') + '<span>' + esc(S.Services.Pharmacy.label) + '. ' + esc(tx('rx_note', 'SMIVAI never suggests medicines or doses — it only reorders what your doctor has already prescribed.')) + '</span></div>' +
        '</div>';

      var payMethod = 'cod';
      S.mount(S.qs('#app'), html, {
        reminders: function () { S.Router.go('#/patient/reminders'); },
        toggle: function (el, ev, name) {
          var i = cart.items.findIndex(function (x) { return x.name === name; });
          if (i >= 0) cart.items.splice(i, 1); else cart.items.push({ name: name, qty: 1 });
          Care.medicines();
        },
        addOther: function () {
          var el = S.qs('#md-other'), v = el.value.trim();
          if (!v) { el.focus(); return; }
          if (!inCart(v)) cart.items.push({ name: v, qty: 1, custom: true });
          Care.medicines();
        },
        more: function (el, ev, i) { cart.items[+i].qty = Math.min(12, cart.items[+i].qty + 1); Care.medicines(); },
        less: function (el, ev, i) { var it = cart.items[+i]; it.qty > 1 ? it.qty-- : cart.items.splice(+i, 1); Care.medicines(); },
        remove: function (el, ev, i) { cart.items.splice(+i, 1); Care.medicines(); },
        rx: function () { S.qs('#md-file').click(); },
        rxRemove: function () { cart.prescription = null; Care.medicines(); },
        pay: function (el, ev, m) {
          payMethod = m;
          S.qsa('.cart-card .choice').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-arg') === m ? 'true' : 'false'); });
        },
        reorder: function (el, ev, id) {
          var o = S.DB.find('orders', id);
          cart.items = o.items.map(function (i) { return { name: i.name, qty: i.qty, custom: !!i.custom }; });
          Care.medicines();
          S.toast(tx('reorder_ready', 'Added to your order — check and place it.'), 'ok');
        },
        place: function (el) {
          var err = S.qs('#md-err');
          var addr = S.qs('#md-addr').value.trim();
          if (!addr) { err.textContent = tx('need_addr', 'Please say where it should be delivered.'); err.hidden = false; return; }
          err.hidden = true; el.disabled = true;
          el.innerHTML = '<span class="spinner" style="border-top-color:#fff;border-color:rgba(255,255,255,.35)"></span>' + esc(tx('sending', 'Sending…'));
          S.Services.Pharmacy.place({ items: cart.items, address: addr, payment: payMethod, prescription: cart.prescription }).then(function (res) {
            el.disabled = false;
            if (!res.ok) { err.textContent = res.error; err.hidden = false; el.innerHTML = S.icon('truck') + esc(tx('save_demo_order', 'Save demo order')); return; }
            var order = S.DB.insert('orders', {
              order_id: S.uid('ord'), patient_id: p.patient_id, items: cart.items, address: addr,
              payment: payMethod, status: 'demo', reference: res.reference, eta: null,
              prescription_media: cart.prescription || '', created_at: S.stamp()
            });
            S.Services.Notify.push({ recipient_role: 'patient', recipient_id: p.patient_id, patient_id: p.patient_id, kind: 'order',
              title: tx('demo_order_saved', 'Demo order saved'), body: res.reference + ' · ' + tx('not_sent', 'not sent to any pharmacy'), link: '#/patient/medicines' });
            S.Links.forPatient(p.patient_id, 'caregiver').forEach(function (l) {
              S.Services.Notify.push({ recipient_role: 'caregiver', recipient_id: l.actor_id, patient_id: p.patient_id, kind: 'order',
                title: String(p.name).split(' ')[0] + ' saved a demo medicine order', body: cart.items.map(function (i) { return i.name; }).join(', ') + ' — not sent to any pharmacy', link: '#/caregiver/dashboard' });
            });
            Care._cart = { pid: p.patient_id, items: [], prescription: null };
            S.Modal.open({
              title: tx('demo_order_saved', 'Demo order saved'),
              body: '<div class="center"><div style="width:8rem;margin:0 auto">' + S.Art.medicine() + '</div>' +
                '<p class="t-lg" style="margin-top:1rem">' + esc(tx('demo_order_msg', 'This order was saved in SMIVAI only. No pharmacy has received it, and nothing will be delivered.')) + '</p>' +
                '<p class="t-small muted">' + esc(tx('order_ref', 'Reference {r}', { r: order.reference })) + ' · ' + esc(tx('demo_get_meds', 'To get these medicines, please contact your pharmacy or caregiver.')) + '</p></div>',
              footer: '<button class="btn btn-lg btn-block" data-modal-close>' + esc(tx('lets_go', 'Let’s go')) + '</button>'
            });
            Care.medicines();
          });
        }
      });

      var file = S.qs('#md-file');
      if (file) file.addEventListener('change', function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        S.Media.fromFile(f, 1400).then(function (d) { return S.Media.put(d); }).then(function (stored) {
          cart.prescription = stored.id;
          S.toast(tx('rx_added', 'Prescription photo added'), 'ok');
          Care.medicines();
        }).catch(function (err2) { S.toast(err2.message || tx('photo_failed', 'That photo could not be added.'), 'warn'); });
        e.target.value = '';
      });
      S.scrollTop();
    },

    /* ============================================================
       CAREGIVER SUPPORT
       ============================================================ */
    caregiver: function () {
      var p = S.State.patient();
      var links = S.Links.forPatient(p.patient_id, 'caregiver');
      var team = links.map(function (l) { return { link: l, person: S.DB.find('caregivers', l.actor_id) }; }).filter(function (x) { return x.person; });
      var docLinks = {};
      var docs = S.Links.forPatient(p.patient_id, 'doctor').map(function (l) {
        var d = S.DB.find('doctors', l.actor_id);
        if (d) docLinks[d.doctor_id] = l.link_id;
        return d;
      }).filter(Boolean);
      var contacts = S.DB.forPatient('contacts', p.patient_id);
      function seesText(link) {
        var s = S.Links.scopesOf(link), on = [];
        if (s.activity) on.push(tx('scope_activity_s', 'progress'));
        if (s.memories) on.push(tx('scope_memories_s', 'memories'));
        if (s.health) on.push(tx('scope_health_s', 'health records'));
        return tx('sees', 'Sees: reminders, alerts{more}', { more: on.length ? ', ' + on.join(', ') : '' });
      }
      var seeBtn = function (linkId) {
        return '<button class="btn btn-sm btn-outline" data-act="perm" data-arg="' + esc(linkId) + '">' + S.icon('shield') + esc(tx('what_they_see', 'What they can see')) + '</button>';
      };
      var requests = S.DB.forPatient('care_requests', p.patient_id).sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; });
      var limit = S.Plans.linkLimit('patient', p.patient_id);
      if (!p.share_code) { S.DB.update('patients', p.patient_id, { share_code: S.Plans.makeShareCode(p.patient_id) }, { silent: true }); p = S.State.patient(); }

      var html =
        '<div class="page anim-in">' +
          '<section class="page-hero tone-peach">' +
            '<div class="grow"><span class="chip chip-peach">' + S.icon('users') + esc(tx('care_team_n', '{n} in your care team', { n: team.length + docs.length })) + '</span>' +
              '<h1>' + esc(tx('nav_caregiver', 'Caregiver Support')) + '</h1>' +
              '<p>' + esc(tx('cg_hero', 'The people who look after you — and help at home when you need it.')) + '</p></div>' +
            '<div class="ph-art float">' + S.Art.caregiver() + '</div>' +
          '</section>' +

          '<section class="p-sec">' + head(tx('care_team', 'Your care team')) +
            '<div class="card"><div class="list">' +
              (team.length ? team.map(function (x) {
                return '<div class="list-item team-item"><span class="avatar avatar-lg">' + S.Art.avatar({ name: x.person.name, gender: 'female', patient_id: x.person.caregiver_id }) + '</span>' +
                  '<div class="grow"><b>' + esc(x.person.name) + '</b><div class="t-small muted">' + esc(x.person.relation || tx('caregiver', 'Caregiver')) + '</div>' +
                    '<div class="t-small muted">' + esc(seesText(x.link)) + '</div></div>' +
                  '<div class="team-actions">' + seeBtn(x.link.link_id) +
                  '<button class="btn btn-sm btn-outline" data-act="msg" data-arg="' + esc(x.person.caregiver_id) + '">' + S.icon('message') + esc(tx('send_message', 'Message')) + '</button>' +
                  '<button class="btn btn-sm btn-danger" data-act="unlink" data-arg="' + esc(x.link.link_id) + '">' + esc(tx('remove', 'Remove')) + '</button></div></div>';
              }).join('') : '') +
              docs.map(function (d) {
                return '<div class="list-item team-item"><span class="avatar avatar-lg">' + S.Art.avatar({ name: d.name, gender: 'male', patient_id: d.doctor_id }) + '</span>' +
                  '<div class="grow"><b>' + esc(d.name) + '</b><div class="t-small muted">' + esc(d.speciality || 'Doctor') + '</div>' +
                    '<div class="t-small muted">' + esc(seesText(S.DB.find('links', docLinks[d.doctor_id]))) + '</div></div>' +
                  '<div class="team-actions">' + S.UI.chip(tx('your_doctor', 'Your doctor'), 'chip-blue') + seeBtn(docLinks[d.doctor_id]) + '</div></div>';
              }).join('') +
              (!team.length && !docs.length ? '<div style="padding:1rem 0">' + S.UI.empty(S.icon('users'), tx('no_team', 'No one is linked yet'), tx('no_team_sub', 'Share your care code with a family member or your doctor.')) + '</div>' : '') +
            '</div></div></section>' +

          '<section class="p-sec">' + head(tx('invite', 'Invite someone to help')) +
            '<div class="card card-tint share-card">' +
              '<div class="grow"><div class="t-mini">' + esc(tx('your_code', 'Your care code')) + '</div>' +
                '<div class="share-code" id="share-code">' + esc(p.share_code) + '</div>' +
                '<p class="t-small muted">' + esc(tx('share_hint', 'Read this out to your caregiver or doctor. They type it into SMIVAI to join your care team.')) + '</p>' +
                '<p class="t-small">' + esc(tx('cg_limit', '{n} of {max} caregivers on your {plan} plan.', { n: team.length, max: limit, plan: S.Plans.planOf('patient', p.patient_id) === 'premium' ? 'Premium' : 'Free' })) + '</p></div>' +
              '<div class="stack stack-1"><button class="btn" data-act="copy">' + S.icon('copy') + esc(tx('copy_code', 'Copy code')) + '</button>' +
              (S.Plans.planOf('patient', p.patient_id) === 'free' ? '<button class="btn btn-premium" data-act="premium">' + S.icon('sparkle') + esc(tx('more_caregivers', 'Allow more')) + '</button>' : '') + '</div>' +
            '</div></section>' +

          (contacts.length ? '<section class="p-sec">' + head(t2('call_family', 'Call your family')) +
            '<div class="contact-grid">' + contacts.map(function (c) {
              return '<div class="contact-card"><span class="avatar avatar-lg">' + S.Art.avatar({ name: c.name, patient_id: c.contact_id, gender: /wife|daughter|sister|mother/i.test(c.relation) ? 'female' : 'male' }) + '</span>' +
                '<div class="grow"><b>' + esc(c.name) + '</b><div class="t-small muted">' + esc(c.relation) + (c.is_emergency ? ' · ' + esc(S.t('first_to_call')) : '') + '</div></div>' +
                '<a class="btn btn-lg" href="tel:' + esc(String(c.phone).replace(/\s/g, '')) + '">' + S.icon('phone') + esc(S.t('call')) + '</a></div>';
            }).join('') + '</div></section>' : '') +

          '<section class="p-sec">' + head(tx('request_help', 'Request help at home'), '', tx('request_help_sub', 'Ask your care team for a visit. They will see it straight away.')) +
            '<div class="serv-grid">' + S.Wellness.CARE_SERVICES.map(function (s) {
              return '<button class="serv-card tone-' + s.color + '" data-act="req" data-arg="' + s.id + '">' +
                '<span class="list-icon ' + (s.color === 'cream' ? 'peach' : s.color) + '">' + S.icon(s.icon) + '</span>' +
                '<b>' + esc(s.name) + '</b><small>' + esc(s.desc) + '</small>' + S.icon('chevronRight') + '</button>';
            }).join('') + '</div></section>' +

          (requests.length ? '<section class="p-sec">' + head(tx('your_requests', 'Your requests')) +
            '<div class="card"><div class="list">' + requests.slice(0, 5).map(function (r) {
              var sv = S.Wellness.CARE_SERVICES.filter(function (s) { return s.id === r.service; })[0] || { name: r.service, icon: 'users' };
              return '<div class="list-item"><span class="list-icon peach">' + S.icon(sv.icon) + '</span>' +
                '<div class="grow"><b>' + esc(sv.name) + '</b><div class="t-small muted">' + esc(S.prettyDate(r.date) + ' · ' + S.prettyTime(r.time)) + (r.note ? ' · ' + esc(r.note) : '') + '</div></div>' +
                S.UI.chip(S.titleCase(r.status), r.status === 'accepted' ? 'chip-green' : r.status === 'cancelled' ? 'chip-coral' : 'chip-amber') +
                (r.status === 'open' ? '<button class="btn btn-sm btn-danger" data-act="cancelReq" data-arg="' + esc(r.request_id) + '">' + esc(S.t('cancel')) + '</button>' : '') + '</div>';
            }).join('') + '</div></div></section>' : '') +
        '</div>';

      S.mount(S.qs('#app'), html, {
        copy: function () {
          var code = p.share_code;
          if (global.navigator.clipboard) global.navigator.clipboard.writeText(code).then(function () { S.toast(tx('code_copied', 'Care code copied.'), 'ok'); },
            function () { S.toast(code, 'ok', 6000); });
          else S.toast(code, 'ok', 6000);
        },
        premium: function () { S.Premium.open(); },
        msg: function (el, ev, cgId) { Care.messageCaregiver(p, cgId); },
        unlink: function (el, ev, linkId) {
          var l = S.DB.find('links', linkId);
          var person = S.DB.find('caregivers', l.actor_id);
          S.Modal.confirm({ title: tx('remove_cg_q', 'Remove {n} from your care team?', { n: person.name }), message: tx('remove_cg_msg', 'They will no longer see your reminders, memories or activity.'), okText: tx('remove', 'Remove'), danger: true })
            .then(function (ok) { if (!ok) return; S.Links.remove(linkId); S.toast(tx('removed', 'Removed.'), 'ok'); Care.caregiver(); });
        },
        req: function (el, ev, sid) { Care.requestForm(p, sid); },
        cancelReq: function (el, ev, rid) { S.DB.update('care_requests', rid, { status: 'cancelled' }); S.toast(tx('req_cancelled', 'Request cancelled.'), 'ok'); Care.caregiver(); },
        perm: function (el, ev, linkId) { Care.permissions(linkId); }
      });
      S.scrollTop();

      function t2(k, en) { return S.I18N.strings[k] ? S.t(k) : tx(k, en); }
    },

    /** The patient chooses what one caregiver or doctor may see. */
    permissions: function (linkId) {
      var l = S.DB.find('links', linkId);
      var p = S.State.patient();
      if (!l || l.patient_id !== p.patient_id) return;          // only your own care team
      var who = l.actor_role === 'doctor' ? S.DB.find('doctors', l.actor_id) : S.DB.find('caregivers', l.actor_id);
      var s = S.Links.scopesOf(l);
      var rows = [
        ['activity', tx('scope_activity', 'Progress and activity'), tx('scope_activity_sub', 'Games, scores, mood check-ins and how you are doing.')],
        ['memories', tx('scope_memories', 'Memories'), tx('scope_memories_sub', 'Your photos and the stories behind them.')],
        ['health', tx('scope_health', 'Health records'), tx('scope_health_sub', 'Medicine orders and health readings.')]
      ];
      S.Modal.open({
        title: tx('what_they_see_n', 'What {n} can see', { n: who ? who.name : '' }),
        subtitle: tx('always_shared', 'Reminders, appointments and SOS alerts are always shared, so they can help you in time.'),
        body: '<div class="stack stack-2">' + rows.map(function (r) {
          return '<label class="row" style="gap:.75rem;align-items:flex-start;cursor:pointer">' +
            '<input type="checkbox" data-scope="' + r[0] + '" style="width:1.4rem;height:1.4rem;flex:none;margin-top:.15rem"' + (s[r[0]] ? ' checked' : '') + '>' +
            '<span><b>' + esc(r[1]) + '</b><span class="t-small muted" style="display:block">' + esc(r[2]) + '</span></span></label>';
        }).join('') + '</div>',
        footer: '<button class="btn btn-outline" data-modal-close>' + esc(S.t('cancel')) + '</button>' +
                '<button class="btn" data-act="save">' + S.icon('check') + esc(tx('save', 'Save')) + '</button>',
        handlers: {
          save: function (el) {
            var next = {};
            S.qsa('input[data-scope]', el.closest('.modal')).forEach(function (b) { next[b.getAttribute('data-scope')] = b.checked; });
            S.Links.setScopes(linkId, next);
            S.Services.Notify.push({ recipient_role: l.actor_role, recipient_id: l.actor_id, patient_id: p.patient_id, kind: 'link',
              title: String(p.name).split(' ')[0] + ' changed what you can see', body: '' });
            S.Modal.close();
            S.toast(tx('perm_saved', 'Saved. They will see only what you chose.'), 'ok');
            Care.caregiver();
          }
        }
      });
    },

    requestForm: function (p, serviceId) {
      var sv = S.Wellness.CARE_SERVICES.filter(function (s) { return s.id === serviceId; })[0];
      S.Modal.open({
        title: sv.name,
        subtitle: sv.desc,
        body: '<div class="stack stack-2">' +
            '<div class="form-grid">' +
              '<div class="field"><label for="cr-date">' + esc(tx('which_day', 'Which day?')) + '</label><input class="input" id="cr-date" type="date" min="' + S.todayISO() + '" value="' + S.addDays(S.todayISO(), 1) + '"></div>' +
              '<div class="field"><label for="cr-time">' + esc(tx('what_time', 'What time?')) + '</label><input class="input" id="cr-time" type="time" value="10:00"></div>' +
            '</div>' +
            '<div class="field"><label for="cr-note">' + esc(tx('anything_else', 'Anything they should know? (optional)')) + '</label>' +
              '<textarea class="textarea" id="cr-note" maxlength="200" placeholder="' + esc(tx('cr_ph', 'e.g. Please bring the blood pressure machine')) + '"></textarea></div>' +
            '<div class="err" id="cr-err" role="alert" hidden></div>' +
          '</div>',
        footer: '<button class="btn btn-outline" data-modal-close>' + esc(S.t('cancel')) + '</button>' +
          '<button class="btn" data-act="send">' + S.icon('send') + esc(tx('send_request', 'Send request')) + '</button>',
        handlers: {
          send: function () {
            var date = S.qs('#cr-date').value, time = S.qs('#cr-time').value;
            var err = S.qs('#cr-err');
            if (!date || !time) { err.textContent = tx('need_day_time', 'Please choose a day and a time.'); err.hidden = false; return; }
            var caregivers = S.Links.forPatient(p.patient_id, 'caregiver');
            if (!caregivers.length) { err.textContent = tx('no_cg_yet', 'No caregiver is linked yet. Share your care code first.'); err.hidden = false; return; }
            var row = S.DB.insert('care_requests', {
              request_id: S.uid('creq'), patient_id: p.patient_id, service: serviceId, date: date, time: time,
              note: S.qs('#cr-note').value.trim(), status: 'open', created_at: S.stamp()
            });
            caregivers.forEach(function (l) {
              S.Services.Notify.push({ recipient_role: 'caregiver', recipient_id: l.actor_id, patient_id: p.patient_id, kind: 'request',
                title: String(p.name).split(' ')[0] + ': ' + sv.name, body: S.prettyDate(date) + ' ' + S.prettyTime(time) + (row.note ? ' — ' + row.note : ''), link: '#/caregiver/alerts' });
            });
            S.Modal.close();
            S.toast(tx('req_sent', 'Your request was sent to your care team.'), 'ok');
            Care.caregiver();
          }
        }
      });
    },

    messageCaregiver: function (p, cgId) {
      var cg = S.DB.find('caregivers', cgId);
      S.Modal.open({
        title: tx('message_to', 'Message to {n}', { n: cg.name }),
        body: '<div class="field"><label for="msg-body">' + esc(tx('your_message', 'Your message')) + '</label>' +
          '<textarea class="textarea" id="msg-body" maxlength="300" placeholder="' + esc(tx('msg_ph', 'e.g. Could you call me this evening?')) + '"></textarea></div>' +
          '<div class="suggest-wrap" style="margin-top:.75rem">' +
            ['Could you call me?', 'I am feeling fine today', 'Please bring my medicines'].map(function (q, i) {
              return '<button class="suggest" data-act="quick" data-arg="' + i + '">' + esc(q) + '</button>';
            }).join('') + '</div>',
        footer: '<button class="btn btn-outline" data-modal-close>' + esc(S.t('cancel')) + '</button>' +
          '<button class="btn" data-act="send">' + S.icon('send') + esc(tx('send', 'Send')) + '</button>',
        handlers: {
          quick: function (el, ev, i) { S.qs('#msg-body').value = ['Could you call me?', 'I am feeling fine today', 'Please bring my medicines'][+i]; },
          send: function () {
            var body = S.qs('#msg-body').value.trim();
            if (!body) { S.qs('#msg-body').focus(); return; }
            S.Services.Notify.push({ recipient_role: 'caregiver', recipient_id: cgId, patient_id: p.patient_id, kind: 'message',
              title: tx('msg_from', 'Message from {n}', { n: p.name }), body: body, link: '#/caregiver/dashboard' });
            S.Modal.close();
            S.toast(tx('msg_sent', 'Message sent.'), 'ok');
          }
        }
      });
    },

    /* ============================================================
       HEALTH RECORDS
       ============================================================ */
    records: function () {
      var p = S.State.patient();
      var vitals = S.DB.forPatient('vitals', p.patient_id).sort(function (a, b) { return a.recorded_at < b.recorded_at ? 1 : -1; });
      var docs = vitals.filter(function (v) { return v.kind === 'document'; });
      var bp = vitals.filter(function (v) { return v.kind === 'bp'; }).slice(0, 14).reverse();
      var steps = vitals.filter(function (v) { return v.kind === 'steps'; }).slice(0, 7).reverse();
      var appts = S.DB.forPatient('appointments', p.patient_id).filter(function (a) { return a.status === 'completed'; });

      var html =
        '<div class="page anim-in">' +
          '<section class="page-hero tone-lav">' +
            '<div class="grow"><span class="chip chip-lav">' + S.icon('records') + esc(tx('your_records', 'Your records')) + '</span>' +
              '<h1>' + esc(tx('health_records', 'My Health Records')) + '</h1>' +
              '<p>' + esc(tx('hr_hero', 'Your own readings and papers, in one place. Your doctor can see these too.')) + '</p>' +
              '<div class="row" style="flex-wrap:wrap"><button class="btn btn-lg" data-act="add">' + S.icon('plus') + esc(tx('add_reading', 'Add a reading')) + '</button>' +
              '<button class="btn btn-lg btn-outline no-print" data-act="print">' + S.icon('records') + esc(tx('print_summary', 'Print summary')) + '</button></div></div>' +
            '<div class="ph-art float">' + S.Art.folder() + '</div>' +
          '</section>' +

          '<section class="p-sec">' + head(tx('latest_readings', 'Latest readings')) + S.Patient.Bits.healthGrid(p.patient_id) + '</section>' +

          '<div class="duo">' +
            '<section class="card"><div class="card-head"><h2 class="card-title">' + esc(tx('bp_trend', 'Blood pressure')) + '</h2>' + S.UI.chip(tx('self_reported', 'Self-reported'), '') + '</div>' +
              (bp.length ? S.Charts.line(bp.map(function (v) { return { date: S.toISO(new Date(v.recorded_at)), value: v.systolic }; }), { min: 80, max: 180, aria: 'Systolic blood pressure', lastLabel: tx('latest', 'Latest') + ' ' + bp[bp.length - 1].systolic })
                : S.UI.empty(S.icon('pulse'), tx('no_bp', 'No readings yet'), tx('no_bp_sub', 'Add your blood pressure to see it here.'))) + '</section>' +
            '<section class="card"><div class="card-head"><h2 class="card-title">' + esc(tx('steps_week', 'Steps this week')) + '</h2></div>' +
              (steps.length ? S.Charts.bars(steps.map(function (v) { return { label: S.weekdayName(S.toISO(new Date(v.recorded_at))).slice(0, 3), value: v.value, color: 'var(--green-400)' }; }), { max: Math.max(6000, Math.max.apply(null, steps.map(function (v) { return v.value; }))), aria: 'Steps per day' })
                : S.UI.empty(S.icon('steps'), tx('no_steps', 'No step counts yet'), '')) + '</section>' +
          '</div>' +

          '<section class="p-sec">' + head(tx('documents', 'Reports & papers'), '<button class="btn btn-sm" data-act="upload">' + S.icon('upload') + esc(tx('add_document', 'Add a photo')) + '</button>') +
            (docs.length
              ? '<div class="doc-strip">' + docs.map(function (d) {
                  return '<button class="doc-thumb has-photo" data-act="viewDoc" data-arg="' + esc(d.vital_id) + '">' +
                    '<img data-media="' + esc(d.media_id) + '" alt="' + esc(d.label || 'Document') + '">' +
                    '<span>' + esc(d.label || tx('document', 'Document')) + '<small>' + esc(S.prettyDate(S.toISO(new Date(d.recorded_at)))) + '</small></span></button>';
                }).join('') + '</div>'
              : S.UI.empty(S.icon('records'), tx('no_docs', 'No reports added yet'), tx('no_docs_sub', 'Take a photo of a prescription or test report to keep it here.'),
                  '<button class="btn" data-act="upload">' + S.icon('camera') + esc(tx('add_document', 'Add a photo')) + '</button>')) +
            '<input type="file" id="doc-file" accept="image/*" class="sr-only">' +
          '</section>' +

          '<section class="p-sec">' + head(tx('reading_history', 'All readings')) +
            (vitals.filter(function (v) { return v.kind !== 'document'; }).length
              ? '<div class="card"><div class="table-scroll"><table class="data"><thead><tr><th>' + esc(tx('when', 'When')) + '</th><th>' + esc(tx('what', 'What')) + '</th><th>' + esc(tx('reading', 'Reading')) + '</th><th></th></tr></thead><tbody>' +
                vitals.filter(function (v) { return v.kind !== 'document'; }).slice(0, 20).map(function (v) {
                  var lab = S.Wellness.vitalLabel(v);
                  return '<tr><td>' + esc(S.prettyStamp(v.recorded_at)) + '</td><td>' + esc({ bp: tx('bp', 'Blood Pressure'), spo2: 'SpO₂', weight: tx('weight', 'Weight'), steps: tx('steps_today', 'Steps') }[v.kind] || v.kind) + '</td>' +
                    '<td><b>' + esc(v.kind === 'bp' ? v.systolic + '/' + v.diastolic : v.value) + '</b> ' + esc(v.unit || '') + '</td>' +
                    '<td>' + (lab ? S.UI.chip(lab.text, lab.tone === 'green' ? 'chip-green' : 'chip-amber') : '') + '</td></tr>';
                }).join('') + '</tbody></table></div></div>'
              : '') +
          '</section>' +
          '<div class="disclaimer">' + S.icon('info') + '<span>' + esc(tx('hr_disc', 'These are readings you or your caregiver entered. SMIVAI does not interpret them or make a diagnosis — please discuss anything unusual with your doctor.')) + '</span></div>' +
        '</div>';

      S.mount(S.qs('#app'), html, {
        add: function () { Care.readingForm(p); },
        upload: function () { S.qs('#doc-file').click(); },
        print: function () { global.print(); },
        viewDoc: function (el, ev, id) {
          var d = S.DB.find('vitals', id);
          S.Media.get(d.media_id).then(function (src) {
            S.Modal.open({
              title: d.label || tx('document', 'Document'),
              subtitle: S.prettyStamp(d.recorded_at),
              body: src ? '<img src="' + src + '" alt="" style="width:100%;border-radius:1rem">' : '<p class="muted">' + esc(tx('doc_missing', 'This photo is no longer on this device.')) + '</p>',
              footer: '<button class="btn btn-danger" data-act="del">' + S.icon('trash') + esc(tx('delete', 'Delete')) + '</button><button class="btn" data-modal-close>' + esc(S.t('close')) + '</button>',
              handlers: { del: function () { if (d.media_id) S.Media.remove(d.media_id); S.DB.remove('vitals', d.vital_id); S.Modal.close(); Care.records(); } }
            });
          });
        }
      });

      var f = S.qs('#doc-file');
      if (f) f.addEventListener('change', function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        S.Media.fromFile(file, 1600).then(function (d) { return S.Media.put(d); }).then(function (stored) {
          S.DB.insert('vitals', { vital_id: S.uid('doc'), patient_id: p.patient_id, kind: 'document', media_id: stored.id,
            label: tx('document', 'Document'), recorded_at: S.stamp(), source: 'self' });
          S.toast(tx('doc_added', 'Photo added to your records.'), 'ok');
          Care.records();
        }).catch(function (err) { S.toast(err.message || tx('photo_failed', 'That photo could not be added.'), 'warn'); });
        e.target.value = '';
      });
      S.Media.hydrate(S.qs('#app'));
      S.scrollTop();
    },

    readingForm: function (p) {
      var kind = 'bp';
      function fields() {
        if (kind === 'bp') return '<div class="form-grid">' +
          '<div class="field"><label for="v-sys">' + esc(tx('systolic', 'Upper number (systolic)')) + '</label><input class="input" id="v-sys" type="number" inputmode="numeric" min="60" max="260" placeholder="120"></div>' +
          '<div class="field"><label for="v-dia">' + esc(tx('diastolic', 'Lower number (diastolic)')) + '</label><input class="input" id="v-dia" type="number" inputmode="numeric" min="30" max="160" placeholder="80"></div></div>';
        var labels = { spo2: ['SpO₂ (%)', '96'], weight: [tx('weight_kg', 'Weight (kg)'), '62'], steps: [tx('steps_today', 'Steps Today'), '4000'] };
        return '<div class="field"><label for="v-val">' + esc(labels[kind][0]) + '</label><input class="input" id="v-val" type="number" inputmode="numeric" placeholder="' + labels[kind][1] + '"></div>';
      }
      function body() {
        return '<div class="stack stack-2">' +
          '<div class="field"><span class="field-label">' + esc(tx('what_reading', 'What would you like to add?')) + '</span>' +
            '<div class="choice-grid">' +
              ['bp', 'spo2', 'weight', 'steps'].map(function (k) {
                var n = { bp: [tx('bp', 'Blood Pressure'), 'pulse'], spo2: ['SpO₂', 'droplet'], weight: [tx('weight', 'Weight'), 'weight'], steps: [tx('steps_today', 'Steps'), 'steps'] }[k];
                return '<button class="choice" data-act="kind" data-arg="' + k + '" aria-pressed="' + (k === kind) + '">' + S.icon(n[1]) + esc(n[0]) + '</button>';
              }).join('') + '</div></div>' +
          '<div id="v-fields">' + fields() + '</div>' +
          '<div class="err" id="v-err" role="alert" hidden></div>' +
          '<p class="t-small muted">' + esc(tx('reading_note', 'SMIVAI records what you enter. It does not judge whether a reading is healthy — that is for your doctor.')) + '</p></div>';
      }
      S.Modal.open({
        title: tx('add_reading', 'Add a reading'),
        body: body(),
        footer: '<button class="btn btn-outline" data-modal-close>' + esc(S.t('cancel')) + '</button><button class="btn" data-act="save">' + S.icon('check') + esc(tx('save', 'Save')) + '</button>',
        handlers: {
          kind: function (el, ev, k) {
            kind = k;
            S.qsa('.choice', el.closest('.modal')).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-arg') === k ? 'true' : 'false'); });
            S.qs('#v-fields').innerHTML = fields();
          },
          save: function () {
            var err = S.qs('#v-err');
            var row = { vital_id: S.uid('vit'), patient_id: p.patient_id, kind: kind, recorded_at: S.stamp(), source: 'self' };
            if (kind === 'bp') {
              var sys = parseInt(S.qs('#v-sys').value, 10), dia = parseInt(S.qs('#v-dia').value, 10);
              if (!sys || !dia) { err.textContent = tx('need_both', 'Please enter both numbers.'); err.hidden = false; return; }
              if (sys < 60 || sys > 260 || dia < 30 || dia > 160 || dia >= sys) { err.textContent = tx('check_bp', 'Please check those numbers — the upper number should be the larger one.'); err.hidden = false; return; }
              row.systolic = sys; row.diastolic = dia; row.unit = 'mmHg';
            } else {
              var val = parseFloat(S.qs('#v-val').value);
              var range = { spo2: [50, 100], weight: [20, 250], steps: [0, 60000] }[kind];
              if (isNaN(val) || val < range[0] || val > range[1]) { err.textContent = tx('check_value', 'Please check that number.'); err.hidden = false; return; }
              row.value = val; row.unit = { spo2: '%', weight: 'kg', steps: 'steps' }[kind];
            }
            S.DB.insert('vitals', row);
            S.Modal.close();
            S.toast(tx('reading_saved', 'Reading saved.'), 'ok');
            Care.records();
          }
        }
      });
    },

    /* ============================================================
       EMERGENCY SOS
       ============================================================ */
    sos: function () {
      var p = S.State.patient();
      var contacts = S.DB.forPatient('contacts', p.patient_id);
      var team = S.Links.forPatient(p.patient_id, 'caregiver').map(function (l) { return S.DB.find('caregivers', l.actor_id); }).filter(Boolean);
      var openAlert = S.DB.where('alerts', function (a) { return a.patient_id === p.patient_id && a.status === 'open'; })[0];

      function draw() {
        var html =
          '<div class="sos-page">' +
            '<button class="btn btn-ghost sos-back" data-act="back">' + S.icon('arrowLeft') + esc(tx('im_ok', 'I am okay — go back')) + '</button>' +
            '<div class="sos-inner">' +
              '<div class="sos-art">' + S.Art.phone() + '</div>' +
              (openAlert
                ? '<h1>' + esc(tx('team_alerted', 'Your care team has been alerted')) + '</h1>' +
                  '<p class="sos-lead">' + esc(tx('team_alerted_sub', 'They can see your alert in SMIVAI. If this is a medical emergency, please also call 112.')) + '</p>'
                : '<h1>' + esc(tx('need_help_now', 'Do you need help right now?')) + '</h1>' +
                  '<p class="sos-lead">' + esc(tx('sos_lead', 'Call the emergency number, or tell your care team that you need help.')) + '</p>') +

              '<div class="sos-actions">' +
                '<a class="btn btn-sos btn-xl" href="tel:112">' + S.icon('phone') + esc(tx('call_112', 'Call 112 now')) + '</a>' +
                (openAlert
                  ? '<button class="btn btn-outline btn-xl" data-act="resolve">' + S.icon('check') + esc(tx('im_safe', 'I am safe now')) + '</button>'
                  : '<button class="btn btn-dark btn-xl" data-act="alert">' + S.icon('users') + esc(tx('alert_team', 'Alert my care team')) + '</button>') +
              '</div>' +

              (contacts.length ? '<section class="sos-contacts"><div class="t-mini">' + esc(tx('people_near', 'People who can come quickly')) + '</div>' +
                contacts.map(function (c) {
                  return '<a class="sos-contact" href="tel:' + esc(String(c.phone).replace(/\s/g, '')) + '">' +
                    '<span class="avatar avatar-lg">' + S.Art.avatar({ name: c.name, patient_id: c.contact_id, gender: /wife|daughter|sister|mother/i.test(c.relation) ? 'female' : 'male' }) + '</span>' +
                    '<span class="grow"><b>' + esc(c.name) + '</b><small>' + esc(c.relation) + ' · ' + esc(c.phone) + '</small></span>' + S.icon('phone') + '</a>';
                }).join('') + '</section>' : '') +

              '<div class="demo-note sos-note">' + S.icon('info') + '<span>' + esc(S.Services.Emergency.label) +
                (team.length ? ' ' + esc(tx('team_count', '{n} caregivers will be alerted in the app.', { n: team.length })) : ' ' + esc(tx('no_team_alert', 'No caregiver is linked yet, so only the phone call will reach someone.'))) + '</span></div>' +
            '</div>' +
          '</div>';

        S.mount(S.qs('#app'), html, {
          back: function () { S.Router.go('#/patient/home'); },
          alert: function (el) {
            el.disabled = true;
            el.innerHTML = '<span class="spinner" style="border-top-color:#fff;border-color:rgba(255,255,255,.35)"></span>' + esc(tx('alerting', 'Alerting…'));
            S.Services.Emergency.raise(p).then(function (res) {
              openAlert = res.alert;
              S.toast(res.notified ? tx('alerted_n', 'Alert sent to {n} caregivers.', { n: res.notified }) : tx('alert_saved', 'Alert saved — no caregiver is linked yet.'), 'ok', 6000);
              draw();
            });
          },
          resolve: function () {
            S.Services.Emergency.resolve(openAlert.alert_id, 'patient');
            S.Links.forPatient(p.patient_id, 'caregiver').forEach(function (l) {
              S.Services.Notify.push({ recipient_role: 'caregiver', recipient_id: l.actor_id, patient_id: p.patient_id, kind: 'sos',
                title: String(p.name).split(' ')[0] + ' is safe', body: tx('marked_safe', 'They marked themselves safe.'), link: '#/caregiver/alerts' });
            });
            openAlert = null;
            S.toast(tx('glad_safe', 'Glad you are safe.'), 'ok');
            draw();
          }
        });
        S.scrollTop();
      }
      draw();
    }
  };

  S.Care = Care;
})(window);
