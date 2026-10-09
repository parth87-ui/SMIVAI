/* ============================================================
   SMIVAI — seed_v2.js
   Fictional demo data for the v2 features: accounts, plans, care links,
   appointments, health readings, photo memories and notifications.

   Runs after the original seeder, and also upgrades a device that already
   holds v1 data (it only adds what is missing). Every person, number and
   identity below is invented. The demo identity numbers are shown on the
   sign-in screen precisely so nobody mistakes them for real ones.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var DEMO = {
    patients: [
      { patient_id: 'pat_ramesh_das', idType: 'aadhaar', stem: '23456789012', gender: 'male', plan: 'free' },
      { patient_id: 'pat_anjali_devi', idType: 'abha', number: '91234567890123', gender: 'female', plan: 'premium' },
      { patient_id: 'pat_bimal_singh', idType: 'aadhaar', stem: '34567890123', gender: 'male', plan: 'free' }
    ],
    caregiver: { caregiver_id: 'cg_001', name: 'Nabanita Sharma', relation: 'Family caregiver', gender: 'female', idType: 'aadhaar', stem: '45678901234', plan: 'premium' },
    caregiver2: { caregiver_id: 'cg_002', name: 'Pranjal Gogoi', relation: 'Neighbour', gender: 'male', idType: 'aadhaar', stem: '56789012345', plan: 'free' },
    doctor: { doctor_id: 'dr_001', name: 'Dr. A. Choudhury', speciality: 'Geriatric Medicine', idType: 'license', number: 'ASMC-45821', plan: 'free' }
  };

  var PHOTO_MEMORIES = {
    /* photo: a picture bundled in assets/memories/ · ico, tone: the card's
       icon and colour · was: the date an older seed used, so a device that
       still has it can be moved to the new one without touching edits */
    pat_ramesh_das: [
      { title: 'Family Trip to Shillong', group: 'family', scene: 'shillong_hills', photo: 'assets/memories/shillong-trip.jpg', ico: 'mountain', tone: 'lav',
        date: '2024-06-10', people: 'Sabita, Rahul and the grandchildren', place: 'Shillong, Meghalaya', event: 'Summer holiday',
        content: 'We took the long road up through the pine forests. Rahul drove, and the children counted waterfalls all the way.' },
      { title: 'Rongali Bihu at home', group: 'moments', scene: 'festival_lamps', photo: 'assets/memories/rongali-bihu.jpg', ico: 'music', tone: 'peach',
        date: '2024-04-14', was: '2023-04-14', people: 'The whole family', place: 'Home, Jorhat', event: 'Rongali Bihu',
        content: 'Pitha, laru and dancing in the courtyard. I played the dhol and Sabita made her famous til pitha.' },
      { title: 'Evenings by the Brahmaputra', group: 'places', scene: 'brahmaputra_sunset', photo: 'assets/memories/brahmaputra-evening.jpg', ico: 'waves', tone: 'blue',
        date: '2023-11-22', was: '2019-11-02', people: 'Sabita', place: 'Nimati Ghat, Jorhat', event: '',
        content: 'Our favourite place to watch the ferries come in and the sun go down.' },
      /* The next three already live in the original demo (seed.js) with
         their own stories, which the Memory Lane questions are built from.
         Only the photograph, the card icon and a date are added to them. */
      { title: 'Old radio', group: 'moments', photo: 'assets/memories/old-radio.jpg', ico: 'radio', tone: 'cream',
        date: '2023-10-05', content: 'Listens to the morning news on it.' },
      { title: 'Bamboo walking stick', group: 'moments', photo: 'assets/memories/bamboo-stick.jpg', ico: 'sprout', tone: 'green',
        date: '2023-03-12', content: 'Made by his father. Keeps it by the door.' },
      { title: 'The school', group: 'moments', photo: 'assets/memories/the-school.jpg', ico: 'cap', tone: 'lav',
        date: '2019-08-10', content: 'Taught mathematics at the village school for 30 years.' }
    ],
    pat_anjali_devi: [
      { title: 'Picnic at Loktak Lake', group: 'family', scene: 'family_picnic', date: '2022-12-25', people: 'Meena, Tomba and the grandchildren', place: 'Loktak Lake, Manipur', event: 'Christmas picnic',
        content: 'We took a boat out to see the phumdis. Tomba caught a fish and would not stop talking about it.' },
      { title: 'Ningol Chakouba', group: 'moments', scene: 'festival_lamps', date: '2023-11-15', people: 'Meena', place: 'Imphal', event: 'Ningol Chakouba',
        content: 'Meena came home with gifts, and we cooked a big family feast together.' }
    ],
    pat_bimal_singh: [
      { title: 'Family picnic by the river', group: 'family', scene: 'family_picnic', date: '2021-01-15', people: 'Amit and Rina', place: 'Kokrajhar', event: 'Magh Bihu picnic',
        content: 'Everyone brought a dish. Rina sang Bodo songs.' },
      { title: 'Hill trip with old friends', group: 'places', scene: 'shillong_hills', date: '2018-10-08', people: 'School friends', place: 'Shillong', event: 'Reunion',
        content: 'Forty years since school, and we laughed like boys again.' }
    ]
  };

  function aadhaar(stem) { return S.Services.Identity.demoAadhaar(stem); }

  function fmtAadhaar(n) { return n.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3'); }
  function fmtAbha(n) { return n.replace(/(\d{2})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4'); }

  var SeedV2 = {
    DEMO: DEMO,

    /** Demo sign-in details for the login screen. */
    credentials: function () {
      var out = [];
      DEMO.patients.forEach(function (d) {
        var p = S.DB.find('patients', d.patient_id);
        if (!p) return;
        var num = d.idType === 'aadhaar' ? aadhaar(d.stem) : d.number;
        out.push({ role: 'patient', name: p.name, idType: d.idType, number: num,
          display: d.idType === 'aadhaar' ? fmtAadhaar(num) : fmtAbha(num), plan: p.plan || d.plan });
      });
      [DEMO.caregiver, DEMO.caregiver2].forEach(function (c) {
        var num = aadhaar(c.stem);
        out.push({ role: 'caregiver', name: c.name, idType: 'aadhaar', number: num, display: fmtAadhaar(num), plan: S.Plans.planOf('caregiver', c.caregiver_id) });
      });
      out.push({ role: 'doctor', name: DEMO.doctor.name, idType: 'license', number: DEMO.doctor.number, display: DEMO.doctor.number, plan: S.Plans.planOf('doctor', DEMO.doctor.doctor_id) });
      return out;
    },

    needed: function () {
      if (!S.DB.all('accounts').length) return true;
      /* a device upgraded mid-development may hold broken care codes */
      if (S.DB.all('patients').some(function (p) {
        return !p.share_code || p.share_code.indexOf('undefined') !== -1;
      })) return true;
      /* …or caregivers seeded before they carried a gender, which the
         picture slots need to choose a face */
      if ([DEMO.caregiver, DEMO.caregiver2].some(function (c) {
        var rec = S.DB.find('caregivers', c.caregiver_id);
        return rec && !rec.gender;
      })) return true;
      /* …or demo memories from before their photographs */
      return Object.keys(PHOTO_MEMORIES).some(function (pid) {
        if (!S.DB.find('patients', pid)) return false;
        return PHOTO_MEMORIES[pid].some(function (m) {
          if (!m.photo) return false;
          var x = S.DB.where('memory_bank', function (r) { return r.patient_id === pid && r.title === m.title; })[0];
          return !x || (!x.photo_url && !x.photo_media && !x.ico) || (m.date && !x.memory_date);
        });
      });
    },

    /** Add everything v2 needs. Idempotent. Returns a promise (identity hashing is async). */
    run: function () {
      var jobs = [];
      /* A fresh seed may set the demo plans; an existing device must never
         have a real upgrade overwritten. */
      var fresh = !S.DB.all('accounts').length;

      /* ---- entities ---- */
      [DEMO.caregiver, DEMO.caregiver2].forEach(function (c) {
        var rec = S.DB.find('caregivers', c.caregiver_id);
        if (!rec) {
          S.DB.insert('caregivers', { caregiver_id: c.caregiver_id, name: c.name, relation: c.relation, gender: c.gender, plan: c.plan }, { silent: true });
        } else if (!rec.gender) {
          /* devices seeded before caregivers carried a gender */
          S.DB.update('caregivers', c.caregiver_id, { gender: c.gender }, { silent: true });
        }
      });
      if (!S.DB.find('doctors', DEMO.doctor.doctor_id)) {
        S.DB.insert('doctors', { doctor_id: DEMO.doctor.doctor_id, name: DEMO.doctor.name, speciality: DEMO.doctor.speciality,
          license_last4: '5821', license_verified: 'prototype', plan: DEMO.doctor.plan }, { silent: true });
      }

      /* ---- patients: plan, share code, gender; links from legacy fields ---- */
      S.DB.all('patients').forEach(function (p) {
        var d = DEMO.patients.filter(function (x) { return x.patient_id === p.patient_id; })[0];
        var patch = {};
        /* also repairs codes written by an earlier, buggy generator */
        if (!p.share_code || p.share_code.indexOf('undefined') !== -1) {
          patch.share_code = S.Plans.makeShareCode(p.patient_id);
        }
        if (!p.plan || (fresh && d && p.plan !== d.plan && !p.plan_txn)) patch.plan = d ? d.plan : 'free';
        if (!p.gender && d) patch.gender = d.gender;
        if (Object.keys(patch).length) S.DB.update('patients', p.patient_id, patch, { silent: true });

        ['caregiver', 'doctor'].forEach(function (role) {
          var actor = p[role + '_id'];
          if (actor && !S.Links.exists(role, actor, p.patient_id)) {
            S.DB.insert('links', { link_id: S.uid('lnk'), patient_id: p.patient_id, actor_role: role, actor_id: actor, status: 'active', created_at: p.created_at || S.stamp() }, { silent: true });
          }
        });

        SeedV2.enrich(p);
      });

      /* ---- accounts (hash identity numbers exactly as sign-in will) ---- */
      var addAccount = function (role, entityId, name, idType, number) {
        return S.Auth.hashId(role, idType, idType === 'license' ? number.toUpperCase() : number).then(function (hash) {
          if (S.DB.where('accounts', function (a) { return a.role === role && a.entity_id === entityId; }).length) return;
          S.DB.insert('accounts', {
            account_id: 'acct_' + entityId, role: role, entity_id: entityId, name: name,
            id_type: idType, id_hash: hash, id_last4: number.replace(/\D/g, '').slice(-4),
            verification: 'prototype', demo: true, settings: {}, created_at: S.stamp()
          }, { silent: true });
        });
      };
      DEMO.patients.forEach(function (d) {
        var p = S.DB.find('patients', d.patient_id);
        if (p) jobs.push(addAccount('patient', p.patient_id, p.name, d.idType, d.idType === 'aadhaar' ? aadhaar(d.stem) : d.number));
      });
      [DEMO.caregiver, DEMO.caregiver2].forEach(function (c) { jobs.push(addAccount('caregiver', c.caregiver_id, c.name, 'aadhaar', aadhaar(c.stem))); });
      jobs.push(addAccount('doctor', DEMO.doctor.doctor_id, DEMO.doctor.name, 'license', DEMO.doctor.number));

      return Promise.all(jobs).then(function () { S.DB.save(); });
    },

    /** Photo memories, appointments, readings and a welcome notification. */
    enrich: function (p) {
      var pid = p.patient_id;

      /* existing memories get a browse group */
      S.DB.forPatient('memory_bank', pid).forEach(function (m) {
        if (!m.group) m.group = S.M.groupOf(m);
      });
      (PHOTO_MEMORIES[pid] || []).forEach(function (m) {
        var found = S.DB.where('memory_bank', function (x) { return x.patient_id === pid && x.title === m.title; })[0];
        if (found) {
          /* an older demo copy: give it its photograph and card icon, and the
             new date only if nobody has changed the old one */
          var patch = {};
          if (m.photo && !found.photo_url && !found.photo_media) patch.photo_url = m.photo;
          if (m.ico && !found.ico) { patch.ico = m.ico; patch.tone = m.tone; }
          if (m.was && found.memory_date === m.was) patch.memory_date = m.date;
          if (m.date && !found.memory_date) patch.memory_date = m.date;
          if (Object.keys(patch).length) S.DB.update('memory_bank', found.memory_id, patch, { silent: true });
          return;
        }
        S.DB.insert('memory_bank', S.M.newMemory({
          patient_id: pid, category: S.M.memoryGroup(m.group).category, group: m.group,
          title: m.title, content: m.content, memory_date: m.date, people: m.people, place: m.place, event: m.event,
          photo_scene: m.scene || '', photo_url: m.photo || '', ico: m.ico || '', tone: m.tone || '',
          icon: '📷', created_by: 'caregiver'
        }), { silent: true });
      });

      /* appointments */
      if (!S.DB.forPatient('appointments', pid).length) {
        var today = S.todayISO();
        S.DB.insert('appointments', {
          appointment_id: S.uid('apt'), patient_id: pid, doctor_id: 'dr_001', doctor_name: 'Dr. A. Choudhury',
          speciality: 'Geriatric Medicine', date: S.addDays(today, 2), time: '10:00', mode: 'video',
          status: 'confirmed', reason: 'Monthly check-in', created_at: S.stamp()
        }, { silent: true });
        S.DB.insert('appointments', {
          appointment_id: S.uid('apt'), patient_id: pid, doctor_id: 'dir_rohan', doctor_name: 'Dr. Rohan Mehta',
          speciality: 'Cardiologist', date: S.addDays(today, 8), time: '11:30', mode: 'clinic',
          status: 'scheduled', reason: 'Routine heart check', created_at: S.stamp()
        }, { silent: true });
        S.DB.insert('appointments', {
          appointment_id: S.uid('apt'), patient_id: pid, doctor_id: 'dr_001', doctor_name: 'Dr. A. Choudhury',
          speciality: 'Geriatric Medicine', date: S.addDays(today, -26), time: '10:00', mode: 'clinic',
          status: 'completed', reason: 'Monthly check-in', created_at: S.stamp()
        }, { silent: true });
      }

      /* self-reported readings — 14 days, gently varied, stable per patient */
      if (!S.DB.forPatient('vitals', pid).length) {
        var r = S.rng(S.hashSeed(pid + 'vitals'));
        var base = { sys: 118 + Math.round(r() * 12), dia: 76 + Math.round(r() * 8), spo2: 95 + Math.round(r() * 3), wt: 58 + Math.round(r() * 14) };
        for (var i = 13; i >= 0; i--) {
          var d = S.addDays(S.todayISO(), -i);
          var at = d + 'T08:30:00';
          if (i % 2 === 0) S.DB.insert('vitals', { vital_id: S.uid('vit'), patient_id: pid, kind: 'bp', systolic: base.sys + Math.round((r() - .5) * 8), diastolic: base.dia + Math.round((r() - .5) * 6), unit: 'mmHg', recorded_at: at, source: 'self' }, { silent: true });
          if (i % 3 === 0) S.DB.insert('vitals', { vital_id: S.uid('vit'), patient_id: pid, kind: 'spo2', value: base.spo2 - (r() > .8 ? 1 : 0), unit: '%', recorded_at: at, source: 'self' }, { silent: true });
          if (i % 7 === 0) S.DB.insert('vitals', { vital_id: S.uid('vit'), patient_id: pid, kind: 'weight', value: base.wt + Math.round((r() - .5) * 2), unit: 'kg', recorded_at: at, source: 'self' }, { silent: true });
          S.DB.insert('vitals', { vital_id: S.uid('vit'), patient_id: pid, kind: 'steps', value: i === 0 ? 4320 : 2600 + Math.round(r() * 3400), unit: 'steps', recorded_at: d + 'T20:00:00', source: 'self' }, { silent: true });
        }
      }

      if (!S.DB.where('notifications', function (n) { return n.recipient_id === pid; }).length) {
        S.DB.insert('notifications', { notification_id: S.uid('ntf'), recipient_role: 'patient', recipient_id: pid, patient_id: pid,
          kind: 'appointment', title: 'Appointment confirmed', body: 'Dr. A. Choudhury · video call in 2 days at 10:00 AM.', link: '#/patient/doctor', read: false, created_at: S.stamp() }, { silent: true });
        S.DB.insert('notifications', { notification_id: S.uid('ntf'), recipient_role: 'patient', recipient_id: pid, patient_id: pid,
          kind: 'memory', title: 'A new memory was added', body: 'Nabanita added a photo to your memories.', link: '#/patient/memories', read: false, created_at: S.stamp() }, { silent: true });
      }
    }
  };

  S.SeedV2 = SeedV2;
})(window);
