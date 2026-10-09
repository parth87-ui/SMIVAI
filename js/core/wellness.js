/* ============================================================
   SMIVAI — wellness.js
   Everyday content: Daily Fact, Learn a Skill, health tips, the doctor
   directory, home-care services and the feeling check-in.

   Tips are general wellbeing habits, never treatment advice, and each
   one ends with the same idea: ask your doctor about anything specific.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  /* The old trivia list ("Octopuses have three hearts"…) was replaced by the
     sourced Daily Facts collection in content_daily.js. */

  var SKILLS = [
    { id: 'box_breathing', title: 'Calm breathing', minutes: 3, art: 'plant', color: 'green',
      intro: 'A slow breathing pattern that many people find relaxing.',
      steps: ['Sit comfortably with your feet on the floor.', 'Breathe in slowly through your nose while you count to four.', 'Hold gently for a count of four.', 'Breathe out slowly for a count of four.', 'Repeat four times. Notice your shoulders relax.'] },
    { id: 'video_call', title: 'Make a video call', minutes: 5, art: 'caregiver', color: 'blue',
      intro: 'See your family’s faces when you talk to them.',
      steps: ['Open the phone’s contact list.', 'Tap the name of the person you want to call.', 'Look for the small camera symbol and tap it.', 'Hold the phone in front of your face, about an arm’s length away.', 'Tap the red button when you have finished.'] },
    { id: 'hand_stretch', title: 'Gentle hand stretches', minutes: 3, art: 'puzzle', color: 'peach',
      intro: 'Keep your fingers flexible for writing and buttons.',
      steps: ['Open your hands wide and spread your fingers.', 'Slowly close them into a soft fist.', 'Touch each fingertip to your thumb, one by one.', 'Rotate your wrists slowly, five times each way.', 'Shake your hands loosely for a few seconds.'] },
    { id: 'new_words', title: 'Three new words', minutes: 4, art: 'book', color: 'lav',
      intro: 'Learn three words and use them today.',
      steps: ['“Serene” means calm and peaceful.', '“Nostalgia” is the warm feeling of remembering the past.', '“Resilient” means able to recover after something difficult.', 'Say each word aloud twice.', 'Try using one of them when you talk to someone today.'] },
    { id: 'chair_exercise', title: 'Chair marching', minutes: 5, art: 'trophy', color: 'green',
      intro: 'A safe way to get moving without standing up.',
      steps: ['Sit near the front of a sturdy chair, holding the sides.', 'Lift your right knee a little, then put it down.', 'Lift your left knee a little, then put it down.', 'Continue for one minute, at your own pace.', 'Rest, then repeat once if you feel comfortable. Stop if anything hurts.'] },
    { id: 'gratitude', title: 'Three good things', minutes: 3, art: 'shieldHeart', color: 'peach',
      intro: 'A small habit that brightens the day.',
      steps: ['Think of one good thing that happened today, however small.', 'Think of a second good thing.', 'Think of a third.', 'If you like, tell someone about one of them.', 'You can also add a memory in My Memories.'] },
    { id: 'phone_font', title: 'Make phone text bigger', minutes: 4, art: 'bulb', color: 'blue',
      intro: 'Make reading your phone easier.',
      steps: ['Open the phone’s Settings.', 'Find “Display” or “Accessibility”.', 'Tap “Font size” or “Text size”.', 'Move the slider to the right until the text is comfortable.', 'Go back — every app will now use the bigger text.'] },
    { id: 'recipe_memory', title: 'Share a family recipe', minutes: 5, art: 'book', color: 'cream',
      intro: 'Recipes carry family memories. Save one for the next generation.',
      steps: ['Choose a dish your family loves.', 'Say or write the ingredients.', 'Describe each step as if teaching a grandchild.', 'Add who taught you, and when you usually cook it.', 'Save it in My Memories under Special Moments.'] }
  ];

  var TIPS = [
    { title: 'Stay hydrated!', text: 'Drink a glass of water with each meal and one in between.', art: 'water' },
    { title: 'Move a little, often', text: 'A short walk or chair marching after meals keeps the body happy.', art: 'plant' },
    { title: 'Talk to someone today', text: 'A phone call with family or a friend is good for the heart and mind.', art: 'phone' },
    { title: 'Keep a steady routine', text: 'Waking and eating at the same times each day helps you feel settled.', art: 'calendar' },
    { title: 'Rest your eyes', text: 'Every so often, look at something far away for a few seconds.', art: 'bulb' },
    { title: 'Enjoy some sunlight', text: 'A little morning light near a window or on a walk can lift the mood.', art: 'weather' }
  ];

  var DOCTORS = [
    { id: 'dr_001', name: 'Dr. A. Choudhury', speciality: 'Geriatric Medicine', city: 'Jorhat', languages: ['Assamese', 'English', 'Hindi'], years: 19, fee: 400, modes: ['video', 'clinic'], gender: 'male' },
    { id: 'dir_neha', name: 'Dr. Neha Barua', speciality: 'General Physician', city: 'Guwahati', languages: ['Assamese', 'English', 'Hindi'], years: 11, fee: 350, modes: ['video', 'clinic', 'home'], gender: 'female' },
    { id: 'dir_rohan', name: 'Dr. Rohan Mehta', speciality: 'Cardiologist', city: 'Guwahati', languages: ['English', 'Hindi'], years: 15, fee: 700, modes: ['video', 'clinic'], gender: 'male' },
    { id: 'dir_ibemhal', name: 'Dr. Ibemhal Devi', speciality: 'Neurologist', city: 'Imphal', languages: ['Manipuri', 'English'], years: 14, fee: 650, modes: ['video', 'clinic'], gender: 'female' },
    { id: 'dir_lalremruati', name: 'Dr. Lalremruati', speciality: 'Physiotherapist', city: 'Aizawl', languages: ['Mizo', 'English'], years: 8, fee: 300, modes: ['home', 'clinic'], gender: 'female' },
    { id: 'dir_bodosa', name: 'Dr. Bodosa Narzary', speciality: 'General Physician', city: 'Kokrajhar', languages: ['Bodo', 'Assamese', 'English'], years: 9, fee: 300, modes: ['video', 'home'], gender: 'male' },
    { id: 'dir_kharkongor', name: 'Dr. W. Kharkongor', speciality: 'Ophthalmologist', city: 'Shillong', languages: ['Khasi', 'English'], years: 17, fee: 500, modes: ['clinic'], gender: 'male' },
    { id: 'dir_sen', name: 'Dr. Mitali Sen', speciality: 'Psychiatrist (Elder care)', city: 'Kolkata', languages: ['Bengali', 'English', 'Hindi'], years: 21, fee: 800, modes: ['video'], gender: 'female' }
  ];

  var VISIT_MODES = [
    { id: 'video', name: 'Video call', icon: 'video', desc: 'From your home, on this device' },
    { id: 'clinic', name: 'At the clinic', icon: 'stethoscope', desc: 'Visit the doctor in person' },
    { id: 'home', name: 'Home visit', icon: 'home', desc: 'The doctor comes to you' }
  ];

  var CARE_SERVICES = [
    { id: 'companion', name: 'Companionship visit', desc: 'Someone to talk, walk and have tea with', icon: 'smile', color: 'peach' },
    { id: 'daily_help', name: 'Help with daily tasks', desc: 'Meals, tidying, getting ready', icon: 'home', color: 'blue' },
    { id: 'nurse', name: 'Nurse visit', desc: 'Blood pressure, dressing, medicines check', icon: 'stethoscope', color: 'lav' },
    { id: 'errands', name: 'Errands & shopping', desc: 'Groceries, pharmacy, bills', icon: 'truck', color: 'green' },
    { id: 'physio', name: 'Physiotherapy session', desc: 'Gentle exercises at home', icon: 'pulse', color: 'cream' }
  ];

  /* Feeling check-in — gentle words, never clinical. */
  var FEELINGS = [
    { id: 'happy', name: 'Happy', face: '😀', tone: 'green' },
    { id: 'good', name: 'Good', face: '🙂', tone: 'blue' },
    { id: 'okay', name: 'Okay', face: '😐', tone: 'cream' },
    { id: 'worried', name: 'Worried', face: '😟', tone: 'peach' },
    { id: 'sad', name: 'Sad', face: '😢', tone: 'lav' },
    { id: 'tired', name: 'Tired', face: '😴', tone: 'lav' }
  ];

  function dayIndex() {
    var d = new Date(), start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / 86400000);
  }

  var Wellness = {
    SKILLS: SKILLS, TIPS: TIPS, DOCTORS: DOCTORS, VISIT_MODES: VISIT_MODES,
    CARE_SERVICES: CARE_SERVICES, FEELINGS: FEELINGS,

    /* The Daily Facts section draws from S.Daily (content_daily.js): real
       stories, sourced facts and encouraging messages, chosen per patient per
       day without repeats. */
    factOfDay: function (offset, patientId) {
      var pid = patientId || (S.State && S.State.patientId) || 'device';
      var it = S.Daily.forDay(pid, offset || 0);
      return { id: it.id, type: it.type, title: it.title, text: it.text, tag: S.Daily.TYPE_LABEL[it.type], by: it.by || '', source: it.source || null };
    },
    encouragement: function (patientId) { return S.Daily.encouragement(patientId || (S.State && S.State.patientId)); },
    skillOfDay: function () { return SKILLS[dayIndex() % SKILLS.length]; },
    skill: function (id) { return SKILLS.filter(function (s) { return s.id === id; })[0] || SKILLS[0]; },
    doctor: function (id) {
      return DOCTORS.filter(function (d) { return d.id === id; })[0] ||
        (function () { var r = S.DB.find('doctors', id); return r ? { id: r.doctor_id, name: r.name, speciality: r.speciality || 'General Physician', city: '', languages: ['English'], years: null, fee: null, modes: ['video', 'clinic'] } : null; })();
    },
    feeling: function (id) {
      return FEELINGS.filter(function (f) { return f.id === id; })[0] ||
        (id === 'low' ? { id: 'low', name: 'Not good', face: '😔', tone: 'lav' } : { id: id, name: S.titleCase(id), face: '🙂', tone: 'blue' });
    },

    /** Activity streak: consecutive days (ending today or yesterday) with any activity. */
    streak: function (patientId) {
      var days = {};
      S.DB.forPatient('game_sessions', patientId).forEach(function (s) { days[s.date] = true; });
      S.DB.forPatient('moods', patientId).forEach(function (m) { days[m.date] = true; });
      S.DB.forPatient('activity_log', patientId).forEach(function (a) { days[a.date] = true; });
      var n = 0, d = S.todayISO();
      if (!days[d]) d = S.addDays(d, -1);
      while (days[d]) { n++; d = S.addDays(d, -1); }
      return n;
    },

    log: function (patientId, kind, ref) {
      var today = S.todayISO();
      var exists = S.DB.where('activity_log', function (a) {
        return a.patient_id === patientId && a.date === today && a.kind === kind && a.ref === ref;
      })[0];
      if (exists) return exists;
      return S.DB.insert('activity_log', { activity_id: S.uid('act'), patient_id: patientId, kind: kind, ref: ref || '', date: today, created_at: S.stamp() });
    },

    doneToday: function (patientId, kind) {
      var today = S.todayISO();
      return S.DB.where('activity_log', function (a) { return a.patient_id === patientId && a.date === today && a.kind === kind; }).length > 0;
    },

    /** Latest self-reported readings, with gentle, non-diagnostic labels. */
    latestVitals: function (patientId) {
      var rows = S.DB.forPatient('vitals', patientId).sort(function (a, b) { return a.recorded_at < b.recorded_at ? 1 : -1; });
      var pick = function (kind) { return rows.filter(function (r) { return r.kind === kind; })[0] || null; };
      return { bp: pick('bp'), spo2: pick('spo2'), weight: pick('weight'), steps: pick('steps') };
    },

    vitalLabel: function (v) {
      if (!v) return null;
      if (v.kind === 'bp') {
        var ok = v.systolic >= 90 && v.systolic <= 139 && v.diastolic >= 60 && v.diastolic <= 89;
        return ok ? { text: 'Normal', tone: 'green' } : { text: 'Ask your doctor', tone: 'amber' };
      }
      if (v.kind === 'spo2') return v.value >= 95 ? { text: 'Good', tone: 'green' } : { text: 'Ask your doctor', tone: 'amber' };
      if (v.kind === 'weight') return { text: 'Recorded', tone: 'blue' };
      if (v.kind === 'steps') return v.value >= 4000 ? { text: 'Great going!', tone: 'green' } : { text: 'Keep Going!', tone: 'peach' };
      return null;
    }
  };

  /* ---------- i18n registration helper ----------
     New screens register their English source strings on first use so
     every visible word still resolves through S.t() — bundled translation,
     cached machine translation, or English — and appears in the caregiver
     translation-review export. */
  S.tx = function (key, en, params) {
    if (S.I18N && S.I18N.strings && !S.I18N.strings[key]) S.I18N.strings[key] = { en: en };
    return S.t(key, params);
  };

  S.Wellness = Wellness;
})(window);
