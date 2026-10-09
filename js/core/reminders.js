/* ============================================================
   SMIVAI — reminders.js
   One reminder system shared by patient, caregiver and doctor.

   A reminder is a *rule* (title, time, repeat). What happened on a given
   day is a separate reminder_event row, so history is never lost when a
   rule is edited, paused or deleted.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var GRACE_MINUTES = 45; // how long after the time a reminder stays "upcoming"

  var Reminders = {
    GRACE_MINUTES: GRACE_MINUTES,

    /* ---------------- definitions ---------------- */
    forPatient: function (patientId) {
      return S.DB.forPatient('reminders', patientId).sort(function (a, b) {
        return S.minutesOf(a.time) - S.minutesOf(b.time);
      });
    },

    /** The same reminder already active for this patient, if any:
        same title (any case), time and repeat — and same day when it is
        a one-off. Mirrored on the server (backend/app/main.py). */
    findDuplicate: function (data) {
      var title = String(data.title || '').trim().toLowerCase();
      var repeat = data.repeat || 'once';
      return S.DB.forPatient('reminders', data.patient_id).filter(function (r) {
        return r.status !== 'paused' && String(r.title || '').trim().toLowerCase() === title &&
          r.time === data.time && (r.repeat || 'once') === repeat && (repeat !== 'once' || r.date === data.date);
      })[0] || null;
    },

    /** Returns the new reminder, or the existing one with `duplicate: true`. */
    create: function (data) {
      var dup = this.findDuplicate(data);
      if (dup) return Object.assign({ duplicate: true }, dup);
      var rem = S.M.newReminder(data);
      S.DB.insert('reminders', rem);
      S.bus.emit('reminders:changed', rem);
      return rem;
    },

    update: function (id, patch) {
      var r = S.DB.update('reminders', id, patch);
      S.bus.emit('reminders:changed', r);
      return r;
    },

    remove: function (id) {
      var ok = S.DB.remove('reminders', id);
      S.bus.emit('reminders:changed', null);
      return ok;
    },

    setStatus: function (id, status) { return this.update(id, { status: status }); },

    /* ---------------- occurrence rules ---------------- */
    occursOn: function (rem, dateISO) {
      if (rem.status === 'paused') return false;
      if (dateISO < rem.date) return false;
      var dow = S.dayOfWeek(dateISO);
      switch (rem.repeat) {
        case 'once': return dateISO === rem.date;
        case 'daily': return true;
        case 'weekdays': return dow >= 1 && dow <= 5;
        case 'weekly': return dow === S.dayOfWeek(rem.date);
        case 'custom': return (rem.repeat_days || []).indexOf(dow) !== -1;
        default: return dateISO === rem.date;
      }
    },

    eventFor: function (reminderId, dateISO) {
      return S.DB.where('reminder_events', function (e) {
        return e.reminder_id === reminderId && e.date === dateISO;
      })[0] || null;
    },

    /** Computed status of one reminder on one date. */
    statusOn: function (rem, dateISO) {
      var ev = this.eventFor(rem.reminder_id, dateISO);
      if (ev) return ev.status;
      var today = S.todayISO();
      if (dateISO < today) return 'missed';
      if (dateISO > today) return 'upcoming';
      var nowM = S.minutesOf(S.nowHHMM());
      return nowM > S.minutesOf(rem.time) + GRACE_MINUTES ? 'missed' : 'upcoming';
    },

    /** All occurrences for a patient on a date, in time order. */
    occurrencesOn: function (patientId, dateISO) {
      var self = this;
      return this.forPatient(patientId)
        .filter(function (r) { return self.occursOn(r, dateISO); })
        .map(function (r) {
          return {
            reminder: r,
            date: dateISO,
            status: self.statusOn(r, dateISO),
            event: self.eventFor(r.reminder_id, dateISO)
          };
        });
    },

    /** Mark an occurrence completed / skipped / missed. */
    mark: function (reminderId, dateISO, status, by) {
      var rem = S.DB.find('reminders', reminderId);
      if (!rem) return null;
      var existing = this.eventFor(reminderId, dateISO);
      var row;
      if (existing) {
        row = S.DB.update('reminder_events', existing.event_id, {
          status: status, marked_at: S.stamp(), marked_by: by || 'patient'
        });
      } else {
        row = S.DB.insert('reminder_events', S.M.newReminderEvent({
          reminder_id: reminderId, patient_id: rem.patient_id,
          date: dateISO, status: status, marked_by: by || 'patient'
        }));
      }
      S.bus.emit('reminders:changed', rem);
      return row;
    },

    /** Next thing coming up today (or the first thing tomorrow). */
    next: function (patientId) {
      var today = S.todayISO();
      var nowM = S.minutesOf(S.nowHHMM());
      var todays = this.occurrencesOn(patientId, today).filter(function (o) {
        return o.status === 'upcoming' && S.minutesOf(o.reminder.time) >= nowM - GRACE_MINUTES;
      });
      if (todays.length) return todays[0];
      var tomorrow = S.addDays(today, 1);
      var next = this.occurrencesOn(patientId, tomorrow);
      return next.length ? next[0] : null;
    },

    /* ---------------- statistics ---------------- */
    statsOn: function (patientId, dateISO) {
      var occ = this.occurrencesOn(patientId, dateISO);
      var count = function (st) { return occ.filter(function (o) { return o.status === st; }).length; };
      var completed = count('completed');
      var missed = count('missed');
      var skipped = count('skipped');
      var upcoming = count('upcoming');
      var decided = completed + missed + skipped;
      return {
        total: occ.length,
        completed: completed,
        missed: missed,
        skipped: skipped,
        upcoming: upcoming,
        completion: decided ? Math.round((completed / decided) * 100) : (occ.length ? 0 : 100),
        occurrences: occ
      };
    },

    /** Adherence over a window of past days (today included). */
    adherence: function (patientId, days) {
      days = days || 14;
      var today = S.todayISO();
      var completed = 0, total = 0;
      for (var i = 0; i < days; i++) {
        var d = S.addDays(today, -i);
        var occ = this.occurrencesOn(patientId, d);
        occ.forEach(function (o) {
          if (o.status === 'upcoming') return; // not yet decided
          total++;
          if (o.status === 'completed') completed++;
        });
      }
      return {
        percent: total ? Math.round((completed / total) * 100) : 100,
        completed: completed,
        total: total,
        days: days
      };
    },

    adherenceSeries: function (patientId, days) {
      days = days || 14;
      var out = [], today = S.todayISO();
      for (var i = days - 1; i >= 0; i--) {
        var d = S.addDays(today, -i);
        var st = this.statsOn(patientId, d);
        out.push({ date: d, value: st.completion, total: st.total, completed: st.completed });
      }
      return out;
    },

    recentMissed: function (patientId, days) {
      days = days || 3;
      var out = [], today = S.todayISO();
      for (var i = 0; i < days; i++) {
        var d = S.addDays(today, -i);
        this.occurrencesOn(patientId, d).forEach(function (o) {
          if (o.status === 'missed') out.push(o);
        });
      }
      return out;
    },

    /** Human-readable repeat description. */
    repeatText: function (rem) {
      switch (rem.repeat) {
        case 'daily': return 'Every day';
        case 'weekdays': return 'Weekdays (Mon–Fri)';
        case 'weekly': return 'Every ' + S.weekdayName(rem.date);
        case 'custom':
          var names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          var list = (rem.repeat_days || []).map(function (d) { return names[d]; });
          return list.length ? list.join(', ') : 'Chosen days';
        default: return 'Once on ' + S.shortDate(rem.date);
      }
    },

    statusChip: function (status) {
      switch (status) {
        case 'completed': return { text: 'Completed', cls: 'chip-green', icon: '✓' };
        case 'missed': return { text: 'Missed', cls: 'chip-coral', icon: '⚠' };
        case 'skipped': return { text: 'Skipped', cls: 'chip-amber', icon: '↷' };
        default: return { text: 'Upcoming', cls: '', icon: '○' };
      }
    },

    /**
     * Spoken text for a voice-enabled reminder, in the patient's language.
     * The common categories come from the translated catalogue; anything
     * custom falls back to the reminder's own title, which the caregiver
     * wrote and is already in a language the patient reads.
     */
    speech: function (rem, patient) {
      var lang = patient ? patient.language : 'en';
      var name = patient ? patient.name.split(' ')[0] : '';
      var keyed = {
        medicine: 'speak_medicine',
        hydration: 'speak_water',
        meal: 'speak_meal',
        cognitive: 'speak_activity',
        rest: 'speak_rest'
      }[rem.category];

      if (keyed) return S.I18N.text(keyed, { name: name }, lang);
      var lead = name ? name + ', ' : '';
      return lead + rem.title + (rem.description ? '. ' + rem.description : '.');
    },

    /**
     * Speak a reminder aloud.
     * @returns {Promise<{spoken, note}>} — the caller shows `note` when the
     * patient's language has no voice, rather than reading English at them.
     */
    speak: function (rem, patient) {
      return S.Voice.speak(this.speech(rem, patient), patient ? patient.language : 'en');
    }
  };

  S.Reminders = Reminders;
})(window);
