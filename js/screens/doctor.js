/* ============================================================
   SMIVAI — screens/doctor.js
   Doctor dashboard: Dashboard · Patients · Insights · Reminders

   Wording rule enforced throughout this file: activity and performance
   language only. No diagnosis, no severity, no progression claims.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var NAV = [
    { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
    { id: 'patients', name: 'Patients', icon: '👥' },
    { id: 'insights', name: 'Insights', icon: '📈' },
    { id: 'appointments', name: 'Appointments', icon: '📅' },
    { id: 'reminders', name: 'Reminders', icon: '🔔' }
  ];

  var Doctor = {
    tab: 'dashboard',

    render: function (tab) {
      this.tab = tab || 'dashboard';
      var self = this;
      var patients = S.State.patients();
      if (!patients.length) {
        S.mount(S.qs('#app'),
          '<div class="dash anim-in"><div class="page-hero tone-blue">' +
            '<div class="grow"><h1>Welcome, ' + S.esc(S.State.actorName) + '</h1>' +
            '<p>Add a patient with the care code they read out to you from SMIVAI. Your plan covers up to ' +
              S.Plans.linkLimit('doctor', S.State.actorId) + ' patients.</p>' +
            '<button class="btn btn-lg" data-act="addPatient">' + S.icon('link') + 'Add a patient</button></div>' +
            '<div class="ph-art">' + S.Art.stethoscope() + '</div></div>' + S.UI.disclaimer() + '</div>',
          { addPatient: function () { self.addPatient(); } });
        return;
      }
      var patient = S.State.patient();
      if (!patient || !S.State.assertAccess(patient)) {
        patient = patients[0];
        S.State.setPatient(patient.patient_id);
      }

      /* The patient decides what each doctor sees (S.Links scopes). */
      var activityShared = S.Links.allows('doctor', S.State.actorId, patient.patient_id, 'activity');
      var lockedActivity = '<div class="section card">' + S.UI.empty(S.icon('lock'),
        String(patient.name).split(' ')[0] + ' has not shared activity and progress with you',
        'They can change this in SMIVAI under Caregiver Support → What they can see.') + '</div>';

      var body =
        this.tab === 'dashboard' ? (activityShared ? this.dashboard(patient) : lockedActivity) :
        this.tab === 'patients' ? this.patients(patients) :
        this.tab === 'insights' ? (activityShared ? this.insights(patient) : lockedActivity) :
        this.tab === 'appointments' ? this.appointments(patient, patients) :
        this.reminders(patient);

      var html =
        '<div class="dash anim-in">' +
          '<div class="dash-head">' +
            '<div><h1>' + S.esc({ dashboard: 'Patient overview', patients: 'My patients', insights: 'Insights', appointments: 'Appointments', reminders: 'Care reminders' }[this.tab] || 'Doctor') + '</h1>' +
              '<div class="dh-sub">' + S.esc(S.State.actorName) + ' · ' +
              S.esc(S.Links.forActor('doctor', S.State.actorId).length + ' of ' + S.Plans.linkLimit('doctor', S.State.actorId) + ' patients · ' +
                (S.Plans.planOf('doctor', S.State.actorId) === 'premium' ? 'Premium' : 'Free plan')) + '</div></div>' +
            S.DashUI.nav('doctor', this.tab, NAV) +
          '</div>' +
          S.DashUI.patientSwitch(patient, patients,
            '<button class="btn btn-secondary btn-sm no-print" data-act="print"><span class="emoji">🖨️</span>Print summary</button>') +
          body +
          S.UI.disclaimer('Insights describe SMIVAI activity only and are not a clinical assessment.') +
        '</div>';

      S.mount(S.qs('#app'), html, this.handlers(patient));
      S.scrollTop();
    },

    handlers: function (patient) {
      var self = this;
      return {
        nav: function (el) { S.Router.go('#/doctor/' + el.getAttribute('data-arg')); },
        switch: function (el) { S.State.setPatient(el.value); self.render(self.tab); },
        openPatient: function (el) { S.State.setPatient(el.getAttribute('data-arg')); S.Router.go('#/doctor/insights'); },
        print: function () { global.print(); },
        addReminder: function () {
          S.ReminderForm.open({ patient: patient, role: 'doctor', onDone: function () { self.render(self.tab); } });
        },
        editReminder: function (el) {
          S.ReminderForm.open({
            patient: patient, role: 'doctor',
            reminder: S.DB.find('reminders', el.getAttribute('data-arg')),
            onDone: function () { self.render(self.tab); }
          });
        },
        toggleReminder: function (el) {
          var r = S.DB.find('reminders', el.getAttribute('data-arg'));
          S.Reminders.setStatus(r.reminder_id, r.status === 'paused' ? 'active' : 'paused');
          self.render(self.tab);
        },
        suggest: function (el) {
          var s = S.M.SUGGESTIONS[parseInt(el.getAttribute('data-arg'), 10)];
          S.ReminderForm.open({
            patient: patient, role: 'doctor',
            reminder: S.M.newReminder({
              patient_id: patient.patient_id, title: s.title, description: s.description,
              category: s.category, time: s.time, repeat: s.repeat
            }),
            onDone: function () { self.render(self.tab); }
          });
        },
        addNote: function () { S.Caregiver.noteForm(patient); },
        addPatient: function () { self.addPatient(); },
        setStatus: function (el) {
          var a2 = S.DB.find('appointments', el.getAttribute('data-arg'));
          var next = el.getAttribute('data-to');
          S.DB.update('appointments', a2.appointment_id, { status: next });
          S.Services.Notify.push({ recipient_role: 'patient', recipient_id: a2.patient_id, patient_id: a2.patient_id,
            kind: 'appointment', title: next === 'confirmed' ? 'Appointment confirmed' : 'Appointment ' + next,
            body: a2.doctor_name + ' · ' + S.prettyDate(a2.date) + ' ' + S.prettyTime(a2.time), link: '#/patient/doctor' });
          S.toast('Appointment ' + next + '. The patient has been told.', 'ok');
          self.render(self.tab);
        },
        syncNow: function () { S.Sync.flush().then(function () { self.render(self.tab); }); },
        toggleOffline2: function () { S.Sync.setOffline(!S.Sync.forcedOffline); self.render(self.tab); }
      };
    },

    /* ---------------- Dashboard ---------------- */
    dashboard: function (patient) {
      var sum = S.Scoring.summary(patient.patient_id);
      var cas = sum.cas;
      var trend = S.Scoring.trendLabel(cas.trend);
      var ad = S.Reminders.adherence(patient.patient_id, 14);
      var plan = S.Plan.progress(patient);
      var series = S.Scoring.scoreSeries(patient.patient_id, 14);
      var completion = this.completionRate(patient, 14);

      return '' +
        '<div class="section stat-grid">' +
          S.UI.stat('Cognitive Activity Score', cas.empty ? '—' : String(cas.score),
            '<span class="trend ' + trend.cls + '">' + trend.icon + ' ' + trend.text + '</span>', cas.empty ? '' : '/100') +
          S.UI.stat('Average accuracy', Math.round(sum.accuracy * 100) + '%', 'last 20 activities') +
          S.UI.stat('Average response time', sum.responseTime + 's', 'per action') +
          S.UI.stat('Activity completion', completion + '%', 'planned sessions, last 14 days') +
          S.UI.stat('Reminder adherence', ad.percent + '%', ad.completed + ' of ' + ad.total + ' · last 14 days') +
        '</div>' +

        '<div class="section grid-sidebar">' +
          '<div class="card">' +
            '<div class="card-head"><div class="card-title">Performance trend · last 14 days</div>' +
              S.UI.chip('Change from recent average: ' + (cas.delta >= 0 ? '+' : '') + cas.delta,
                cas.delta >= 3 ? 'chip-green' : cas.delta <= -3 ? 'chip-amber' : '') + '</div>' +
            S.Charts.line(series, { aria: 'Cognitive Activity Score trend' }) +
            '<p class="t-small muted" style="margin-top:10px">Derived from accuracy, response time, mistakes, ' +
              'completion and the difficulty level served. Not a clinical measure.</p>' +
          '</div>' +
          '<div class="card">' +
            '<div class="card-title" style="margin-bottom:12px">Today</div>' +
            '<div class="sync-row"><span>Planned activities</span><b>' + plan.done + ' / ' + plan.total + '</b></div>' +
            '<div class="sync-row"><span>Reminders completed</span><b>' +
              S.Reminders.statsOn(patient.patient_id, S.todayISO()).completed + '</b></div>' +
            '<div class="sync-row"><span>Language</span><b>' + S.esc(S.I18N.lang(patient.language).name) + '</b></div>' +
            '<div class="sync-row"><span>Patient ID</span><b class="t-small">' + S.esc(patient.patient_id) + '</b></div>' +
            '<hr class="divider">' +
            '<div class="card-title" style="margin-bottom:10px">Mood check-ins</div>' +
            S.DashUI.moodStrip(patient) +
          '</div>' +
        '</div>' +

        '<div class="section">' + S.UI.sectionTitle('Important activity changes') + S.DashUI.alerts(patient) + '</div>' +

        '<div class="section grid-2">' +
          '<div class="card"><div class="card-title" style="margin-bottom:12px">Accuracy by activity</div>' +
            S.DashUI.gamePerformance(patient) + '</div>' +
          '<div class="card">' +
            '<div class="card-head"><div class="card-title">Care notes</div>' +
              '<button class="btn btn-sm btn-secondary no-print" data-act="addNote"><span class="emoji">➕</span>Add note</button></div>' +
            S.DashUI.careNotes(patient, true) +
          '</div>' +
        '</div>' +

        '<div class="section card">' +
          '<div class="card-title" style="margin-bottom:12px">Recent activity history</div>' +
          S.DashUI.sessionsTable(patient, 10) +
        '</div>';
    },

    /* ---------------- Patients ---------------- */
    patients: function (patients) {
      return '<div class="section card">' +
        S.UI.sectionTitle('Patients under your care',
          '<button class="btn btn-sm" data-act="addPatient">' + S.icon('link') + 'Add a patient</button>') +
        '<div class="table-scroll"><table class="data">' +
          '<thead><tr><th>Patient</th><th>Age</th><th>Language</th><th>Activity score</th><th>Trend</th>' +
          '<th>Accuracy</th><th>Adherence</th><th>Last activity</th><th></th></tr></thead><tbody>' +
          patients.map(function (p) {
            var cas = S.Scoring.cognitiveActivityScore(p.patient_id);
            var t = S.Scoring.trendLabel(cas.trend);
            var ad = S.Reminders.adherence(p.patient_id, 14);
            var last = S.Scoring.sessionsFor(p.patient_id).slice(-1)[0];
            return '<tr>' +
              '<td><b>' + S.esc(p.name) + '</b><div class="t-small muted">' + S.esc(p.district || '') + '</div></td>' +
              '<td>' + p.age + '</td>' +
              '<td>' + S.esc(S.I18N.lang(p.language).name) + '</td>' +
              '<td><b>' + (cas.empty ? '—' : cas.score) + '</b></td>' +
              '<td><span class="trend ' + t.cls + '">' + t.icon + ' ' + t.text + '</span></td>' +
              '<td>' + (cas.empty ? '—' : Math.round(cas.accuracy * 100) + '%') + '</td>' +
              '<td>' + ad.percent + '%</td>' +
              '<td class="muted">' + (last ? S.esc(S.relativeDay(last.date)) : '—') + '</td>' +
              '<td><button class="btn btn-sm btn-secondary" data-act="openPatient" data-arg="' + S.esc(p.patient_id) + '">Insights</button></td>' +
              '</tr>';
          }).join('') +
        '</tbody></table></div>' +
        '<p class="t-small muted" style="margin-top:14px">Only patients linked to ' + S.esc(S.State.actorName) +
          ' are listed. Every figure is read against that patient’s own patient_id.</p>' +
      '</div>';
    },

    /* ---------------- Insights ---------------- */
    insights: function (patient) {
      var cas = S.Scoring.cognitiveActivityScore(patient.patient_id);
      var trend = S.Scoring.trendLabel(cas.trend);
      var breakdown = S.Scoring.gameBreakdown(patient);
      var profile = S.Adaptive.profile(patient);
      var series = S.Scoring.scoreSeries(patient.patient_id, 21);
      var sessions = S.Scoring.sessionsFor(patient.patient_id);
      var first = patient.name.split(' ')[0];

      var narrative = [];
      narrative.push('Recent activity performance is ' +
        (cas.trend === 'improving' ? 'higher than' : cas.trend === 'lower' ? 'lower than' : 'in line with') +
        ' ' + first + '’s own recent average (change: ' + (cas.delta >= 0 ? '+' : '') + cas.delta + ' points).');
      narrative.push('Average accuracy across the last ' + cas.sessions + ' activities is ' +
        Math.round(cas.accuracy * 100) + '%, with an average response time of ' +
        S.Scoring.summary(patient.patient_id).responseTime + ' seconds per action.');
      var served = profile.filter(function (r) { return r.plays; });
      if (served.length) {
        narrative.push('Personalised difficulty currently serves ' +
          served.map(function (r) { return r.game.name + ' at ' + S.M.difficulty(r.level).name; }).join(', ') + '.');
      }
      if (cas.trend === 'lower') narrative.push('Consider reviewing recent activity at the next visit.');

      return '' +
        '<div class="section grid-2">' +
          '<div class="card">' +
            '<div class="card-head"><div class="card-title">Cognitive Activity Score</div>' + S.UI.trend(cas.trend) + '</div>' +
            '<div class="row" style="gap:24px;flex-wrap:wrap">' +
              S.UI.ring(cas.score, 100, { size: 128, center: cas.empty ? '—' : String(cas.score), sub: 'of 100', fontSize: 30 }) +
              '<div class="grow">' +
                '<div class="sync-row"><span>Sessions counted</span><b>' + cas.sessions + '</b></div>' +
                '<div class="sync-row"><span>Change from recent average</span><b>' + (cas.delta >= 0 ? '+' : '') + cas.delta + '</b></div>' +
                '<div class="sync-row"><span>Average accuracy</span><b>' + Math.round(cas.accuracy * 100) + '%</b></div>' +
                '<div class="sync-row"><span>Total sessions recorded</span><b>' + sessions.length + '</b></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="card">' +
            '<div class="card-title" style="margin-bottom:12px">Summary</div>' +
            narrative.map(function (n) { return '<p class="t-body" style="margin-bottom:10px">' + S.esc(n) + '</p>'; }).join('') +
            '<p class="t-small muted" style="margin-top:10px">This is a description of SMIVAI activity. ' +
              'It is not a diagnosis and does not describe disease progression.</p>' +
          '</div>' +
        '</div>' +

        '<div class="section card">' +
          '<div class="card-title" style="margin-bottom:12px">Performance trend · last 21 days</div>' +
          S.Charts.line(series, { aria: 'Cognitive Activity Score over 21 days' }) +
        '</div>' +

        '<div class="section grid-2">' +
          '<div class="card"><div class="card-title" style="margin-bottom:12px">Activity breakdown</div>' +
            '<div class="table-scroll"><table class="data">' +
            '<thead><tr><th>Activity</th><th>Domain</th><th>Played</th><th>Accuracy</th><th>Avg score</th><th>Response</th></tr></thead><tbody>' +
            breakdown.map(function (b) {
              return '<tr><td><span class="emoji">' + b.game.icon + '</span> <b>' + S.esc(b.game.name) + '</b></td>' +
                '<td class="muted t-small">' + S.esc(b.game.domain) + '</td>' +
                '<td>' + b.plays + '</td>' +
                '<td>' + (b.plays ? Math.round(b.accuracy * 100) + '%' : '—') + '</td>' +
                '<td>' + (b.plays ? b.score : '—') + '</td>' +
                '<td>' + (b.plays ? b.rt + 's' : '—') + '</td></tr>';
            }).join('') + '</tbody></table></div></div>' +

          '<div class="card"><div class="card-title" style="margin-bottom:12px">Reminder adherence</div>' +
            S.DashUI.adherencePanel(patient) + '</div>' +
        '</div>' +

        '<div class="section card">' +
          '<div class="card-title" style="margin-bottom:12px">Full activity history</div>' +
          S.DashUI.sessionsTable(patient, 40) +
        '</div>' +

        '<div class="section grid-2">' +
          '<div class="card"><div class="card-title" style="margin-bottom:12px">Care notes</div>' +
            S.DashUI.careNotes(patient, true) + '</div>' +
          '<div class="card"><div class="card-title" style="margin-bottom:12px">Personalised difficulty</div>' +
            '<div class="table-scroll"><table class="data">' +
            '<thead><tr><th>Activity</th><th>Level</th><th>Ability (θ)</th><th>Expected success</th></tr></thead><tbody>' +
            profile.map(function (r) {
              return '<tr><td>' + S.esc(r.game.name) + '</td>' +
                '<td>' + S.UI.chip(S.M.difficulty(r.level).name, 'chip-green') +
                  (r.locked ? ' ' + S.UI.chip('Fixed by choice', '') : '') + '</td>' +
                '<td>' + S.esc(S.Adaptive.thetaText(r)) + '</td>' +
                '<td>' + (r.plays ? r.expected + '%' : '—') + '</td></tr>';
            }).join('') + '</tbody></table></div>' +
            '<p class="t-small muted" style="margin-top:10px">Rasch (1PL) ability estimate per activity: a MAP estimate over the last ' +
              S.Adaptive.WINDOW + ' games, shown ± one standard error. Under ' + S.Adaptive.PROVISIONAL_BELOW +
              ' answers it is marked provisional. Level difficulties are fixed design values, not calibrated, ' +
              'so θ is a relative progress figure, not a validated measurement.</p>' +
          '</div>' +
        '</div>' +
        S.UI.progressDisclaimer();
    },

    /* ---------------- Reminders (doctor) ---------------- */
    reminders: function (patient) {
      var rems = S.Reminders.forPatient(patient.patient_id);
      var mine = rems.filter(function (r) { return r.created_by_role === 'doctor'; });
      var others = rems.filter(function (r) { return r.created_by_role !== 'doctor'; });
      var ad = S.Reminders.adherence(patient.patient_id, 14);
      var missed = S.Reminders.recentMissed(patient.patient_id, 7);

      function row(r, editable) {
        var cat = S.M.reminderCategory(r.category);
        var st = S.Reminders.statusOn(r, S.todayISO());
        var occursToday = S.Reminders.occursOn(r, S.todayISO());
        var chip = S.Reminders.statusChip(st);
        return '<div class="rem-row ' + (r.status === 'paused' ? 'paused' : '') + '">' +
          '<div class="rr-ico emoji">' + cat.icon + '</div>' +
          '<div class="grow">' +
            '<div class="rr-title">' + S.esc(r.title) + '</div>' +
            '<div class="rr-meta">' + S.esc(S.prettyTime(r.time)) + ' · ' + S.esc(S.Reminders.repeatText(r)) +
              ' · by ' + S.esc(r.created_by_name) + '</div>' +
            '<div class="row" style="gap:8px;margin-top:6px">' +
              (occursToday ? S.UI.chip(chip.text, chip.cls, chip.icon) : S.UI.chip('Not today', '')) +
            '</div>' +
          '</div>' +
          (editable ? '<div class="rr-actions">' +
            '<button class="btn btn-sm btn-secondary" data-act="editReminder" data-arg="' + S.esc(r.reminder_id) + '">Edit</button>' +
            '<button class="btn btn-sm btn-secondary" data-act="toggleReminder" data-arg="' + S.esc(r.reminder_id) + '">' +
              (r.status === 'paused' ? 'Resume' : 'Pause') + '</button></div>' : '') +
        '</div>';
      }

      return '<div class="section stat-grid">' +
          S.UI.stat('Reminder adherence', ad.percent + '%', 'last 14 days') +
          S.UI.stat('Recent missed reminders', String(missed.length), 'last 7 days') +
          S.UI.stat('Active reminders', String(rems.filter(function (r) { return r.status !== 'paused'; }).length), 'for this patient') +
          S.UI.stat('Created by you', String(mine.length), 'from the care plan') +
        '</div>' +

        '<div class="section grid-sidebar">' +
          '<div class="card">' +
            '<div class="card-head"><div class="card-title">Reminders you created</div>' +
              '<button class="btn btn-sm" data-act="addReminder"><span class="emoji">➕</span>Add reminder</button></div>' +
            '<div class="card card-tint" style="margin-bottom:14px;padding:14px 16px">' +
              '<p class="t-small">Reminders are created from an <b>existing care plan or instruction</b> — appointments, ' +
              'follow-ups, cognitive activity and general care. SMIVAI does not prescribe medication.</p></div>' +
            (mine.length ? mine.map(function (r) { return row(r, true); }).join('')
              : S.UI.empty('🔔', 'You have not created any reminders', '',
                  '<button class="btn" data-act="addReminder"><span class="emoji">➕</span>Add reminder</button>')) +
            '<hr class="divider">' +
            '<div class="card-title" style="margin-bottom:10px">Created by the caregiver</div>' +
            (others.length ? others.map(function (r) { return row(r, false); }).join('')
              : '<p class="t-small muted">None.</p>') +
            '<hr class="divider">' +
            '<div class="card-title" style="margin-bottom:10px">Suggestions</div>' +
            '<p class="t-small muted" style="margin-bottom:12px">Nothing is created until you press Add.</p>' +
            '<div class="suggest-wrap">' +
              S.M.SUGGESTIONS.map(function (s, i) {
                return '<button class="suggest" data-act="suggest" data-arg="' + i + '">' +
                  '<span class="emoji">' + s.icon + '</span>' + S.esc(s.title) + ' <b>+ Add</b></button>';
              }).join('') +
            '</div>' +
          '</div>' +
          '<div class="card">' +
            '<div class="card-title" style="margin-bottom:14px">Adherence</div>' +
            S.DashUI.adherencePanel(patient) +
            (missed.length ? '<hr class="divider"><div class="card-title" style="margin-bottom:10px">Recent missed</div>' +
              missed.slice(0, 6).map(function (o) {
                return '<div class="sync-row"><span>' + S.esc(o.reminder.title) + '</span><b class="t-small">' +
                  S.esc(S.relativeDay(o.date)) + '</b></div>';
              }).join('') : '') +
            '<p class="t-small muted" style="margin-top:12px">A missed reminder is not, by itself, an indication of change.</p>' +
          '</div>' +
        '</div>';
    },

    /** Share of planned daily sessions that were actually completed. */
    completionRate: function (patient, days) {
      var today = S.todayISO(), done = 0, total = 0;
      for (var i = 0; i < days; i++) {
        var d = S.addDays(today, -i);
        var plan = S.DB.where('daily_sessions', function (p) {
          return p.patient_id === patient.patient_id && p.date === d;
        })[0];
        var expected = plan ? plan.activities.length : 2;   // typical daily session
        var actual = S.Scoring.sessionsOn(patient.patient_id, d).length;
        total += expected;
        done += Math.min(actual, expected);
      }
      return total ? Math.round((done / total) * 100) : 0;
    }
  };

  /* ---------------- Appointments ---------------- */
  Doctor.appointments = function (patient, patients) {
    var self = this;
    var ids = {};
    S.Links.forActor('doctor', S.State.actorId).forEach(function (l) { ids[l.patient_id] = true; });
    var today = S.todayISO();
    var mine = S.DB.where('appointments', function (a) { return ids[a.patient_id] && a.doctor_id === S.State.actorId; });
    var upcoming = mine.filter(function (a) { return a.date >= today && S.M.apptOpen(a); })
      .sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
    var past = mine.filter(function (a) { return a.date < today || a.status === 'completed' || a.status === 'cancelled'; })
      .sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? 1 : -1; });

    function row(a, actions) {
      var p = S.DB.find('patients', a.patient_id) || { name: 'Patient' };
      return '<div class="list-item"><span class="list-icon blue">' + S.icon('calendar') + '</span>' +
        '<div class="grow"><b>' + S.esc(p.name) + '</b><div class="t-small muted">' +
          S.esc(S.prettyDate(a.date) + ' · ' + S.prettyTime(a.time) + ' · ' + S.titleCase(a.mode) + (a.reason ? ' · ' + a.reason : '')) + '</div></div>' +
        S.UI.chip(S.titleCase(a.status), a.status === 'confirmed' ? 'chip-green' : a.status === 'cancelled' ? 'chip-coral' : '') +
        (actions && a.status === 'scheduled'
          ? '<button class="btn btn-sm" data-act="setStatus" data-to="confirmed" data-arg="' + S.esc(a.appointment_id) + '">' + S.icon('check') + 'Confirm</button>' +
            '<button class="btn btn-sm btn-danger" data-act="setStatus" data-to="cancelled" data-arg="' + S.esc(a.appointment_id) + '">Decline</button>'
          : '') +
        (actions && a.status === 'confirmed'
          ? '<button class="btn btn-sm btn-outline" data-act="setStatus" data-to="completed" data-arg="' + S.esc(a.appointment_id) + '">' + S.icon('check') + 'Mark seen</button>'
          : '') +
        '</div>';
    }

    return '<div class="section">' +
        S.UI.sectionTitle('Requests and upcoming visits') +
        '<div class="card">' + (upcoming.length
          ? '<div class="list">' + upcoming.map(function (a) { return row(a, true); }).join('') + '</div>'
          : S.UI.empty(S.icon('calendar'), 'No upcoming appointments', 'Bookings your patients make in SMIVAI appear here.')) + '</div>' +
      '</div>' +
      '<div class="section"><div class="card"><div class="card-title" style="margin-bottom:12px">Past</div>' +
        (past.length ? '<div class="list">' + past.slice(0, 10).map(function (a) { return row(a, false); }).join('') + '</div>'
          : S.UI.empty(S.icon('clock'), 'Nothing yet', '')) + '</div></div>';
  };

  /** Add a patient by the care code they read out — with the plan limit. */
  Doctor.addPatient = function () {
    var self = this;
    var limit = S.Plans.linkLimit('doctor', S.State.actorId);
    var used = S.Links.forActor('doctor', S.State.actorId).length;
    if (used >= limit) { S.Premium.locked('Caring for more than ' + limit + ' patients'); return; }
    S.Modal.open({
      title: 'Add a patient',
      subtitle: used + ' of ' + limit + ' patients on your ' + (S.Plans.planOf('doctor', S.State.actorId) === 'premium' ? 'Premium' : 'Free') + ' plan.',
      body: '<div class="field"><label for="dp-code">Care code</label>' +
        '<input class="input" id="dp-code" placeholder="SMV-XXXXXX" style="text-transform:uppercase"></div>' +
        '<p class="t-small muted" style="margin-top:10px">The patient finds this code in SMIVAI under Caregiver Support. ' +
        'A doctor can only open a record after the patient shares it.</p>' +
        '<div class="err" id="dp-err" role="alert" hidden style="margin-top:10px"></div>',
      footer: '<button class="btn btn-outline" data-modal-close>Cancel</button>' +
        '<button class="btn" data-act="join">' + S.icon('link') + 'Add patient</button>',
      handlers: {
        join: function (el) {
          var root = el.closest('.modal');
          var err = S.qs('#dp-err', root);
          el.disabled = true;
          S.Links.join('doctor', S.State.actorId, S.qs('#dp-code', root).value).then(function (res) {
          el.disabled = false;
          if (!res.ok) {
            err.textContent = res.error; err.hidden = false;
            if (res.limit) setTimeout(function () { S.Modal.close(); S.Premium.locked('More patients'); }, 1200);
            return;
          }
          var found = res.patient;
          S.State.setPatient(found.patient_id);
          S.Modal.close();
          S.toast(found.name + ' added to your patients.', 'ok');
          self.render('dashboard');
          });
        }
      }
    });
  };

  S.Doctor = Doctor;
})(window);
