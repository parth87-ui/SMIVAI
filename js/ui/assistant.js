/* ============================================================
   SMIVAI — ui/assistant.js
   "Ask HUN" — natural language interaction in the patient's language.

   The loop:
       speech  →  ASR in the patient's language      (Bhashini / AI4Bharat)
               →  translate to English if needed     (Bhashini NMT)
               →  intent match against the patient's own data
               →  answer composed in English
               →  translate back to the patient's language
               →  spoken aloud                       (Bhashini TTS)

   Intent matching runs on the English pivot, so one small intent table
   serves every language rather than needing keyword lists per language.
   Answers are always grounded in this patient's records — the assistant
   reads the database, it does not generate medical content.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  /* Intents are matched on the English pivot. Each returns a plain answer
     string built from the patient's own data. */
  var INTENTS = [
    {
      id: 'next_reminder',
      patterns: [/next remind/i, /what.*(next|now)/i, /what.*do now/i, /remind/i, /medicine.*when/i, /when.*medicine/i],
      answer: function (p) {
        var next = S.Reminders.next(p.patient_id);
        if (!next) return 'You have nothing else scheduled today.';
        var when = S.prettyTime(next.reminder.time);
        var day = next.date === S.todayISO() ? 'today' : 'tomorrow';
        return next.reminder.title + ' at ' + when + ', ' + day + '.';
      }
    },
    {
      id: 'todays_activity',
      patterns: [/activit/i, /exercise/i, /play/i, /game/i, /what.*today/i, /session/i],
      answer: function (p) {
        var plan = S.Plan.progress(p);
        if (!plan.total) return 'There is no activity planned for today.';
        if (plan.done >= plan.total) return 'You have finished all ' + plan.total + ' activities today. Well done.';
        var next = plan.next;
        return 'You have completed ' + plan.done + ' of ' + plan.total + ' activities. ' +
          'Next is ' + next.game.name + ', about ' + next.minutes + ' minutes.';
      },
      action: function () { S.Router.go('#/patient/play'); }
    },
    {
      id: 'medicine',
      patterns: [/medicine/i, /tablet/i, /pill/i, /dawa/i],
      answer: function (p) {
        var meds = S.Reminders.occurrencesOn(p.patient_id, S.todayISO()).filter(function (o) {
          return o.reminder.category === 'medicine';
        });
        if (!meds.length) return 'There is no medicine reminder set for today.';
        return meds.map(function (o) {
          var st = o.status === 'completed' ? 'already taken' :
                   o.status === 'missed' ? 'not marked yet' : 'coming up';
          return o.reminder.title + ' at ' + S.prettyTime(o.reminder.time) + ', ' + st;
        }).join('. ') + '.';
      }
    },
    {
      id: 'family',
      patterns: [/family/i, /son|daughter|wife|husband/i, /call/i, /phone/i, /who is/i],
      answer: function (p, text) {
        var contacts = S.DB.forPatient('contacts', p.patient_id);
        var mem = S.DB.forPatient('memory_bank', p.patient_id).filter(function (m) { return m.category === 'family'; });
        // "who is Rahul" — look the name up in this patient's own memories
        var named = mem.filter(function (m) {
          return new RegExp('\\b' + m.title.replace(/[.*+?^${}()|[\]\\]/g, '') + '\\b', 'i').test(text);
        })[0];
        if (named) return named.title + ' is your ' + (named.content || '').split('.')[0].toLowerCase() + '.';
        if (!contacts.length) return 'There are no family contacts saved yet.';
        return 'You can call ' + contacts.map(function (c) { return c.name + ', your ' + c.relation.toLowerCase(); }).join(', or ') + '.';
      },
      action: function () { S.Router.go('#/patient/family'); }
    },
    {
      id: 'memories',
      patterns: [/memor/i, /remember/i, /favourite|favorite/i, /food/i, /like to eat/i],
      answer: function (p) {
        var mems = S.DB.forPatient('memory_bank', p.patient_id);
        var food = mems.filter(function (m) { return m.category === 'food'; });
        if (food.length) return 'Your favourite foods are ' + food.map(function (m) { return m.title; }).join(' and ') + '.';
        if (mems.length) return 'You have ' + mems.length + ' memories saved. Open My Memories to see them.';
        return 'No memories have been saved yet. Your caregiver can add them.';
      },
      action: function () { S.Router.go('#/patient/memories'); }
    },
    {
      id: 'progress',
      patterns: [/how am i doing/i, /progress/i, /score/i, /how did i do/i],
      answer: function (p) {
        var plan = S.Plan.progress(p);
        return 'You have done ' + plan.done + ' of ' + plan.total + ' activities today. You are doing well.';
      }
    },
    {
      id: 'time',
      patterns: [/what time/i, /which day/i, /what day/i, /date/i],
      answer: function () {
        var now = new Date();
        return 'It is ' + S.prettyTime((now.getHours() < 10 ? '0' : '') + now.getHours() + ':' +
          (now.getMinutes() < 10 ? '0' : '') + now.getMinutes()) + ' on ' +
          S.weekdayName(S.todayISO()) + ', ' + S.prettyDate(S.todayISO()) + '.';
      }
    },
    {
      id: 'help',
      patterns: [/help/i, /what can you/i, /confused/i, /lost/i],
      answer: function () {
        return 'You can ask me about your next reminder, your medicine, today\'s activity, ' +
          'your family, or your memories.';
      }
    }
  ];

  var SUGGESTIONS = [
    'What is my next reminder?',
    'What activity should I do today?',
    'Who can I call?',
    'What is my favourite food?'
  ];

  var Assistant = {
    listening: false,
    busy: false,

    open: function () {
      var p = S.State.patient();
      if (!p) return;
      var lang = p.language || 'en';
      var caps = S.LangService.capabilities(lang);
      var canListen = S.LangService.canListen(lang);

      S.Modal.open({
        title: S.t('assistant'),
        subtitle: canListen ? S.t('tap_and_speak') : null,
        body:
          '<div class="assistant">' +
            (!canListen
              ? '<div class="alert info" style="margin-bottom:18px"><span class="al-ico emoji">🎤</span><div>' +
                  '<div class="al-title">' + S.esc(S.t('language')) + ': ' + S.esc(caps.language.name) + '</div>' +
                  '<div class="al-body">' + S.esc(S.LangService.explainNoAsr(lang)) + '</div></div></div>'
              : '') +
            '<div class="asst-stage">' +
              '<button class="asst-mic" data-act="mic" ' + (canListen ? '' : 'disabled') + ' aria-label="' + S.esc(S.t('speak_now')) + '">' +
                '<span class="emoji">🎤</span></button>' +
              '<div class="asst-state" id="asst-state">' + S.esc(canListen ? S.t('tap_and_speak') : S.t('choose_one_answer')) + '</div>' +
            '</div>' +
            '<div id="asst-thread" class="asst-thread"></div>' +
            '<div class="asst-suggest">' +
              '<div class="t-mini" style="margin-bottom:10px">' + S.esc(S.t('try_asking')) + '</div>' +
              '<div class="suggest-wrap">' +
                SUGGESTIONS.map(function (q, i) {
                  return '<button class="suggest" data-act="ask" data-arg="' + i + '">' + S.esc(q) + '</button>';
                }).join('') +
              '</div>' +
            '</div>' +
          '</div>',
        footer: '<button class="btn btn-secondary" data-modal-close>' + S.esc(S.t('close')) + '</button>',
        noAutofocus: true,
        handlers: {
          mic: function (el) { Assistant.toggleMic(el, p); },
          ask: function (el) { Assistant.handle(SUGGESTIONS[parseInt(el.getAttribute('data-arg'), 10)], p, true); }
        }
      });
    },

    setState: function (text) {
      var el = S.qs('#asst-state');
      if (el) el.textContent = text;
    },

    say: function (who, text, sub) {
      var thread = S.qs('#asst-thread');
      if (!thread) return;
      var row = document.createElement('div');
      row.className = 'asst-line ' + who;
      row.innerHTML = '<div class="asst-bubble">' + S.esc(text) + '</div>' +
        (sub ? '<div class="asst-sub">' + S.esc(sub) + '</div>' : '');
      thread.appendChild(row);
      thread.scrollTop = thread.scrollHeight;
    },

    toggleMic: function (btn, patient) {
      var self = this;
      var lang = patient.language || 'en';

      if (this.listening) {
        this.listening = false;
        btn.classList.remove('is-live');
        this.setState('…');
        S.LangService.stopListening(lang).then(function (res) {
          if (!res.ok || !res.text) {
            self.setState(S.t('didnt_catch'));
            if (res.note) S.toast(res.note, 'warn', 5000);
            return;
          }
          self.handle(res.text, patient, false, res.provider);
        });
        return;
      }

      S.LangService.startListening(lang).then(function (res) {
        if (!res.ok) {
          self.setState(res.note || S.t('didnt_catch'));
          if (res.note) S.toast(res.note, 'warn', 5000);
          return;
        }
        self.listening = true;
        btn.classList.add('is-live');
        self.setState(S.t('listening'));
      });
    },

    /**
     * Handle one utterance.
     * @param {string} text      what the patient said, in their language
     * @param {object} patient
     * @param {boolean} isEnglish true when it came from a suggestion chip
     */
    handle: function (text, patient, isEnglish, provider) {
      var self = this;
      var lang = patient.language || 'en';
      if (this.busy) return;
      this.busy = true;

      this.say('user', text, provider ? 'heard via ' + provider : null);
      this.setState('…');

      // 1 · get an English pivot to match intents against
      var toEnglish = (isEnglish || lang === 'en')
        ? Promise.resolve({ ok: true, text: text })
        : S.LangService.translate(text, lang, 'en');

      toEnglish.then(function (tr) {
        var pivot = (tr && tr.ok && tr.text) ? tr.text : text;

        // 2 · match an intent against the patient's own data
        var hit = null;
        for (var i = 0; i < INTENTS.length && !hit; i++) {
          for (var j = 0; j < INTENTS[i].patterns.length; j++) {
            if (INTENTS[i].patterns[j].test(pivot)) { hit = INTENTS[i]; break; }
          }
        }

        var answerEn = hit
          ? hit.answer(patient, pivot)
          : 'I am not sure about that. You can ask me about your next reminder, your medicine, ' +
            'today\'s activity, your family, or your memories.';

        // 3 · put the answer back into the patient's language
        var toPatient = lang === 'en'
          ? Promise.resolve({ ok: true, text: answerEn })
          : S.LangService.translate(answerEn, 'en', lang);

        return toPatient.then(function (out) {
          var spokenText = (out && out.ok && out.text) ? out.text : answerEn;
          var machineNote = (lang !== 'en' && out && out.ok) ? 'translated by ' + out.provider : null;

          self.say('smivai', spokenText, machineNote);
          self.setState(S.t('tap_and_speak'));

          // 4 · speak it
          S.Voice.speak(spokenText, lang).then(function (r) {
            if (!r.spoken && r.note) S.toast(r.note, 'warn', 5000);
          });

          if (hit && hit.action) {
            setTimeout(function () { S.Modal.close(); hit.action(); }, 2600);
          }
          self.busy = false;
        });
      }).catch(function (err) {
        console.warn('[SMIVAI] assistant', err);
        self.say('smivai', S.t('didnt_catch'));
        self.setState(S.t('tap_and_speak'));
        self.busy = false;
      });
    }
  };

  S.Assistant = Assistant;
})(window);
