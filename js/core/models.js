/* ============================================================
   SMIVAI — models.js
   Domain constants, record factories and the access-scope helper.
   Shapes match backend/schema.sql one-for-one.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  /* ---------------- Catalogue of cognitive activities ---------------- */
  var GAMES = [
    {
      id: 'picture_matching', name: 'Picture Matching', icon: '🖼️', tier: 'free', art: 'matching', color: 'blue',
      short: 'Match pictures that go together.',
      desc: 'Find the two pictures that belong together. Everything stays visible — no rush.',
      domain: 'Attention & visual recognition',
      minutes: [2, 2, 3, 4, 5],
      instruction: 'match_pictures'
    },
    {
      id: 'memory_pairs', name: 'Memory Pairs', icon: '🧩', tier: 'free', art: 'cards', color: 'lav',
      short: 'Remember where the pictures are.',
      desc: 'Look at the cards, then turn them over two at a time to find the matching pairs.',
      domain: 'Short-term memory & recall',
      minutes: [3, 3, 4, 5, 6],
      instruction: 'remember_cards'
    },
    {
      id: 'picture_bingo', name: 'Picture Bingo', icon: '🔍', tier: 'free', art: 'bingo', color: 'peach',
      short: 'Find the picture you hear.',
      desc: 'HUN names an everyday object and you tap it on the board.',
      domain: 'Recognition & listening',
      minutes: [2, 2, 3, 3, 4],
      instruction: 'find_object'
    },
    {
      id: 'category_sorting', name: 'Category Sorting', icon: '🗂️', tier: 'free', art: 'sorting', color: 'green',
      short: 'Put things into the right group.',
      desc: 'Sort familiar objects into groups such as food, clothes and household things.',
      domain: 'Thinking & language association',
      minutes: [3, 3, 3, 4, 5],
      instruction: 'sort_items'
    },
    {
      id: 'jigsaw', name: 'Jigsaw', icon: '🧷', tier: 'premium', art: 'puzzle', color: 'peach',
      short: 'Rebuild a familiar picture.',
      desc: 'Swap the large pieces around until the picture looks right again.',
      domain: 'Visual processing & problem solving',
      minutes: [3, 3, 4, 5, 6],
      instruction: 'build_picture'
    },
    {
      id: 'my_memories', name: 'Memory Lane', icon: '❤️', tier: 'premium', art: 'photos', color: 'cream',
      short: 'Questions about your own life.',
      desc: 'Gentle questions built from the people, places and foods in your Memory Bank.',
      domain: 'Reminiscence & personal recall',
      minutes: [2, 2, 2, 3, 4],
      instruction: 'your_memories_q'
    },
    {
      id: 'pattern', name: 'Complete the Pattern', icon: '🔷', tier: 'premium', art: 'shapes', color: 'blue',
      short: 'Find what comes next.',
      desc: 'Look at the row of shapes and colours, then choose the piece that completes it.',
      domain: 'Reasoning & attention',
      minutes: [3, 3, 3, 4, 5],
      instruction: 'pattern_instruction'
    },
    {
      id: 'word_hustle', name: 'Word Hustle', icon: '🔤', tier: 'premium', art: 'letters', color: 'lav',
      short: 'Put the letters in order.',
      desc: 'Tap the letters in the right order to spell the word shown in the picture.',
      domain: 'Language & word finding',
      minutes: [3, 3, 4, 5, 6],
      instruction: 'word_instruction'
    }
  ];

  /* Shown to Premium members as "coming soon" (early access), not yet playable. */
  var UPCOMING_GAMES = [
    { id: 'story_recall', name: 'Story Recall', art: 'book', color: 'cream', short: 'Listen to a short story, then answer gentle questions.' },
    { id: 'rhythm_tap', name: 'Rhythm Tap', art: 'bulb', color: 'peach', short: 'Tap along with familiar folk rhythms.' }
  ];

  /* Five steps, one logit apart — see js/core/adaptive.js. */
  var DIFFICULTIES = [
    { id: 'very_easy', name: 'Very easy', b: -2.0, label: 'Very gentle' },
    { id: 'easy', name: 'Easy', b: -1.0, label: 'Gentle' },
    { id: 'medium', name: 'Medium', b: 0.0, label: 'Steady' },
    { id: 'hard', name: 'Hard', b: 1.0, label: 'Challenging' },
    { id: 'very_hard', name: 'Very hard', b: 2.0, label: 'Stretching' }
  ];

  var REMINDER_CATEGORIES = [
    { id: 'medicine', name: 'Medication', icon: '💊', ico: 'pill', tone: 'peach' },
    { id: 'meal', name: 'Food', icon: '🍽️', ico: 'leaf', tone: 'green' },
    { id: 'appointment', name: 'Appointments', icon: '👨‍⚕️', ico: 'stethoscope', tone: 'blue' },
    { id: 'exercise', name: 'Exercise', icon: '🚶', ico: 'steps', tone: 'green' },
    { id: 'cognitive', name: 'Activities', icon: '🧠', ico: 'brain', tone: 'lav' },
    { id: 'hydration', name: 'Water', icon: '💧', ico: 'droplet', tone: 'blue' },
    { id: 'rest', name: 'Rest', icon: '😴', ico: 'moon', tone: 'lav' },
    { id: 'custom', name: 'Other', icon: '📝', ico: 'note', tone: 'cream' }
  ];

  var REPEATS = [
    { id: 'once', name: 'Once' },
    { id: 'daily', name: 'Every day' },
    { id: 'weekdays', name: 'Weekdays (Mon–Fri)' },
    { id: 'weekly', name: 'Weekly' },
    { id: 'custom', name: 'Chosen days' }
  ];

  var PRIORITIES = [
    { id: 'normal', name: 'Normal' },
    { id: 'important', name: 'High Priority' }
  ];

  var MEMORY_CATEGORIES = [
    { id: 'family', name: 'Family', icon: '👨‍👩‍👧', question: 'Who is {title}?' },
    { id: 'food', name: 'Favourite Food', icon: '🍲', question: 'Which of these is a favourite food?' },
    { id: 'place', name: 'Important Places', icon: '🏡', question: 'Which place is important to you?' },
    { id: 'music', name: 'Favourite Music', icon: '🎵', question: 'Which music do you enjoy?' },
    { id: 'routine', name: 'Daily Routine', icon: '📅', question: 'What happens at this time of day?' },
    { id: 'personal', name: 'Personal Memories', icon: '❤️', question: 'Which memory belongs to you?' },
    { id: 'object', name: 'Familiar Objects', icon: '🧺', question: 'Which object is yours?' }
  ];

  /* How the patient browses memories. The older `category` field is kept
     for the Memory Lane game; `group` is what the Memories screen shows. */
  var MEMORY_GROUPS = [
    { id: 'family', name: 'Family', ico: 'users', tone: 'peach', category: 'family' },
    { id: 'people', name: 'People', ico: 'smile', tone: 'blue', category: 'personal' },
    { id: 'places', name: 'Places', ico: 'pin', tone: 'green', category: 'place' },
    { id: 'moments', name: 'Special Moments', ico: 'sparkle', tone: 'lav', category: 'personal' }
  ];

  var MOODS = [
    { id: 'happy', name: 'Happy', face: '😀' },
    { id: 'good', name: 'Good', face: '🙂' },
    { id: 'okay', name: 'Okay', face: '😐' },
    { id: 'worried', name: 'Worried', face: '😟' },
    { id: 'sad', name: 'Sad', face: '😢' },
    { id: 'tired', name: 'Tired', face: '😴' },
    { id: 'low', name: 'Not good', face: '😔', legacy: true }
  ];

  var SUGGESTIONS = [
    { title: 'Drink water', category: 'hydration', time: '10:30', repeat: 'daily', icon: '💧', description: 'A glass of water.' },
    { title: 'Cognitive activity', category: 'cognitive', time: '10:00', repeat: 'daily', icon: '🧠', description: "Today's SMIVAI session." },
    { title: 'Breakfast', category: 'meal', time: '08:00', repeat: 'daily', icon: '🍽️', description: 'Morning meal.' },
    { title: 'Evening walk', category: 'exercise', time: '17:00', repeat: 'daily', icon: '🚶', description: 'A short walk nearby.' },
    { title: 'Afternoon rest', category: 'rest', time: '14:00', repeat: 'daily', icon: '😴', description: 'A short rest.' },
    { title: 'Call family', category: 'custom', time: '19:00', repeat: 'weekly', icon: '📞', description: 'A call with the family.' }
  ];

  /* ---------------- Lookups ---------------- */
  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  var M = {
    GAMES: GAMES,
    UPCOMING_GAMES: UPCOMING_GAMES,
    MEMORY_GROUPS: MEMORY_GROUPS,
    DIFFICULTIES: DIFFICULTIES,
    REMINDER_CATEGORIES: REMINDER_CATEGORIES,
    REPEATS: REPEATS,
    PRIORITIES: PRIORITIES,
    MEMORY_CATEGORIES: MEMORY_CATEGORIES,
    MOODS: MOODS,
    SUGGESTIONS: SUGGESTIONS,

    game: function (id) { return byId(GAMES, id) || { id: id, name: S.titleCase(id), icon: '🧠', minutes: [3, 3, 3, 3, 4] }; },
    difficulty: function (id) { return byId(DIFFICULTIES, id) || DIFFICULTIES[2]; },

    /** Activity name in the reader's language, falling back to English. */
    gameName: function (id, code) {
      var key = 'game_' + id;
      if (S.I18N && S.I18N.strings[key]) return S.I18N.text(key, null, code);
      return this.game(id).name;
    },

    /** Difficulty name in the reader's language. */
    difficultyName: function (id, code) {
      if (S.I18N && S.I18N.strings[id]) return S.I18N.text(id, null, code);
      return this.difficulty(id).name;
    },
    reminderCategory: function (id) { return byId(REMINDER_CATEGORIES, id) || byId(REMINDER_CATEGORIES, 'custom'); },
    memoryCategory: function (id) { return byId(MEMORY_CATEGORIES, id) || byId(MEMORY_CATEGORIES, 'personal'); },
    repeat: function (id) { return byId(REPEATS, id) || REPEATS[0]; },
    mood: function (id) { return byId(MOODS, id) || MOODS[1]; },
    memoryGroup: function (id) { return byId(MEMORY_GROUPS, id) || MEMORY_GROUPS[3]; },
    /** Group for a memory row, including older rows that only have a category. */
    groupOf: function (m) {
      if (m.group) return m.group;
      return m.category === 'family' ? 'family' : m.category === 'place' ? 'places' : 'moments';
    },

    difficultyIndex: function (id) {
      for (var i = 0; i < DIFFICULTIES.length; i++) if (DIFFICULTIES[i].id === id) return i;
      return 2;   // medium
    },
    /** Gentler than medium (very easy, easy) / harder than medium (hard, very hard). */
    isGentle: function (id) { return this.difficultyIndex(id) < 2; },
    isHard: function (id) { return this.difficultyIndex(id) > 2; },

    /* ---------------- Factories ---------------- */
    newPatient: function (o) {
      return {
        patient_id: o.patient_id || S.uid('pat'),
        name: o.name,
        age: o.age || null,
        /* Preferred language, chosen at onboarding. Everything the patient
           reads or hears is resolved against this. */
        language: o.language || 'en',
        /* Set once a caregiver has confirmed the choice with the patient,
           so an unreviewed default never masquerades as a preference. */
        language_confirmed: o.language_confirmed !== undefined ? o.language_confirmed : false,
        voice_gender: o.voice_gender || 'female',
        district: o.district || '',
        caregiver_id: o.caregiver_id === undefined ? 'cg_001' : o.caregiver_id,
        doctor_id: o.doctor_id === undefined ? 'dr_001' : o.doctor_id,
        avatar_tone: o.avatar_tone || 'sage',
        gender: o.gender || '',
        plan: o.plan || 'free',
        share_code: o.share_code || '',
        // Rasch-style ability estimate per activity (logits). See adaptive.js.
        ability: o.ability || {},
        difficulty: o.difficulty || {},
        created_at: o.created_at || S.stamp(),
        updated_at: S.stamp()
      };
    },

    newGameSession: function (o) {
      return {
        session_id: o.session_id || S.uid('ses'),
        patient_id: o.patient_id,
        game_type: o.game_type,
        difficulty: o.difficulty,
        score: o.score,
        accuracy: o.accuracy,                 // 0..1
        response_time: o.response_time,       // seconds, average per action
        mistakes: o.mistakes || 0,
        attempts: o.attempts || 0,
        completion_status: o.completion_status || 'completed', // completed | partial
        duration_seconds: o.duration_seconds || 0,
        content_level: o.content_level || 1,  // 1 general · 2 NER local · 3 personal
        source: o.source || 'patient_app',
        timestamp: o.timestamp || S.stamp(),
        date: o.date || S.todayISO(),
        updated_at: S.stamp()
      };
    },

    /** Roles shown to people (not the internal ids). */
    roleName: function (role) {
      return { patient: 'Patient', caregiver: 'Caregiver', doctor: 'Doctor', donor: 'Donor',
               admin: 'Smivai administrator', charity_partner: 'Charity partner' }[role] || S.titleCase(role || '');
    },
    /** Roles that have Free/Premium plans and a care record. */
    hasPlans: function (role) { return role === 'patient' || role === 'caregiver' || role === 'doctor'; },

    /** An appointment still to happen: requested (scheduled) or confirmed.
        Cancelled, completed and rescheduled (replaced) ones are closed. */
    apptOpen: function (a) { return !!a && (a.status === 'scheduled' || a.status === 'confirmed'); },

    /** Words for an appointment's status, as the patient reads them. */
    apptStatusText: function (a) {
      return { scheduled: S.tx('st_waiting', 'Waiting for confirmation'), confirmed: S.tx('st_confirmed', 'Confirmed'),
               cancelled: S.tx('st_cancelled', 'Cancelled'), completed: S.tx('st_completed', 'Completed'),
               rescheduled: S.tx('st_rescheduled', 'Moved to a new time') }[a.status] || S.titleCase(a.status || '');
    },

    /** One judged answer inside a game session (Rasch response data). */
    newItemResponse: function (o) {
      return {
        response_id: o.response_id || S.uid('resp'),
        session_id: o.session_id,
        patient_id: o.patient_id,
        game_type: o.game_type,
        level: o.level,                       // the "item": this game at this level
        b: o.b,                               // item difficulty used when it was played (logits)
        level_source: o.level_source || 'auto', // auto · manual
        seq: o.seq,                           // 1-based order within the session
        correct: !!o.correct,
        response_ms: o.response_ms || null,
        item_ref: o.item_ref || null,         // optional: what was asked
        created_at: o.created_at || S.stamp()
      };
    },

    newReminder: function (o) {
      return {
        reminder_id: o.reminder_id || S.uid('rem'),
        patient_id: o.patient_id,
        title: o.title,
        description: o.description || '',
        category: o.category || 'custom',
        date: o.date || S.todayISO(),
        time: o.time || '09:00',
        repeat: o.repeat || 'once',
        repeat_days: o.repeat_days || [],     // 0..6 for repeat === 'custom'
        priority: o.priority || 'normal',
        status: o.status || 'active',         // active | paused
        created_by_role: o.created_by_role || 'caregiver',
        created_by_id: o.created_by_id || 'cg_001',
        created_by_name: o.created_by_name || 'Caregiver',
        voice_enabled: o.voice_enabled !== false,
        created_at: o.created_at || S.stamp(),
        updated_at: S.stamp()
      };
    },

    /* One occurrence of a reminder on a given date. */
    newReminderEvent: function (o) {
      return {
        event_id: o.event_id || S.uid('rev'),
        reminder_id: o.reminder_id,
        patient_id: o.patient_id,
        date: o.date,
        status: o.status || 'completed',      // completed | skipped | missed
        marked_at: o.marked_at || S.stamp(),
        marked_by: o.marked_by || 'patient',
        updated_at: S.stamp()
      };
    },

    newMemory: function (o) {
      return {
        memory_id: o.memory_id || S.uid('mem'),
        patient_id: o.patient_id,
        category: o.category,
        title: o.title,
        content: o.content || '',
        icon: o.icon || '',
        group: o.group || '',
        memory_date: o.memory_date || '',
        people: o.people || '',
        place: o.place || '',
        event: o.event || '',
        photo_media: o.photo_media || '',
        photo_scene: o.photo_scene || '',
        photo_url: o.photo_url || '',
        ico: o.ico || '',          // the card's icon; blank = the group's
        tone: o.tone || '',
        created_by: o.created_by || 'caregiver',
        created_at: o.created_at || S.stamp(),
        updated_at: S.stamp()
      };
    },

    newScore: function (o) {
      return {
        score_id: o.score_id || S.uid('cas'),
        patient_id: o.patient_id,
        date: o.date || S.todayISO(),
        score: o.score,
        trend: o.trend || 'stable',
        sessions_counted: o.sessions_counted || 0,
        updated_at: S.stamp()
      };
    },

    newMood: function (o) {
      return {
        mood_id: o.mood_id || S.uid('mood'),
        patient_id: o.patient_id,
        date: o.date || S.todayISO(),
        mood: o.mood,
        updated_at: S.stamp()
      };
    },

    newCareNote: function (o) {
      return {
        note_id: o.note_id || S.uid('note'),
        patient_id: o.patient_id,
        created_by: o.created_by || 'caregiver',
        created_by_name: o.created_by_name || 'Caregiver',
        content: o.content,
        timestamp: o.timestamp || S.stamp(),
        updated_at: S.stamp()
      };
    },

    newContact: function (o) {
      return {
        contact_id: o.contact_id || S.uid('con'),
        patient_id: o.patient_id,
        name: o.name,
        relation: o.relation || '',
        phone: o.phone || '',
        is_emergency: !!o.is_emergency,
        updated_at: S.stamp()
      };
    },

    newRoutine: function (o) {
      return {
        routine_id: o.routine_id || S.uid('rou'),
        patient_id: o.patient_id,
        time: o.time,
        title: o.title,
        icon: o.icon || '🕐',
        updated_at: S.stamp()
      };
    },

    /* ---------------- Access scope ----------------
       Prototype-level role separation. Enforced on every screen that
       reads patient data; mirrored server-side in backend/app/deps.py. */
    canAccess: function (role, actorId, patient) {
      if (!patient || !actorId) return false;
      if (role === 'patient') return patient.patient_id === actorId;
      if (role === 'caregiver' || role === 'doctor') return S.Links.exists(role, actorId, patient.patient_id);
      return false;
    },

    /** Patients this actor may see: through an active care link only. */
    visiblePatients: function (role, actorId) {
      if (!actorId) return [];
      if (role === 'patient') { var me = S.DB.find('patients', actorId); return me ? [me] : []; }
      var ids = {};
      S.Links.forActor(role, actorId).forEach(function (l) { ids[l.patient_id] = true; });
      return S.DB.all('patients').filter(function (p) { return ids[p.patient_id]; })
        .sort(function (a, b) { return a.name < b.name ? -1 : 1; });
    }
  };

  S.M = M;
})(window);
