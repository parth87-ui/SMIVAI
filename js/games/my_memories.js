/* ============================================================
   SMIVAI — Activity 6 · My Memories
   Reminiscence and personal recall — the signature SMIVAI activity.

   Every question is built from THIS patient's Memory Bank, read with
   their patient_id. Distractors are drawn from the general content bank
   or from the same patient's other entries — never from another patient.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var LEVELS = { very_easy: 3, easy: 4, medium: 5, hard: 6, very_hard: 7 };

  var RELATIONS = ['Son', 'Daughter', 'Wife', 'Husband', 'Grandson', 'Granddaughter',
    'Neighbour', 'Friend', 'Doctor', 'Nurse', 'Cousin'];
  var GENERIC_PLACES = ['The market', 'The hospital', 'The railway station', 'The post office', 'The city office'];
  var GENERIC_MUSIC = ['Film songs', 'Classical music', 'Drum music', 'Devotional songs', 'Flute music'];
  var GENERIC_PERSONAL = ['Worked at the post office', 'Ran a tea stall', 'Drove a bus', 'Worked at the bank'];
  var GENERIC_ROUTINE = ['Goes to the market', 'Reads the newspaper', 'Visits a neighbour', 'Naps in the afternoon'];

  function firstSentence(text) {
    return String(text || '').split('.')[0].trim();
  }

  function distinct(list, correct, n) {
    var out = [];
    S.shuffle(list).forEach(function (v) {
      if (out.length >= n) return;
      if (v.toLowerCase() === String(correct).toLowerCase()) return;
      if (out.indexOf(v) !== -1) return;
      out.push(v);
    });
    return out;
  }

  /** Build one question from a memory row. */
  function buildQuestion(mem, patient, allMemories, hard) {
    var first = patient.name.split(' ')[0];
    var sameCat = allMemories.filter(function (m) {
      return m.category === mem.category && m.memory_id !== mem.memory_id;
    });

    var q = { icon: mem.icon || S.M.memoryCategory(mem.category).icon, memory: mem };

    switch (mem.category) {
      case 'family': {
        var relation = firstSentence(mem.content) || 'Family';
        q.text = 'Who is ' + mem.title + '?';
        q.correct = relation;
        q.options = distinct(RELATIONS, relation, 2);
        break;
      }
      case 'food': {
        q.text = 'Which of these does ' + first + ' like to eat?';
        q.correct = mem.title;
        var foods = S.Content.pool({ levels: [1, 2], categories: ['food'] })
          .map(function (i) { return i.label; });
        q.options = distinct(foods, mem.title, 2);
        break;
      }
      case 'place': {
        q.text = 'Which place is important to ' + first + '?';
        q.correct = mem.title;
        q.options = distinct(GENERIC_PLACES, mem.title, 2);
        break;
      }
      case 'music': {
        q.text = 'Which music does ' + first + ' enjoy?';
        q.correct = mem.title;
        q.options = distinct(GENERIC_MUSIC, mem.title, 2);
        break;
      }
      case 'object': {
        q.text = 'Which of these belongs to ' + first + '?';
        q.correct = mem.title;
        var things = S.Content.pool({ levels: [1, 2], categories: ['household'] })
          .map(function (i) { return i.label; });
        q.options = distinct(things, mem.title, 2);
        break;
      }
      case 'routine': {
        q.text = 'What does ' + first + ' usually do?';
        q.correct = mem.title;
        q.options = distinct(GENERIC_ROUTINE, mem.title, 2);
        break;
      }
      default: {
        q.text = 'Which of these is ' + first + '’s own memory?';
        q.correct = mem.title;
        q.options = distinct(GENERIC_PERSONAL, mem.title, 2);
      }
    }

    // Hard level prefers a distractor from the patient's own bank in the
    // same category — closer alternatives, still entirely their own data.
    if (hard && sameCat.length) {
      q.options[0] = sameCat[0].title;
      q.options = distinct(q.options.concat(GENERIC_PERSONAL), q.correct, 2);
    }

    q.all = S.shuffle([q.correct].concat(q.options));
    q.hint = mem.content ? '' : '';
    return q;
  }

  S.Games.my_memories = {
    id: 'my_memories',

    start: function (ctx) {
      var patient = ctx.patient;
      var count = LEVELS[ctx.difficulty] || 5;
      var hard = S.M.isHard(ctx.difficulty);

      /* Only this patient's memories. */
      var memories = S.DB.forPatient('memory_bank', patient.patient_id);
      ctx.setContentLevel(3);

      if (memories.length < 3) {
        ctx.el.innerHTML = S.UI.empty('❤️', 'No memories saved yet',
          'Ask your caregiver to add a few people, places and favourite foods. Then this activity will be ready for you.',
          '<button class="btn btn-lg" data-act="back2">Go back</button>');
        S.bind(ctx.el, { back2: function () { S.GameShell.exit(); } });
        return;
      }

      var chosen = S.sample(memories, Math.min(count, memories.length));
      var questions = chosen.map(function (m) { return buildQuestion(m, patient, memories, hard); });

      var idx = 0, tries = 0, locked = false;

      function render() {
        var q = questions[idx];
        ctx.setInstruction(q.text, S.t('choose_one_answer'));
        ctx.el.innerHTML =
          '<div class="q-card anim-in">' +
            '<div class="q-ico emoji">' + q.icon + '</div>' +
            '<div class="q-text">' + S.esc(q.text) + '</div>' +
            '<div class="q-hint">' + S.esc(S.t('question_of', { n: idx + 1, total: questions.length })) + '</div>' +
          '</div>' +
          '<div class="opt-grid">' +
            q.all.map(function (o, i) {
              return '<button class="opt" data-opt="' + i + '">' + S.esc(o) + '</button>';
            }).join('') +
          '</div>';

        S.qsa('.opt', ctx.el).forEach(function (btn) {
          btn.addEventListener('click', function () { pick(btn, q); });
        });
        ctx.lastActionAt = Date.now();
        tries = 0;
        locked = false;
        ctx.progress(idx, questions.length);
      }

      function advance() {
        idx += 1;
        ctx.clearFeedback();
        if (idx >= questions.length) { ctx.progress(questions.length, questions.length); ctx.finish(); }
        else render();
      }

      function pick(btn, q) {
        if (locked) return;
        var value = btn.textContent;
        var correct = value === q.correct;
        ctx.attempt(correct);

        if (correct) {
          locked = true;
          btn.setAttribute('data-state', 'correct');
          S.qsa('.opt', ctx.el).forEach(function (b) { b.disabled = true; });
          ctx.praise();
          if (q.memory && q.memory.content) {
            ctx.calm(q.memory.title + ' — ' + q.memory.content);
          }
          setTimeout(advance, 1500);
        } else {
          tries += 1;
          btn.setAttribute('data-state', 'soft');
          btn.disabled = true;
          if (tries >= 2) {
            locked = true;
            S.qsa('.opt', ctx.el).forEach(function (b) {
              if (b.textContent === q.correct) b.setAttribute('data-state', 'correct');
              b.disabled = true;
            });
            ctx.calm('The answer is ' + q.correct + '. ' + (q.memory.content || ''));
            setTimeout(advance, 2200);
          } else {
            ctx.encourage();
          }
        }
      }

      render();
    }
  };
})(window);
