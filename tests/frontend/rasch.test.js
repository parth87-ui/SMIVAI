/* Rasch-based automatic difficulty — the whole chain, deterministically:
   gameplay → recorded answers → ability estimate → next level chosen
   automatically → saved → the next game really serves that level. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const h = require('./harness');

const GAME = 'picture_matching';

function patient(S, name) {
  const { patient, account } = h.addPatient(S, { name });
  h.signIn(S, account);
  return patient.patient_id;
}

/** Play one game at whatever level the app serves, through the real game shell save. */
function play(S, pid, right, total, game) {
  game = game || GAME;
  const p = S.DB.find('patients', pid);
  const level = S.Adaptive.difficultyFor(p, game);
  const ctx = { patient: p, game: S.M.game(game), difficulty: level, sessionId: S.uid('ses'), source: 'auto',
    responses: [], attempts: 0, mistakes: 0, responseTimes: [], startedAt: Date.now(), contentLevel: 1 };
  for (let i = 0; i < total; i++) {           // what ctx.attempt() does for each answer
    const correct = i < right;
    ctx.attempts++; if (!correct) ctx.mistakes++; ctx.responseTimes.push(3);
    ctx.responses.push({ correct, response_ms: 3000, item_ref: null, at: S.stamp() });
  }
  const res = S.GameShell.save(ctx, 'completed');
  return { level, adapt: res.adapt, session: res.session };
}

test('the first game starts at the introductory level (Easy)', () => {
  const S = h.load();
  const pid = patient(S, 'Aruna Devi');
  assert.strictEqual(S.Adaptive.difficultyFor(S.DB.find('patients', pid), GAME), 'easy');
});

test('every answer is recorded with its level, difficulty and outcome', () => {
  const S = h.load();
  const pid = patient(S, 'Aruna Devi');
  const g = play(S, pid, 2, 3);
  const rows = S.DB.where('item_responses', (r) => r.session_id === g.session.session_id);
  assert.strictEqual(rows.length, 3);
  assert.deepStrictEqual(rows.map((r) => r.correct), [true, true, false]);
  assert.ok(rows.every((r) => r.level === 'easy' && r.b === -1 && r.patient_id === pid && r.response_ms === 3000));
  const ses = S.DB.find('game_sessions', g.session.session_id);
  assert.strictEqual(ses.level_source, 'auto');
  assert.strictEqual(ses.next_level, 'easy');
});

test('different answer patterns give different model inputs and estimates', () => {
  const S = h.load();
  const a = patient(S, 'Good Run'), b = patient(S, 'Hard Run');
  play(S, a, 3, 3); play(S, b, 0, 3);
  const ea = S.Adaptive.estimate(S.Adaptive.evidenceFor(a, GAME));
  const eb = S.Adaptive.estimate(S.Adaptive.evidenceFor(b, GAME));
  assert.deepStrictEqual(S.Adaptive.evidenceFor(a, GAME).map((e) => e.right), [3]);
  assert.deepStrictEqual(S.Adaptive.evidenceFor(b, GAME).map((e) => e.right), [0]);
  assert.ok(ea.theta > eb.theta);
});

test('one lucky round does not move the level; several successful games do — and the next game is harder', () => {
  const S = h.load();
  const pid = patient(S, 'Aruna Devi');
  const LEVELS = S.Games[GAME].LEVELS;
  const g1 = play(S, pid, 3, 3);
  assert.strictEqual(g1.adapt.reason, 'too_short');
  assert.strictEqual(g1.adapt.to, 'easy', 'one perfect game is not enough evidence');
  const g2 = play(S, pid, 3, 3);
  assert.strictEqual(g2.adapt.to, 'easy');
  const g3 = play(S, pid, 3, 3);
  assert.strictEqual(g3.adapt.reason, 'up');
  assert.strictEqual(g3.adapt.to, 'medium');
  // persisted, and loaded automatically for the next game — no manual choice
  const p = S.DB.find('patients', pid);
  assert.strictEqual(p.difficulty[GAME], 'medium');
  const next = play(S, pid, 3, 3);
  assert.strictEqual(next.level, 'medium', 'the next game is served at the new level');
  // the level really changes the game: more pictures, related (harder) pairs
  assert.strictEqual(LEVELS.easy.pairs, 3);
  assert.strictEqual(LEVELS[next.level].pairs, 5);
  assert.strictEqual(LEVELS[next.level].mode, 'related');
});

test('repeated difficulty brings a more manageable level', () => {
  const S = h.load();
  const pid = patient(S, 'Aruna Devi');
  for (let i = 0; i < 3; i++) play(S, pid, 3, 3);                // up to medium
  const seen = [];
  for (let i = 0; i < 4; i++) seen.push(play(S, pid, 1, 5).adapt);
  assert.strictEqual(seen[0].to, 'medium', 'not after one poor game');
  assert.ok(seen.some((a) => a.reason === 'down' && a.to === 'easy'), 'struggling repeatedly lowers the level');
  const now = S.Adaptive.difficultyFor(S.DB.find('patients', pid), GAME);
  assert.ok(S.Adaptive.ORDER.indexOf(now) < S.Adaptive.ORDER.indexOf('medium'), 'continued struggle keeps it easier, never harder');
  assert.ok(seen.every((a) => a.steps >= -1), 'never more than one step down at a time');
});

test('a jump of two levels needs strong, sustained evidence', () => {
  const S = h.load();
  const pid = patient(S, 'Aruna Devi');
  const outs = [];
  for (let i = 0; i < 4; i++) outs.push(play(S, pid, 4, 4).adapt);  // 16 answers, all right
  const up = outs.find((a) => a.reason === 'up');
  assert.ok(up, 'it moves up');
  assert.strictEqual(up.steps, 1, 'by one step once 8 answers support it');
});

test('results persist across sessions (a new device load of the same data)', () => {
  const S = h.load();
  const pid = patient(S, 'Aruna Devi');
  for (let i = 0; i < 3; i++) play(S, pid, 3, 3);
  const saved = global.localStorage.getItem('smivai.db.v4');
  assert.ok(saved && saved.includes('"medium"'));
  S.DB.load();                                                    // reload from storage
  assert.strictEqual(S.Adaptive.difficultyFor(S.DB.find('patients', pid), GAME), 'medium');
});

test('one patient’s play never changes another’s level or estimate', () => {
  const S = h.load();
  const a = patient(S, 'Aruna Devi'), b = patient(S, 'Ravi Das');
  for (let i = 0; i < 3; i++) play(S, a, 3, 3);
  assert.strictEqual(S.Adaptive.difficultyFor(S.DB.find('patients', a), GAME), 'medium');
  assert.strictEqual(S.Adaptive.difficultyFor(S.DB.find('patients', b), GAME), 'easy');
  assert.deepStrictEqual(S.Adaptive.evidenceFor(b, GAME), []);
});

test('games keep separate estimates and separate difficulty tables', () => {
  const S = h.load();
  const pid = patient(S, 'Aruna Devi');
  for (let i = 0; i < 3; i++) play(S, pid, 3, 3, 'picture_matching');
  assert.strictEqual(S.Adaptive.difficultyFor(S.DB.find('patients', pid), 'memory_pairs'), 'easy', 'another game is not affected');
  S.Adaptive.setGameDifficulties('memory_pairs', { easy: -0.5, medium: 0.8 });
  assert.strictEqual(S.Adaptive.bOf('memory_pairs', 'medium'), 0.8);
  assert.strictEqual(S.Adaptive.bOf('picture_matching', 'medium'), 0, 'tables are per game');
});

test('choosing a level by hand or fixing one does not move the automatic level', () => {
  const S = h.load();
  const pid = patient(S, 'Aruna Devi');
  const p = S.DB.find('patients', pid);
  S.Adaptive.setLock(p, GAME, 'very_easy');
  for (let i = 0; i < 4; i++) play(S, pid, 3, 3);
  assert.strictEqual(S.Adaptive.difficultyFor(S.DB.find('patients', pid), GAME), 'very_easy');
  assert.strictEqual(S.Adaptive.autoLevel(S.DB.find('patients', pid), GAME), 'easy');
});
