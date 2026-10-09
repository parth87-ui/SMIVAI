/* ============================================================
   SMIVAI — ui/gameshell.js
   The frame every brain game runs inside.

   The shell owns what must behave the same in all eight games:
   the plan check (Free / Premium), the instructions screen, response
   timing, attempt and mistake bookkeeping, supportive wording, the
   elapsed-time chip, saving the session, the adaptive update and the
   completion screen.

   A game module only renders its board and calls ctx.attempt().
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;
  function tx(k, en, p) { return S.tx(k, en, p); }
  function esc(s) { return S.esc(s); }

  S.Games = S.Games || {};

  var PRAISE_KEYS = ['good_job', 'well_done', 'doing_great'];
  var GENTLE_KEYS = ['thats_okay', 'try_another', 'good_effort'];

  /* Plain "how to play" steps, in the patient's language where available. */
  var HOW = {
    picture_matching: ['Look at all the pictures on the board.', 'Tap one picture, then tap the one that belongs with it.', 'Matched pairs stay open. Everything remains visible — there is no rush.'],
    memory_pairs: ['Study the cards while they are face up.', 'Tap “I am ready” when you have looked at them.', 'Turn two cards at a time to find the matching pairs.'],
    picture_bingo: ['HUN names an everyday object.', 'Find that object on the board and tap it.', 'Tap the 🔊 button any time to hear it again.'],
    category_sorting: ['Pick up an object from the tray by tapping it.', 'Tap the group it belongs to — food, clothes, and so on.', 'Keep going until the tray is empty.'],
    jigsaw: ['The finished picture is shown beside the board.', 'Tap one piece, then tap another — they swap places.', 'Keep swapping until the picture looks right.'],
    my_memories: ['HUN asks gentle questions about your own life.', 'Choose the answer you remember.', 'There is no wrong answer that matters — this is for enjoyment.'],
    pattern: ['Look at the row of shapes and colours.', 'Work out what should come next.', 'Tap your answer from the choices below.'],
    word_hustle: ['A picture shows the word.', 'Tap the letters in the right order to spell it.', 'Tap a letter you placed to take it back.']
  };

  var GameShell = {
    active: null,
    timer: null,

    /**
     * @param {string} gameId
     * @param {{difficulty?:string, returnTo?:string, skipIntro?:boolean}} opts
     */
    open: function (gameId, opts) {
      opts = opts || {};
      var patient = S.State.patient();
      if (!patient) { S.Router.go('#/'); return; }

      var game = S.M.game(gameId);
      var mod = S.Games[gameId];
      if (!mod) {
        S.toast(tx('game_missing', 'That activity is not available right now.'), 'warn');
        S.Router.go('#/patient/games');
        return;
      }

      /* Plan check happens here, not in the button that opened it. */
      if (!S.Plans.canPlay(patient, gameId)) {
        S.Router.go('#/patient/games');
        setTimeout(function () { S.Premium.locked(S.M.gameName(gameId)); }, 60);
        return;
      }

      var difficulty = opts.difficulty || S.Adaptive.difficultyFor(patient, gameId);
      if (!opts.skipIntro) return this.intro(game, difficulty, opts);
      this.run(game, difficulty, opts);
    },

    /* ---------------- instructions ---------------- */
    intro: function (game, difficulty, opts) {
      var minutes = game.minutes[S.M.difficultyIndex(difficulty)];
      var steps = HOW[game.id] || [game.desc];
      var patient = S.State.patient();

      var html =
        '<div class="game-wrap intro anim-in">' +
          '<div class="game-top">' +
            '<button class="btn-back" data-act="back" aria-label="' + esc(S.t('back')) + '">' + S.icon('arrowLeft') + '</button>' +
            '<div class="gt-title">' + esc(S.M.gameName(game.id)) + '</div>' +
          '</div>' +
          '<div class="intro-card tone-' + (game.color || 'blue') + '">' +
            '<div class="intro-art float">' + (S.Art[game.art] ? S.Art[game.art]() : '') + '</div>' +
            '<div class="intro-body">' +
              '<div class="row" style="gap:.5rem;flex-wrap:wrap">' +
                S.UI.chip(S.M.difficultyName(difficulty), 'chip-blue') +
                S.UI.chip(S.t('about_n_min', { n: minutes }), '') +
                S.UI.chip(tx('dom_' + game.id, game.domain), 'chip-lav') +
              '</div>' +
              '<h1>' + esc(S.M.gameName(game.id)) + '</h1>' +
              '<p class="intro-lead">' + esc(tx('gdesc_' + game.id, game.desc)) + '</p>' +
              '<ol class="how-list">' + steps.map(function (s, i) {
                return '<li><span class="hl-n">' + (i + 1) + '</span>' + esc(tx('how_' + game.id + '_' + i, s)) + '</li>';
              }).join('') + '</ol>' +
              '<div class="row" style="flex-wrap:wrap;margin-top:1.5rem">' +
                '<button class="btn btn-xl" data-act="start">' + S.icon('play') + esc(S.t('start')) + '</button>' +
                '<button class="listen-btn" data-act="listen">' + S.icon('volume') + esc(S.t('listen')) + '</button>' +
                '<button class="btn btn-outline btn-lg" data-act="level">' + S.icon('settings') + esc(S.t('choose_level')) + '</button>' +
              '</div>' +
              '<p class="t-small muted" style="margin-top:1rem">' + S.icon('info') + ' ' + esc(S.t('no_timer')) + '</p>' +
            '</div>' +
          '</div>' +
        '</div>';

      S.mount(S.qs('#app'), html, {
        back: function () { S.Router.go(opts.returnTo || '#/patient/games'); },
        start: function () { GameShell.run(game, difficulty, opts); },
        level: function () { S.Patient.levelPicker(game.id); },
        listen: function (el) {
          var text = S.M.gameName(game.id) + '. ' + steps.join(' ');
          el.classList.add('is-speaking');
          S.Voice.speak(text, patient.language).then(function (r) {
            el.classList.remove('is-speaking');
            if (!r.spoken && r.note) S.toast(r.note, 'warn', 4500);
          });
        }
      });
      S.scrollTop();
    },

    /* ---------------- the game itself ---------------- */
    run: function (game, difficulty, opts) {
      var patient = S.State.patient();
      var mod = S.Games[game.id];
      var app = S.qs('#app');

      var ctx = {
        patient: patient,
        game: game,
        difficulty: difficulty,
        sessionId: S.uid('ses'),
        /* 'auto' when served at the level adaptation chose (or the person's
           fixed level); 'manual' when they picked a different one. */
        source: opts.source || (difficulty === S.Adaptive.difficultyFor(patient, game.id) ? 'auto' : 'manual'),
        responses: [],          // one per judged answer — see ctx.attempt
        rand: Math.random,
        startedAt: Date.now(),
        lastActionAt: Date.now(),
        attempts: 0,
        mistakes: 0,
        responseTimes: [],
        contentLevel: 1,
        finished: false,
        el: null,
        returnTo: opts.returnTo || '#/patient/games'
      };
      this.active = ctx;

      var html =
        '<div class="game-wrap">' +
          '<div class="game-top">' +
            '<button class="btn-back" data-act="back" aria-label="' + esc(S.t('back')) + '">' + S.icon('arrowLeft') + '</button>' +
            '<div class="gt-title">' + esc(S.M.gameName(game.id)) + '</div>' +
            '<span class="chip chip-blue gt-level">' + esc(S.M.difficultyName(difficulty)) + '</span>' +
            '<span class="chip gt-timer" id="gt-timer">' + S.icon('timer') + '<b>0:00</b></span>' +
          '</div>' +
          '<div class="game-instruction">' +
            '<div class="gi-text">' +
              '<div class="gi-main" id="gi-main">' + esc(S.t(game.instruction)) + '</div>' +
              '<div class="gi-sub" id="gi-sub">' + esc(S.t('no_timer')) + '</div>' +
            '</div>' +
            '<button class="listen-btn" data-act="listen">' + S.icon('volume') + esc(S.t('listen')) + '</button>' +
          '</div>' +
          '<div id="game-feedback" aria-live="polite"></div>' +
          '<div id="game-progress"></div>' +
          '<div id="game-body"></div>' +
        '</div>';

      S.mount(app, html, {
        back: function () { GameShell.exit(); },
        listen: function (el) { GameShell.speak(el); }
      });
      S.scrollTop();
      S.Shell.render();

      ctx.el = S.qs('#game-body');
      this.startTimer();

      ctx.setInstruction = function (main, sub) {
        var m = S.qs('#gi-main'), s2 = S.qs('#gi-sub');
        if (m) m.textContent = main;
        if (s2) s2.textContent = sub || S.t('no_timer');
        ctx.spokenText = main;
      };

      ctx.progress = function (done, total) {
        var el = S.qs('#game-progress');
        if (!el) return;
        var dots = '';
        for (var i = 0; i < total; i++) dots += '<i class="' + (i < done ? 'on' : '') + '"></i>';
        el.innerHTML = '<div class="game-progress"><span class="gp-label">' + esc(S.t('done_of', { done: done, total: total })) + '</span>' +
          '<span class="gp-dots">' + dots + '</span></div>';
      };

      /** One judged action. `itemRef` optionally names what was asked. */
      ctx.attempt = function (correct, itemRef) {
        var now = Date.now();
        var dt = (now - ctx.lastActionAt) / 1000;
        ctx.lastActionAt = now;
        if (dt > 0.2 && dt < 90) ctx.responseTimes.push(dt);
        ctx.attempts += 1;
        if (!correct) ctx.mistakes += 1;
        ctx.responses.push({ correct: !!correct, response_ms: Math.round(dt * 1000), item_ref: itemRef || null, at: S.stamp() });
        return correct;
      };

      ctx.praise = function (text) { GameShell.feedback('good', text || S.t(S.pick(PRAISE_KEYS))); };
      ctx.encourage = function (text) { GameShell.feedback('gentle', text || S.t(S.pick(GENTLE_KEYS))); };
      ctx.calm = function (text) { GameShell.feedback('calm', text); };
      ctx.clearFeedback = function () { GameShell.feedback(null); };
      ctx.speak = function (text) { S.Voice.speak(text, patient.language); };
      ctx.finish = function (extra) { GameShell.finish(extra); };
      ctx.setContentLevel = function (lvl) { ctx.contentLevel = lvl; };

      S.safe(function () { mod.start(ctx); }, tx('game_start_failed', 'We could not start that activity. Please try again.'));
    },

    startTimer: function () {
      var self = this;
      clearInterval(this.timer);
      this.timer = setInterval(function () {
        var ctx = self.active;
        var el = S.qs('#gt-timer b');
        if (!ctx || !el) { clearInterval(self.timer); return; }
        var s = Math.round((Date.now() - ctx.startedAt) / 1000);
        el.textContent = Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
      }, 1000);
    },

    feedback: function (kind, text) {
      var el = S.qs('#game-feedback');
      if (!el) return;
      if (!kind) { el.innerHTML = ''; return; }
      var ico = kind === 'good' ? S.icon('star') : kind === 'gentle' ? S.icon('leaf') : S.icon('info');
      el.innerHTML = '<div class="feedback ' + kind + '">' + ico + '<span>' + esc(text) + '</span></div>';
    },

    speak: function (btn) {
      var ctx = this.active;
      if (!ctx) return;
      var text = ctx.spokenText || S.qs('#gi-main').textContent;
      if (btn) btn.classList.add('is-speaking');
      S.Voice.speak(text, ctx.patient.language).then(function (res) {
        if (btn) btn.classList.remove('is-speaking');
        if (res && !res.spoken && res.note) S.toast(res.note, 'warn', 4200);
      });
    },

    exit: function () {
      var ctx = this.active;
      this.abandon();
      S.Router.go(ctx ? ctx.returnTo : '#/patient/games');
    },

    /** Leaving mid-game: keep a partial session if enough was done. */
    abandon: function () {
      var ctx = this.active;
      clearInterval(this.timer);
      S.Voice.stop();
      if (ctx && !ctx.finished && ctx.attempts >= 3) {
        this.save(ctx, 'partial');
        S.toast(S.t('offline_saved'), 'ok');
      }
      this.active = null;
    },

    /* ---------------- completion ---------------- */
    finish: function (extra) {
      var ctx = this.active;
      if (!ctx || ctx.finished) return;
      ctx.finished = true;
      clearInterval(this.timer);
      S.Voice.stop();

      var saved = this.save(ctx, 'completed');
      var session = saved.session, adapt = saved.adapt;
      var accuracyPct = Math.round(session.accuracy * 100);
      var secs = session.duration_seconds;
      var perf = accuracyPct >= 90 ? tx('perf_excellent', 'Excellent') : accuracyPct >= 75 ? tx('perf_verygood', 'Very good') : accuracyPct >= 55 ? tx('perf_good', 'Good effort') : tx('perf_keep', 'Well tried');

      /* Which level each button plays. Same game either way. */
      var played = ctx.difficulty;
      var moved = adapt && adapt.changed ? adapt.to : null;
      var up = adapt && adapt.direction === 'up';
      var againLevel = up ? moved : played;                    // the one offered first
      var altLevel = moved ? (up ? played : moved) : null;     // the other one, if there is one
      var name = function (lvl) { return S.M.difficultyName(lvl); };
      var againLabel = up ? tx('play_level', 'Play {level}', { level: name(againLevel) })
        : adapt && adapt.direction === 'down' ? tx('try_same', 'Try {level} again', { level: name(againLevel) })
        : S.t('play_again');
      var altLabel = altLevel ? (up ? tx('play_same', 'Play {level} again', { level: name(altLevel) })
        : tx('play_level', 'Play {level}', { level: name(altLevel) })) : '';

      var html =
        '<div class="game-wrap">' +
          '<div class="done-card anim-in">' +
            '<div class="dc-art">' + S.Art.trophy() + '</div>' +
            '<h2>' + esc(tx('great_job', 'Great job!')) + ' 🎉</h2>' +
            '<p class="dc-sub">' + esc(S.t('you_completed', { name: S.M.gameName(ctx.game.id) })) + '</p>' +
            '<div class="done-stats">' +
              ds(session.score, S.t('activity_score')) +
              ds(adapt && adapt.total ? adapt.right + '/' + adapt.total : accuracyPct + '%', S.t('correct')) +
              ds(perf, tx('performance', 'Performance')) +
              ds(Math.floor(secs / 60) + ':' + (secs % 60 < 10 ? '0' : '') + (secs % 60), tx('time_taken', 'Time')) +
            '</div>' +
            (adapt && adapt.direction === 'up'
              ? '<div class="dc-unlock">' + S.icon('trophy') + '<span>' +
                  esc(tx('unlocked_new', 'New level opened: {level}', { level: S.M.difficultyName(adapt.to) })) + '</span></div>'
              : '') +
            (adapt && adapt.message
              ? '<div class="dc-adapt dc-adapt-' + adapt.direction + '">' +
                  S.icon(adapt.direction === 'up' ? 'trend' : adapt.direction === 'down' ? 'leaf' : 'check') +
                  '<span>' + esc(adapt.message) + '</span></div>'
              : '') +
            '<div class="done-actions">' +
              /* Play again, always for the same game. Did well: the level just
                 opened comes first, with the old one still there. Did not:
                 the same level comes first, to try again and do better. */
              '<button class="btn btn-xl" data-act="again">' + S.icon('play') + esc(againLabel) + '</button>' +
              (altLevel ? '<button class="btn btn-lg btn-outline" data-act="alt">' + S.icon('refresh') + esc(altLabel) + '</button>' : '') +
              '<button class="btn btn-lg btn-outline" data-act="back">' + S.icon('brain') + esc(tx('back_to_games', 'Back to Games')) + '</button>' +
            '</div>' +
            (extra && extra.note ? '<p class="t-small muted" style="margin-top:1.25rem">' + esc(extra.note) + '</p>' : '') +
          '</div>' +
          '<div class="disclaimer">' + S.icon('info') + '<span>' + esc(S.t('disclaimer')) + '</span></div>' +
        '</div>';

      var gameId = ctx.game.id, returnTo = ctx.returnTo;

      S.mount(S.qs('#app'), html, {
        again: function () { GameShell.active = null; GameShell.open(gameId, { difficulty: againLevel, returnTo: returnTo, skipIntro: true }); },
        alt: function () { GameShell.active = null; GameShell.open(gameId, { difficulty: altLevel, returnTo: returnTo, skipIntro: true }); },
        back: function () { GameShell.active = null; S.Router.go(returnTo); }
      });
      S.scrollTop();
      S.Shell.render();

      S.Voice.speak(tx('great_job', 'Great job!') + ' ' + S.t('you_completed', { name: S.M.gameName(gameId) }), ctx.patient.language);
      if (S.Sync.isOnline()) S.Sync.flush();

      function ds(v, l) { return '<div class="ds"><div class="ds-v">' + esc(v) + '</div><div class="ds-l">' + esc(l) + '</div></div>'; }
    },

    /** Persist the session, update ability, refresh score + plan. */
    save: function (ctx, status) {
      var accuracy = ctx.attempts ? (ctx.attempts - ctx.mistakes) / ctx.attempts : 0;
      var avgRt = ctx.responseTimes.length ? S.avg(ctx.responseTimes) : 8;

      var session = S.M.newGameSession({
        session_id: ctx.sessionId,
        patient_id: ctx.patient.patient_id,
        game_type: ctx.game.id,
        difficulty: ctx.difficulty,
        accuracy: S.round(accuracy, 3),
        response_time: S.round(avgRt, 1),
        mistakes: ctx.mistakes,
        attempts: ctx.attempts,
        completion_status: status,
        duration_seconds: Math.round((Date.now() - ctx.startedAt) / 1000),
        content_level: ctx.contentLevel,
        source: 'patient_app'
      });
      session.score = S.Scoring.sessionScore(session);

      S.DB.insert('game_sessions', session);

      /* Every answer, for calibrating item difficulty later. The "item" is
         this game at this level, with the level's b at the time it was played. */
      ctx.responses.forEach(function (r, i) {
        S.DB.insert('item_responses', S.M.newItemResponse({
          session_id: session.session_id, patient_id: session.patient_id, game_type: session.game_type,
          level: session.difficulty, b: S.Adaptive.B[session.difficulty], level_source: ctx.source,
          seq: i + 1, correct: r.correct, response_ms: r.response_ms, item_ref: r.item_ref, created_at: r.at
        }));
      });

      var patient = S.DB.find('patients', ctx.patient.patient_id);
      var adapt = S.Adaptive.update(patient, session, ctx.source);

      S.Scoring.recordDailyScore(patient.patient_id);
      S.Plan.refresh(patient);

      S.bus.emit('session:saved', { session: session, adapt: adapt });
      return { session: session, adapt: adapt };
    }
  };

  S.GameShell = GameShell;
})(window);
