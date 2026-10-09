/* ============================================================
   SMIVAI — screens/caregiver.js
   Caregiver dashboard + the shared dashboard pieces the doctor view reuses.

   Tabs: Dashboard · Patients · Activities · Reminders · Memory Bank
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  /* ============================================================
     Shared dashboard building blocks (also used by the doctor view)
     ============================================================ */
  var DashUI = {

    nav: function (role, current, items) {
      return '<div class="rolenav" role="tablist">' +
        items.map(function (it) {
          return '<button role="tab" data-act="nav" data-arg="' + it.id + '" ' +
            'aria-current="' + (it.id === current ? 'page' : 'false') + '">' +
            '<span class="emoji">' + it.icon + '</span>' + S.esc(it.name) + '</button>';
        }).join('') + '</div>';
    },

    patientSwitch: function (patient, patients, extraHtml) {
      return '<div class="patient-switch">' +
        S.UI.avatar(patient.name, null, patient) +
        '<div>' +
          '<div class="ps-name">' + S.esc(patient.name) + '</div>' +
          '<div class="ps-meta">' + S.esc(patient.age + ' years · ' + S.I18N.lang(patient.language).name +
            (patient.district ? ' · ' + patient.district : '')) + '</div>' +
        '</div>' +
        '<div class="ps-actions">' +
          '<label class="sr-only" for="patient-select">Select patient</label>' +
          '<select class="select" id="patient-select" data-act="switch">' +
            patients.map(function (p) {
              return '<option value="' + S.esc(p.patient_id) + '"' +
                (p.patient_id === patient.patient_id ? ' selected' : '') + '>' + S.esc(p.name) + '</option>';
            }).join('') +
          '</select>' +
          (extraHtml || '') +
        '</div>' +
      '</div>';
    },

    /** Neutral, non-diagnostic alerts. */
    alerts: function (patient) {
      var out = [];
      var sos = S.DB.where('alerts', function (a) { return a.patient_id === patient.patient_id && a.status === 'open'; })[0];
      if (sos) {
        out.push({ kind: 'attention', icon: '🚨', title: sos.title, body: sos.body + ' · ' + S.prettyStamp(sos.created_at) });
      }
      var cas = S.Scoring.cognitiveActivityScore(patient.patient_id);
      var plan = S.Plan.progress(patient);
      var todayStats = S.Reminders.statsOn(patient.patient_id, S.todayISO());
      var missedRecent = S.Reminders.recentMissed(patient.patient_id, 3);
      var firstName = patient.name.split(' ')[0];

      if (cas.trend === 'lower') {
        out.push({
          kind: 'attention', icon: '📉', title: 'Recent activity performance has decreased',
          body: firstName + '’s recent activity performance is lower than his recent average (' +
            cas.delta + ' points). Consider checking in and keeping sessions short.'
        });
      }
      if (todayStats.missed > 0) {
        out.push({
          kind: '', icon: '⚠️',
          title: S.plural(todayStats.missed, 'reminder') + ' missed today',
          body: 'Missed reminders are common and are not, by themselves, a sign of change.'
        });
      } else if (missedRecent.length >= 2) {
        out.push({
          kind: '', icon: '⚠️',
          title: S.plural(missedRecent.length, 'reminder') + ' missed in the last 3 days',
          body: missedRecent.slice(0, 3).map(function (o) {
            return o.reminder.title + ' (' + S.relativeDay(o.date) + ')';
          }).join(' · ')
        });
      }
      if (plan.total && plan.done === 0) {
        out.push({
          kind: '', icon: '🧠', title: firstName + ' has not started today’s activity',
          body: 'Today’s session is ' + plan.total + ' short activities, about ' + plan.minutes + ' minutes.'
        });
      }
      var moodRow = S.DB.forPatient('moods', patient.patient_id)
        .sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0];
      if (moodRow && ['low', 'sad', 'worried'].indexOf(moodRow.mood) !== -1) {
        out.push({
          kind: '', icon: '💛', title: 'Recent check-in was “' + S.Wellness.feeling(moodRow.mood).name + '”',
          body: 'Recorded on ' + S.relativeDay(moodRow.date) + '. A short call or visit may help.'
        });
      }
      if (!out.length) {
        out.push({
          kind: 'info', icon: '✅', title: 'Nothing needs attention',
          body: firstName + ' is on track with activities and reminders today.'
        });
      }
      return out.map(function (a) {
        return '<div class="alert ' + a.kind + '"><span class="al-ico emoji">' + a.icon + '</span>' +
          '<div><div class="al-title">' + S.esc(a.title) + '</div>' +
          '<div class="al-body">' + S.esc(a.body) + '</div></div></div>';
      }).join('');
    },

    /** Today's activity + reminder checklist. */
    todayList: function (patient) {
      var plan = S.Plan.progress(patient);
      var occ = S.Reminders.occurrencesOn(patient.patient_id, S.todayISO());
      var rows = [];

      plan.items.forEach(function (it) {
        rows.push({
          icon: it.game.icon,
          title: it.game.name,
          meta: S.M.difficulty(it.difficulty).name + ' · about ' + it.minutes + ' min',
          state: it.done ? 'completed' : 'pending',
          extra: it.done && it.session ? Math.round(it.session.accuracy * 100) + '% correct' : ''
        });
      });
      occ.forEach(function (o) {
        rows.push({
          icon: S.M.reminderCategory(o.reminder.category).icon,
          title: o.reminder.title,
          meta: S.prettyTime(o.reminder.time) + ' · ' + S.Reminders.repeatText(o.reminder),
          state: o.status,
          extra: ''
        });
      });

      if (!rows.length) return S.UI.empty('🗓️', 'Nothing scheduled today', '');

      return '<div class="list">' + rows.map(function (r) {
        var mark = r.state === 'completed' ? '✓' : r.state === 'missed' ? '⚠' : r.state === 'skipped' ? '↷' : '○';
        var cls = r.state === 'completed' ? 'green' : r.state === 'missed' ? 'coral' : r.state === 'skipped' ? 'amber' : '';
        var chip = r.state === 'completed' ? S.UI.chip('Completed', 'chip-green')
          : r.state === 'missed' ? S.UI.chip('Missed', 'chip-coral')
          : r.state === 'skipped' ? S.UI.chip('Skipped', 'chip-amber')
          : S.UI.chip('Pending', '');
        return '<div class="list-item">' +
          '<div class="list-icon ' + cls + '"><span class="emoji">' + r.icon + '</span></div>' +
          '<div class="grow"><div style="font-weight:800">' + mark + ' ' + S.esc(r.title) + '</div>' +
          '<div class="t-small muted">' + S.esc(r.meta) + (r.extra ? ' · ' + S.esc(r.extra) : '') + '</div></div>' +
          chip + '</div>';
      }).join('') + '</div>';
    },

    gamePerformance: function (patient) {
      var rows = S.Scoring.gameBreakdown(patient).filter(function (b) { return b.plays > 0; });
      if (!rows.length) return S.UI.empty('🧠', 'No activities completed yet', '');
      return S.Charts.hbars(rows.map(function (b) {
        return { label: b.game.name, value: Math.round(b.accuracy * 100) };
      }), { aria: 'Accuracy by activity' });
    },

    sessionsTable: function (patient, limit) {
      var sessions = S.Scoring.sessionsFor(patient.patient_id).slice().reverse().slice(0, limit || 10);
      if (!sessions.length) return S.UI.empty('📋', 'No sessions recorded yet', '');
      return '<div class="table-scroll"><table class="data">' +
        '<thead><tr><th>Activity</th><th>When</th><th>Level</th><th>Score</th><th>Accuracy</th>' +
        '<th>Mistakes</th><th>Avg response</th><th>Status</th></tr></thead><tbody>' +
        sessions.map(function (s) {
          var g = S.M.game(s.game_type);
          return '<tr>' +
            '<td><span class="emoji">' + g.icon + '</span> <b>' + S.esc(g.name) + '</b></td>' +
            '<td class="muted">' + S.esc(S.relativeDay(s.date)) + '</td>' +
            '<td>' + S.esc(S.M.difficulty(s.difficulty).name) + '</td>' +
            '<td><b>' + s.score + '</b></td>' +
            '<td>' + Math.round(s.accuracy * 100) + '%</td>' +
            '<td>' + s.mistakes + '</td>' +
            '<td>' + s.response_time + 's</td>' +
            '<td>' + (s.completion_status === 'completed'
              ? S.UI.chip('Completed', 'chip-green') : S.UI.chip('Partial', 'chip-amber')) + '</td>' +
            '</tr>';
        }).join('') +
        '</tbody></table></div>';
    },

    adherencePanel: function (patient) {
      var ad = S.Reminders.adherence(patient.patient_id, 14);
      var today = S.Reminders.statsOn(patient.patient_id, S.todayISO());
      var series = S.Reminders.adherenceSeries(patient.patient_id, 10).map(function (d) {
        return { label: S.shortDate(d.date).split(' ')[0], value: d.value };
      });
      return '<div class="stack-2">' +
        '<div class="row" style="gap:20px;flex-wrap:wrap">' +
          '<div>' + S.UI.ring(ad.percent, 100, { size: 96, center: ad.percent + '%', fontSize: 22 }) + '</div>' +
          '<div class="grow">' +
            '<div class="t-mini">Reminder adherence · last 14 days</div>' +
            '<div class="t-h2" style="margin-top:4px">' + ad.completed + ' of ' + ad.total + ' completed</div>' +
            '<div class="t-small muted" style="margin-top:6px">Today: ' + today.completed + ' completed · ' +
              today.missed + ' missed · ' + today.upcoming + ' upcoming</div>' +
            '<div style="margin-top:12px">' + S.Charts.strip([
              { value: today.completed, color: 'var(--success)' },
              { value: today.skipped, color: 'var(--amber)' },
              { value: today.missed, color: 'var(--error)' },
              { value: today.upcoming, color: 'var(--divider)' }
            ], { aria: 'Today’s reminder breakdown' }) + '</div>' +
            '<div class="legend" style="margin-top:10px">' +
              '<span><i style="background:var(--success)"></i>Completed</span>' +
              '<span><i style="background:var(--amber)"></i>Skipped</span>' +
              '<span><i style="background:var(--error)"></i>Missed</span>' +
              '<span><i style="background:var(--divider)"></i>Upcoming</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<hr class="divider">' +
        S.Charts.bars(series, { aria: 'Daily reminder completion', max: 100 }) +
        '<p class="t-small muted">Reminder adherence is tracked separately from the Cognitive Activity Score.</p>' +
      '</div>';
    },

    careNotes: function (patient, canAdd) {
      var notes = S.DB.forPatient('care_notes', patient.patient_id)
        .sort(function (a, b) { return a.timestamp < b.timestamp ? 1 : -1; });
      if (!notes.length) {
        return S.UI.empty('📝', 'No care notes yet',
          canAdd ? 'Notes are observations, not diagnoses.' : 'The caregiver has not added notes yet.');
      }
      return notes.map(function (n) {
        return '<div class="note">' +
          '<div class="n-meta">' + S.esc(n.created_by_name || S.titleCase(n.created_by)) + ' · ' + S.esc(S.prettyStamp(n.timestamp)) + '</div>' +
          '<div class="n-body">' + S.esc(n.content) + '</div>' +
          '</div>';
      }).join('');
    },

    moodStrip: function (patient) {
      var moods = S.DB.forPatient('moods', patient.patient_id)
        .sort(function (a, b) { return a.date < b.date ? -1 : 1; }).slice(-7);
      if (!moods.length) return '<p class="t-small muted">No mood check-ins yet.</p>';
      return '<div class="row" style="gap:14px;flex-wrap:wrap">' + moods.map(function (m) {
        var meta = S.M.mood(m.mood);
        return '<div style="text-align:center;min-width:56px">' +
          '<div class="emoji" style="font-size:30px">' + meta.face + '</div>' +
          '<div class="t-small muted">' + S.esc(S.shortDate(m.date)) + '</div></div>';
      }).join('') + '</div>';
    },

    syncPanel: function () {
      var st = S.Sync.status();
      var server = S.Sync.serverStats();
      var local = S.DB.stats();
      return '<div class="stack-1">' +
        '<div class="sync-row"><span>Connection</span><b>' + (st.state === 'offline' ? 'Offline' : st.state === 'syncing' ? 'Syncing…' : 'Online') + '</b></div>' +
        '<div class="sync-row"><span>Pending records</span><b>' + st.pending + '</b></div>' +
        '<div class="sync-row"><span>Last sync</span><b>' + (st.lastSyncedAt ? S.prettyStamp(st.lastSyncedAt) + ' · ' + st.lastSyncedCount + ' rows' : 'not yet this session') + '</b></div>' +
        '<div class="sync-row"><span>Local rows</span><b>' + local.total + ' in ' + local.tables.length + ' tables</b></div>' +
        '<div class="sync-row"><span>Central store</span><b>' + (server.rows === null ? 'FastAPI' : server.rows + ' rows') + '</b></div>' +
        '<div class="sync-row"><span>Transport</span><b>' + S.esc(st.adapter) + (st.simulated ? ' (local simulation)' : '') + '</b></div>' +
        '<div class="row" style="margin-top:14px;gap:10px;flex-wrap:wrap">' +
          '<button class="btn btn-sm" data-act="syncNow"><span class="emoji">🔄</span>Sync now</button>' +
          '<button class="btn btn-secondary btn-sm" data-act="toggleOffline2"><span class="emoji">📶</span>' +
            (st.state === 'offline' ? 'Go online' : 'Simulate offline') + '</button>' +
        '</div>' +
      '</div>';
    }
  };
  S.DashUI = DashUI;

  /* ============================================================
     Reminder editor — shared by caregiver and doctor
     ============================================================ */
  var ReminderForm = {
    open: function (opts) {
      var patient = opts.patient;
      var rem = opts.reminder || null;
      var role = opts.role;
      var actor = { id: S.State.actorId, name: S.State.actorName };
      var onDone = opts.onDone || function () {};

      var cats = role === 'doctor'
        ? ['appointment', 'cognitive', 'medicine', 'exercise', 'rest', 'custom']
        : S.M.REMINDER_CATEGORIES.map(function (c) { return c.id; });

      var days = rem ? (rem.repeat_days || []).slice() : [];

      var body =
        '<div class="form-grid">' +
          '<div class="field full"><label for="rf-title">Reminder title</label>' +
            '<input class="input" id="rf-title" value="' + S.esc(rem ? rem.title : '') + '" placeholder="e.g. Drink water"></div>' +

          '<div class="field full"><label for="rf-desc">Short description (optional)</label>' +
            '<input class="input" id="rf-desc" value="' + S.esc(rem ? rem.description : '') + '" placeholder="e.g. A glass of water"></div>' +

          '<div class="field"><label for="rf-cat">Category</label>' +
            '<select class="select" id="rf-cat">' +
              cats.map(function (id) {
                var c = S.M.reminderCategory(id);
                return '<option value="' + c.id + '"' + (rem && rem.category === c.id ? ' selected' : '') + '>' +
                  c.icon + '  ' + c.name + '</option>';
              }).join('') +
            '</select></div>' +

          '<div class="field"><label for="rf-time">Time</label>' +
            '<input class="input" id="rf-time" type="time" value="' + S.esc(rem ? rem.time : '10:30') + '"></div>' +

          '<div class="field"><label for="rf-repeat">Repeat</label>' +
            '<select class="select" id="rf-repeat">' +
              S.M.REPEATS.map(function (r) {
                return '<option value="' + r.id + '"' + (rem && rem.repeat === r.id ? ' selected' : '') + '>' + r.name + '</option>';
              }).join('') +
            '</select></div>' +

          '<div class="field"><label for="rf-date">Start / on date</label>' +
            '<input class="input" id="rf-date" type="date" value="' + S.esc(rem ? rem.date : S.todayISO()) + '"></div>' +

          '<div class="field full" id="rf-days-wrap" style="display:none"><label>Which days?</label>' +
            '<div class="choice-grid">' +
              ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(function (d, i) {
                return '<button type="button" class="choice" data-day="' + i + '" aria-pressed="' +
                  (days.indexOf(i) !== -1 ? 'true' : 'false') + '">' + d + '</button>';
              }).join('') +
            '</div></div>' +

          '<div class="field"><label for="rf-priority">Priority</label>' +
            '<select class="select" id="rf-priority">' +
              S.M.PRIORITIES.map(function (p) {
                return '<option value="' + p.id + '"' + (rem && rem.priority === p.id ? ' selected' : '') + '>' + p.name + '</option>';
              }).join('') +
            '</select></div>' +

          '<div class="field"><label>Voice reminder</label>' +
            '<label class="toggle"><input type="checkbox" id="rf-voice"' +
              (!rem || rem.voice_enabled ? ' checked' : '') + '><span class="track"></span>' +
              '<span>Read this reminder aloud</span></label></div>' +

          '<div class="full card card-tint" style="padding:14px 16px">' +
            '<div class="t-small"><b>For:</b> ' + S.esc(patient.name) + ' · <b>Created by:</b> ' +
              S.esc(actor.name) + ' (' + S.titleCase(role) + ')</div>' +
            (role === 'doctor'
              ? '<div class="t-small muted" style="margin-top:6px">Reminders are created from an existing care plan or instruction. ' +
                'SMIVAI does not prescribe medication.</div>' : '') +
          '</div>' +
        '</div>';

      S.Modal.open({
        title: rem ? 'Edit reminder' : 'Add reminder',
        subtitle: 'For ' + patient.name,
        body: body,
        footer:
          (rem ? '<button class="btn btn-danger" data-act="del"><span class="emoji">🗑️</span>Delete</button>' : '') +
          '<button class="btn btn-secondary" data-modal-close>Cancel</button>' +
          '<button class="btn" data-act="save"><span class="emoji">✅</span>' + (rem ? 'Save changes' : 'Create reminder') + '</button>',
        onMount: function (root) {
          var repeatSel = S.qs('#rf-repeat', root);
          var daysWrap = S.qs('#rf-days-wrap', root);
          var syncDays = function () {
            daysWrap.style.display = repeatSel.value === 'custom' ? 'flex' : 'none';
          };
          repeatSel.addEventListener('change', syncDays);
          syncDays();
          S.qsa('[data-day]', root).forEach(function (b) {
            b.addEventListener('click', function () {
              var d = parseInt(b.getAttribute('data-day'), 10);
              var i = days.indexOf(d);
              if (i === -1) days.push(d); else days.splice(i, 1);
              b.setAttribute('aria-pressed', days.indexOf(d) !== -1 ? 'true' : 'false');
            });
          });
        },
        handlers: {
          save: function (el) {
            var root = el.closest('.modal');
            var title = S.qs('#rf-title', root).value.trim();
            if (!title) { S.toast('Please enter a reminder title.', 'warn'); return; }
            var payload = {
              patient_id: patient.patient_id,
              title: title,
              description: S.qs('#rf-desc', root).value.trim(),
              category: S.qs('#rf-cat', root).value,
              time: S.qs('#rf-time', root).value || '09:00',
              repeat: S.qs('#rf-repeat', root).value,
              repeat_days: days.slice().sort(),
              date: S.qs('#rf-date', root).value || S.todayISO(),
              priority: S.qs('#rf-priority', root).value,
              voice_enabled: S.qs('#rf-voice', root).checked,
              created_by_role: role,
              created_by_id: actor.id,
              created_by_name: actor.name
            };
            if (payload.repeat === 'custom' && !payload.repeat_days.length) {
              S.toast('Please choose at least one day.', 'warn'); return;
            }
            var made = rem ? S.Reminders.update(rem.reminder_id, payload) : S.Reminders.create(payload);
            if (!rem && made && made.duplicate) {
              S.toast(patient.name.split(' ')[0] + ' already has this reminder at ' + S.prettyTime(payload.time) + '.', 'warn', 4500);
              return;
            }
            S.Modal.close();
            S.toast(rem ? 'Reminder updated for ' + patient.name.split(' ')[0] + '.' :
              'Reminder created for ' + patient.name.split(' ')[0] + ' (at ' + S.prettyTime(payload.time) + ' in their own local time).', 'ok');
            onDone();
          },
          del: function () {
            S.Modal.close();
            S.Modal.confirm({
              title: 'Delete this reminder?',
              message: 'It will stop appearing for ' + patient.name + '. Past history is kept.',
              okText: 'Delete', danger: true
            }).then(function (ok) {
              if (!ok) return;
              S.Reminders.remove(rem.reminder_id);
              S.toast('Reminder deleted.', 'ok');
              onDone();
            });
          }
        }
      });
    }
  };
  S.ReminderForm = ReminderForm;

  /* ============================================================
     Caregiver screens
     ============================================================ */
  var NAV = [
    { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
    { id: 'patients', name: 'Patients', icon: '👥' },
    { id: 'activities', name: 'Activities', icon: '🧠' },
    { id: 'reminders', name: 'Reminders', icon: '🔔' },
    { id: 'memory', name: 'Memory Bank', icon: '❤️' },
    { id: 'alerts', name: 'Alerts & SOS', icon: '🚨' },
    { id: 'guidance', name: 'Doctor guidance', icon: '🩺' },
    { id: 'language', name: 'Language', icon: '🌐' }
  ];

  var Caregiver = {
    tab: 'dashboard',

    TITLES: {
      dashboard: 'Home', patients: 'People I support', activities: 'Progress',
      reminders: 'Reminders', memory: 'Memories', alerts: 'Alerts & SOS',
      guidance: 'Doctor guidance', language: 'Language'
    },

    render: function (tab) {
      var self = this;
      this.tab = tab || 'dashboard';
      var patients = S.State.patients();
      if (!patients.length) return this.welcome();
      var patient = S.State.patient();
      if (!patient || !S.State.assertAccess(patient)) {
        patient = patients[0];
        S.State.setPatient(patient.patient_id);
      }

      /* The patient decides what each caregiver sees (S.Links scopes). */
      var can = function (scope) { return S.Links.allows('caregiver', S.State.actorId, patient.patient_id, scope); };
      var first = String(patient.name).split(' ')[0];
      var locked = function (what) {
        return '<div class="section card">' + S.UI.empty(S.icon('lock'), first + ' has not shared ' + what + ' with you',
          'They can change this in SMIVAI under Caregiver Support → What they can see.') + '</div>';
      };

      var body =
        this.tab === 'dashboard' ? (can('activity') ? this.dashboard(patient)
          : '<div class="section">' + S.UI.sectionTitle('Needs attention') + DashUI.alerts(patient) + '</div>' + locked('progress and activity')) :
        this.tab === 'patients' ? this.patients(patients) :
        this.tab === 'activities' ? (can('activity') ? this.activities(patient) : locked('progress and activity')) :
        this.tab === 'reminders' ? this.reminders(patient) :
        this.tab === 'alerts' ? this.alertsTab(patient) :
        this.tab === 'guidance' ? this.guidance(patient) :
        this.tab === 'language' ? this.language(patient) :
        (can('memories') ? this.memory(patient) : locked('memories'));

      var html =
        '<div class="dash anim-in">' +
          '<div class="dash-head">' +
            '<div><h1>' + S.esc(self.TITLES[this.tab] || 'Caregiver') + '</h1>' +
              '<div class="dh-sub">' + S.esc(S.State.actorName) + ' · ' +
              S.esc(S.Links.forActor('caregiver', S.State.actorId).length + ' of ' + S.Plans.linkLimit('caregiver', S.State.actorId) + ' people · ' +
                (S.Plans.planOf('caregiver', S.State.actorId) === 'premium' ? 'Premium' : 'Free plan')) + '</div></div>' +
            DashUI.nav('caregiver', this.tab, NAV) +
          '</div>' +
          DashUI.patientSwitch(patient, patients,
            '<button class="btn btn-outline btn-sm" data-act="addPatient">' + S.icon('link') + 'Add someone</button>') +
          body +
          S.UI.disclaimer() +
        '</div>';

      S.mount(S.qs('#app'), html, this.handlers(patient, patients));
      S.scrollTop();
    },

    handlers: function (patient, patients) {
      var self = this;
      return {
        nav: function (el) { S.Router.go('#/caregiver/' + el.getAttribute('data-arg')); },
        switch: function (el) { S.State.setPatient(el.value); self.render(self.tab); },
        addPatient: function () { self.addPatient(); },
        openPatient: function (el) { S.State.setPatient(el.getAttribute('data-arg')); S.Router.go('#/caregiver/dashboard'); },

        addReminder: function () {
          S.ReminderForm.open({ patient: patient, role: 'caregiver', onDone: function () { self.render(self.tab); } });
        },
        editReminder: function (el) {
          S.ReminderForm.open({
            patient: patient, role: 'caregiver',
            reminder: S.DB.find('reminders', el.getAttribute('data-arg')),
            onDone: function () { self.render(self.tab); }
          });
        },
        toggleReminder: function (el) {
          var r = S.DB.find('reminders', el.getAttribute('data-arg'));
          S.Reminders.setStatus(r.reminder_id, r.status === 'paused' ? 'active' : 'paused');
          S.toast(r.status === 'paused' ? 'Reminder resumed.' : 'Reminder paused.', 'ok');
          self.render(self.tab);
        },
        markDone: function (el) {
          S.Reminders.mark(el.getAttribute('data-arg'), S.todayISO(), 'completed', 'caregiver');
          S.toast('Marked as completed.', 'ok');
          self.render(self.tab);
        },
        suggest: function (el) {
          var s = S.M.SUGGESTIONS[parseInt(el.getAttribute('data-arg'), 10)];
          S.ReminderForm.open({
            patient: patient, role: 'caregiver',
            reminder: S.M.newReminder({
              patient_id: patient.patient_id, title: s.title, description: s.description,
              category: s.category, time: s.time, repeat: s.repeat
            }),
            onDone: function () { self.render(self.tab); }
          });
          // The suggestion only pre-fills the form — nothing is created until
          // the user presses Create.
          var modal = S.qs('.modal');
          if (modal) {
            var foot = S.qs('.modal-foot .btn-danger', modal);
            if (foot) foot.parentNode.removeChild(foot);
          }
        },

        addMemory: function () { self.memoryForm(patient, null); },
        editMemory: function (el) { self.memoryForm(patient, S.DB.find('memory_bank', el.getAttribute('data-arg'))); },
        delMemory: function (el) {
          var m = S.DB.find('memory_bank', el.getAttribute('data-arg'));
          S.Modal.confirm({
            title: 'Remove this memory?',
            message: '“' + m.title + '” will be removed from ' + patient.name + '’s Memory Bank and from My Memories activities.',
            okText: 'Remove', danger: true
          }).then(function (ok) {
            if (!ok) return;
            S.DB.remove('memory_bank', m.memory_id);
            S.toast('Memory removed.', 'ok');
            self.render('memory');
          });
        },

        addContact: function () { self.contactForm(patient); },
        delContact: function (el) {
          S.DB.remove('contacts', el.getAttribute('data-arg'));
          S.toast('Contact removed.', 'ok');
          self.render('memory');
        },

        addNote: function () { self.noteForm(patient); },

        setLang: function (el) {
          S.DB.update('patients', patient.patient_id, { language: el.getAttribute('data-arg'), language_confirmed: true });
          S.toast(patient.name.split(' ')[0] + ' will now see SMIVAI in ' +
            S.I18N.lang(el.getAttribute('data-arg')).name + '.', 'ok');
          self.render('language');
        },
        saveCreds: function (el) {
          var root = el.closest('.dash');
          S.LangService.setCreds({
            userId: S.qs('#lg-user', root).value.trim(),
            ulcaApiKey: S.qs('#lg-key', root).value.trim(),
            bhashiniPipelineId: S.qs('#lg-pipe', root).value.trim(),
            ai4bharatBase: S.qs('#lg-ai4b', root).value.trim(),
            ttsGender: S.qs('#lg-gender', root).value
          });
          S.toast('Language service settings saved.', 'ok');
          self.render('language');
        },
        testLang: function () { self.testLanguageService(patient.language); },
        pretranslate: function () { self.pretranslate(patient.language); },
        exportLang: function () { self.exportTranslations(patient.language); },
        syncNow: function () { S.Sync.flush().then(function () { self.render(self.tab); }); },
        toggleOffline2: function () { S.Sync.setOffline(!S.Sync.forcedOffline); self.render(self.tab); },
        exportData: function () { self.exportData(); },
        ackAlert: function (el, ev, id) {
          var alert = S.DB.find('alerts', id);
          S.Services.Emergency.resolve(id, S.State.actorId);
          S.Services.Notify.push({ recipient_role: 'patient', recipient_id: alert.patient_id, patient_id: alert.patient_id,
            kind: 'sos', title: S.State.actorName + ' is on the way', body: 'Your caregiver saw your alert and has responded.', link: '#/patient/home' });
          S.toast('Marked as responded. ' + (S.DB.find('patients', alert.patient_id) || {}).name + ' has been told.', 'ok');
          self.render(self.tab);
        },
        acceptReq: function (el, ev, id) {
          var req = S.DB.update('care_requests', id, { status: 'accepted', accepted_by: S.State.actorId });
          S.Services.Notify.push({ recipient_role: 'patient', recipient_id: req.patient_id, patient_id: req.patient_id,
            kind: 'request', title: 'Your request was accepted', body: S.State.actorName + ' will come on ' + S.prettyDate(req.date) + ' at ' + S.prettyTime(req.time) + '.', link: '#/patient/caregiver' });
          S.toast('Accepted — they have been told.', 'ok');
          self.render(self.tab);
        }
      };
    },

    /* ---------------- Dashboard ---------------- */
    dashboard: function (patient) {
      var cas = S.Scoring.cognitiveActivityScore(patient.patient_id);
      var plan = S.Plan.progress(patient);
      var today = S.Reminders.statsOn(patient.patient_id, S.todayISO());
      var series = S.Scoring.scoreSeries(patient.patient_id, 14);
      var breakdown = S.Scoring.gameBreakdown(patient).filter(function (b) { return b.plays; });
      var trend = S.Scoring.trendLabel(cas.trend);

      return '' +
        '<div class="section">' + S.UI.sectionTitle('Needs attention') + DashUI.alerts(patient) + '</div>' +

        '<div class="section stat-grid">' +
          S.UI.stat('Today’s progress', plan.done + ' / ' + plan.total, 'activities completed') +
          S.UI.stat('Cognitive Activity Score', cas.empty ? '—' : String(cas.score),
            cas.empty ? 'no activity yet' : '<span class="trend ' + trend.cls + '">' + trend.icon + ' ' + trend.text + '</span>',
            cas.empty ? '' : '/100') +
          S.UI.stat('Reminders today', today.completed + ' / ' + today.total,
            today.missed ? today.missed + ' missed' : 'none missed') +
          S.UI.stat('Average accuracy', cas.empty ? '—' : Math.round(cas.accuracy * 100) + '%', 'last ' + cas.sessions + ' activities') +
        '</div>' +

        '<div class="section grid-sidebar">' +
          '<div class="card">' +
            '<div class="card-head"><div class="card-title">Cognitive Activity Score · last 14 days</div>' +
              S.UI.chip(cas.empty ? 'No data' : cas.score + ' / 100', 'chip-green') + '</div>' +
            S.Charts.line(series, { aria: 'Cognitive Activity Score trend', lastLabel: cas.empty ? '' : 'Latest ' + cas.score }) +
            '<p class="t-small muted" style="margin-top:10px">This score reflects recent activity performance and engagement. ' +
              'It is not a medical or diagnostic score.</p>' +
          '</div>' +
          '<div class="card">' +
            '<div class="card-title" style="margin-bottom:12px">Mood check-ins</div>' +
            DashUI.moodStrip(patient) +
            '<hr class="divider">' +
            '<div class="card-title" style="margin-bottom:10px">Patient</div>' +
            '<div class="t-small muted">Age ' + patient.age + ' · ' + S.esc(S.I18N.lang(patient.language).name) +
              (patient.district ? ' · ' + S.esc(patient.district) : '') + '</div>' +
            '<div class="t-small muted" style="margin-top:6px">ID ' + S.esc(patient.patient_id) + '</div>' +
          '</div>' +
        '</div>' +

        '<div class="section grid-2">' +
          '<div class="card"><div class="card-title" style="margin-bottom:12px">Today’s activity</div>' +
            DashUI.todayList(patient) + '</div>' +
          '<div class="card"><div class="card-title" style="margin-bottom:12px">Accuracy by activity</div>' +
            DashUI.gamePerformance(patient) +
            (breakdown.length ? '<p class="t-small muted" style="margin-top:10px">Average across ' +
              S.sum(breakdown.map(function (b) { return b.plays; })) + ' completed activities.</p>' : '') +
          '</div>' +
        '</div>' +

        '<div class="section grid-2">' +
          '<div class="card">' +
            '<div class="card-head"><div class="card-title">Care notes</div>' +
              '<button class="btn btn-sm btn-secondary" data-act="addNote"><span class="emoji">➕</span>Add note</button></div>' +
            DashUI.careNotes(patient, true) +
          '</div>' +
          '<div class="card">' +
            '<div class="card-title" style="margin-bottom:12px">Device &amp; sync</div>' +
            DashUI.syncPanel() +
          '</div>' +
        '</div>';
    },

    /* ---------------- Patients ---------------- */
    patients: function (patients) {
      return '<div class="section">' +
        S.UI.sectionTitle('Patients you support',
          '<button class="btn btn-sm" data-act="addPatient"><span class="emoji">➕</span>Add patient</button>') +
        '<div class="grid-3">' +
          patients.map(function (p) {
            var cas = S.Scoring.cognitiveActivityScore(p.patient_id);
            var plan = S.Plan.progress(p);
            var ad = S.Reminders.adherence(p.patient_id, 14);
            var t = S.Scoring.trendLabel(cas.trend);
            var series = S.Scoring.scoreSeries(p.patient_id, 10).map(function (d) { return d.value; });
            return '<div class="card">' +
              '<div class="row" style="gap:14px">' + S.UI.avatar(p.name, null, p) +
                '<div class="grow"><div style="font-weight:800;font-size:18px">' + S.esc(p.name) + '</div>' +
                '<div class="t-small muted">' + p.age + ' years · ' + S.esc(S.I18N.lang(p.language).name) + '</div></div>' +
              '</div>' +
              '<hr class="divider">' +
              '<div class="row between"><span class="t-small muted">Cognitive Activity Score</span>' +
                '<b style="font-size:20px">' + (cas.empty ? '—' : cas.score) + '</b></div>' +
              '<div style="margin:8px 0">' + S.Charts.spark(series, { width: 240, height: 38 }) + '</div>' +
              '<div class="row between"><span class="t-small muted">Trend</span>' +
                '<span class="trend ' + t.cls + '">' + t.icon + ' ' + t.text + '</span></div>' +
              '<div class="row between" style="margin-top:6px"><span class="t-small muted">Today’s activities</span>' +
                '<b>' + plan.done + ' / ' + plan.total + '</b></div>' +
              '<div class="row between" style="margin-top:6px"><span class="t-small muted">Reminder adherence</span>' +
                '<b>' + ad.percent + '%</b></div>' +
              '<button class="btn btn-block btn-secondary" style="margin-top:16px" data-act="openPatient" data-arg="' +
                S.esc(p.patient_id) + '"><span class="emoji">📋</span>Open dashboard</button>' +
              '</div>';
          }).join('') +
        '</div>' +
        '<div class="section card">' +
          '<div class="card-title" style="margin-bottom:10px">Data separation</div>' +
          '<p class="t-small muted">Every activity, reminder, memory, mood and note is stored against a single ' +
            '<b>patient_id</b>. Switching patient re-reads every panel from that id — no record is shared between patients. ' +
            'Caregivers see only patients assigned to them; doctors see only their own patients.</p>' +
          '<div class="row" style="margin-top:14px;gap:10px;flex-wrap:wrap">' +
            '<button class="btn btn-sm btn-secondary" data-act="exportData"><span class="emoji">⬇️</span>Export local data (JSON)</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    },

    /* ---------------- Alerts & SOS ---------------- */
    alertsTab: function (patient) {
      var ids = {};
      S.Links.forActor('caregiver', S.State.actorId).forEach(function (l) { ids[l.patient_id] = true; });
      var alerts = S.DB.where('alerts', function (a) { return ids[a.patient_id]; })
        .sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; });
      var requests = S.DB.where('care_requests', function (r) { return ids[r.patient_id]; })
        .sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; });
      var notes = S.Services.Notify.forMe().slice(0, 10);

      function who(id) { return (S.DB.find('patients', id) || {}).name || 'Patient'; }

      return '<div class="section">' + S.UI.sectionTitle('Emergency alerts') +
          (alerts.length
            ? '<div class="stack stack-2">' + alerts.slice(0, 8).map(function (a) {
                var open = a.status === 'open';
                return '<div class="alert ' + (open ? 'attention' : 'info') + '">' +
                  '<span class="al-ico">' + S.icon(open ? 'sos' : 'checkCircle') + '</span><div class="grow">' +
                  '<div class="al-title">' + S.esc(a.title) + '</div>' +
                  '<div class="al-body">' + S.esc(a.body) + ' · ' + S.esc(S.prettyStamp(a.created_at)) + '</div>' +
                  (open ? '<div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap">' +
                    '<button class="btn btn-sm" data-act="ackAlert" data-arg="' + S.esc(a.alert_id) + '">' + S.icon('check') + 'I have responded</button>' +
                    '<a class="btn btn-sm btn-outline" href="tel:112">' + S.icon('phone') + 'Call 112</a></div>' : '') +
                  '</div></div>';
              }).join('') + '</div>'
            : '<div class="alert info"><span class="al-ico">' + S.icon('checkCircle') + '</span><div>' +
              '<div class="al-title">No emergency alerts</div><div class="al-body">You will see an alert here the moment someone presses SOS.</div></div></div>') +
        '</div>' +

        '<div class="section grid-2">' +
          '<div class="card"><div class="card-title" style="margin-bottom:12px">Help requested at home</div>' +
            (requests.length
              ? '<div class="list">' + requests.slice(0, 8).map(function (r) {
                  var sv = S.Wellness.CARE_SERVICES.filter(function (s2) { return s2.id === r.service; })[0] || { name: r.service, icon: 'users' };
                  return '<div class="list-item"><span class="list-icon peach">' + S.icon(sv.icon) + '</span>' +
                    '<div class="grow"><b>' + S.esc(sv.name) + '</b><div class="t-small muted">' + S.esc(who(r.patient_id) + ' · ' + S.prettyDate(r.date) + ' ' + S.prettyTime(r.time)) + '</div>' +
                    (r.note ? '<div class="t-small">' + S.esc(r.note) + '</div>' : '') + '</div>' +
                    (r.status === 'open'
                      ? '<button class="btn btn-sm" data-act="acceptReq" data-arg="' + S.esc(r.request_id) + '">' + S.icon('check') + 'Accept</button>'
                      : S.UI.chip(S.titleCase(r.status), r.status === 'accepted' ? 'chip-green' : 'chip-coral')) +
                    '</div>';
                }).join('') + '</div>'
              : S.UI.empty(S.icon('users'), 'No requests', 'Requests for a visit or errand appear here.')) +
          '</div>' +
          '<div class="card"><div class="card-title" style="margin-bottom:12px">Recent updates</div>' +
            (notes.length
              ? '<div class="list">' + notes.map(function (n) {
                  return '<div class="list-item"><span class="list-icon blue">' + S.icon('bell') + '</span>' +
                    '<div class="grow"><b>' + S.esc(n.title) + '</b><div class="t-small muted">' + S.esc(n.body) + '</div>' +
                    '<div class="t-mini">' + S.esc(S.prettyStamp(n.created_at)) + '</div></div></div>';
                }).join('') + '</div>'
              : S.UI.empty(S.icon('bell'), 'Nothing new', '')) +
          '</div>' +
        '</div>';
    },

    /* ---------------- Doctor guidance ---------------- */
    guidance: function (patient) {
      var today = S.todayISO();
      var appts = S.DB.forPatient('appointments', patient.patient_id).sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
      var upcoming = appts.filter(function (a) { return a.date >= today && S.M.apptOpen(a); });
      var past = appts.filter(function (a) { return a.date < today || a.status === 'completed'; }).reverse();
      var docNotes = S.DB.forPatient('care_notes', patient.patient_id).filter(function (n) { return n.created_by_name && /^Dr/i.test(n.created_by_name); });
      var doctorReminders = S.Reminders.forPatient(patient.patient_id).filter(function (r) { return r.created_by_role === 'doctor'; });
      var healthShared = S.Links.allows('caregiver', S.State.actorId, patient.patient_id, 'health');
      var orders = healthShared ? S.DB.forPatient('orders', patient.patient_id).sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; }) : [];

      return '<div class="section grid-2">' +
          '<div class="card"><div class="card-title" style="margin-bottom:12px">Appointments</div>' +
            (upcoming.length || past.length
              ? '<div class="list">' + upcoming.concat(past.slice(0, 4)).map(function (a) {
                  return '<div class="list-item"><span class="list-icon blue">' + S.icon('stethoscope') + '</span>' +
                    '<div class="grow"><b>' + S.esc(a.doctor_name) + '</b><div class="t-small muted">' +
                    S.esc(S.prettyDate(a.date) + ' · ' + S.prettyTime(a.time) + ' · ' + S.titleCase(a.mode)) + '</div></div>' +
                    S.UI.chip(S.titleCase(a.status), a.status === 'confirmed' ? 'chip-green' : a.status === 'cancelled' ? 'chip-coral' : '') + '</div>';
                }).join('') + '</div>'
              : S.UI.empty(S.icon('calendar'), 'No appointments', '')) +
          '</div>' +
          '<div class="card"><div class="card-title" style="margin-bottom:12px">From the doctor</div>' +
            (docNotes.length
              ? docNotes.slice(0, 6).map(function (n) {
                  return '<div class="note"><div class="n-meta">' + S.esc(n.created_by_name + ' · ' + S.prettyStamp(n.timestamp)) + '</div>' +
                    '<div class="n-body">' + S.esc(n.content) + '</div></div>';
                }).join('')
              : S.UI.empty(S.icon('note'), 'No notes from the doctor yet', '')) +
            (doctorReminders.length
              ? '<hr class="divider"><div class="card-title" style="margin-bottom:10px">Care-plan reminders set by the doctor</div>' +
                '<div class="list">' + doctorReminders.map(function (r) {
                  return '<div class="list-item"><span class="list-icon blue">' + S.icon(S.M.reminderCategory(r.category).ico) + '</span>' +
                    '<div class="grow"><b>' + S.esc(r.title) + '</b><div class="t-small muted">' + S.esc(S.prettyTime(r.time) + ' · ' + S.Reminders.repeatText(r)) + '</div></div></div>';
                }).join('') + '</div>'
              : '') +
          '</div>' +
        '</div>' +
        '<div class="section card"><div class="card-title" style="margin-bottom:12px">Medicine orders (demo — no pharmacy is connected)</div>' +
          (orders.length
            ? '<div class="list">' + orders.slice(0, 5).map(function (o) {
                return '<div class="list-item"><span class="list-icon green">' + S.icon('truck') + '</span>' +
                  '<div class="grow"><b>' + S.esc(o.items.map(function (i) { return i.name + (i.qty > 1 ? ' ×' + i.qty : ''); }).join(', ')) + '</b>' +
                  '<div class="t-small muted">' + S.esc(S.prettyStamp(o.created_at) + ' · ' + o.reference) + '</div></div>' +
                  S.UI.chip(o.status === 'demo' || o.status === 'placed' ? 'Demo · not sent' : S.titleCase(o.status), '') + '</div>';
              }).join('') + '</div>'
            : healthShared ? S.UI.empty(S.icon('pill'), 'No orders yet', '')
              : S.UI.empty(S.icon('lock'), String(patient.name).split(' ')[0] + ' has not shared health records with you', '')) +
        '</div>';
    },

    /* ---------------- Activities ---------------- */
    activities: function (patient) {
      var breakdown = S.Scoring.gameBreakdown(patient);
      var profile = S.Adaptive.profile(patient);
      var summary = S.Scoring.summary(patient);

      return S.UI.progressDisclaimer() +
        '<div class="section stat-grid">' +
          S.UI.stat('Activities completed', String(summary.plays), 'all time') +
          S.UI.stat('Average accuracy', Math.round(summary.accuracy * 100) + '%', 'last 20 activities') +
          S.UI.stat('Average response', summary.responseTime + 's', 'per action') +
          S.UI.stat('Average mistakes', String(summary.mistakes), 'per activity') +
        '</div>' +

        '<div class="section grid-2">' +
          '<div class="card"><div class="card-title" style="margin-bottom:12px">Performance by activity</div>' +
            '<div class="table-scroll"><table class="data">' +
              '<thead><tr><th>Activity</th><th>Played</th><th>Accuracy</th><th>Avg score</th><th>Response</th><th>Level</th></tr></thead>' +
              '<tbody>' + breakdown.map(function (b) {
                return '<tr><td><span class="emoji">' + b.game.icon + '</span> <b>' + S.esc(b.game.name) + '</b>' +
                  '<div class="t-small muted">' + S.esc(b.game.domain) + '</div></td>' +
                  '<td>' + b.plays + '</td>' +
                  '<td>' + (b.plays ? Math.round(b.accuracy * 100) + '%' : '—') + '</td>' +
                  '<td>' + (b.plays ? b.score : '—') + '</td>' +
                  '<td>' + (b.plays ? b.rt + 's' : '—') + '</td>' +
                  '<td>' + (b.level ? S.UI.chip(S.M.difficulty(b.level).name, 'chip-green') : '—') + '</td></tr>';
              }).join('') + '</tbody></table></div>' +
          '</div>' +

          '<div class="card"><div class="card-title" style="margin-bottom:6px">Personalised difficulty</div>' +
            '<p class="t-small muted" style="margin-bottom:14px">Each activity keeps its own ability estimate (Rasch / IRT), ' +
              'shown ± one standard error and marked provisional until there are enough answers. ' +
              'Levels move one step at a time; a level fixed by choice does not move.</p>' +
            '<div class="table-scroll"><table class="data">' +
              '<thead><tr><th>Activity</th><th>Level served</th><th>Ability (θ)</th><th>Expected success</th></tr></thead>' +
              '<tbody>' + profile.map(function (r) {
                return '<tr><td><span class="emoji">' + r.game.icon + '</span> ' + S.esc(r.game.name) + '</td>' +
                  '<td>' + S.UI.chip(S.M.difficulty(r.level).name, 'chip-green') +
                    (r.locked ? ' ' + S.UI.chip('Fixed by choice', '') : '') + '</td>' +
                  '<td>' + S.esc(S.Adaptive.thetaText(r)) + '</td>' +
                  '<td>' + (r.plays ? r.expected + '%' : '—') + '</td></tr>';
              }).join('') + '</tbody></table></div>' +
          '</div>' +
        '</div>' +

        '<div class="section card">' +
          '<div class="card-head"><div class="card-title">Activity history</div>' +
            S.UI.chip(S.plural(S.Scoring.sessionsFor(patient.patient_id).length, 'session'), '') + '</div>' +
          DashUI.sessionsTable(patient, 25) +
        '</div>';
    },

    /* ---------------- Reminders ---------------- */
    reminders: function (patient) {
      var rems = S.Reminders.forPatient(patient.patient_id);
      var today = S.Reminders.statsOn(patient.patient_id, S.todayISO());

      return '<div class="section stat-grid">' +
          S.UI.stat('Today’s reminders', String(today.total), 'scheduled') +
          S.UI.stat('Completed', String(today.completed), 'today') +
          S.UI.stat('Missed', String(today.missed), 'today') +
          S.UI.stat('Completion', today.completion + '%', 'of decided reminders today') +
        '</div>' +

        '<div class="section grid-sidebar">' +
          '<div class="card">' +
            '<div class="card-head"><div class="card-title">Reminder management</div>' +
              '<button class="btn btn-sm" data-act="addReminder"><span class="emoji">➕</span>Add reminder</button></div>' +
            (rems.length
              ? rems.map(function (r) {
                  var cat = S.M.reminderCategory(r.category);
                  var st = S.Reminders.statusOn(r, S.todayISO());
                  var occursToday = S.Reminders.occursOn(r, S.todayISO());
                  var chip = S.Reminders.statusChip(st);
                  return '<div class="rem-row ' + (r.status === 'paused' ? 'paused' : '') + '">' +
                    '<div class="rr-ico emoji">' + cat.icon + '</div>' +
                    '<div class="grow">' +
                      '<div class="rr-title">' + S.esc(r.title) +
                        (r.priority === 'important' ? ' ' + S.UI.chip('Important', 'chip-amber', '★') : '') + '</div>' +
                      '<div class="rr-meta">' + S.esc(S.prettyTime(r.time)) + ' · ' + S.esc(S.Reminders.repeatText(r)) +
                        ' · by ' + S.esc(r.created_by_name) + ' (' + S.esc(S.titleCase(r.created_by_role)) + ')' +
                        (r.voice_enabled ? ' · 🔊 voice on' : '') + '</div>' +
                      '<div class="row" style="gap:8px;margin-top:6px">' +
                        (occursToday ? S.UI.chip(chip.text, chip.cls, chip.icon) : S.UI.chip('Not today', '')) +
                        (r.status === 'paused' ? S.UI.chip('Paused', 'chip-amber') : '') +
                      '</div>' +
                    '</div>' +
                    '<div class="rr-actions">' +
                      (occursToday && st !== 'completed'
                        ? '<button class="btn btn-sm btn-secondary" data-act="markDone" data-arg="' + S.esc(r.reminder_id) + '">✓ Mark done</button>' : '') +
                      '<button class="btn btn-sm btn-secondary" data-act="editReminder" data-arg="' + S.esc(r.reminder_id) + '">Edit</button>' +
                      '<button class="btn btn-sm btn-secondary" data-act="toggleReminder" data-arg="' + S.esc(r.reminder_id) + '">' +
                        (r.status === 'paused' ? 'Resume' : 'Pause') + '</button>' +
                    '</div>' +
                  '</div>';
                }).join('')
              : S.UI.empty('🔔', 'No reminders yet',
                  'Add the first reminder for ' + patient.name.split(' ')[0] + '.',
                  '<button class="btn" data-act="addReminder"><span class="emoji">➕</span>Add reminder</button>')) +

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
            '<div class="card-title" style="margin-bottom:14px">Reminder insights</div>' +
            DashUI.adherencePanel(patient) +
          '</div>' +
        '</div>';
    },

    /* ---------------- Memory Bank ---------------- */
    memory: function (patient) {
      /* photos load after paint */
      setTimeout(function () { S.Media.hydrate(S.qs('#app')); }, 0);
      var mems = S.DB.forPatient('memory_bank', patient.patient_id);
      var contacts = S.DB.forPatient('contacts', patient.patient_id);
      var routines = S.DB.forPatient('routines', patient.patient_id)
        .sort(function (a, b) { return S.minutesOf(a.time) - S.minutesOf(b.time); });
      var byCat = {};
      mems.forEach(function (m) { (byCat[m.category] = byCat[m.category] || []).push(m); });

      return '<div class="section">' +
          S.UI.sectionTitle('Memory Bank · ' + patient.name,
            '<button class="btn btn-sm" data-act="addMemory"><span class="emoji">➕</span>Add memory</button>') +
          '<div class="card card-tint" style="margin-bottom:16px">' +
            '<p class="t-small"><b>These entries power the My Memories activity.</b> ' +
            'Add favourite foods, family members and important places, and the questions ' +
            'in that activity are built from them straight away. Entries belong to this patient only.</p>' +
          '</div>' +
          (mems.length
            ? S.M.MEMORY_CATEGORIES.filter(function (c) { return byCat[c.id]; }).map(function (c) {
                return '<div class="mem-cat-head" style="margin-top:24px"><span class="mch-ico emoji">' + c.icon + '</span>' +
                  '<h3 class="t-h3">' + S.esc(c.name) + '</h3>' +
                  S.UI.chip(String(byCat[c.id].length), '') + '</div>' +
                  '<div class="grid-3">' + byCat[c.id].map(function (m) {
                    var thumb = S.Media.memoryImg(m, m.title);
                    return '<div class="card card-pad-sm">' +
                      (thumb ? '<div class="cg-thumb has-photo">' + thumb + '</div>' : '') +
                      '<div class="row" style="gap:12px">' +
                        '<div class="list-icon green"><span class="emoji">' + (m.icon || c.icon) + '</span></div>' +
                        '<div class="grow"><div style="font-weight:800">' + S.esc(m.title) + '</div>' +
                        '<div class="t-small muted">' + S.esc(m.content) + '</div></div>' +
                      '</div>' +
                      '<div class="row" style="gap:8px;margin-top:12px">' +
                        '<button class="btn btn-sm btn-secondary" data-act="editMemory" data-arg="' + S.esc(m.memory_id) + '">Edit</button>' +
                        '<button class="btn btn-sm btn-danger" data-act="delMemory" data-arg="' + S.esc(m.memory_id) + '">Remove</button>' +
                      '</div></div>';
                  }).join('') + '</div>';
              }).join('')
            : S.UI.empty('❤️', 'Memory Bank is empty',
                'Add a few people, places and favourite foods.',
                '<button class="btn" data-act="addMemory"><span class="emoji">➕</span>Add memory</button>')) +
        '</div>' +

        '<div class="section grid-2">' +
          '<div class="card">' +
            '<div class="card-head"><div class="card-title">Family &amp; emergency contacts</div>' +
              '<button class="btn btn-sm btn-secondary" data-act="addContact"><span class="emoji">➕</span>Add</button></div>' +
            (contacts.length ? '<div class="list">' + contacts.map(function (c) {
              return '<div class="list-item">' +
                '<div class="list-icon green">' + S.esc(S.initials(c.name)) + '</div>' +
                '<div class="grow"><div style="font-weight:800">' + S.esc(c.name) + '</div>' +
                '<div class="t-small muted">' + S.esc(c.relation) + ' · ' + S.esc(c.phone) +
                (c.is_emergency ? ' · first to call' : '') + '</div></div>' +
                '<button class="btn btn-sm btn-danger" data-act="delContact" data-arg="' + S.esc(c.contact_id) + '">Remove</button>' +
                '</div>';
            }).join('') + '</div>' : S.UI.empty('📞', 'No contacts yet', '')) +
          '</div>' +

          '<div class="card">' +
            '<div class="card-title" style="margin-bottom:12px">Daily routine</div>' +
            (routines.length ? '<div class="timeline">' + routines.map(function (r) {
              return '<div class="tl-item"><div class="tl-time" style="font-size:14px">' + S.esc(S.prettyTime(r.time)) + '</div>' +
                '<div class="tl-name" style="font-size:16px"><span class="emoji">' + r.icon + '</span> ' + S.esc(r.title) + '</div></div>';
            }).join('') + '</div>' : S.UI.empty('🕐', 'No routine set', '')) +
            '<p class="t-small muted" style="margin-top:12px">The patient sees this as a simple timeline on the Reminders screen.</p>' +
          '</div>' +
        '</div>';
    },

    /** Nothing linked yet — the first thing a new caregiver sees. */
    welcome: function () {
      var self = this;
      var limit = S.Plans.linkLimit('caregiver', S.State.actorId);
      S.mount(S.qs('#app'),
        '<div class="dash anim-in"><div class="page-hero tone-peach">' +
          '<div class="grow"><h1>Welcome, ' + S.esc(String(S.State.actorName).split(' ')[0]) + '</h1>' +
          '<p>Ask the person you look after to open <b>Caregiver Support</b> in SMIVAI and read you their care code. ' +
          'Your plan lets you support up to ' + limit + ' ' + (limit === 1 ? 'person' : 'people') + '.</p>' +
          '<button class="btn btn-lg" data-act="addPatient">' + S.icon('link') + 'Add someone with their care code</button></div>' +
          '<div class="ph-art">' + S.Art.caregiver() + '</div></div>' +
          S.UI.disclaimer() + '</div>',
        { addPatient: function () { self.addPatient(); } });
      S.scrollTop();
    },

    /* ---------------- Forms ---------------- */
    addPatient: function () {
      var self = this;
      var limit = S.Plans.linkLimit('caregiver', S.State.actorId);
      var used = S.Links.forActor('caregiver', S.State.actorId).length;
      if (used >= limit) {
        S.Premium.locked('Supporting more than ' + limit + ' people');
        return;
      }
      S.Modal.open({
        title: 'Add someone to support',
        subtitle: used + ' of ' + limit + ' places used on your ' + (S.Plans.planOf('caregiver', S.State.actorId) === 'premium' ? 'Premium' : 'Free') + ' plan.',
        body:
          '<div class="card card-tint card-flat" style="margin-bottom:18px">' +
            '<div class="card-title" style="margin-bottom:8px">' + S.icon('link') + ' Join with a care code</div>' +
            '<p class="t-small muted" style="margin-bottom:10px">The person you support finds this in SMIVAI under Caregiver Support. ' +
              'Linking needs their code — a caregiver can never search for a patient.</p>' +
            '<div class="row"><input class="input grow" id="np-code" placeholder="SMV-XXXXXX" style="text-transform:uppercase">' +
            '<button class="btn" data-act="join">' + S.icon('check') + 'Join</button></div>' +
            '<div class="err" id="np-err" role="alert" hidden style="margin-top:10px"></div>' +
          '</div>' +
          '<div class="t-mini" style="margin:18px 0 10px">Or set up a new person on this device</div>' +
          '<div class="form-grid">' +
            '<div class="field full"><label for="np-name">Full name</label><input class="input" id="np-name" placeholder="e.g. Hemanta Baruah"></div>' +
            '<div class="field"><label for="np-age">Age</label><input class="input" id="np-age" type="number" min="40" max="110" value="70"></div>' +
            '<div class="field"><label for="np-lang">Preferred language</label><select class="select" id="np-lang">' +
              '<optgroup label="North-East India">' +
                S.I18N.forPicker().ner.map(function (l) {
                  return '<option value="' + l.code + '">' + l.native + ' — ' + l.name +
                    (l.community ? ' (text only)' : '') + '</option>';
                }).join('') +
              '</optgroup><optgroup label="Other">' +
                S.I18N.forPicker().other.map(function (l) {
                  return '<option value="' + l.code + '">' + l.native + ' — ' + l.name + '</option>';
                }).join('') +
              '</optgroup>' +
            '</select>' +
            '<p class="t-small muted">Everything the patient reads and hears uses this language.</p></div>' +
            '<div class="field full"><label for="np-district">District / place</label><input class="input" id="np-district" placeholder="e.g. Dibrugarh, Assam"></div>' +
          '</div>',
        footer: '<button class="btn btn-outline" data-modal-close>Cancel</button>' +
                '<button class="btn" data-act="save">' + S.icon('plus') + 'Create profile</button>',
        handlers: {
          join: function (el) {
            var root = el.closest('.modal');
            var err = S.qs('#np-err', root);
            var code = S.qs('#np-code', root).value;
            el.disabled = true;
            S.Links.join('caregiver', S.State.actorId, code).then(function (res) {
              el.disabled = false;
              if (!res.ok) {
                err.textContent = res.error; err.hidden = false;
                if (res.limit) setTimeout(function () { S.Modal.close(); S.Premium.locked('Supporting more people'); }, 1200);
                return;
              }
              S.State.setPatient(res.patient.patient_id);
              S.Modal.close();
              S.toast('You are now supporting ' + res.patient.name + '.', 'ok');
              self.render('dashboard');
            });
          },
          save: function (el) {
            var root = el.closest('.modal');
            var name = S.qs('#np-name', root).value.trim();
            if (!name) { S.toast('Please enter a name.', 'warn'); return; }
            var srv = S.Auth.session();
            if (S.CONFIG.apiBase && srv && srv.mode === 'server') {
              /* The server never lets a caregiver create someone else's account:
                 the person signs up (or is helped to) and shares their care code. */
              S.toast('With the SMIVAI server on, the person signs up on their own device and reads you their care code.', 'warn', 6000);
              return;
            }
            var p = S.M.newPatient({
              name: name,
              age: parseInt(S.qs('#np-age', root).value, 10) || 70,
              language: S.qs('#np-lang', root).value,
              language_confirmed: true,
              district: S.qs('#np-district', root).value.trim(),
              caregiver_id: null,
              doctor_id: null
            });
            p.share_code = S.Plans.makeShareCode(p.patient_id);
            S.DB.insert('patients', p);
            S.Links.add('caregiver', S.State.actorId, p);
            S.State.setPatient(p.patient_id);
            S.Modal.close();
            S.toast(name + ' added.', 'ok');
            self.render('dashboard');
          }
        }
      });
    },

    memoryForm: function (patient, mem) {
      var self = this;
      var pendingPhoto = null;
      S.Modal.open({
        title: mem ? 'Edit memory' : 'Add memory',
        subtitle: 'For ' + patient.name + ' · used in the My Memories activity',
        body: '<div class="form-grid">' +
            '<div class="field"><label for="mm-cat">Category</label><select class="select" id="mm-cat">' +
              S.M.MEMORY_CATEGORIES.map(function (c) {
                return '<option value="' + c.id + '"' + (mem && mem.category === c.id ? ' selected' : '') + '>' +
                  c.icon + '  ' + c.name + '</option>';
              }).join('') + '</select></div>' +
            '<div class="field"><label for="mm-icon">Picture (emoji)</label>' +
              '<input class="input" id="mm-icon" maxlength="4" value="' + S.esc(mem ? mem.icon : '') + '" placeholder="e.g. 🥟"></div>' +
            '<div class="field full"><label for="mm-title">Title</label>' +
              '<input class="input" id="mm-title" value="' + S.esc(mem ? mem.title : '') + '" placeholder="e.g. Momos"></div>' +
            '<div class="field full"><label for="mm-content">Details</label>' +
              '<textarea class="textarea" id="mm-content" placeholder="e.g. Favourite food. Likes them steamed.">' +
              S.esc(mem ? mem.content : '') + '</textarea>' +
              '<p class="t-small muted">For a family member, start with the relationship — “Son.” — so the activity can ask “Who is …?”.</p></div>' +
            '<div class="field"><label for="mm-group">Shown under</label><select class="select" id="mm-group">' +
              S.M.MEMORY_GROUPS.map(function (g) {
                return '<option value="' + g.id + '"' + (mem && S.M.groupOf(mem) === g.id ? ' selected' : '') + '>' + S.esc(g.name) + '</option>';
              }).join('') + '</select></div>' +
            '<div class="field"><label for="mm-date">When was it?</label>' +
              '<input class="input" id="mm-date" type="date" max="' + S.todayISO() + '" value="' + S.esc(mem ? mem.memory_date : '') + '"></div>' +
            '<div class="field"><label for="mm-people">Who was there?</label>' +
              '<input class="input" id="mm-people" value="' + S.esc(mem ? mem.people : '') + '" placeholder="e.g. Rahul and the grandchildren"></div>' +
            '<div class="field"><label for="mm-place">Where?</label>' +
              '<input class="input" id="mm-place" value="' + S.esc(mem ? mem.place : '') + '" placeholder="e.g. Shillong"></div>' +
            '<div class="field full"><span class="field-label">Photo</span>' +
              '<div id="mm-photo">' + (mem && S.Media.hasPhoto(mem)
                ? '<div class="pp-preview has-photo">' + S.Media.memoryImg(mem, mem.title) + '</div>' : '') + '</div>' +
              '<button class="btn btn-outline btn-sm" type="button" data-act="pickPhoto">' + S.icon('camera') + 'Choose a photo</button>' +
              '<input type="file" id="mm-file" accept="image/*" class="sr-only">' +
              '<p class="t-small muted">Photos stay on this device; the memory text is what syncs.</p></div>' +
          '</div>',
        footer: '<button class="btn btn-secondary" data-modal-close>Cancel</button>' +
                '<button class="btn" data-act="save"><span class="emoji">✅</span>' + (mem ? 'Save' : 'Add memory') + '</button>',
        onMount: function (root) {
          var file = S.qs('#mm-file', root);
          file.addEventListener('change', function (ev) {
            var f = ev.target.files && ev.target.files[0];
            if (!f) return;
            S.Media.fromFile(f).then(function (d) { return S.Media.put(d); }).then(function (stored) {
              pendingPhoto = stored.id;
              S.qs('#mm-photo', root).innerHTML = '<div class="pp-preview has-photo"><img data-media="' + stored.id + '" alt=""></div>';
              S.Media.hydrate(root);
              if (!stored.persisted) S.toast('This photo is kept for this session only in this browser.', 'warn', 6000);
            }).catch(function (err) { S.toast(err.message || 'That photo could not be added.', 'warn'); });
            ev.target.value = '';
          });
          S.Media.hydrate(root);
        },
        handlers: {
          pickPhoto: function (el) { S.qs('#mm-file', el.closest('.modal')).click(); },
          save: function (el) {
            var root = el.closest('.modal');
            var title = S.qs('#mm-title', root).value.trim();
            if (!title) { S.toast('Please enter a title.', 'warn'); return; }
            var payload = {
              patient_id: patient.patient_id,
              category: S.qs('#mm-cat', root).value,
              group: S.qs('#mm-group', root).value,
              memory_date: S.qs('#mm-date', root).value,
              people: S.qs('#mm-people', root).value.trim(),
              place: S.qs('#mm-place', root).value.trim(),
              title: title,
              content: S.qs('#mm-content', root).value.trim(),
              icon: S.qs('#mm-icon', root).value.trim(),
              created_by: S.State.actorId
            };
            if (pendingPhoto) payload.photo_media = pendingPhoto;
            if (mem) S.DB.update('memory_bank', mem.memory_id, payload);
            else {
              S.DB.insert('memory_bank', S.M.newMemory(payload));
              S.Services.Notify.push({ recipient_role: 'patient', recipient_id: patient.patient_id, patient_id: patient.patient_id,
                kind: 'memory', title: 'A new memory was added',
                body: S.State.actorName + ' added a memory called ' + title + '.', link: '#/patient/memories' });
            }
            S.Modal.close();
            S.toast(mem ? 'Memory updated.' : 'Memory added — ' + patient.name.split(' ')[0] + ' can see it now.', 'ok');
            self.render('memory');
          }
        }
      });
    },

    contactForm: function (patient) {
      var self = this;
      S.Modal.open({
        title: 'Add contact',
        subtitle: 'For ' + patient.name,
        body: '<div class="form-grid">' +
            '<div class="field"><label for="ct-name">Name</label><input class="input" id="ct-name"></div>' +
            '<div class="field"><label for="ct-rel">Relationship</label><input class="input" id="ct-rel" placeholder="e.g. Son"></div>' +
            '<div class="field"><label for="ct-phone">Phone</label><input class="input" id="ct-phone" placeholder="+91 …"></div>' +
            '<div class="field"><label>Emergency contact</label>' +
              '<label class="toggle"><input type="checkbox" id="ct-emg"><span class="track"></span><span>Call first</span></label></div>' +
          '</div>',
        footer: '<button class="btn btn-secondary" data-modal-close>Cancel</button>' +
                '<button class="btn" data-act="save">Add contact</button>',
        handlers: {
          save: function (el) {
            var root = el.closest('.modal');
            var name = S.qs('#ct-name', root).value.trim();
            if (!name) { S.toast('Please enter a name.', 'warn'); return; }
            S.DB.insert('contacts', S.M.newContact({
              patient_id: patient.patient_id, name: name,
              relation: S.qs('#ct-rel', root).value.trim(),
              phone: S.qs('#ct-phone', root).value.trim(),
              is_emergency: S.qs('#ct-emg', root).checked
            }));
            S.Modal.close();
            S.toast('Contact added.', 'ok');
            self.render('memory');
          }
        }
      });
    },

    noteForm: function (patient) {
      var self = this;
      S.Modal.open({
        title: 'Add care note',
        subtitle: 'An observation about ' + patient.name + ' — not a diagnosis.',
        body: '<div class="field"><label for="cn-text">Note</label>' +
          '<textarea class="textarea" id="cn-text" placeholder="e.g. Seemed tired today. Enjoyed the memory activity."></textarea></div>',
        footer: '<button class="btn btn-secondary" data-modal-close>Cancel</button>' +
                '<button class="btn" data-act="save">Save note</button>',
        handlers: {
          save: function (el) {
            var text = S.qs('#cn-text', el.closest('.modal')).value.trim();
            if (!text) { S.toast('Please write a note first.', 'warn'); return; }
            S.DB.insert('care_notes', S.M.newCareNote({
              patient_id: patient.patient_id,
              created_by: 'caregiver',
              created_by_name: S.State.actorName,
              content: text
            }));
            S.Modal.close();
            S.toast('Care note saved.', 'ok');
            self.render(self.tab);
          }
        }
      });
    },

    exportData: function () {
      S.Modal.open({
        title: 'Local data export',
        subtitle: 'Everything stored on this device, in the same shape the API receives.',
        body: '<textarea class="textarea" style="min-height:320px;font-family:ui-monospace,monospace;font-size:12px" readonly>' +
          S.esc(S.DB.exportJSON()) + '</textarea>',
        footer: '<button class="btn" data-modal-close>Close</button>'
      });
    }
  };

  S.Caregiver = Caregiver;
})(window);
