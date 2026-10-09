/* ============================================================
   SMIVAI — screens/patient.js
   Patient experience: Home · Brain Games · Reminders · My Progress ·
   Daily Fact · Learn a Skill · Profile hub (mobile) · language chooser.

   Every visible string resolves through S.t()/S.tx() against the
   patient's own language. Talk, Memories, Care services and Settings
   live in their own modules.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  function t(key, params) { return S.t(key, params); }
  function tx(k, en, p) { return S.tx(k, en, p); }
  function esc(s) { return S.esc(s); }

  function greetKey() {
    var part = S.partOfDay();
    return part === 'Morning' ? 'good_morning' : part === 'Afternoon' ? 'good_afternoon' : 'good_evening';
  }
  function firstName(p) { return String(p.name || '').split(' ')[0]; }

  function head(title, actionHtml, sub) {
    return '<div class="sec-head"><div><h2>' + esc(title) + '</h2>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>' +
      (actionHtml || '') + '</div>';
  }
  function viewAll(act, text) {
    return '<button class="link-btn" data-act="' + act + '">' + esc(text || tx('view_all', 'View all')) + S.icon('arrowRight') + '</button>';
  }
  function disclaimer() {
    return '<div class="disclaimer">' + S.icon('info') + '<span>' + esc(S.t('disclaimer')) + '</span></div>';
  }
  function speak(text, p, btn) {
    if (btn) btn.classList.add('is-speaking');
    return S.Voice.speak(text, p.language).then(function (r) {
      if (btn) btn.classList.remove('is-speaking');
      if (!r.spoken && r.note) S.toast(r.note, 'warn', 5000);
    });
  }

  /* ============================================================
     Shared pieces
     ============================================================ */
  var Bits = {
    feelingRow: function (p) {
      var today = S.DB.where('moods', function (m) { return m.patient_id === p.patient_id && m.date === S.todayISO(); })[0];
      return '<div class="feel-row" role="group" aria-label="' + esc(t('how_feeling')) + '">' +
        S.Wellness.FEELINGS.map(function (f) {
          var on = today && today.mood === f.id;
          return '<button class="feel-btn tone-' + f.tone + '" data-act="feel" data-arg="' + f.id + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
            '<span class="ff emoji" aria-hidden="true">' + f.face + '</span><span>' + esc(tx('feel_' + f.id, f.name)) + '</span></button>';
        }).join('') + '</div>' +
        (today ? '<div class="feel-reply" role="status">' + Bits.feelingReply(today.mood) + '</div>' : '');
    },

    feelingReply: function (mood) {
      var warm = { happy: 'That’s lovely to hear! Keep smiling today.', good: 'Wonderful. Have a gentle, good day.', okay: 'Thank you for telling me. A short walk or a chat might brighten things.',
        worried: 'Thank you for telling me. You are not alone — would you like to talk?', sad: 'I’m sorry you feel sad. Talking to someone can help.', tired: 'Thank you for telling me. A little rest and some water can help.' };
      var needsCare = mood === 'worried' || mood === 'sad' || mood === 'low';
      return '<span>' + esc(tx('feel_reply_' + mood, warm[mood] || t('thanks_for_telling'))) + '</span>' +
        (needsCare ? '<span class="row" style="gap:.5rem;flex-wrap:wrap;margin-top:.625rem">' +
          '<button class="btn btn-sm" data-act="talk">' + S.icon('talk') + esc(tx('talk_smivai', 'Talk with HUN')) + '</button>' +
          '<button class="btn btn-sm btn-peach" data-act="callFamily">' + S.icon('phone') + esc(t('call_family')) + '</button></span>' : '');
    },

    saveFeeling: function (p, id) {
      var today = S.todayISO();
      var existing = S.DB.where('moods', function (m) { return m.patient_id === p.patient_id && m.date === today; })[0];
      if (existing) S.DB.update('moods', existing.mood_id, { mood: id, updated_at: S.stamp() });
      else S.DB.insert('moods', S.M.newMood({ patient_id: p.patient_id, date: today, mood: id }));
      if (id === 'sad' || id === 'worried') {
        S.Links.forPatient(p.patient_id, 'caregiver').forEach(function (l) {
          S.Services.Notify.push({ recipient_role: 'caregiver', recipient_id: l.actor_id, patient_id: p.patient_id, kind: 'message',
            title: firstName(p) + ' is feeling ' + id + ' today', body: 'A quick call might be welcome.', link: '#/caregiver/dashboard' });
        });
      }
      S.toast(t('thanks_for_telling'), 'ok');
    },

    feelingHandlers: function (p, rerender) {
      return {
        feel: function (el, ev, id) { Bits.saveFeeling(p, id); rerender(); },
        talk: function () { S.Router.go('#/patient/talk'); },
        callFamily: function () { S.Router.go('#/patient/caregiver'); }
      };
    },

    apptRow: function (a) {
      var doc = S.Wellness.doctor(a.doctor_id) || { name: a.doctor_name, gender: 'male' };
      var stTone = a.status === 'confirmed' ? 'chip-green' : a.status === 'scheduled' ? 'chip-blue' : a.status === 'cancelled' ? 'chip-coral' : '';
      var mode = S.Wellness.VISIT_MODES.filter(function (m) { return m.id === a.mode; })[0];
      return '<div class="appt-row">' +
        '<span class="avatar avatar-lg">' + S.Art.avatar({ name: a.doctor_name, gender: doc.gender || 'male', patient_id: a.doctor_id }) + '</span>' +
        '<div class="grow"><div class="ap-name">' + esc(a.doctor_name) + '</div><div class="ap-spec">' + esc(a.speciality) + '</div></div>' +
        '<div class="ap-when"><span>' + S.icon('calendar') + esc(S.prettyDate(a.date)) + '</span><span>' + S.icon('clock') + esc(S.prettyTime(a.time)) + '</span>' +
          (mode ? '<span>' + S.icon(mode.icon) + esc(mode.name) + '</span>' : '') + '</div>' +
        '<span class="chip ' + stTone + '">' + esc(S.M.apptStatusText(a)) + '</span>' +
        '</div>';
    },

    upcomingAppointments: function (pid) {
      var today = S.todayISO();
      return S.DB.forPatient('appointments', pid).filter(function (a) {
        return a.date >= today && S.M.apptOpen(a);
      }).sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
    },

    metric: function (ico, tone, value, unit, label, v) {
      var lab = S.Wellness.vitalLabel(v);
      return '<div class="metric tone-' + tone + '">' +
        '<span class="m-ico round">' + S.icon(ico) + '</span>' +
        '<div class="m-val">' + (value === null ? '—' : esc(value)) + (unit && value !== null ? '<small>' + esc(unit) + '</small>' : '') + '</div>' +
        '<div class="m-lab">' + esc(label) + '</div>' +
        (lab ? '<span class="chip chip-' + (lab.tone === 'green' ? 'green' : lab.tone === 'amber' ? 'amber' : lab.tone) + '">' + esc(tx('vl_' + lab.text.replace(/\W+/g, '_').toLowerCase(), lab.text)) + '</span>' : '') +
        '</div>';
    },

    /** Newest first. */
    notesOf: function (pid) {
      return S.DB.forPatient('patient_notes', pid).sort(function (a, b) {
        return (a.updated_at || a.created_at || '') < (b.updated_at || b.created_at || '') ? 1 : -1;
      });
    },

    /* One box in Quick Actions that does both jobs: write a note down
       straight away, or open the notes already written. */
    notesBox: function (p) {
      var notes = Bits.notesOf(p.patient_id), last = notes[0];
      var peek = last ? String(last.text).replace(/\s+/g, ' ').trim() : '';
      if (peek.length > 60) peek = peek.slice(0, 58).replace(/\s+\S*$/, '') + '…';
      return '<div class="qa-notes" role="group" aria-labelledby="qn-t">' +
        '<span class="qn-art">' + S.Art.notepad() + '</span>' +
        '<div class="qn-copy"><span class="qa-title" id="qn-t">' + esc(tx('my_notes', 'My Notes')) + '</span>' +
          '<span class="qa-sub">' + esc(last ? tx('last_note', 'Last note: “{text}”', { text: peek })
            : tx('notes_sub', 'Write down anything you want to remember.')) + '</span></div>' +
        '<div class="qn-actions">' +
          '<button class="btn btn-lg" data-act="addNote">' + S.icon('plus') + esc(tx('add_note', 'Add a note')) + '</button>' +
          '<button class="btn btn-lg btn-outline" data-act="notes">' + S.icon('note') + esc(tx('view_notes', 'View notes')) +
            (notes.length ? ' <span class="qn-count">' + notes.length + '</span>' : '') + '</button>' +
        '</div>' +
      '</div>';
    },

    healthGrid: function (pid) {
      var v = S.Wellness.latestVitals(pid);
      return '<div class="metric-grid">' +
        Bits.metric('pulse', 'peach', v.bp ? v.bp.systolic + '/' + v.bp.diastolic : null, '', tx('bp', 'Blood Pressure'), v.bp) +
        Bits.metric('droplet', 'blue', v.spo2 ? v.spo2.value : null, '%', 'SpO₂', v.spo2) +
        Bits.metric('weight', 'cream', v.weight ? v.weight.value : null, 'kg', tx('weight', 'Weight'), v.weight) +
        Bits.metric('steps', 'green', v.steps ? v.steps.value.toLocaleString('en-IN') : null, '', tx('steps_today', 'Steps Today'), v.steps) +
      '</div>';
    }
  };

  var Patient = {
    Bits: Bits,

    /** Optional photographs for the dashboard hero: one for the patient's
        own gender, then a general one, then the drawn elder. */
    heroPhotos: function (p) {
      var g = String((p && p.gender) || '').toLowerCase();
      var mine = g === 'female' || g === 'male' ? ['assets/patient-hero-' + g + '.jpg'] : [];
      return mine.concat('assets/patient-hero.jpg');
    },

    /* ============================================================
       HOME
       ============================================================ */
    home: function () {
      var p = S.State.patient();
      var plan = S.Plan.progress(p);
      var nextRem = S.Reminders.next(p.patient_id);
      var appts = Bits.upcomingAppointments(p.patient_id).slice(0, 2);
      var fact = S.Wellness.factOfDay();
      var skill = S.Wellness.skillOfDay();
      var mems = S.DB.forPatient('memory_bank', p.patient_id);
      var photoMem = mems.filter(function (m) { return S.Media.hasPhoto(m); }).sort(function (a, b) { return (a.memory_date || '') < (b.memory_date || '') ? 1 : -1; })[0];
      var streak = S.Wellness.streak(p.patient_id);
      var today = S.todayISO();
      var tipIdx = 0;
      var lang = p.language || 'en', cov = S.I18N.coverage(lang);
      var partial = lang !== 'en' && cov.percent < 60;

      var hero =
        '<section class="hero anim-in" aria-labelledby="hero-t">' +
          '<div class="hero-copy">' +
            '<h1 id="hero-t">' + esc(t(greetKey())) + ',<br>' + esc(firstName(p)) + ' Ji!</h1>' +
            '<p class="hero-sub">' + esc(tx('hero_sub', 'Healthier Today, Happier Tomorrow.')) + '</p>' +
            '<p class="hero-note">' + esc(tx('hero_note', 'HUN is here to talk, help, and keep you connected.')) + '</p>' +
            '<div class="hero-cta">' +
              '<button class="btn btn-xl" data-act="talk">' + S.icon('mic') + esc(tx('talk_smivai', 'Talk with HUN')) + S.icon('arrowRight') + '</button>' +
            '</div>' +
            (partial ? '<p class="t-small" style="margin-top:.75rem;color:var(--warning-ink)">' + S.icon('globe') + ' ' + esc(S.I18N.lang(lang).native) + ' · ' + cov.percent + '% — some words are still in English</p>' : '') +
          '</div>' +
          '<div class="hero-art">' + S.Art.hero(p) + '</div>' +
          '<span class="hero-quote">' + S.icon('sparkle') + esc(tx('hero_quote', 'You are stronger than you think.')) + '</span>' +
          '<button class="hero-plan glass" data-act="games" aria-label="' + esc(t('activities_done', { done: plan.done, total: plan.total })) + '">' +
            S.UI.ring(plan.done, plan.total || 1, { size: 58, stroke: 7, center: plan.done + '/' + plan.total, fontSize: 17, color: 'var(--lav-400)' }) +
            '<span><b>' + esc(t('todays_session')) + '</b><small>' + esc(plan.next ? S.M.gameName(plan.next.game_type) + ' · ' + t('about_n_min', { n: plan.next.minutes }) : t('all_done_today')) + '</small></span>' +
          '</button>' +
        '</section>';

      var quick =
        '<section class="p-sec anim-in-2" aria-labelledby="qa-t">' + head(tx('quick_actions', 'Quick Actions')).replace('<h2>', '<h2 id="qa-t">') +
          '<div class="qa-grid">' +
            qa('doctor', 'blue', S.Art.stethoscope(), tx('book_doctor', 'Book a Doctor'), tx('bd_sub', 'Consult from home')) +
            qa('medicines', 'green', S.Art.medicine(), tx('order_medicines', 'Order Medicines'), tx('om_sub', 'Get medicines at your doorstep')) +
            qa('caregiver', 'peach', S.Art.caregiver(), tx('request_caregiver', 'Request a Caregiver'), tx('rc_sub', 'Get help at home')) +
            qa('records', 'lav', S.Art.folder(), tx('health_records', 'My Health Records'), tx('hr_sub', 'View anytime, anywhere')) +
            Bits.notesBox(p) +
          '</div>' +
        '</section>';

      var sos =
        '<section class="sos-card only-mobile" aria-label="Emergency">' +
          '<span class="sos-ico">' + S.icon('phone') + '</span>' +
          '<div class="grow"><b>' + esc(tx('in_emergency', 'In an Emergency?')) + '</b><span>' + esc(tx('get_help', 'Get immediate assistance')) + '</span></div>' +
          '<button class="btn btn-sos" data-act="sos">' + esc(tx('call_now', 'Call Now')) + '</button>' +
        '</section>';

      var nextStep = plan.next;
      var activities =
        '<section class="p-sec" aria-labelledby="ta-t">' + head(tx('todays_activities', 'Today’s Activities')).replace('<h2>', '<h2 id="ta-t">') +
          '<div class="bento">' +
            '<div class="tile t-brain">' +
              '<div class="tile-top"><span class="chip chip-lav">' + S.icon('brain') + esc(tx('nav_games', 'Brain Games')) + '</span>' +
                '<span class="t-count">' + esc(t('activities_done', { done: plan.done, total: plan.total })) + '</span></div>' +
              '<h3>' + esc(nextStep ? tx('brain_workout', 'Your brain workout for today') : t('all_done_today')) + '</h3>' +
              '<div class="plan-steps">' + plan.items.map(function (it) {
                return '<div class="ps' + (it.done ? ' done' : '') + '"><span class="ps-art">' + (S.Art[it.game.art] ? S.Art[it.game.art]() : '') + '</span>' +
                  '<span class="grow"><b>' + esc(S.M.gameName(it.game_type)) + '</b><small>' + esc(t('about_n_min', { n: it.minutes }) + ' · ' + S.M.difficultyName(it.difficulty)) + '</small></span>' +
                  '<span class="ps-state">' + (it.done ? S.icon('checkCircle') : '') + '</span></div>';
              }).join('') + '</div>' +
              '<button class="btn btn-lg btn-block" data-act="' + (nextStep ? 'startNext' : 'games') + '">' + S.icon('play') +
                esc(nextStep ? tx('play_next', 'Play {name}', { name: S.M.gameName(nextStep.game_type) }) : t('can_choose_another')) + '</button>' +
            '</div>' +
            (photoMem
              ? '<button class="tile t-memory has-photo" data-act="memory" data-arg="' + esc(photoMem.memory_id) + '">' + S.Media.memoryImg(photoMem) +
                  '<span class="tm-shade"></span><span class="tm-copy"><span class="chip chip-peach">' + S.icon('heart') + esc(tx('nav_memories2', 'My Memories')) + '</span>' +
                  '<b>' + esc(photoMem.title) + '</b><small>' + esc(photoMem.memory_date ? S.prettyDate(photoMem.memory_date) : '') + '</small></span></button>'
              : '<button class="tile t-memory t-memory-empty" data-act="addMemory"><span class="tile-art">' + S.Art.photos() + '</span><b>' + esc(tx('add_memory', 'Add a Memory')) + '</b><small>' + esc(tx('add_memory_sub', 'Save a photo and its story')) + '</small></button>') +
            '<button class="tile t-fact" data-act="fact"><span class="tile-art sm">' + S.Art.bulb() + '</span>' +
              '<span class="t-kicker">' + esc(tx('daily_fact', 'Daily Fact')) + '</span><b>' + esc(fact.title) + '</b>' +
              (S.Wellness.doneToday(p.patient_id, 'fact') ? '<span class="chip chip-green">' + S.icon('check') + esc(tx('read', 'Read')) + '</span>' : '<span class="t-go">' + esc(tx('read_now', 'Read now')) + S.icon('arrowRight') + '</span>') + '</button>' +
            '<button class="tile t-skill" data-act="skill"><span class="tile-art sm">' + S.Art.book() + '</span>' +
              '<span class="t-kicker">' + esc(tx('learn_skill', 'Learn a New Skill')) + '</span><b>' + esc(skill.title) + '</b>' +
              '<span class="t-go">' + esc(tx('n_minutes', '{n} minutes', { n: skill.minutes })) + S.icon('arrowRight') + '</span></button>' +
            '<button class="tile t-rem" data-act="reminders"><span class="tile-ico">' + S.icon(nextRem ? S.M.reminderCategory(nextRem.reminder.category).ico : 'bell') + '</span>' +
              '<span class="grow"><span class="t-kicker">' + esc(t('next_reminder')) + '</span><b>' + esc(nextRem ? nextRem.reminder.title : t('nothing_else_today')) + '</b>' +
              (nextRem ? '<small>' + esc(S.prettyTime(nextRem.reminder.time) + (nextRem.date !== today ? ' · ' + S.relativeDay(nextRem.date) : '')) + '</small>' : '') + '</span>' + S.icon('chevronRight') + '</button>' +
            '<button class="tile t-prog" data-act="progress"><span class="tile-ico">' + S.icon('flame') + '</span>' +
              '<span class="grow"><span class="t-kicker">' + esc(tx('nav_progress', 'My Progress')) + '</span><b>' + esc(streak ? tx('streak_n', '{n}-day streak', { n: streak }) : tx('start_streak', 'Start your streak today')) + '</b>' +
              '<small>' + esc(tx('doing_well', 'You’re doing well — keep going!')) + '</small></span>' + S.icon('chevronRight') + '</button>' +
          '</div>' +
        '</section>';

      var feeling =
        '<section class="p-sec feel-sec" aria-labelledby="fc-t">' + head(t('how_feeling')).replace('<h2>', '<h2 id="fc-t">') + Bits.feelingRow(p) + '</section>';

      var duo =
        '<div class="duo">' +
          '<section class="card" aria-labelledby="ua-t">' +
            '<div class="card-head"><h2 class="card-title" id="ua-t">' + esc(tx('upcoming_appts', 'Upcoming Appointments')) + '</h2>' + viewAll('doctor') + '</div>' +
            (appts.length ? '<div class="stack stack-1">' + appts.map(Bits.apptRow).join('') + '</div>'
              : S.UI.empty(S.icon('calendar'), tx('no_appts', 'No appointments booked'), '', '<button class="btn" data-act="doctor">' + S.icon('plus') + esc(tx('book_doctor', 'Book a Doctor')) + '</button>')) +
          '</section>' +
          '<section class="card" aria-labelledby="hs-t">' +
            '<div class="card-head"><h2 class="card-title" id="hs-t">' + esc(tx('health_summary', 'My Health Summary')) + '</h2>' + viewAll('records') + '</div>' +
            Bits.healthGrid(p.patient_id) +
          '</section>' +
        '</div>';

      var wellness =
        '<button class="wellness" data-act="wellness">' +
          '<span class="w-art">' + S.Art.plant() + '</span>' +
          '<span class="grow"><b>' + esc(tx('small_steps', 'Small Steps, Big Difference')) + '</b>' +
          '<span>' + esc(tx('small_steps_sub', 'Take care of your health today for a brighter tomorrow.')) + '</span></span>' +
          '<span class="arrow-btn">' + S.icon('arrowRight') + '</span></button>';

      var tips = S.Wellness.TIPS;
      var rail =
        '<aside class="home-rail" aria-label="Today at a glance">' +
          '<div class="card rail-date">' +
            '<span class="rd-art">' + S.Art.calendar() + '</span>' +
            '<div class="grow"><div class="rd-day">' + esc(S.weekdayName(today)) + '</div><div class="rd-date">' + esc(S.prettyDate(today)) + '</div></div>' +
            '<div class="rd-wx" id="wx" hidden></div>' +
          '</div>' +
          '<div class="card rail-tip" id="tipcard">' + tipHtml(0) + '</div>' +
          (nextRem
            ? '<div class="card card-peach rail-rem"><div class="t-mini">' + esc(t('next_reminder')) + '</div>' +
                '<div class="row" style="margin-top:.5rem"><span class="list-icon peach">' + S.icon(S.M.reminderCategory(nextRem.reminder.category).ico) + '</span>' +
                '<div class="grow"><b style="font-size:1.125rem">' + esc(nextRem.reminder.title) + '</b><div class="muted t-small">' + esc(S.prettyTime(nextRem.reminder.time) + ' · ' + S.relativeDay(nextRem.date)) + '</div></div></div>' +
                (nextRem.date === today ? '<button class="btn btn-sm btn-block" style="margin-top:.875rem" data-act="remDone" data-arg="' + esc(nextRem.reminder.reminder_id) + '">' + S.icon('check') + esc(t('done_btn')) + '</button>' : '') +
              '</div>'
            : '') +
          '<div class="sos-panel">' +
            '<div class="row" style="align-items:flex-start"><span class="sos-ico">' + S.icon('phone') + '</span>' +
            '<div><b>' + esc(tx('need_help', 'Need Immediate Help?')) + '</b><p>' + esc(tx('need_help_sub', 'In an emergency, get assistance now.')) + '</p></div></div>' +
            '<button class="btn btn-sos btn-lg btn-block" data-act="sos">' + esc(tx('call_now', 'Call Now')) + '</button>' +
          '</div>' +
        '</aside>';

      var quote =
        '<section class="quote-strip">' +
          '<span class="q-leaf">' + S.Art.plant() + '</span>' +
          '<p>\u201C' + esc(tx('home_quote', 'A healthier, happier you — always.')) + '\u201D</p>' +
          '<span class="q-by">— HUN</span>' +
        '</section>';

      var html =
        '<div class="home">' +
          '<div class="home-main">' + hero + activities + quick + sos + feeling + duo + wellness + quote + disclaimer() + '</div>' +
          rail +
        '</div>';

      function tipHtml(i) {
        var tip = tips[i];
        var artFn = S.Art[tip.art] || S.Art.water;
        return '<div class="row" style="align-items:flex-start;gap:.75rem"><span class="list-icon amber">' + S.icon('bulb') + '</span>' +
          '<h2 class="card-title" style="margin-top:.4rem">' + esc(tx('health_tip', 'Today’s Health Tip')) + '</h2></div>' +
          '<div class="tip-body"><div><b>' + esc(tx('tip_t_' + i, tip.title)) + '</b><p>' + esc(tx('tip_b_' + i, tip.text)) + '</p></div>' +
          '<span class="tip-art">' + (tip.art === 'weather' ? S.Art.weather('sun') : artFn()) + '</span></div>' +
          '<div class="tip-nav"><button class="arrow-btn" data-tip="-1" aria-label="Previous tip">' + S.icon('chevronLeft') + '</button>' +
            '<span class="dots">' + tips.map(function (x, k) { return '<i class="' + (k === i ? 'on' : '') + '"></i>'; }).join('') + '</span>' +
            '<button class="arrow-btn" data-tip="1" aria-label="Next tip">' + S.icon('chevronRight') + '</button></div>';
      }

      var rerender = function () { Patient.home(); };
      S.mount(S.qs('#app'), html, Object.assign({
        talk: function () { S.Router.go('#/patient/talk'); },
        games: function () { S.Router.go('#/patient/games'); },
        startNext: function () { S.Router.go('#/patient/game/' + plan.next.game_type); },
        doctor: function () { S.Router.go('#/patient/doctor'); },
        medicines: function () { S.Router.go('#/patient/medicines'); },
        caregiver: function () { S.Router.go('#/patient/caregiver'); },
        records: function () { S.Router.go('#/patient/records'); },
        notes: function () { S.Router.go('#/patient/notes'); },
        addNote: function () { Patient.noteEditor(p, null, rerender); },
        reminders: function () { S.Router.go('#/patient/reminders'); },
        progress: function () { S.Router.go('#/patient/progress'); },
        fact: function () { S.Router.go('#/patient/fact'); },
        skill: function () { S.Router.go('#/patient/skill'); },
        wellness: function () { S.Router.go('#/patient/skill/chair_exercise'); },
        memory: function (el, ev, id) { S.Router.go('#/patient/memory/' + id); },
        addMemory: function () { S.Router.go('#/patient/memories/new'); },
        sos: function () { S.Router.go('#/patient/sos'); },
        remDone: function (el, ev, id) {
          S.Reminders.mark(id, today, 'completed', 'patient');
          S.toast(t('marked_done'), 'ok');
          rerender();
        }
      }, Bits.feelingHandlers(p, rerender)));

      /* tip carousel */
      var tipCard = S.qs('#tipcard');
      tipCard.addEventListener('click', function (e) {
        var b = e.target.closest('[data-tip]');
        if (!b) return;
        tipIdx = (tipIdx + parseInt(b.getAttribute('data-tip'), 10) + tips.length) % tips.length;
        tipCard.innerHTML = tipHtml(tipIdx);
      });

      /* weather — quietly absent when offline or unknown */
      if (S.Prefs.get('show_weather')) {
        S.Services.Weather.get(p.district).then(function (w) {
          var el = S.qs('#wx');
          if (!el || !w.ok) return;
          el.hidden = false;
          el.innerHTML = '<span class="wx-art">' + S.Art.weather(w.kind) + '</span><span><b>' + w.temp + '°C</b><small>' + esc(w.city) + '</small></span>';
          el.title = w.text + ' · ' + S.Services.Weather.label;
        });
      }
      /* A photograph in the hero, if one has been placed in assets/.
         Without it the drawn elder stays — and the drawing is the one that
         reflects this patient's own look, so the photo is a house picture,
         not a portrait of them. See docs/ASSETS.md. */
      S.Photo.into(S.qs('.hero-art'), {
        file: Patient.heroPhotos(p),
        ratio: '4x3',
        alt: tx('hero_photo_alt', 'An older adult at home, using SMIVAI on a tablet')
      });

      S.Media.hydrate(S.qs('#app'));
      S.scrollTop();

      function qa(act, tone, art, title, sub) {
        return '<button class="qa tone-' + tone + '" data-act="' + act + '">' +
          '<span class="qa-art">' + art + '</span>' +
          '<span class="qa-title">' + esc(title) + '</span><span class="qa-sub">' + esc(sub) + '</span>' +
          '<span class="arrow-btn qa-go" aria-hidden="true">' + S.icon('arrowRight') + '</span></button>';
      }
    },

    /* ============================================================
       BRAIN GAMES
       ============================================================ */
    games: function () {
      var p = S.State.patient();
      var plan = S.Plan.progress(p);
      var premium = S.Plans.planOf('patient', p.patient_id) === 'premium';
      var free = S.M.GAMES.filter(function (g) { return g.tier === 'free'; });
      var prem = S.M.GAMES.filter(function (g) { return g.tier === 'premium'; });

      function card(g) {
        var can = S.Plans.canPlay(p, g.id);
        var level = S.Adaptive.difficultyFor(p, g.id);
        var plays = S.DB.where('game_sessions', function (s) { return s.patient_id === p.patient_id && s.game_type === g.id; });
        var best = plays.length ? Math.max.apply(null, plays.map(function (s) { return s.score; })) : null;
        return '<article class="game-card tone-' + g.color + (can ? '' : ' is-locked') + '">' +
          '<div class="gc-art">' + (S.Art[g.art] ? S.Art[g.art]() : '') +
            (can ? '' : '<span class="lock-tag gc-lock">' + S.icon('lock') + 'Premium</span>') + '</div>' +
          '<div class="gc-body">' +
            '<h3>' + esc(S.M.gameName(g.id)) + '</h3>' +
            '<p>' + esc(tx('gshort_' + g.id, g.short)) + '</p>' +
            '<div class="row" style="gap:.5rem;flex-wrap:wrap">' +
              S.UI.chip(tx('dom_' + g.id, g.domain), 'chip-' + (g.color === 'cream' ? 'peach' : g.color === 'green' ? 'green' : g.color)) +
              (can ? S.UI.chip(S.M.difficultyName(level), '') : '') +
              (best !== null ? S.UI.chip(tx('best', 'Best') + ' ' + best, 'chip-green') : '') +
            '</div>' +
          '</div>' +
          '<div class="gc-foot">' +
            (can
              ? '<button class="btn btn-lg" data-act="start" data-arg="' + g.id + '">' + S.icon('play') + esc(t('start')) + '</button>' +
                '<button class="btn btn-outline" data-act="level" data-arg="' + g.id + '" aria-label="' + esc(t('choose_level')) + ' — ' + esc(S.M.gameName(g.id)) + '">' + S.icon('settings') + esc(tx('level_short', 'Level')) + '</button>'
              : '<button class="btn btn-lg btn-premium" data-act="locked" data-arg="' + g.id + '">' + S.icon('sparkle') + esc(tx('unlock', 'Unlock with Premium')) + '</button>') +
          '</div>' +
        '</article>';
      }

      var html =
        '<div class="page anim-in">' +
          '<section class="page-hero tone-lav">' +
            '<div class="grow"><span class="chip chip-lav">' + S.icon('brain') + esc(premium ? tx('games_all', 'All 8 games') : tx('games_free', '4 of 8 games on your Free plan')) + '</span>' +
              '<h1>' + esc(tx('nav_games', 'Brain Games')) + '</h1>' +
              '<p>' + esc(tx('games_sub', 'Gentle games that keep your mind active. There is never any rush.')) + '</p>' +
              (plan.next
                ? '<button class="btn btn-lg" data-act="startNext">' + S.icon('play') + esc(tx('play_next', 'Play {name}', { name: S.M.gameName(plan.next.game_type) })) + '</button>'
                : '<span class="chip chip-green chip-lg">' + S.icon('checkCircle') + esc(t('all_done_today')) + '</span>') +
            '</div>' +
            '<div class="ph-art float">' + S.Art.puzzle() + '</div>' +
          '</section>' +

          '<section class="p-sec">' + head(tx('free_games', 'Your games'), '', tx('free_games_sub', 'Included in every plan')) +
            '<div class="game-grid">' + free.map(card).join('') + '</div></section>' +

          '<section class="p-sec">' + head(tx('premium_games', 'Premium games'), premium ? '' : '<button class="btn btn-premium btn-sm" data-act="premium">' + S.icon('sparkle') + esc(tx('see_premium', 'See Premium')) + '</button>',
              premium ? tx('premium_games_on', 'Unlocked with your Premium plan') : tx('premium_games_off', 'Available with SMIVAI Premium')) +
            '<div class="game-grid">' + prem.map(card).join('') + '</div></section>' +

          '<section class="p-sec">' + head(tx('coming_soon', 'Coming soon'), '', premium ? tx('early_access', 'Premium members get early access') : tx('early_access_off', 'Premium members will get these first')) +
            '<div class="game-grid soon">' + S.M.UPCOMING_GAMES.map(function (g) {
              return '<article class="game-card tone-' + g.color + ' is-soon"><div class="gc-art">' + S.Art[g.art]() + '</div>' +
                '<div class="gc-body"><h3>' + esc(g.name) + '</h3><p>' + esc(g.short) + '</p></div>' +
                '<div class="gc-foot"><span class="chip chip-premium">' + S.icon('clock') + esc(tx('soon', 'Coming soon')) + '</span></div></article>';
            }).join('') + '</div></section>' +
          disclaimer() +
        '</div>';

      S.mount(S.qs('#app'), html, {
        start: function (el, ev, id) { S.Router.go('#/patient/game/' + id); },
        startNext: function () { S.Router.go('#/patient/game/' + plan.next.game_type); },
        level: function (el, ev, id) { Patient.levelPicker(id); },
        locked: function (el, ev, id) { S.Premium.locked(S.M.gameName(id)); },
        premium: function () { S.Premium.open(); }
      });
      S.scrollTop();
    },

    /* kept for the Router's legacy #/patient/play */
    play: function () { this.games(); },

    levelPicker: function (gameId) {
      var p = S.State.patient();
      var g = S.M.game(gameId);
      var current = S.Adaptive.difficultyFor(p, gameId);
      var suggested = S.Adaptive.autoLevel(p, gameId);
      var lock = S.Adaptive.lockOf(p, gameId);
      var chosen = current;
      var openTo = S.Adaptive.unlockedIndex(p, gameId);   // harder levels open by doing well
      S.Modal.open({
        title: S.M.gameName(gameId),
        subtitle: t('choose_level'),
        body: '<div class="level-pick">' +
          S.M.DIFFICULTIES.map(function (d, i) {
            var locked = i > openTo;
            return '<button class="level-opt' + (locked ? ' is-locked' : '') + '" data-act="pick" data-arg="' + d.id + '"' +
              (locked ? ' disabled' : '') + ' aria-pressed="' + (d.id === current ? 'true' : 'false') + '">' +
              (locked ? '<span class="lo-lock">' + S.icon('lock') + '</span>' : '') +
              '<span class="lo-name">' + esc(S.M.difficultyName(d.id)) + '</span>' +
              '<span class="lo-meta">' + esc(locked
                ? tx('locked_hint', 'Do well at {level} to open this', { level: S.M.difficultyName(S.M.DIFFICULTIES[i - 1].id) })
                : t('about_n_min', { n: g.minutes[i] })) + '</span>' +
              (d.id === suggested ? '<span class="lo-tag">' + esc(tx('suggested', 'Suggested for you')) + '</span>' : '') +
              '</button>';
          }).join('') + '</div>' +
          /* Accessibility choice, separate from automatic adaptation. */
          '<label class="row" style="gap:.75rem;margin-top:1rem;align-items:flex-start;cursor:pointer">' +
            '<input type="checkbox" id="lv-lock" style="width:1.4rem;height:1.4rem;flex:none;margin-top:.15rem"' + (lock ? ' checked' : '') + '>' +
            '<span><b>' + esc(tx('lock_level', 'Always use this level')) + '</b>' +
            '<span class="t-small muted" style="display:block">' + esc(tx('lock_level_sub', 'Turns off automatic changes for this game. You can turn it back on here at any time.')) + '</span></span>' +
          '</label>',
        footer: '<button class="btn btn-outline" data-modal-close>' + esc(t('cancel')) + '</button>' +
                '<button class="btn" data-act="go">' + S.icon('play') + esc(t('start')) + '</button>',
        handlers: {
          pick: function (el, ev, arg) {
            chosen = arg;
            S.qsa('.level-opt', el.closest('.modal')).forEach(function (b) {
              b.setAttribute('aria-pressed', b.getAttribute('data-arg') === arg ? 'true' : 'false');
            });
          },
          go: function () {
            var box = S.qs('#lv-lock');
            var wantLock = !!(box && box.checked);
            if (wantLock && lock !== chosen) S.Adaptive.setLock(p, gameId, chosen);
            else if (!wantLock && lock) S.Adaptive.setLock(p, gameId, null);
            S.Modal.close();
            S.GameShell.open(gameId, { difficulty: chosen, returnTo: '#/patient/games' });
          }
        }
      });
    },

    /* ============================================================
       REMINDERS — the patient can add, edit, delete and complete
       ============================================================ */
    reminders: function () {
      var p = S.State.patient();
      var today = S.todayISO();
      var filter = Patient._remFilter || 'all';
      var occ = S.Reminders.occurrencesOn(p.patient_id, today).filter(function (o) { return filter === 'all' || o.reminder.category === filter; });
      var upcoming = occ.filter(function (o) { return o.status === 'upcoming'; });
      var missed = occ.filter(function (o) { return o.status === 'missed'; });
      var done = occ.filter(function (o) { return o.status === 'completed' || o.status === 'skipped'; });
      var all = S.Reminders.forPatient(p.patient_id);
      var later = all.filter(function (r) { return !S.Reminders.occursOn(r, today) && (filter === 'all' || r.category === filter); });
      var routine = S.DB.forPatient('routines', p.patient_id).sort(function (a, b) { return S.minutesOf(a.time) - S.minutesOf(b.time); });
      var nowM = S.minutesOf(S.nowHHMM());
      var cats = ['all', 'medicine', 'meal', 'appointment', 'exercise', 'cognitive', 'custom'];

      var html =
        '<div class="page anim-in">' +
          '<section class="page-hero tone-peach">' +
            '<div class="grow"><span class="chip chip-peach">' + S.icon('calendar') + esc(S.relativeDay(today) + ' · ' + S.prettyDate(today)) + '</span>' +
              '<h1>' + esc(t('reminders_title')) + '</h1>' +
              '<p>' + esc(occ.length ? tx('rem_summary', '{done} of {total} done today', { done: done.filter(function (o) { return o.status === 'completed'; }).length, total: occ.length }) : tx('rem_none', 'Nothing planned for today.')) + '</p>' +
              '<button class="btn btn-lg" data-act="add">' + S.icon('plus') + esc(tx('add_reminder', 'Add a Reminder')) + '</button>' +
            '</div>' +
            '<div class="ph-art float">' + S.Art.calendar() + '</div>' +
          '</section>' +

          '<div class="filter-row" role="tablist" aria-label="Filter reminders">' + cats.map(function (c) {
            var cat = c === 'all' ? { name: tx('all', 'All'), ico: 'list' } : S.M.reminderCategory(c);
            return '<button class="filter-chip" role="tab" data-act="filter" data-arg="' + c + '" aria-selected="' + (filter === c) + '">' + S.icon(cat.ico) + esc(tx('rc_' + c, cat.name)) + '</button>';
          }).join('') + '</div>' +

          (occ.length === 0 && !later.length ? S.UI.empty(S.icon('bell'), tx('rem_empty', 'No reminders yet'), tx('rem_empty_sub', 'Add your medicines, meals or walks and HUN will remind you.'),
            '<button class="btn btn-lg" data-act="add">' + S.icon('plus') + esc(tx('add_reminder', 'Add a Reminder')) + '</button>') : '') +

          (upcoming.length ? '<section class="p-sec">' + head(t('coming_up')) + '<div class="rem-list">' + upcoming.map(remCard).join('') + '</div></section>' : '') +
          (missed.length ? '<section class="p-sec">' + head(t('please_check')) + '<div class="rem-list">' + missed.map(remCard).join('') + '</div></section>' : '') +
          (done.length ? '<section class="p-sec">' + head(t('finished_today')) + '<div class="rem-list">' + done.map(remCard).join('') + '</div></section>' : '') +
          (later.length ? '<section class="p-sec">' + head(tx('other_days', 'On other days')) + '<div class="rem-list">' + later.map(function (r) { return remCard({ reminder: r, status: 'later' }); }).join('') + '</div></section>' : '') +

          (routine.length ? '<section class="p-sec">' + head(t('your_usual_day')) +
            '<div class="card"><div class="timeline">' + routine.map(function (r) {
              var isNow = Math.abs(S.minutesOf(r.time) - nowM) <= 45;
              return '<div class="tl-item ' + (isNow ? 'now' : '') + '"><div class="tl-time">' + esc(S.prettyTime(r.time)) + '</div>' +
                '<div class="tl-name"><span class="emoji">' + r.icon + '</span> ' + esc(r.title) + '</div></div>';
            }).join('') + '</div></div></section>' : '') +
          '<div class="demo-note">' + S.icon('bell') + '<span>' + esc(tx('rem_delivery', 'Reminders appear while SMIVAI is open on this device. SMIVAI cannot alert you yet when it is closed, so keep your usual alarms for important medicines.')) + '</span></div>' +
          disclaimer() +
        '</div>';

      S.mount(S.qs('#app'), html, {
        add: function () { Patient.reminderForm(null); },
        filter: function (el, ev, c) { Patient._remFilter = c; Patient.reminders(); },
        done: function (el, ev, id) { S.Reminders.mark(id, today, 'completed', 'patient'); S.toast(t('marked_done'), 'ok'); Patient.reminders(); },
        skip: function (el, ev, id) { S.Reminders.mark(id, today, 'skipped', 'patient'); S.toast(t('will_remind'), 'warn'); Patient.reminders(); },
        undo: function (el, ev, id) {
          var ev2 = S.Reminders.eventFor(id, today);
          if (ev2) S.DB.remove('reminder_events', ev2.event_id);
          Patient.reminders();
        },
        edit: function (el, ev, id) { Patient.reminderForm(S.DB.find('reminders', id)); },
        hear: function (el, ev, id) {
          var rem = S.DB.find('reminders', id);
          if (!rem) return;
          el.classList.add('is-speaking');
          S.Reminders.speak(rem, p).then(function (r) { el.classList.remove('is-speaking'); if (!r.spoken && r.note) S.toast(r.note, 'warn', 5000); });
        }
      });
      S.scrollTop();

      function remCard(o) {
        var r = o.reminder, cat = S.M.reminderCategory(r.category);
        var cls = o.status === 'completed' ? ' is-done' : o.status === 'missed' ? ' is-missed' : o.status === 'skipped' ? ' is-skipped' : '';
        var chip = o.status === 'later' ? { cls: '', icon: '' } : S.Reminders.statusChip(o.status);
        return '<article class="rem-card tone-' + cat.tone + cls + '">' +
          '<span class="rem-ico">' + S.icon(cat.ico) + '</span>' +
          '<div class="grow">' +
            '<div class="rem-time">' + esc(S.prettyTime(r.time)) + (o.status === 'later' ? ' · ' + esc(S.Reminders.repeatText(r)) : '') + '</div>' +
            '<h3 class="rem-title">' + esc(r.title) + '</h3>' +
            (r.description ? '<p class="rem-desc">' + esc(r.description) + '</p>' : '') +
            '<div class="row" style="gap:.5rem;flex-wrap:wrap;margin-top:.5rem">' +
              (o.status !== 'later' ? S.UI.chip(t('status_' + o.status), chip.cls, chip.icon) : '') +
              (r.priority === 'important' ? S.UI.chip(tx('high_priority', 'High Priority'), 'chip-amber', '★') : '') +
              S.UI.chip(tx('rc_' + r.category, cat.name), '') +
            '</div>' +
            '<div class="rem-actions">' +
              (o.status === 'upcoming' || o.status === 'missed'
                ? '<button class="btn btn-success" data-act="done" data-arg="' + esc(r.reminder_id) + '">' + S.icon('check') + esc(tx('mark_complete', 'Mark Complete')) + '</button>' +
                  '<button class="btn btn-outline" data-act="skip" data-arg="' + esc(r.reminder_id) + '">' + S.icon('clock') + esc(t('not_now')) + '</button>'
                : o.status === 'completed' || o.status === 'skipped'
                  ? '<button class="btn btn-outline btn-sm" data-act="undo" data-arg="' + esc(r.reminder_id) + '">' + S.icon('refresh') + esc(tx('undo', 'Undo')) + '</button>' : '') +
              (r.voice_enabled ? '<button class="listen-btn" data-act="hear" data-arg="' + esc(r.reminder_id) + '">' + S.icon('volume') + esc(t('listen')) + '</button>' : '') +
              '<button class="btn btn-ghost" data-act="edit" data-arg="' + esc(r.reminder_id) + '">' + S.icon('edit') + esc(tx('edit', 'Edit')) + '</button>' +
            '</div>' +
          '</div>' +
        '</article>';
      }
    },

    reminderForm: function (rem) {
      var p = S.State.patient();
      var cats = ['medicine', 'meal', 'appointment', 'exercise', 'cognitive', 'custom'];
      var chosen = rem ? rem.category : 'medicine';
      var body =
        '<div class="stack stack-2">' +
          '<div class="field"><span class="field-label">' + esc(tx('what_kind', 'What kind of reminder?')) + '</span>' +
            '<div class="choice-grid">' + cats.map(function (c) {
              var cat = S.M.reminderCategory(c);
              return '<button class="choice" data-act="cat" data-arg="' + c + '" aria-pressed="' + (c === chosen) + '">' + S.icon(cat.ico) + esc(tx('rc_' + c, cat.name)) + '</button>';
            }).join('') + '</div></div>' +
          '<div class="field"><label for="rm-title">' + esc(tx('rem_title', 'What should HUN remind you?')) + '</label>' +
            '<input class="input" id="rm-title" maxlength="60" value="' + esc(rem ? rem.title : '') + '" placeholder="e.g. Take Medicine"></div>' +
          '<div class="form-grid">' +
            '<div class="field"><label for="rm-time">' + esc(tx('time', 'Time')) + '</label><input class="input" id="rm-time" type="time" value="' + esc(rem ? rem.time : '08:00') + '"></div>' +
            '<div class="field"><label for="rm-repeat">' + esc(tx('repeat', 'Repeat')) + '</label><select class="select" id="rm-repeat">' +
              S.M.REPEATS.filter(function (r) { return r.id !== 'custom'; }).map(function (r) {
                return '<option value="' + r.id + '"' + ((rem ? rem.repeat : 'daily') === r.id ? ' selected' : '') + '>' + esc(r.name) + '</option>';
              }).join('') + '</select></div>' +
          '</div>' +
          '<div class="field"><label for="rm-desc">' + esc(tx('notes_opt', 'Notes (optional)')) + '</label><input class="input" id="rm-desc" maxlength="120" value="' + esc(rem ? rem.description : '') + '" placeholder="e.g. After breakfast, with water"></div>' +
          '<label class="toggle"><input type="checkbox" id="rm-prio"' + (rem && rem.priority === 'important' ? ' checked' : '') + '><span class="track"></span>' + esc(tx('high_priority', 'High Priority')) + '</label>' +
          '<label class="toggle"><input type="checkbox" id="rm-voice"' + (!rem || rem.voice_enabled ? ' checked' : '') + '><span class="track"></span>' + esc(tx('read_aloud', 'Read it aloud to me')) + '</label>' +
          (rem && rem.created_by_role && rem.created_by_role !== 'patient' ? '<p class="t-small muted">' + S.icon('users') + ' ' + esc(tx('set_by', 'Set by {name}', { name: rem.created_by_name || S.titleCase(rem.created_by_role) })) + '</p>' : '') +
          '<div class="err" id="rm-err" role="alert" hidden></div>' +
        '</div>';

      S.Modal.open({
        title: rem ? tx('edit_reminder', 'Edit reminder') : tx('add_reminder', 'Add a Reminder'),
        body: body,
        footer: (rem ? '<button class="btn btn-danger" data-act="del">' + S.icon('trash') + esc(tx('delete', 'Delete')) + '</button>' : '<button class="btn btn-outline" data-modal-close>' + esc(t('cancel')) + '</button>') +
          '<button class="btn" data-act="save">' + S.icon('check') + esc(tx('save', 'Save')) + '</button>',
        handlers: {
          cat: function (el, ev, c) {
            chosen = c;
            S.qsa('.choice', el.closest('.modal')).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-arg') === c ? 'true' : 'false'); });
            var title = S.qs('#rm-title');
            if (!title.value.trim()) title.placeholder = { medicine: 'e.g. Take Medicine', meal: 'e.g. Breakfast', appointment: 'e.g. Visit Dr. Choudhury', exercise: 'e.g. Evening walk', cognitive: 'e.g. Brain Game', custom: 'e.g. Call Rahul' }[c];
          },
          save: function () {
            var title = S.qs('#rm-title').value.trim();
            var time = S.qs('#rm-time').value;
            var err = S.qs('#rm-err');
            if (!title) { err.textContent = tx('need_title', 'Please say what to remind you about.'); err.hidden = false; S.qs('#rm-title').focus(); return; }
            if (!/^\d{2}:\d{2}$/.test(time)) { err.textContent = tx('need_time', 'Please choose a time.'); err.hidden = false; return; }
            var data = {
              title: title, time: time, category: chosen, repeat: S.qs('#rm-repeat').value,
              description: S.qs('#rm-desc').value.trim(),
              priority: S.qs('#rm-prio').checked ? 'important' : 'normal',
              voice_enabled: S.qs('#rm-voice').checked
            };
            if (rem) S.Reminders.update(rem.reminder_id, data);
            else {
              var made = S.Reminders.create(Object.assign(data, { patient_id: p.patient_id, date: S.todayISO(), created_by_role: 'patient', created_by_id: p.patient_id, created_by_name: p.name }));
              if (made.duplicate) { S.toast(tx('rem_dup', 'You already have this reminder at {t}.', { t: S.prettyTime(data.time) }), 'warn', 4500); return; }
            }
            S.Modal.close();
            S.toast(rem ? tx('rem_saved', 'Reminder updated.') : tx('rem_added', 'Reminder added.'), 'ok');
            Patient.reminders();
          },
          del: function () {
            S.Modal.confirm({ title: tx('del_rem_q', 'Delete this reminder?'), message: '“' + rem.title + '” ' + tx('del_rem_msg', 'will no longer remind you. Past history is kept.'), okText: tx('delete', 'Delete'), danger: true })
              .then(function (ok) { if (!ok) return; S.Reminders.remove(rem.reminder_id); S.toast(tx('rem_deleted', 'Reminder deleted.'), 'ok'); Patient.reminders(); });
          }
        }
      });
    },

    /* ============================================================
       MY PROGRESS — simple, encouraging, never a clinical dashboard
       ============================================================ */
    progress: function () {
      var p = S.State.patient();
      var premium = S.Plans.planOf('patient', p.patient_id) === 'premium';
      var sessions = S.DB.forPatient('game_sessions', p.patient_id).sort(function (a, b) { return a.timestamp < b.timestamp ? 1 : -1; });
      var weekAgo = S.addDays(S.todayISO(), -6);
      var week = sessions.filter(function (s) { return s.date >= weekAgo; });
      var prevWeek = sessions.filter(function (s) { return s.date >= S.addDays(weekAgo, -7) && s.date < weekAgo; });
      var avgScore = week.length ? Math.round(S.avg(week.map(function (s) { return s.score; }))) : 0;
      var acc = week.length ? Math.round(100 * S.avg(week.map(function (s) { return s.accuracy; }))) : 0;
      var streak = S.Wellness.streak(p.patient_id);
      var days = [];
      for (var i = 6; i >= 0; i--) {
        var d = S.addDays(S.todayISO(), -i);
        var n = sessions.filter(function (s) { return s.date === d; }).length;
        days.push({ date: d, label: S.weekdayName(d).slice(0, 3), value: n });
      }
      var maxDay = Math.max(3, Math.max.apply(null, days.map(function (d) { return d.value; })));
      var moodWeek = days.map(function (d) {
        var m = S.DB.where('moods', function (x) { return x.patient_id === p.patient_id && x.date === d.date; })[0];
        return { d: d, m: m ? S.Wellness.feeling(m.mood) : null };
      });
      var message = week.length >= prevWeek.length && week.length > 0 ? tx('prog_great', 'You’re doing great this week!')
        : week.length ? tx('prog_good', 'Nice work — every game counts.') : tx('prog_start', 'Let’s play a game together this week.');

      var html =
        '<div class="page anim-in">' +
          '<section class="page-hero tone-green">' +
            '<div class="grow"><span class="chip chip-green">' + S.icon('trend') + esc(tx('this_week', 'This week')) + '</span>' +
              '<h1>' + esc(message) + '</h1>' +
              '<p>' + esc(tx('prog_sub', 'Here is how your week went. Every little bit of practice helps.')) + '</p></div>' +
            '<div class="ph-art float">' + S.Art.trophy() + '</div>' +
          '</section>' +

          '<div class="big-stats">' +
            bigStat('games', 'lav', week.length, tx('games_done', 'Games completed'), tx('games_done_sub', '{n} in total', { n: sessions.length })) +
            bigStat('star', 'blue', avgScore || '—', tx('avg_score', 'Average score'), tx('out_of_100', 'out of 100')) +
            bigStat('target', 'green', acc ? acc + '%' : '—', tx('accuracy', 'Accuracy'), tx('correct_answers', 'correct answers')) +
            bigStat('flame', 'peach', streak, tx('streak', 'Day streak'), streak ? tx('keep_it', 'Keep it going!') : tx('start_today', 'Start today!')) +
          '</div>' +

          '<div class="duo">' +
            '<section class="card"><div class="card-head"><h2 class="card-title">' + esc(tx('weekly_activity', 'Weekly activity')) + '</h2>' + S.UI.chip(tx('games_per_day', 'games per day'), '') + '</div>' +
              '<div class="week-bars" role="img" aria-label="Games played each day this week">' + days.map(function (d) {
                var h = Math.round(100 * d.value / maxDay);
                return '<div class="wb' + (d.date === S.todayISO() ? ' today' : '') + '"><span class="wb-n">' + d.value + '</span><span class="wb-bar"><i style="height:' + Math.max(4, h) + '%"></i></span><span class="wb-l">' + esc(d.label) + '</span></div>';
              }).join('') + '</div></section>' +
            '<section class="card"><div class="card-head"><h2 class="card-title">' + esc(tx('feelings_week', 'How you felt')) + '</h2></div>' +
              '<div class="mood-week">' + moodWeek.map(function (x) {
                return '<div class="mw"><span class="mw-face emoji" aria-hidden="true">' + (x.m ? x.m.face : '·') + '</span><span class="mw-l">' + esc(x.d.label) + '</span>' +
                  '<span class="sr-only">' + esc(x.m ? x.m.name : 'no check-in') + '</span></div>';
              }).join('') + '</div>' +
              '<p class="t-small muted" style="margin-top:1rem">' + esc(tx('feel_note', 'Your check-ins help your family know how you are.')) + '</p></section>' +
          '</div>' +

          '<section class="p-sec">' + head(tx('recent_games', 'Recent games'), viewAll('games', tx('play_game', 'Play a game'))) +
            (sessions.length ? '<div class="card"><div class="list">' + sessions.slice(0, 6).map(function (s) {
              var g = S.M.game(s.game_type);
              return '<div class="list-item"><span class="list-icon ' + (g.color === 'cream' ? 'peach' : g.color || 'blue') + '">' + S.icon('brain') + '</span>' +
                '<div class="grow"><b>' + esc(S.M.gameName(s.game_type)) + '</b><div class="t-small muted">' + esc(S.relativeDay(s.date) + ' · ' + S.M.difficultyName(s.difficulty)) + '</div></div>' +
                '<div style="text-align:right"><b style="font-size:1.25rem">' + s.score + '</b><div class="t-small muted">' + Math.round(s.accuracy * 100) + '% ' + esc(tx('correct_short', 'correct')) + '</div></div></div>';
            }).join('') + '</div></div>'
              : S.UI.empty(S.icon('brain'), tx('no_games_yet', 'No games played yet'), tx('no_games_sub', 'Your results will appear here after your first game.'), '<button class="btn btn-lg" data-act="games">' + S.icon('play') + esc(tx('play_game', 'Play a game')) + '</button>')) +
          '</section>' +

          (premium
            ? '<section class="p-sec">' + head(tx('deeper', 'Deeper insights'), '<span class="plan-badge premium">' + S.icon('sparkle') + 'Premium</span>') +
                '<div class="duo"><div class="card"><div class="card-title" style="margin-bottom:1rem">' + esc(tx('by_skill', 'By type of game')) + '</div>' +
                  S.Charts.hbars(S.Scoring.gameBreakdown(p.patient_id).filter(function (b) { return b.plays; }).map(function (b) {
                    return { label: S.M.gameName(b.game.id), value: Math.round(b.accuracy * 100), color: 'var(--lav-400)' };
                  }), { aria: 'Accuracy by game' }) + '</div>' +
                '<div class="card"><div class="card-title" style="margin-bottom:1rem">' + esc(tx('month_trend', 'Your last 30 days')) + '</div>' +
                  S.Charts.line(S.Scoring.scoreSeries(p.patient_id, 30), { aria: 'Activity score over 30 days', lastLabel: tx('latest', 'Latest') }) + '</div></div>' +
              '</section>'
            : '<section class="locked-panel"><div class="lp-art">' + S.Art.trophy() + '</div><div class="grow"><span class="plan-badge premium">' + S.icon('sparkle') + 'Premium</span>' +
                '<h3>' + esc(tx('deeper', 'Deeper insights')) + '</h3><p>' + esc(tx('deeper_sub', 'See how you do in each type of game, and your progress over the month.')) + '</p></div>' +
                '<button class="btn btn-premium btn-lg" data-act="premium">' + S.icon('sparkle') + esc(tx('see_premium', 'See Premium')) + '</button></section>') +
          S.UI.progressDisclaimer() + disclaimer() +
        '</div>';

      S.mount(S.qs('#app'), html, {
        games: function () { S.Router.go('#/patient/games'); },
        premium: function () { S.Premium.open(); }
      });
      S.scrollTop();

      function bigStat(ico, tone, v, l, sub) {
        return '<div class="big-stat tone-' + tone + '"><span class="bs-ico">' + S.icon(ico) + '</span><div class="bs-v">' + esc(v) + '</div>' +
          '<div class="bs-l">' + esc(l) + '</div><div class="bs-sub">' + esc(sub) + '</div></div>';
      }
    },

    /* ============================================================
       DAILY FACT & LEARN A SKILL (free for everyone)
       ============================================================ */
    fact: function (offset) {
      var p = S.State.patient();
      offset = offset || 0;
      var f = S.Wellness.factOfDay(offset);
      var html =
        '<div class="page page-narrow anim-in">' +
          '<button class="btn btn-ghost" data-act="back">' + S.icon('arrowLeft') + esc(S.t('back')) + '</button>' +
          '<article class="read-card tone-blue">' +
            '<div class="rc-art float">' + S.Art.bulb() + '</div>' +
            '<span class="chip chip-blue">' + S.icon('bulb') + esc(offset ? tx('another_fact', 'Another fact') : tx('daily_fact', 'Daily Fact')) + ' · ' + esc(f.tag) + '</span>' +
            '<h1>' + esc(f.title) + '</h1>' +
            '<p class="rc-text">' + esc(f.text) + '</p>' +
            /* What kind of item this is, and where it comes from. */
            (f.by ? '<p class="t-small muted" style="margin-top:.75rem">— ' + esc(f.by) + '</p>' : '') +
            (f.source ? '<p class="t-small muted" style="margin-top:.5rem">' + esc(tx('source', 'Source')) + ': ' +
              '<a href="' + esc(f.source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(f.source.name) + '</a></p>' : '') +
            '<div class="row" style="flex-wrap:wrap;margin-top:1.5rem">' +
              '<button class="listen-btn" data-act="listen">' + S.icon('volume') + esc(t('listen')) + '</button>' +
              '<button class="btn btn-lg btn-outline" data-act="another">' + S.icon('refresh') + esc(tx('another_fact', 'Another fact')) + '</button>' +
              '<button class="btn btn-lg" data-act="talk">' + S.icon('talk') + esc(tx('talk_about', 'Talk about it')) + '</button>' +
            '</div>' +
          '</article>' +
        '</div>';
      S.Wellness.log(p.patient_id, 'fact', String(offset));
      S.mount(S.qs('#app'), html, {
        back: function () { S.Router.go('#/patient/home'); },
        listen: function (el) { speak(f.title + '. ' + f.text, p, el); },
        another: function () { Patient.fact(offset + 1); },
        talk: function () { S.Talk.seed = 'Tell me more about: ' + f.title; S.Router.go('#/patient/talk'); }
      });
      S.scrollTop();
    },

    skill: function (id) {
      var p = S.State.patient();
      var sk = id ? S.Wellness.skill(id) : S.Wellness.skillOfDay();
      var step = 0;
      var draw = function () {
        var last = step === sk.steps.length - 1;
        var html =
          '<div class="page page-narrow anim-in">' +
            '<button class="btn btn-ghost" data-act="back">' + S.icon('arrowLeft') + esc(S.t('back')) + '</button>' +
            '<article class="read-card tone-' + (sk.color === 'cream' ? 'peach' : sk.color) + '">' +
              '<div class="rc-art float">' + (S.Art[sk.art] ? S.Art[sk.art]() : S.Art.book()) + '</div>' +
              '<span class="chip chip-lav">' + S.icon('book') + esc(tx('learn_skill', 'Learn a New Skill')) + ' · ' + esc(tx('n_minutes', '{n} minutes', { n: sk.minutes })) + '</span>' +
              '<h1>' + esc(sk.title) + '</h1>' +
              '<p class="rc-lead">' + esc(sk.intro) + '</p>' +
              '<div class="step-card" aria-live="polite"><span class="step-n">' + esc(tx('step_of', 'Step {a} of {b}', { a: step + 1, b: sk.steps.length })) + '</span>' +
                '<p>' + esc(sk.steps[step]) + '</p>' +
                '<div class="step-dots">' + sk.steps.map(function (x, i) { return '<i class="' + (i <= step ? 'on' : '') + '"></i>'; }).join('') + '</div></div>' +
              '<div class="row" style="flex-wrap:wrap;margin-top:1.25rem">' +
                (step > 0 ? '<button class="btn btn-lg btn-outline" data-act="prev">' + S.icon('arrowLeft') + esc(S.t('back')) + '</button>' : '') +
                '<button class="listen-btn" data-act="listen">' + S.icon('volume') + esc(t('listen')) + '</button>' +
                '<button class="btn btn-lg" data-act="next">' + esc(last ? tx('i_did_it', 'I did it!') : tx('next', 'Next')) + S.icon(last ? 'check' : 'arrowRight') + '</button>' +
              '</div>' +
            '</article>' +
            '<section class="p-sec">' + head(tx('more_skills', 'More skills to try')) +
              '<div class="skill-grid">' + S.Wellness.SKILLS.filter(function (s) { return s.id !== sk.id; }).map(function (s) {
                return '<button class="skill-pill" data-act="open" data-arg="' + s.id + '"><span class="list-icon ' + (s.color === 'cream' ? 'peach' : s.color) + '">' + S.icon('book') + '</span>' +
                  '<span class="grow"><b>' + esc(s.title) + '</b><small>' + esc(tx('n_minutes', '{n} minutes', { n: s.minutes })) + '</small></span>' + S.icon('chevronRight') + '</button>';
              }).join('') + '</div></section>' +
          '</div>';
        S.mount(S.qs('#app'), html, {
          back: function () { S.Router.go('#/patient/home'); },
          prev: function () { step = Math.max(0, step - 1); draw(); },
          next: function () {
            if (!last) { step++; draw(); return; }
            S.Wellness.log(p.patient_id, 'skill', sk.id);
            S.toast(tx('skill_done', 'Well done! You learned something new today.'), 'ok');
            S.Router.go('#/patient/home');
          },
          listen: function (el) { speak(sk.steps[step], p, el); },
          open: function (el, ev, sid) { S.Router.go('#/patient/skill/' + sid); }
        });
      };
      draw();
      S.scrollTop();
    },

    /* ============================================================
       PROFILE HUB (mobile "Profile" tab)
       ============================================================ */
    more: function () {
      var p = S.State.patient();
      var plan = S.Plans.planOf('patient', p.patient_id);
      var items = [
        ['reminders', 'bell', 'peach', t('reminders_title')], ['progress', 'chart', 'green', tx('nav_progress', 'My Progress')],
        ['doctor', 'stethoscope', 'blue', tx('book_doctor', 'Book a Doctor')], ['medicines', 'pill', 'green', tx('order_medicines', 'Order Medicines')],
        ['records', 'records', 'lav', tx('health_records', 'My Health Records')], ['caregiver', 'users', 'peach', tx('nav_caregiver', 'Caregiver Support')],
        ['support', 'heart', 'peach', tx('help_charities', 'Helplines & charities')],
        ['settings', 'settings', 'blue', tx('nav_settings', 'Settings')]
      ];
      var html =
        '<div class="page page-narrow anim-in">' +
          '<section class="profile-card">' +
            '<span class="avatar avatar-xl">' + S.Art.avatar(p) + '</span>' +
            '<div class="grow"><h1>' + esc(p.name) + '</h1><p>' + esc((p.age ? p.age + ' years · ' : '') + (p.district || '')) + '</p>' +
              '<span class="plan-badge ' + plan + '">' + (plan === 'premium' ? S.icon('sparkle') + 'Premium' : 'Free plan') + '</span></div>' +
          '</section>' +
          (plan === 'free' ? '<button class="upsell" data-act="premium"><span class="u-art">' + S.Art.orb() + '</span><span class="grow"><b>' + esc(tx('unlock_premium', 'Unlock SMIVAI Premium')) + '</b><small>' + esc(tx('premium_pitch_p', 'All 8 brain games, deeper conversations and detailed progress.')) + '</small></span>' + S.icon('chevronRight') + '</button>' : '') +
          '<nav class="hub-list" aria-label="More">' + items.map(function (it) {
            return '<button class="hub-item" data-act="go" data-arg="' + it[0] + '"><span class="list-icon ' + it[2] + '">' + S.icon(it[1]) + '</span><span class="grow">' + esc(it[3]) + '</span>' + S.icon('chevronRight') + '</button>';
          }).join('') + '</nav>' +
          '<button class="sos-card" data-act="sos" style="width:100%;margin-top:1rem"><span class="sos-ico">' + S.icon('phone') + '</span><span class="grow" style="text-align:left"><b>' + esc(tx('sos_short', 'Emergency SOS')) + '</b><span>' + esc(tx('get_help', 'Get immediate assistance')) + '</span></span></button>' +
          '<button class="btn btn-outline btn-lg btn-block" style="margin-top:1rem" data-act="logout">' + S.icon('logout') + 'Sign out</button>' +
        '</div>';
      S.mount(S.qs('#app'), html, {
        go: function (el, ev, id) { S.Router.go('#/patient/' + id); },
        premium: function () { S.Premium.open(); },
        sos: function () { S.Router.go('#/patient/sos'); },
        logout: function () { S.Shell.confirmLogout(); }
      });
      S.Photo.avatarInto(S.qs('.avatar-xl'), p);
      S.scrollTop();
    },

    /* ============================================================
       MY NOTES — write it down, read it back
       ============================================================ */
    notes: function () {
      var p = S.State.patient();
      var list = Bits.notesOf(p.patient_id);
      var rerender = function () { Patient.notes(); };

      var html =
        '<div class="page">' +
          '<section class="page-hero tone-cream">' +
            '<div class="grow"><span class="chip chip-peach">' + S.icon('note') + esc(tx('my_notes', 'My Notes')) + '</span>' +
              '<h1>' + esc(tx('notes_title', 'Your notes')) + '</h1>' +
              '<p>' + esc(tx('notes_hero', 'Anything you want to remember — a name, a recipe, something to ask the doctor. Only you can see these.')) + '</p></div>' +
            '<div class="ph-art">' + S.Art.notepad() + '</div>' +
          '</section>' +

          '<section class="card note-compose" aria-labelledby="nc-t">' +
            '<h2 class="card-title" id="nc-t">' + esc(tx('add_note', 'Add a note')) + '</h2>' +
            '<label class="sr-only" for="note-new">' + esc(tx('add_note', 'Add a note')) + '</label>' +
            '<textarea id="note-new" class="input note-input" rows="4" maxlength="2000" placeholder="' +
              esc(tx('note_ph', 'Write anything you want to remember…')) + '"></textarea>' +
            '<div class="err" id="note-err" role="alert" hidden></div>' +
            '<div class="note-compose-foot"><button class="btn btn-lg" data-act="save">' + S.icon('check') + esc(tx('save_note', 'Save note')) + '</button></div>' +
          '</section>' +

          '<section class="p-sec" aria-labelledby="nl-t">' +
            '<div class="sec-head"><div><h2 id="nl-t">' + esc(tx('view_notes', 'View notes')) + '</h2>' +
              '<p>' + esc(list.length ? tx('n_notes', '{n} notes, newest first', { n: list.length }) : '') + '</p></div></div>' +
            (list.length
              ? '<div class="note-list">' + list.map(function (n) {
                  var when = S.prettyDate(String(n.updated_at || n.created_at).slice(0, 10)) + ' · ' +
                    new Date(n.updated_at || n.created_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
                  return '<article class="note-card">' +
                    '<p class="note-text">' + esc(n.text) + '</p>' +
                    '<div class="note-foot"><span class="note-when">' + S.icon('clock') + esc(when) + '</span>' +
                      '<span class="note-btns">' +
                        '<button class="btn btn-sm btn-outline" data-act="edit" data-arg="' + esc(n.note_id) + '">' + S.icon('edit') + esc(tx('edit', 'Edit')) + '</button>' +
                        '<button class="btn btn-sm btn-outline btn-quiet-danger" data-act="del" data-arg="' + esc(n.note_id) + '">' + S.icon('trash') + esc(tx('delete', 'Delete')) + '</button>' +
                      '</span></div>' +
                  '</article>';
                }).join('') + '</div>'
              : S.UI.empty(S.icon('note'), tx('no_notes', 'No notes yet'), tx('no_notes_sub', 'Write your first one above — it will appear here.'))) +
          '</section>' +
          disclaimer() +
        '</div>';

      S.mount(S.qs('#app'), html, {
        save: function () {
          var box = S.qs('#note-new'), text = box.value.trim(), err = S.qs('#note-err');
          if (!text) { err.textContent = tx('note_empty', 'Write something first.'); err.hidden = false; box.focus(); return; }
          Patient.saveNote(p, null, text);
          S.toast(tx('note_saved', 'Note saved.'), 'ok');
          rerender();
        },
        edit: function (el, ev, id) { Patient.noteEditor(p, S.DB.find('patient_notes', id), rerender); },
        del: function (el, ev, id) {
          S.Modal.confirm({
            title: tx('del_note_q', 'Delete this note?'),
            message: tx('del_note_msg', 'It will be removed from this device and cannot be brought back.'),
            okText: tx('delete', 'Delete'), danger: true
          }).then(function (ok) {
            if (!ok) return;
            S.DB.remove('patient_notes', id);
            S.toast(tx('note_deleted', 'Note deleted.'), 'ok');
            rerender();
          });
        }
      });
      S.scrollTop();
    },

    saveNote: function (p, note, text) {
      var now = S.stamp();
      if (note) return S.DB.update('patient_notes', note.note_id, { text: text, updated_at: now });
      return S.DB.insert('patient_notes', { note_id: S.uid('pn'), patient_id: p.patient_id, text: text, created_at: now, updated_at: now });
    },

    /** Add (note = null) or edit a note in a dialog, from anywhere. */
    noteEditor: function (p, note, done) {
      S.Modal.open({
        title: note ? tx('edit_note', 'Edit note') : tx('add_note', 'Add a note'),
        body:
          '<label class="sr-only" for="note-text">' + esc(tx('my_notes', 'My Notes')) + '</label>' +
          '<textarea id="note-text" class="input note-input" rows="6" maxlength="2000" placeholder="' +
            esc(tx('note_ph', 'Write anything you want to remember…')) + '">' + esc(note ? note.text : '') + '</textarea>' +
          '<div class="err" id="note-text-err" role="alert" hidden></div>',
        footer: '<button class="btn btn-outline" data-modal-close>' + esc(t('cancel')) + '</button>' +
          '<button class="btn" data-act="save">' + S.icon('check') + esc(tx('save_note', 'Save note')) + '</button>',
        handlers: {
          save: function () {
            var box = S.qs('#note-text'), text = box.value.trim();
            if (!text) { var e = S.qs('#note-text-err'); e.textContent = tx('note_empty', 'Write something first.'); e.hidden = false; box.focus(); return; }
            Patient.saveNote(p, note, text);
            S.Modal.close();
            S.toast(tx('note_saved', 'Note saved.'), 'ok');
            if (done) done();
          }
        }
      });
    },

    /* ============================================================
       LANGUAGE CHOOSER
       ============================================================ */
    languagePicker: function (opts) {
      opts = opts || {};
      /* Signed in as a patient: their own language, saved on their record.
         Anyone else (the welcome and sign-in screens): this device's. */
      var sess = S.Auth.session();
      var p = sess && sess.role === 'patient' ? S.State.patient() : null;
      var chosen = p ? (p.language || 'en') : (S.Prefs.get('ui_lang') || 'en');
      var groups = S.I18N.forPicker();

      function cards(list) {
        return '<div class="lang-grid">' + list.map(function (l) {
          var caps = S.LangService.capabilities(l.code);
          return '<button class="lang-card" data-act="pick" data-arg="' + l.code + '" aria-pressed="' + (l.code === chosen ? 'true' : 'false') + '">' +
            '<span class="lc-body"><span class="lc-native">' + esc(l.native) + '</span><span class="lc-name">' + esc(l.name) + '</span>' +
              '<span class="lc-caps">' +
                capDot('Aa', caps.interface.percent >= 80 ? 'on' : caps.interface.percent >= 40 ? 'partial' : 'off') +
                capDot('🔊', caps.tts === 'available' ? 'on' : caps.tts === 'device-voice' ? 'partial' : 'off') +
                capDot('🎤', caps.asr === 'available' ? 'on' : caps.asr === 'device-only' ? 'partial' : 'off') +
              '</span></span><span class="lc-check">' + S.icon('check') + '</span></button>';
        }).join('') + '</div>';
      }

      S.Modal.open({
        title: opts.onboarding ? 'Choose your language' : S.t('change_language'),
        subtitle: p ? 'The language ' + firstName(p) + ' is most comfortable reading and hearing.'
          : 'The language you are most comfortable reading and hearing.',
        body:
          '<div class="lang-group"><div class="lang-group-head">North-East India</div>' + cards(groups.ner) + '</div>' +
          '<div class="lang-group"><div class="lang-group-head">Other</div>' + cards(groups.other) + '</div>' +
          '<div class="cov-legend" style="margin-top:20px"><span><i style="background:var(--success)"></i>Aa interface · 🔊 voice · 🎤 speech</span></div>' +
          '<p class="t-small muted" style="margin-top:12px">Languages without a Bhashini or AI4Bharat model show text only. SMIVAI never reads a different language aloud in place of the one you choose.</p>',
        footer: '<button class="btn btn-outline" data-modal-close>' + esc(t('cancel')) + '</button>' +
          '<button class="btn" data-act="save">' + S.icon('check') + esc(t('done_btn')) + '</button>',
        handlers: {
          pick: function (el, ev, arg) {
            chosen = arg;
            S.qsa('.lang-card', el.closest('.modal')).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-arg') === arg ? 'true' : 'false'); });
          },
          save: function () {
            if (p) S.DB.update('patients', p.patient_id, { language: chosen, language_confirmed: true });
            else S.Prefs.set('ui_lang', chosen);
            S.Modal.close();
            S.bus.emit('i18n:updated', { lang: chosen });
            S.toast(S.t('language') + ': ' + S.I18N.lang(chosen).native, 'ok');
            if (opts.onDone) opts.onDone(chosen); else S.Router.handle();
          }
        }
      });
    }
  };

  function capDot(label, state) { return '<span class="cap-dot ' + state + '"><i></i>' + label + '</span>'; }

  S.Patient = Patient;
})(window);
