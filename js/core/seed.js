/* ============================================================
   SMIVAI — seed.js
   Fictional demo data. Every patient gets a genuinely different history:
   different games, scores, trends, reminders, memories, moods and notes.

   Nothing here is a real person. Phone numbers are placeholders.
   The generator is seeded per patient, so the demo is identical on every
   machine and every reload until the data is reset.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var CAREGIVER = { id: 'cg_001', name: 'Nabanita Sharma', role: 'caregiver' };
  var DOCTOR = { id: 'dr_001', name: 'Dr. A. Choudhury', role: 'doctor' };

  /* Typical number of scored actions per round, by activity and level. */
  var ATTEMPTS = {
    picture_matching: { easy: 7, medium: 11, hard: 15 },
    memory_pairs: { easy: 8, medium: 12, hard: 18 },
    picture_bingo: { easy: 5, medium: 6, hard: 8 },
    category_sorting: { easy: 6, medium: 9, hard: 12 },
    jigsaw: { easy: 7, medium: 11, hard: 16 },
    my_memories: { easy: 4, medium: 5, hard: 6 }
  };

  var PROFILES = [
    {
      patient: {
        patient_id: 'pat_ramesh_das', name: 'Ramesh Das', age: 72, language: 'as', language_confirmed: true,
        district: 'Jorhat, Assam', caregiver_id: CAREGIVER.id, doctor_id: DOCTOR.id
      },
      seed: 1071,
      /* steady performer, no clear direction */
      accStart: 0.74, accEnd: 0.77, rtStart: 8.6, rtEnd: 8.2,
      levels: ['easy', 'medium', 'medium', 'medium'],
      games: ['memory_pairs', 'category_sorting', 'picture_matching', 'my_memories', 'picture_bingo'],
      adherence: 0.85,
      todayGames: ['memory_pairs', 'category_sorting'],
      plan: ['memory_pairs', 'category_sorting', 'my_memories'],
      moods: ['good', 'good', 'okay', 'good', 'okay', 'good', 'good'],
      memories: [
        { category: 'family', title: 'Rahul', content: 'Son. Lives in Guwahati, calls every Sunday.', icon: '👨' },
        { category: 'family', title: 'Sabita', content: 'Wife. They married in 1978.', icon: '👩' },
        { category: 'family', title: 'Priya', content: 'Granddaughter. In school, loves drawing.', icon: '👧' },
        { category: 'food', title: 'Momos', content: 'Favourite food. Likes them steamed, with clear soup.', icon: '🥟' },
        { category: 'food', title: 'Red tea', content: 'Two cups every morning, no sugar.', icon: '🍵' },
        { category: 'place', title: 'Home Village', content: 'Grew up here. Walks to the river in the morning.', icon: '🛖' },
        { category: 'music', title: 'Bihu songs', content: 'Listens on the radio during Bohag Bihu.', icon: '🎵' },
        { category: 'routine', title: 'Morning walk', content: 'Walks by the river at about seven.', icon: '🚶' },
        { category: 'personal', title: 'The school', content: 'Taught mathematics at the village school for 30 years.', icon: '📚' },
        { category: 'object', title: 'Bamboo walking stick', content: 'Made by his father. Keeps it by the door.', icon: '🎋' },
        { category: 'object', title: 'Old radio', content: 'Listens to the morning news on it.', icon: '📻' }
      ],
      reminders: [
        { title: 'Take medicine', category: 'medicine', time: '08:00', repeat: 'daily', priority: 'important', description: 'Morning tablet after breakfast.', by: 'caregiver' },
        { title: 'Breakfast', category: 'meal', time: '08:30', repeat: 'daily', description: 'Rice and tea.', by: 'caregiver' },
        { title: 'SMIVAI activity', category: 'cognitive', time: '10:00', repeat: 'daily', description: "Today's short session.", by: 'caregiver' },
        { title: 'Evening walk', category: 'exercise', time: '17:00', repeat: 'weekdays', description: 'A short walk near the house.', by: 'caregiver' },
        { title: 'Clinic follow-up', category: 'appointment', time: '11:00', repeat: 'once', dayOffset: 5, priority: 'important', description: 'Routine follow-up as per care plan.', by: 'doctor' }
      ],
      routine: [
        { time: '07:00', title: 'Wake up', icon: '🌅' },
        { time: '08:00', title: 'Medicine', icon: '💊' },
        { time: '08:30', title: 'Breakfast', icon: '🍽️' },
        { time: '10:00', title: 'Cognitive activity', icon: '🧠' },
        { time: '13:00', title: 'Lunch', icon: '🍲' },
        { time: '17:00', title: 'Evening walk', icon: '🚶' },
        { time: '21:00', title: 'Rest', icon: '😴' }
      ],
      contacts: [
        { name: 'Rahul Das', relation: 'Son', phone: '+91 90000 12345', is_emergency: true },
        { name: 'Sabita Das', relation: 'Wife', phone: '+91 90000 12346' },
        { name: 'Nabanita Sharma', relation: 'Caregiver', phone: '+91 90000 10001' }
      ],
      notes: [
        { days: 0, by: 'caregiver', text: 'Enjoyed the memory activity this morning. Talked about the village for a while afterwards.' },
        { days: 2, by: 'caregiver', text: 'Seemed tired in the afternoon. We kept the session short.' },
        { days: 6, by: 'doctor', text: 'Reviewed activity summary. Continue current routine; no change advised.' }
      ]
    },

    {
      patient: {
        patient_id: 'pat_anjali_devi', name: 'Anjali Devi', age: 68, language: 'mni', language_confirmed: true,
        district: 'Imphal, Manipur', caregiver_id: CAREGIVER.id, doctor_id: DOCTOR.id
      },
      seed: 2208,
      /* clearly improving, moving up to hard */
      accStart: 0.71, accEnd: 0.90, rtStart: 9.4, rtEnd: 6.8,
      levels: ['easy', 'medium', 'medium', 'hard'],
      games: ['picture_matching', 'jigsaw', 'memory_pairs', 'my_memories', 'category_sorting'],
      adherence: 0.93,
      todayGames: ['picture_matching'],
      plan: ['picture_matching', 'jigsaw', 'my_memories'],
      moods: ['good', 'good', 'good', 'okay', 'good', 'good', 'good'],
      memories: [
        { category: 'family', title: 'Meena', content: 'Daughter. Visits every weekend.', icon: '👩' },
        { category: 'family', title: 'Tomba', content: 'Son. Works in Imphal.', icon: '👨' },
        { category: 'food', title: 'Rice', content: 'Favourite food. Prefers it with fish curry.', icon: '🍚' },
        { category: 'food', title: 'Fish curry', content: 'Cooks it on Sundays.', icon: '🐟' },
        { category: 'place', title: 'Home', content: 'The house she has lived in for forty years.', icon: '🏡' },
        { category: 'place', title: 'Loktak', content: 'Went there often as a young woman.', icon: '🏞️' },
        { category: 'music', title: 'Folk songs', content: 'Listens on the radio in the evening.', icon: '🎵' },
        { category: 'routine', title: 'Evening prayer', content: 'Every day at about six.', icon: '🕯️' },
        { category: 'personal', title: 'Winter shawls', content: 'Wove shawls for the whole family every winter.', icon: '🧣' },
        { category: 'object', title: 'Weaving loom', content: 'Still kept in the front room.', icon: '🧶' }
      ],
      reminders: [
        { title: 'Take medicine', category: 'medicine', time: '09:00', repeat: 'daily', priority: 'important', description: 'One tablet with water.', by: 'caregiver' },
        { title: 'Drink water', category: 'hydration', time: '11:00', repeat: 'daily', description: 'A glass of water.', by: 'caregiver' },
        { title: 'Afternoon rest', category: 'rest', time: '14:00', repeat: 'daily', description: 'A short rest after lunch.', by: 'caregiver' },
        { title: 'SMIVAI activity', category: 'cognitive', time: '16:00', repeat: 'daily', description: 'Evening session.', by: 'caregiver' },
        { title: 'Monthly review', category: 'appointment', time: '10:30', repeat: 'once', dayOffset: 9, description: 'Routine review as per care plan.', by: 'doctor' }
      ],
      routine: [
        { time: '06:30', title: 'Wake up', icon: '🌅' },
        { time: '09:00', title: 'Medicine', icon: '💊' },
        { time: '11:00', title: 'Drink water', icon: '💧' },
        { time: '13:00', title: 'Lunch', icon: '🍲' },
        { time: '14:00', title: 'Rest', icon: '😴' },
        { time: '16:00', title: 'Cognitive activity', icon: '🧠' },
        { time: '18:00', title: 'Evening prayer', icon: '🕯️' }
      ],
      contacts: [
        { name: 'Meena Devi', relation: 'Daughter', phone: '+91 90000 22345', is_emergency: true },
        { name: 'Tomba Singh', relation: 'Son', phone: '+91 90000 22346' }
      ],
      notes: [
        { days: 1, by: 'caregiver', text: 'Finished the jigsaw without help today. Very pleased with herself.' },
        { days: 4, by: 'caregiver', text: 'Asked to do an extra activity in the evening.' }
      ]
    },

    {
      patient: {
        patient_id: 'pat_bimal_singh', name: 'Bimal Singh', age: 75, language: 'brx',
        district: 'Kokrajhar, Assam', caregiver_id: CAREGIVER.id, doctor_id: DOCTOR.id
      },
      seed: 3390,
      /* recent performance lower than his own earlier average */
      accStart: 0.74, accEnd: 0.57, rtStart: 8.9, rtEnd: 12.4,
      levels: ['medium', 'medium', 'easy', 'easy'],
      games: ['picture_bingo', 'category_sorting', 'memory_pairs', 'my_memories', 'picture_matching'],
      adherence: 0.68,
      todayGames: ['picture_bingo'],
      plan: ['picture_bingo', 'my_memories', 'category_sorting'],
      moods: ['okay', 'low', 'okay', 'okay', 'good', 'okay', 'low'],
      memories: [
        { category: 'family', title: 'Amit', content: 'Son. Lives nearby and visits daily.', icon: '👨' },
        { category: 'family', title: 'Rina', content: 'Daughter. Calls in the evening.', icon: '👩' },
        { category: 'food', title: 'Dal', content: 'Favourite food. Likes it plain with rice.', icon: '🍲' },
        { category: 'food', title: 'Pitha', content: 'Eats it during festival days.', icon: '🍘' },
        { category: 'place', title: 'Guwahati', content: 'Worked there for many years.', icon: '🏙️' },
        { category: 'music', title: 'Folk drums', content: 'Enjoys drum music at festivals.', icon: '🪘' },
        { category: 'routine', title: 'Garden in the morning', content: 'Waters the vegetables after tea.', icon: '🪴' },
        { category: 'personal', title: 'The vegetable garden', content: 'Kept a garden behind the house for thirty years.', icon: '🥬' },
        { category: 'object', title: 'Bamboo basket', content: 'Uses it to carry vegetables.', icon: '🧺' }
      ],
      reminders: [
        { title: 'Morning medicine', category: 'medicine', time: '08:00', repeat: 'daily', priority: 'important', description: 'Tablet after breakfast.', by: 'caregiver' },
        { title: 'SMIVAI activity', category: 'cognitive', time: '11:00', repeat: 'daily', description: 'Short morning session.', by: 'caregiver' },
        { title: 'Lunch', category: 'meal', time: '13:00', repeat: 'daily', description: 'Rice and dal.', by: 'caregiver' },
        { title: 'Evening medicine', category: 'medicine', time: '20:00', repeat: 'daily', priority: 'important', description: 'Tablet after dinner.', by: 'caregiver' },
        { title: 'Follow-up visit', category: 'appointment', time: '09:30', repeat: 'once', dayOffset: 2, priority: 'important', description: 'Follow-up as per existing care plan.', by: 'doctor' }
      ],
      routine: [
        { time: '06:00', title: 'Wake up', icon: '🌅' },
        { time: '07:30', title: 'Garden', icon: '🪴' },
        { time: '08:00', title: 'Medicine', icon: '💊' },
        { time: '11:00', title: 'Cognitive activity', icon: '🧠' },
        { time: '13:00', title: 'Lunch', icon: '🍲' },
        { time: '20:00', title: 'Medicine', icon: '💊' },
        { time: '21:30', title: 'Rest', icon: '😴' }
      ],
      contacts: [
        { name: 'Amit Singh', relation: 'Son', phone: '+91 90000 32345', is_emergency: true },
        { name: 'Rina Basumatary', relation: 'Daughter', phone: '+91 90000 32346' }
      ],
      notes: [
        { days: 0, by: 'caregiver', text: 'Had difficulty following the sorting activity today. Stopped after two rounds.' },
        { days: 1, by: 'caregiver', text: 'Missed the evening medicine reminder. Family informed.' },
        { days: 3, by: 'doctor', text: 'Noted lower recent activity performance. Worth reviewing at the next visit.' }
      ]
    }
  ];

  var DAYS_BACK = 21;

  function buildSessions(profile, patient) {
    var rand = S.rng(profile.seed);
    var sessions = [];
    var today = S.todayISO();

    for (var i = DAYS_BACK; i >= 1; i--) {
      var t = (DAYS_BACK - i) / (DAYS_BACK - 1);       // 0 → 1 over the window
      var date = S.addDays(today, -i);
      var r = rand();
      var count = r < 0.14 ? 0 : (r < 0.66 ? 1 : 2);   // some quiet days
      for (var k = 0; k < count; k++) {
        sessions.push(makeSession(profile, patient, date, t, rand, null));
      }
    }
    // Today's completed activities
    (profile.todayGames || []).forEach(function (g) {
      sessions.push(makeSession(profile, patient, today, 1, rand, g));
    });
    return sessions;
  }

  function makeSession(profile, patient, date, t, rand, forceGame) {
    var game = forceGame || S.pick(profile.games, rand);
    var levelIdx = Math.min(profile.levels.length - 1, Math.floor(t * profile.levels.length));
    var level = profile.levels[levelIdx];

    var acc = profile.accStart + (profile.accEnd - profile.accStart) * t + (rand() - 0.5) * 0.11;
    acc = S.clamp(acc, 0.34, 0.98);

    var rt = profile.rtStart + (profile.rtEnd - profile.rtStart) * t + (rand() - 0.5) * 1.8;
    rt = S.clamp(rt, 3.5, 18);

    var attempts = (ATTEMPTS[game] && ATTEMPTS[game][level]) || 8;
    attempts = attempts + Math.round((rand() - 0.5) * 2);
    var mistakes = Math.max(0, Math.round(attempts * (1 - acc)));
    var accuracy = S.round(Math.max(0, (attempts - mistakes) / attempts), 3);

    var hour = 8 + Math.floor(rand() * 10);
    var stampDate = S.fromISO(date);
    stampDate.setHours(hour, Math.floor(rand() * 60), 0, 0);

    var completion = rand() < 0.94 ? 'completed' : 'partial';

    var row = S.M.newGameSession({
      patient_id: patient.patient_id,
      game_type: game,
      difficulty: level,
      accuracy: accuracy,
      response_time: S.round(rt, 1),
      mistakes: mistakes,
      attempts: attempts,
      completion_status: completion,
      duration_seconds: Math.round(attempts * rt),
      content_level: rand() < 0.4 ? 2 : 1,
      timestamp: stampDate.toISOString(),
      date: date
    });
    row.score = S.Scoring.sessionScore(row);
    return row;
  }

  /** Replay the session history through the real Rasch update to get θ. */
  function primeAbility(patient) {
    var byGame = {}, counts = {};
    S.Scoring.sessionsFor(patient.patient_id).forEach(function (s) {
      var n = counts[s.game_type] || 0;
      byGame[s.game_type] = S.Adaptive.step(byGame[s.game_type] || 0, s, n);
      counts[s.game_type] = n + 1;
    });
    var ability = {}, difficulty = {};
    Object.keys(byGame).forEach(function (g) {
      ability[g] = S.round(byGame[g], 3);
      difficulty[g] = S.Adaptive.levelNearest(byGame[g]);
    });
    patient.ability = ability;
    patient.difficulty = difficulty;
  }

  function buildScoreHistory(patient) {
    var all = S.Scoring.sessionsFor(patient.patient_id);
    var rows = [], today = S.todayISO(), prev = null;
    for (var i = DAYS_BACK; i >= 0; i--) {
      var date = S.addDays(today, -i);
      var upto = all.filter(function (s) { return s.date <= date; });
      if (!upto.length) continue;
      var window = upto.slice(Math.max(0, upto.length - 12));
      var score = S.Scoring.scoreOfSessions(window);
      var trend = prev === null ? 'stable' : (score - prev >= 3 ? 'improving' : (score - prev <= -3 ? 'lower' : 'stable'));
      prev = score;
      rows.push(S.M.newScore({
        patient_id: patient.patient_id, date: date, score: score,
        trend: trend, sessions_counted: window.length
      }));
    }
    return rows;
  }

  function buildReminders(profile, patient) {
    var today = S.todayISO();
    return profile.reminders.map(function (r) {
      var isDoctor = r.by === 'doctor';
      return S.M.newReminder({
        patient_id: patient.patient_id,
        title: r.title,
        description: r.description || '',
        category: r.category,
        time: r.time,
        repeat: r.repeat,
        repeat_days: r.repeat_days || [],
        priority: r.priority || 'normal',
        date: r.dayOffset !== undefined ? S.addDays(today, r.dayOffset) : S.addDays(today, -DAYS_BACK),
        created_by_role: isDoctor ? 'doctor' : 'caregiver',
        created_by_id: isDoctor ? DOCTOR.id : CAREGIVER.id,
        created_by_name: isDoctor ? DOCTOR.name : CAREGIVER.name,
        voice_enabled: r.category !== 'appointment'
      });
    });
  }

  /** Reminder history that lands near the profile's adherence target. */
  function buildReminderEvents(profile, patient, reminders) {
    var rand = S.rng(profile.seed + 7);
    var events = [];
    var today = S.todayISO();
    var nowM = S.minutesOf(S.nowHHMM());
    var yesterday = S.addDays(today, -1);
    var forcedMissDone = false;

    for (var i = 14; i >= 0; i--) {
      var date = S.addDays(today, -i);
      reminders.forEach(function (rem) {
        if (!S.Reminders.occursOn(rem, date)) return;
        // Today: only occurrences whose time has already passed get a verdict.
        if (date === today && S.minutesOf(rem.time) + S.Reminders.GRACE_MINUTES > nowM) return;

        // Guarantee one visible missed item yesterday, for the alert demo.
        if (date === yesterday && !forcedMissDone &&
            (rem.category === 'hydration' || rem.category === 'exercise' || rem.category === 'cognitive')) {
          forcedMissDone = true;
          return; // no event → computed as missed
        }

        var r = rand();
        if (r < profile.adherence) {
          var marked = S.fromISO(date);
          marked.setHours(parseInt(rem.time.split(':')[0], 10), parseInt(rem.time.split(':')[1], 10) + 6, 0, 0);
          events.push(S.M.newReminderEvent({
            reminder_id: rem.reminder_id, patient_id: patient.patient_id,
            date: date, status: 'completed', marked_at: marked.toISOString(),
            marked_by: rand() < 0.75 ? 'patient' : 'caregiver'
          }));
        } else if (r < profile.adherence + 0.07) {
          events.push(S.M.newReminderEvent({
            reminder_id: rem.reminder_id, patient_id: patient.patient_id,
            date: date, status: 'skipped', marked_by: 'patient'
          }));
        }
        // otherwise: no row → computed as missed
      });
    }
    return events;
  }

  function buildMoods(profile, patient) {
    var today = S.todayISO();
    return profile.moods.map(function (m, idx) {
      return S.M.newMood({
        patient_id: patient.patient_id,
        date: S.addDays(today, -(profile.moods.length - 1 - idx)),
        mood: m
      });
    });
  }

  function buildNotes(profile, patient) {
    return profile.notes.map(function (n) {
      var d = S.fromISO(S.addDays(S.todayISO(), -n.days));
      d.setHours(10 + (n.days % 6), 20, 0, 0);
      return S.M.newCareNote({
        patient_id: patient.patient_id,
        created_by: n.by,
        created_by_name: n.by === 'doctor' ? DOCTOR.name : CAREGIVER.name,
        content: n.text,
        timestamp: d.toISOString()
      });
    });
  }

  var Seed = {
    CAREGIVER: CAREGIVER,
    DOCTOR: DOCTOR,

    needed: function () { return !S.DB.ready || !S.DB.all('patients').length; },

    run: function () {
      var patients = [], sessions = [], reminders = [], events = [], memories = [],
        scores = [], moods = [], notes = [], contacts = [], routines = [], plans = [];

      PROFILES.forEach(function (profile) {
        var patient = S.M.newPatient(profile.patient);
        patients.push(patient);

        var ses = buildSessions(profile, patient);
        sessions = sessions.concat(ses);

        profile.memories.forEach(function (m) {
          memories.push(S.M.newMemory({
            patient_id: patient.patient_id, category: m.category,
            title: m.title, content: m.content, icon: m.icon,
            created_by: CAREGIVER.id
          }));
        });

        var rems = buildReminders(profile, patient);
        reminders = reminders.concat(rems);
        events = events.concat(buildReminderEvents(profile, patient, rems));

        moods = moods.concat(buildMoods(profile, patient));
        notes = notes.concat(buildNotes(profile, patient));

        profile.contacts.forEach(function (c) {
          contacts.push(S.M.newContact({
            patient_id: patient.patient_id, name: c.name, relation: c.relation,
            phone: c.phone, is_emergency: c.is_emergency
          }));
        });

        profile.routine.forEach(function (r) {
          routines.push(S.M.newRoutine({
            patient_id: patient.patient_id, time: r.time, title: r.title, icon: r.icon
          }));
        });
      });

      /* Write the base tables first so score/ability derivation can read them. */
      S.DB.seedTable('patients', patients);
      S.DB.seedTable('game_sessions', sessions);
      S.DB.seedTable('memory_bank', memories);
      S.DB.seedTable('reminders', reminders);
      S.DB.seedTable('reminder_events', events);
      S.DB.seedTable('moods', moods);
      S.DB.seedTable('care_notes', notes);
      S.DB.seedTable('contacts', contacts);
      S.DB.seedTable('routines', routines);
      S.DB.seedTable('sync_queue', []);

      PROFILES.forEach(function (profile, idx) {
        var patient = patients[idx];
        primeAbility(patient);
        scores = scores.concat(buildScoreHistory(patient));

        /* Today's personalised session, including what was already done. */
        plans.push({
          plan_id: S.uid('plan'),
          patient_id: patient.patient_id,
          date: S.todayISO(),
          activities: profile.plan.map(function (g) {
            return {
              game_type: g,
              difficulty: S.Adaptive.difficultyFor(patient, g),
              minutes: S.M.game(g).minutes[S.M.difficultyIndex(S.Adaptive.difficultyFor(patient, g))]
            };
          }),
          created_at: S.stamp()
        });
      });

      S.DB.seedTable('cognitive_scores', scores);
      S.DB.seedTable('daily_sessions', plans);
      S.DB.save();
      S.DB.ready = true;
      return true;
    },

    reset: function () {
      S.DB.reset();
      this.run();
      S.bus.emit('data:updated', { table: '*', op: 'reset' });
    }
  };

  S.Seed = Seed;
})(window);
