/* ============================================================
   SMIVAI — companion.js
   What SMIVAI says back.

   Two engines, chosen honestly and labelled on screen:

     basic     an on-device intent engine. It reads this patient's own
               records — reminders, memories, appointments, activity —
               and answers from them. No medical content is generated.

     advanced  Premium only, and only when the SMIVAI server is
               configured with a model key (see backend/app/ai.py). The
               key never reaches the browser. If the server is not
               configured, SMIVAI says so and uses the basic engine —
               it never pretends to be something it is not.

   The basic engine answers in the language of each message, not only the
   profile's. S.LangDetect works out the language and turns the message
   into English keywords; intents are matched on those, so one table
   serves every language. Each intent returns a reply built from the
   patient's own data, and S.Replies renders it in the person's language
   and script — see js/core/companion_i18n.js.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;
  var Rp = function () { return S.Replies; };

  function first(p) { return String(p.name || '').split(' ')[0]; }
  function reply(key, params) { return { key: key, params: params || {} }; }

  /* ------------------------------------------------------------
     Personal questions — answered from the patient's own saved records,
     never by guessing. The source of truth for each:
       name            → the patients row (S.State.patient)
       family          → contacts (+ family memories)
       saved memories  → memory_bank
       reminders       → reminders
       "earlier"       → this patient's saved conversation turns
     Missing data is said plainly; nothing is ever invented.
     ------------------------------------------------------------ */
  /* "hun" is often heard as "hon"/"hoon"; a leading "hey hun," is dropped. */
  function strip(text) {
    return String(text || '').replace(/^\s*((hey|hi|hello|ok|okay)[\s,]+)?(hun|hunn|hoon|hon)\b[\s,.!:-]*/i, '').trim();
  }

  var RELATIONS = {
    daughter: ['daughter', 'beti', 'putri'], son: ['son', 'beta', 'putra'],
    wife: ['wife', 'patni'], husband: ['husband', 'pati'],
    granddaughter: ['granddaughter', 'poti', 'natin'], grandson: ['grandson', 'pota', 'nati'],
    grandchild: ['grandchild', 'grandchildren', 'grandkid', 'grandkids'],
    brother: ['brother', 'bhai'], sister: ['sister', 'behen', 'bahin', 'didi'],
    mother: ['mother', 'maa', 'mom'], father: ['father', 'papa', 'baba'],
    friend: ['friend', 'dost'], neighbour: ['neighbour', 'neighbor']
  };
  /** Which family member a question names ("my daughter", "my son's number"), or null. */
  function relationIn(text) {
    var m = /\bmy\s+(\w+?)(?:'s|s)?\b/i.exec(text) || /\b(\w+)\s+ka\s+naam\b/i.exec(text);
    if (!m) return null;
    var word = m[1].toLowerCase();
    for (var k in RELATIONS) if (RELATIONS[k].indexOf(word) !== -1) return k;
    return null;
  }
  function relationMatches(contact, key) {
    var r = String(contact.relation || '').toLowerCase();
    if (key === 'grandchild') return /grand(son|daughter|child)/.test(r);
    return RELATIONS[key].some(function (w) { return new RegExp('\\b' + w + '\\b').test(r); });
  }
  function listNames(arr) {
    return arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  }
  function savedMemories(p) {
    return S.DB.forPatient('memory_bank', p.patient_id).sort(function (a, b) {
      return String(b.updated_at || b.created_at || '') < String(a.updated_at || a.created_at || '') ? -1 : 1;
    });
  }
  /** Is this a question (as opposed to a statement)? */
  function isQuestion(text) {
    return /\?\s*$/.test(text) || /^\s*(what|who|where|when|why|how|which|whose|is|are|can|could|do|does|did|will|would|tell me|kya|kaun|kab|kahan|kaise)\b/i.test(text);
  }
  /** About the person themself ("my", "I", "me") rather than the world. */
  function isPersonal(text) { return /\b(my|mine|i|me|i'?m|i am|mera|meri|mere|mujhe)\b/i.test(text); }

  var PERSONAL = [
    {
      id: 'my_name', personal: true,
      test: /\b(what'?s my name|what is my name|whats my name|my name\?|who am i|do you know (who i am|my name)|do you remember me|remember who i am|tell me my name|say my name|mera naam|naam kya hai)\b/i,
      answer: function (p, text) {
        if (!p.name) return { reply: reply('name_unknown') };
        return { reply: reply(/remember/i.test(text) ? 'remember_me' : 'my_name', { name: p.name, first: first(p) }) };
      }
    },
    {
      id: 'family_member', personal: true,
      test: { test: function (text) { return !!relationIn(text) && /\b(who|name|number|phone|call|tell me about|where|ka naam|kaun)\b/i.test(text); } },
      answer: function (p, text) {
        var key = relationIn(text);
        var found = S.DB.forPatient('contacts', p.patient_id).filter(function (c) { return relationMatches(c, key); });
        if (!found.length) return { reply: reply('family_member_none', { rel: key }), action: 'caregiver' };
        var wantsNumber = /\b(number|phone|call)\b/i.test(text);
        if (wantsNumber) {
          var withPhone = found.filter(function (c) { return c.phone; });
          if (!withPhone.length) return { reply: reply('family_member_nophone', { rel: key, names: listNames(found.map(function (c) { return c.name; })) }) };
          return { reply: reply('family_member_phone', { list: listNames(withPhone.map(function (c) { return c.name + ' — ' + c.phone; })) }), action: 'caregiver' };
        }
        if (found.length === 1) return { reply: reply('family_member_one', { rel: key, name: found[0].name, first: first(p) }), action: 'caregiver' };
        return { reply: reply('family_member_many', { rel: key, n: found.length, names: listNames(found.map(function (c) { return c.name; })) }), action: 'caregiver' };
      }
    },
    {
      id: 'family_all', personal: true,
      test: /\b(who is in my family|who'?s in my family|my family members|tell me about my family|what did i (tell|say to) you about my family|about my family|meri family|mera parivar)\b/i,
      answer: function (p) {
        var contacts = S.DB.forPatient('contacts', p.patient_id);
        var famMems = savedMemories(p).filter(function (m) { return m.category === 'family' || m.group === 'family'; });
        if (!contacts.length && !famMems.length) return { reply: reply('family_none'), action: 'caregiver' };
        var who = contacts.map(function (c) { return c.name + (c.relation ? ' (your ' + String(c.relation).toLowerCase() + ')' : ''); });
        return {
          reply: reply('family_all', {
            list: who.length ? listNames(who) : '',
            mem: famMems.length ? ' You also saved ' + famMems.length + ' family ' + (famMems.length === 1 ? 'memory' : 'memories') + ', like “' + famMems[0].title + '”.' : ''
          }),
          action: 'caregiver'
        };
      }
    },
    {
      id: 'reminders_list', personal: true,
      test: /\b(what did i ask you to remind|what (are|were) my reminders|my reminders|list (of )?(my )?reminders|which reminders|what reminders|remind me about\?)\b/i,
      answer: function (p) {
        var rems = S.Reminders.forPatient(p.patient_id).filter(function (r) { return r.status !== 'paused'; });
        if (!rems.length) return { reply: reply('reminders_none'), action: 'reminders' };
        var items = rems.slice(0, 5).map(function (r) { return r.title + ' at ' + S.prettyTime(r.time); });
        return { reply: reply('reminders_list', { n: rems.length, list: listNames(items), more: rems.length > 5 ? ' and ' + (rems.length - 5) + ' more' : '' }), action: 'reminders' };
      }
    },
    {
      id: 'memories_list', personal: true,
      test: /\b(what memories|which memories|memories (have )?i (have )?saved|memories i saved|my saved memories|list (my )?memories|how many memories|what have i saved)\b/i,
      answer: function (p) {
        var mems = savedMemories(p);
        if (!mems.length) return { reply: reply('memories_none'), action: 'memories' };
        return { reply: reply('memories_list', { n: mems.length, list: listNames(mems.slice(0, 3).map(function (m) { return '“' + m.title + '”'; })) }), action: 'memories' };
      }
    },
    {
      id: 'memory_recent', personal: true,
      test: /\b(remember (the|my) memory|memory (that )?i (saved|added)|the memory i saved|my last memory|latest memory|last memory)\b/i,
      answer: function (p) {
        var m = savedMemories(p)[0];
        if (!m) return { reply: reply('memories_none'), action: 'memories' };
        return {
          reply: reply('memory_recent', {
            title: m.title,
            where: m.place ? ', at ' + m.place : '',
            note: m.content ? ' You wrote: “' + String(m.content).slice(0, 120) + (String(m.content).length > 120 ? '…' : '') + '”' : ''
          }),
          action: 'memory:' + m.memory_id
        };
      }
    },
    {
      id: 'recall', personal: true,
      test: /\b(what did i (tell|say to|ask) you|what did i say|what were we talking about|what did we talk about|did i tell you|what have i told you|earlier i (told|said))\b/i,
      answer: function (p, text, ctx) {
        /* Only the person's own earlier words, from saved conversation turns —
           never a guess. Questions they asked are not "things they told me". */
        var said = ((ctx && ctx.history) || []).filter(function (h) {
          return h.role === 'user' && h.content && !isQuestion(h.content) && h.content.split(/\s+/).length >= 3;
        }).map(function (h) { return h.content; });
        if (!said.length) return { reply: reply('recall_none') };
        var last = said.slice(-2).map(function (s) { return '“' + String(s).slice(0, 140) + '”'; });
        return { reply: reply('recall', { list: last.join(' and ') }) };
      }
    },
    {
      id: 'today_plan', personal: true,
      test: /\b(what should i do today|what do i (have|do) today|plan for today|what'?s (on )?(for )?today|aaj kya karna|today'?s plan)\b/i,
      answer: function (p) {
        var plan = S.Plan.progress(p);
        var next = S.Reminders.next(p.patient_id);
        var parts = [];
        if (next && next.date === S.todayISO()) parts.push(next.reminder.title + ' at ' + S.prettyTime(next.reminder.time));
        if (plan.total) parts.push(plan.done >= plan.total ? 'your brain games are all done' : 'brain games — ' + plan.done + ' of ' + plan.total + ' done' + (plan.next ? ', next is ' + S.M.gameName(plan.next.game_type) : ''));
        if (!parts.length) return { reply: reply('today_free', { first: first(p) }) };
        return { reply: reply('today_plan', { list: listNames(parts), first: first(p) }), action: plan.next ? 'games' : 'reminders' };
      }
    },
    {
      id: 'encourage', personal: true,
      test: /\b(something encouraging|encourage me|cheer me up|motivate me|something nice|kind words|i feel useless|i am useless|i'?m useless|i feel old|i am too old|kuch accha bolo)\b/i,
      answer: function (p) {
        var m = S.Wellness.encouragement(p.patient_id);
        return { reply: reply('encourage', { text: m.text, by: m.by ? ' — ' + m.by : '' }) };
      }
    }
  ];

  /* Each intent answers from this patient's own data. Order matters:
     the first match wins, so urgent and specific ones come first. */
  var INTENTS = [
    {
      id: 'emergency',
      test: /\b(emergency|help me now|chest pain|cannot breathe|can'?t breathe|i fell|fallen down|bleeding|unconscious|severe pain)\b/i,
      answer: function () { return { reply: reply('emergency'), action: 'sos', urgent: true }; }
    },
    {
      id: 'medical_advice',
      test: /\b(should i take|what dose|how many tablets|is it safe to|do i have|diagnos|what is wrong with me|cure|treatment for)\b/i,
      answer: function (p) {
        var apt = S.DB.forPatient('appointments', p.patient_id).filter(function (a) { return a.date >= S.todayISO() && S.M.apptOpen(a); })[0];
        return apt
          ? { reply: reply('medical_advice_apt', { doctor: apt.doctor_name, date: Rp().date(apt.date) }), action: 'doctor' }
          : { reply: reply('medical_advice'), action: 'doctor' };
      }
    },
    {
      id: 'greeting',
      test: /\b(hello|hi|hey|namaste|namaskar|good morning|good afternoon|good evening|khurumjari)\b/i,
      answer: function (p) {
        var plan = S.Plan.progress(p);
        return { reply: reply(plan.done < plan.total ? 'greeting_plan' : 'greeting_done', { name: first(p) }) };
      }
    },
    {
      id: 'how_are_you',
      test: /\b(how are you|kaise ho|are you well)\b/i,
      answer: function () { return { reply: reply('how_are_you') }; }
    },
    {
      id: 'low_mood',
      test: /\b(lonely|alone|sad|unhappy|missing|bored|upset|low|crying|no one)\b/i,
      answer: function (p) {
        var c = S.DB.forPatient('contacts', p.patient_id)[0];
        var mem = S.DB.forPatient('memory_bank', p.patient_id)[0];
        var parts = [reply('low_mood')];
        if (c) parts.push(reply('low_mood_call', { contact: c.name }));
        if (mem) parts.push(reply('low_mood_memory'));
        return { reply: parts, suggest: ['Call my family', 'Show me a memory', 'Let’s play a game'] };
      }
    },
    {
      id: 'good_mood',
      test: /\b(i am fine|i'?m fine|i fine|feeling good|feeling well|happy|very good|theek)\b/i,
      answer: function () { return { reply: reply('good_mood') }; }
    },
    {
      /* before the reminders: "what time is it now" asks the time, not the
         next task — unless it names one ("what time is my medicine") */
      id: 'time',
      test: /^(?!.*\b(medicine|remind|task|appointment|doctor|tablet|pill)\b).*\b(what time|time what|time is|which day|what day|date|today is)\b/i,
      answer: function () {
        var now = new Date();
        var hh = (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
        var today = S.todayISO();
        return { reply: reply('time', { time: Rp().now(hh), weekday: Rp().weekday(today), date: Rp().date(today) }) };
      }
    },
    {
      /* before next_reminder, so "when is my medicine" lists the medicines */
      id: 'medicine',
      test: /\b(medicine|tablet|pill|dawa|dose taken)\b/i,
      answer: function (p) {
        var meds = S.Reminders.occurrencesOn(p.patient_id, S.todayISO()).filter(function (o) { return o.reminder.category === 'medicine'; });
        if (!meds.length) return { reply: reply('medicine_none'), action: 'reminders' };
        var items = meds.map(function (o) {
          var st = o.status === 'completed' ? 'taken' : o.status === 'missed' ? 'missed' : 'upcoming';
          return reply('med_item', { title: o.reminder.title, time: Rp().at(o.reminder.time), status: Rp().medStatus(st) });
        });
        return { reply: reply('medicine_list', { list: items }), action: 'reminders' };
      }
    },
    {
      id: 'next_reminder',
      test: /\b(next remind|remind|next (task|thing|work|job)|my task|what.*(next|now)|next.*what|what next|schedule)\b/i,
      answer: function (p) {
        var next = S.Reminders.next(p.patient_id);
        if (!next) return { reply: reply('next_none') };
        var today = next.date === S.todayISO();
        return {
          reply: reply('next_reminder', {
            title: next.reminder.title,
            time: Rp().at(next.reminder.time),
            when: Rp().day(today),
            doing: Rp().doing(next.reminder.category)
          }),
          action: 'reminders'
        };
      }
    },
    {
      id: 'activity',
      test: /\b(activit|exercise|play|game|session|what.*today)\b/i,
      answer: function (p) {
        var plan = S.Plan.progress(p);
        if (!plan.total) return { reply: reply('activity_none'), action: 'games' };
        if (plan.done >= plan.total) return { reply: reply('activity_done', { total: plan.total }), action: 'games' };
        var gameId = plan.next.game_type;
        return {
          reply: reply('activity_next', {
            done: plan.done, total: plan.total, minutes: plan.next.minutes,
            game: function (v) { return S.M.gameName(gameId, v === 'hi-Latn' ? 'en' : v); }
          }),
          action: 'games'
        };
      }
    },
    {
      id: 'family',
      test: /\b(family|son|daughter|wife|husband|grandchild|call|phone|who is)\b/i,
      answer: function (p, text) {
        var contacts = S.DB.forPatient('contacts', p.patient_id);
        var mem = S.DB.forPatient('memory_bank', p.patient_id).filter(function (m) { return m.category === 'family' || m.group === 'family'; });
        var named = mem.filter(function (m) {
          return new RegExp('\\b' + String(m.title).replace(/[.*+?^${}()|[\]\\]/g, '') + '\\b', 'i').test(text);
        })[0];
        if (named) {
          return { reply: reply('family_named', { title: named.title, content: named.content || 'someone dear to you', place: named.place ? ' (' + named.place + ')' : '' }), action: 'memories' };
        }
        if (!contacts.length) return { reply: reply('family_none'), action: 'caregiver' };
        return {
          reply: reply('family_list', {
            list: function (v) {
              return contacts.map(function (c) {
                var rel = String(c.relation || '').toLowerCase();
                return v === 'en' ? c.name + ', your ' + rel : c.name + (rel ? ' (' + rel + ')' : '');
              }).join(Rp().listSep(v));
            }
          }),
          action: 'caregiver'
        };
      }
    },
    {
      id: 'memories',
      /* not any "favourite": "what is my favourite colour?" is not about memories */
      test: /\b(memor|remember|photo|picture|old days|favou?rite (memory|photo|picture|place|day))\b/i,
      answer: function (p) {
        var mems = S.DB.forPatient('memory_bank', p.patient_id);
        var photo = mems.filter(function (m) { return S.Media.hasPhoto(m); })[0];
        if (photo) {
          return {
            reply: reply('memories_photo', {
              title: photo.title,
              place: function (v) { return photo.place ? (v === 'en' ? ', at ' + photo.place : ' (' + photo.place + ')') : ''; }
            }),
            action: 'memory:' + photo.memory_id
          };
        }
        if (mems.length) return { reply: reply('memories_count', { n: mems.length }), action: 'memories' };
        return { reply: reply('memories_none'), action: 'memories' };
      }
    },
    {
      id: 'progress',
      test: /\b(how am i doing|progress|score|how did i do|streak)\b/i,
      answer: function (p) {
        var streak = S.Wellness.streak(p.patient_id);
        var plan = S.Plan.progress(p);
        return {
          reply: streak > 1 ? reply('progress_streak', { done: plan.done, total: plan.total, streak: streak })
            : reply('progress', { done: plan.done, total: plan.total }),
          action: 'progress'
        };
      }
    },
    {
      id: 'appointment',
      test: /\b(doctor|appointment|clinic|consult|checkup|check-up)\b/i,
      answer: function (p) {
        var apt = S.DB.forPatient('appointments', p.patient_id).filter(function (a) { return a.date >= S.todayISO() && S.M.apptOpen(a); })
          .sort(function (a, b) { return a.date < b.date ? -1 : 1; })[0];
        if (apt) return { reply: reply('appointment_next', { doctor: apt.doctor_name, date: Rp().date(apt.date), time: Rp().at(apt.time) }), action: 'doctor' };
        return { reply: reply('appointment_none'), action: 'doctor' };
      }
    },
    {
      id: 'fact',
      test: /\b(fact|tell me something|interesting|did you know)\b/i,
      answer: function (p) {
        var f = S.Wellness.factOfDay(0, p.patient_id);
        return { reply: reply('fact', { title: f.title, text: f.text }), action: 'fact' };
      }
    },
    {
      id: 'skill',
      test: /\b(teach me|learn|how do i|show me how)\b/i,
      answer: function () {
        var sk = S.Wellness.skillOfDay();
        return { reply: reply('skill', { title: sk.title, intro: sk.intro, minutes: sk.minutes }), action: 'skill' };
      }
    },
    {
      id: 'joke',
      test: /\b(joke|make me laugh|funny|song|story)\b/i,
      answer: function () { return { reply: reply('joke', { joke: Rp().joke(Math.random()) }) }; }
    },
    {
      id: 'weather',
      test: /\b(weather|raining|rain|hot today|cold today|sunny)\b/i,
      answer: function (p) {
        return S.Services.Weather.get(p.district).then(function (w) {
          if (!w.ok) return { reply: reply('weather_fail') };
          return { reply: reply('weather_ok', { city: w.city, temp: w.temp, desc: String(w.text || '').toLowerCase() }) };
        });
      }
    },
    {
      id: 'identity',
      test: /\b(who are you|your name|what are you|are you a robot)\b/i,
      answer: function (p) { return { reply: reply('identity', { name: first(p) }) }; }
    },
    {
      id: 'thanks',
      test: /\b(thank|thanks|dhanyabad|dhanyavad)\b/i,
      answer: function () { return { reply: reply('thanks') }; }
    },
    {
      id: 'bye',
      test: /\b(bye|goodbye|that'?s all|stop talking|enough|good night)\b/i,
      answer: function (p) { return { reply: reply('bye', { name: first(p) }), action: 'end' }; }
    }
  ];

  /* Safety first (emergency, medicine), then personal questions, then the rest. */
  INTENTS.splice.apply(INTENTS, [2, 0].concat(PERSONAL));

  var Companion = {
    INTENTS: INTENTS,
    strip: strip,
    isQuestion: isQuestion,

    /* ---------------- conversation memory (this patient only) ---------------- */
    /** Keep one turn. Device-only: never synced, never shared with the care team. */
    remember: function (patientId, role, text) {
      if (!patientId || !text) return;
      S.DB.insert('conversation_turns', { turn_id: S.uid('turn'), patient_id: patientId, role: role, content: String(text).slice(0, 600), at: S.stamp() }, { silent: true });
      var all = this.recent(patientId, 1000);
      if (all.length > 100) all.slice(0, all.length - 100).forEach(function (t) { S.DB.remove('conversation_turns', t.turn_id, { silent: true }); });
    },
    /** The last n turns, oldest first, as {role, content}. */
    recent: function (patientId, n) {
      return S.DB.where('conversation_turns', function (t) { return t.patient_id === patientId; })
        .sort(function (a, b) { return a.at < b.at ? -1 : a.at > b.at ? 1 : 0; })
        .slice(-(n || 12)).map(function (t) { return { role: t.role, content: t.content, turn_id: t.turn_id }; });
    },

    /** Which engine will answer, and whether it is really available. */
    engine: function (patient) {
      var premium = S.Plans.planOf('patient', patient.patient_id) === 'premium';
      if (premium && S.Services.AI.available()) return { id: 'advanced', label: 'HUN · Advanced AI · Premium' };
      if (premium) return { id: 'basic', label: 'HUN · basic — advanced AI is not connected on this device' };
      return { id: 'basic', label: 'HUN · basic (on this device)' };
    },

    suggestions: function (patient, ctx) {
      if (ctx && ctx.memory) return ['Who is in this photo?', 'Tell me about this memory', 'What happened that day?'];
      var out = ['What is my next reminder?', 'What should I do today?'];
      if (S.DB.forPatient('memory_bank', patient.patient_id).length) out.push('Show me a happy memory');
      out.push('Tell me something interesting');
      if (S.DB.forPatient('contacts', patient.patient_id).length) out.push('Who can I call?');
      return out;
    },

    /** The patient's own context, summarised for the advanced engine. */
    context: function (patient, ctx) {
      var plan = S.Plan.progress(patient);
      var next = S.Reminders.next(patient.patient_id);
      var mems = S.DB.forPatient('memory_bank', patient.patient_id);
      var apt = S.DB.forPatient('appointments', patient.patient_id).filter(function (a) { return a.date >= S.todayISO() && S.M.apptOpen(a); })[0];
      return {
        name: patient.name, first_name: first(patient), age: patient.age, place: patient.district,
        language: S.I18N.lang(patient.language).name,
        activities_done: plan.done, activities_total: plan.total,
        next_activity: plan.next ? S.M.gameName(plan.next.game_type) : null,
        next_reminder: next ? { title: next.reminder.title, category: next.reminder.category, time: S.prettyTime(next.reminder.time), day: next.date === S.todayISO() ? 'today' : 'tomorrow' } : null,
        next_appointment: apt ? { doctor: apt.doctor_name, date: S.prettyDate(apt.date), time: S.prettyTime(apt.time) } : null,
        family: S.DB.forPatient('contacts', patient.patient_id).map(function (c) { return c.name + ' (' + c.relation + ')'; }),
        memories: mems.slice(0, 12).map(function (m) { return { title: m.title, when: m.memory_date, people: m.people, place: m.place, note: m.content }; }),
        streak_days: S.Wellness.streak(patient.patient_id),
        focus_memory: ctx && ctx.memory ? { title: ctx.memory.title, when: ctx.memory.memory_date, people: ctx.memory.people, place: ctx.memory.place, note: ctx.memory.content } : null
      };
    },

    /** Local intent match. Resolves to {reply, action?, suggest?, intent?}. */
    local: function (patient, pivot, ctx) {
      ctx = ctx || {};
      var text = String(pivot || '');

      /* Confirming a note against the memory we are looking at */
      if (ctx.pendingNote && /\b(yes|yes please|ok|okay|save it|please do|haan|ha)\b/i.test(text)) {
        var m = ctx.memory;
        if (m) {
          S.DB.update('memory_bank', m.memory_id, { content: (m.content ? m.content + '\n\n' : '') + ctx.pendingNote });
          ctx.pendingNote = null;
          return Promise.resolve({ reply: reply('mem_saved', { title: m.title }), action: 'memory:' + m.memory_id });
        }
      }
      if (ctx.pendingNote && /\b(no|not now|leave it|nahi)\b/i.test(text)) {
        ctx.pendingNote = null;
        return Promise.resolve({ reply: reply('mem_not_saved') });
      }

      text = strip(text);
      for (var i = 0; i < INTENTS.length; i++) {
        if (INTENTS[i].test.test(text)) {
          var id = INTENTS[i].id;
          return Promise.resolve(INTENTS[i].answer(patient, text, ctx)).then(function (res) { res.intent = id; return res; });
        }
      }

      /* Talking about a specific memory: reflect it back and offer to keep it */
      if (ctx.memory) {
        var mem = ctx.memory;
        if (/\bwho\b/i.test(text)) {
          return Promise.resolve({ reply: mem.people
            ? [reply('mem_who', { title: mem.title, people: mem.people })].concat(mem.place ? [reply('mem_where', { place: mem.place })] : [])
            : reply('mem_who_unknown') });
        }
        if (/\bwhen|what year|which day\b/i.test(text)) {
          return Promise.resolve({ reply: mem.memory_date ? reply('mem_when', { title: mem.title, date: Rp().date(mem.memory_date) }) : reply('mem_when_unknown') });
        }
        if (text.split(/\s+/).length >= 6) {
          ctx.pendingNote = ctx.original || text;
          return Promise.resolve({ reply: reply('mem_offer', { title: mem.title }) });
        }
        return Promise.resolve({ reply: reply('mem_prompt') });
      }

      /* A question nothing above could answer. Never filler like "tell me
         more" to a question: say what Hun can and cannot know. */
      if (isQuestion(text)) {
        return Promise.resolve(isPersonal(text)
          ? { reply: reply('personal_unknown'), fallback: true, intent: 'personal_unknown' }
          : { reply: reply('general_offline'), fallback: true, intent: 'general_question' });
      }
      /* Something the person is telling Hun: acknowledge it warmly (it is kept
         in their conversation, so "what did I tell you earlier" can find it). */
      if (text.split(/\s+/).length >= 4) {
        return Promise.resolve({ reply: reply('statement_ack', { first: first(patient) }), intent: 'statement' });
      }
      return Promise.resolve({ reply: reply('fallback_' + Math.floor(Math.random() * 3)), fallback: true });
    },

    /**
     * Answer one message. Always resolves — never throws at the patient.
     * opts.det      what S.LangDetect found (language, script, reply style)
     * opts.original the message exactly as the person wrote or said it
     * @returns {Promise<{text, localized?, action?, suggest?, engine, note?}>}
     *   text       the answer in English
     *   localized  {text, speech, speechLang} in the person's own language,
     *              when SMIVAI can say it on this device
     */
    answer: function (patient, pivot, ctx, history, opts) {
      opts = opts || {};
      var self = this;
      var det = opts.det || { lang: 'en', variant: 'en' };
      ctx = ctx || {};
      ctx.original = opts.original;
      /* The person's earlier words, for "what did I tell you earlier": the
         saved turns of this patient only, minus the message being answered. */
      var past = (history && history.length ? history : this.recent(patient.patient_id, 24)).slice();
      if (past.length && past[past.length - 1].role === 'user' && strip(String(past[past.length - 1].content).toLowerCase()) === strip(String(opts.original || pivot).toLowerCase())) past.pop();
      ctx.history = past;

      function basic(extra) {
        return self.local(patient, pivot, ctx).then(function (r) {
          var out = Object.assign({}, r, extra || {});
          out.engine = 'basic';
          out.text = S.Replies.render(r.reply, 'en') || '';
          var v = det.variant;
          if (v && v !== 'en') {
            var shown = S.Replies.render(r.reply, v);
            if (shown) {
              /* Hindi typed in English letters is shown the same way but read
                 aloud from the Devanagari, which a Hindi voice pronounces properly */
              var spoken = v === 'hi-Latn' ? (S.Replies.render(r.reply, 'hi') || shown) : shown;
              out.localized = { text: shown, speech: spoken, speechLang: det.lang };
            }
          }
          return out;
        });
      }

      if (this.engine(patient).id !== 'advanced') return basic();

      /* Emergencies and medicine questions are always answered by the
         fixed on-device rules, even with advanced AI: the reply and the
         SOS / doctor button must not depend on a model or a network. */
      var pivotText = strip(String(pivot || ''));
      if (INTENTS.some(function (i) { return (i.id === 'emergency' || i.id === 'medical_advice') && i.test.test(pivotText); })) {
        return basic();
      }
      /* Questions about the person's own saved records (name, family,
         memories, reminders, what they said earlier) are answered from those
         records directly — the source of truth — not by the model. */
      if (PERSONAL.some(function (i) { return i.test.test(pivotText); })) return basic();

      /* Only hints travel. The server reads this patient's records itself
         (backend/app/ai.py · build_context), so the device never ships
         names, ages or memory notes to the model provider. */
      var hints = {
        reply_language: det.variant === 'hi-Latn' ? 'Hindi, written in English letters (Hinglish)'
          : S.I18N.lang(det.lang).name + (det.script && det.script !== 'latn' ? ' (in its own script)' : ''),
        local_date: S.todayISO(),
        local_time: S.nowHHMM(),
        focus_memory_id: ctx.memory ? ctx.memory.memory_id : null
      };

      return S.Services.AI.chat({
        patient_id: patient.patient_id,
        message: opts.original || pivot,
        context: hints,
        history: (history || []).slice(-10)
      }).then(function (res) {
        if (res.ok && res.text) {
          return { text: res.text, engine: 'advanced', provider: res.provider,
            localized: det.lang !== 'en' ? { text: res.text, speech: res.text, speechLang: det.lang } : null };
        }
        return basic({
          note: res.reason === 'premium-required' ? 'Advanced AI needs a Premium plan — answering from your own records instead.'
            : res.reason === 'not-configured' ? 'Advanced AI is not connected on this device — answering from your own records instead.'
            : 'HUN could not reach the SMIVAI server, so I answered from your own records.'
        });
      });
    }
  };

  S.Companion = Companion;
})(window);
