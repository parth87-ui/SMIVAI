/* Hun answers personal questions from the authenticated patient's own saved
   records, never guesses, and keeps patients apart. Runs the real device
   engine (js/core/companion.js) in Node via the harness. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const h = require('./harness');

function world() {
  const S = h.load();
  const aruna = h.addPatient(S, { name: 'Aruna Devi' });
  const ravi = h.addPatient(S, { name: 'Ravi Das' });
  const A = aruna.patient.patient_id, R = ravi.patient.patient_id;
  S.DB.insert('contacts', { contact_id: 'c1', patient_id: A, name: 'Meena Devi', relation: 'Daughter', phone: '98640 11111' }, { silent: true });
  S.DB.insert('contacts', { contact_id: 'c2', patient_id: A, name: 'Arjun Devi', relation: 'Son' }, { silent: true });
  S.DB.insert('contacts', { contact_id: 'c3', patient_id: R, name: 'Priya Das', relation: 'Daughter', phone: '98640 22222' }, { silent: true });
  S.DB.insert('memory_bank', S.M.newMemory({ patient_id: A, title: 'Wedding in Jorhat', category: 'family', content: 'Rain all day, red sari.' }), { silent: true });
  S.DB.insert('memory_bank', S.M.newMemory({ patient_id: R, title: 'RAVI SECRET MEMORY', category: 'family' }), { silent: true });
  S.Reminders.create({ patient_id: A, title: 'Evening walk', time: '18:00', repeat: 'daily', date: S.todayISO(), category: 'exercise', created_by_role: 'patient', created_by_id: A });
  S.Reminders.create({ patient_id: R, title: 'RAVI PILL', time: '08:00', repeat: 'daily', date: S.todayISO(), category: 'medicine', created_by_role: 'patient', created_by_id: R });
  h.signIn(S, aruna.account);
  return { S, A, R, aruna: S.DB.find('patients', A), ravi: S.DB.find('patients', R), ravAcct: ravi.account };
}

test('Hun knows the authenticated patient’s name — for different patients', async () => {
  const w = world();
  const a = await h.ask(w.S, w.aruna, 'What is my name?');
  assert.strictEqual(a.intent, 'my_name');
  assert.match(a.text, /Aruna Devi/);
  const r = await h.ask(w.S, w.ravi, 'What is my name?');
  assert.match(r.text, /Ravi Das/);
  assert.doesNotMatch(r.text, /Aruna/);
  for (const q of ["whats my name", "Who am I?", "Hey Hun, what is my name?", "hon, tell me my name"]) {
    assert.match((await h.ask(w.S, w.aruna, q)).text, /Aruna Devi/, q);
  }
  const m = await h.ask(w.S, w.aruna, 'Do you remember me?');
  assert.strictEqual(m.intent, 'my_name');
  assert.match(m.text, /remember you — you are Aruna Devi/);
});

test('family questions use saved relationships, and only that patient’s', async () => {
  const w = world();
  assert.match((await h.ask(w.S, w.aruna, 'Who is my daughter?')).text, /Your daughter is Meena Devi/);
  assert.doesNotMatch((await h.ask(w.S, w.aruna, 'Who is my daughter?')).text, /Arjun|Priya/);
  assert.match((await h.ask(w.S, w.aruna, "What is my daughter's number?")).text, /98640 11111/);
  assert.match((await h.ask(w.S, w.aruna, "Tell me my son's name")).text, /Arjun Devi/);
  const fam = await h.ask(w.S, w.aruna, 'Who is in my family?');
  assert.match(fam.text, /Meena Devi \(your daughter\) and Arjun Devi \(your son\)/);
  assert.match(fam.text, /Wedding in Jorhat/);
  assert.doesNotMatch(fam.text, /Priya|RAVI/);
  assert.match((await h.ask(w.S, w.aruna, 'What did I tell you about my family?')).text, /Meena Devi/);
});

test('missing family data is said plainly, never invented', async () => {
  const w = world();
  const a = await h.ask(w.S, w.aruna, 'Who is my wife?');
  assert.strictEqual(a.intent, 'family_member');
  assert.match(a.text, /I do not have a wife saved/);
  assert.match((await h.ask(w.S, w.aruna, "What is my son's phone number?")).text, /no phone number/);
});

test('saved memories and reminders come from the records', async () => {
  const w = world();
  const list = await h.ask(w.S, w.aruna, 'What memories have I saved?');
  assert.strictEqual(list.intent, 'memories_list');
  assert.match(list.text, /saved 1 memories|saved 1 memor/);
  assert.match(list.text, /Wedding in Jorhat/);
  assert.doesNotMatch(list.text, /RAVI/);
  const recent = await h.ask(w.S, w.aruna, 'Do you remember the memory I saved?');
  assert.match(recent.text, /Wedding in Jorhat/);
  assert.match(recent.text, /Rain all day/);
  const rem = await h.ask(w.S, w.aruna, 'What did I ask you to remind me about?');
  assert.strictEqual(rem.intent, 'reminders_list');
  assert.match(rem.text, /Evening walk at 6:00 PM/);
  assert.doesNotMatch(rem.text, /RAVI/);
});

test('"what did I tell you earlier" uses only this patient’s saved words', async () => {
  const w = world();
  const none = await h.ask(w.S, w.aruna, 'What did I tell you earlier?');
  assert.match(none.text, /cannot find anything you told me earlier/);
  w.S.Companion.remember(w.A, 'user', 'My grandson Rohan is visiting on Sunday');
  w.S.Companion.remember(w.A, 'assistant', 'How lovely!');
  w.S.Companion.remember(w.R, 'user', 'RAVI said something private');
  w.S.Companion.remember(w.A, 'user', 'What did I tell you earlier?');           // the question itself
  const a = await w.S.Companion.answer(w.aruna, 'what did i tell you earlier?', {}, w.S.Companion.recent(w.A, 12),
    { det: { lang: 'en', variant: 'en' }, original: 'What did I tell you earlier?' });
  assert.match(a.text, /grandson Rohan is visiting on Sunday/);
  assert.doesNotMatch(a.text, /RAVI|What did I tell you/);
});

test('today, encouragement and loneliness get warm, specific answers', async () => {
  const w = world();
  assert.match((await h.ask(w.S, w.aruna, 'What should I do today?')).text, /Evening walk|brain games|Nothing is planned/);
  const enc1 = await h.ask(w.S, w.aruna, 'Can you tell me something encouraging?');
  const enc2 = await h.ask(w.S, w.aruna, 'Can you tell me something encouraging?');
  assert.strictEqual(enc1.intent, 'encourage');
  assert.notStrictEqual(enc1.text, enc2.text, 'encouragement should not repeat at once');
  const lonely = await h.ask(w.S, w.aruna, 'I am feeling lonely. Can we talk?');
  assert.strictEqual(lonely.intent, 'low_mood');
});

test('general and unknown questions are not answered with filler', async () => {
  const w = world();
  const g = await h.ask(w.S, w.aruna, 'What is the capital of India?');
  assert.strictEqual(g.intent, 'general_question');
  assert.match(g.text, /general-knowledge question/);
  assert.doesNotMatch(g.text, /Tell me more — I am listening/);
  const u = await h.ask(w.S, w.aruna, 'What is my favourite colour?');
  assert.match(u.text, /do not have that saved, so I will not guess/);
  assert.strictEqual((await h.ask(w.S, w.aruna, 'Hello')).intent, 'greeting');
  const said = await h.ask(w.S, w.aruna, 'My grandson is coming on Sunday to visit me');
  assert.strictEqual(said.intent, 'statement');
  assert.match(said.text, /Thank you for telling me, Aruna Ji/);
});

test('with advanced AI, personal questions still come from the records; a provider failure falls back honestly', async () => {
  const w = world();
  w.S.DB.update('patients', w.A, { plan: 'premium' }, { silent: true });
  w.S.CONFIG.apiBase = 'http://api.test';
  const calls = [];
  w.S.Services.AI.chat = (payload) => { calls.push(payload); return Promise.resolve({ ok: false, reason: 'network' }); };
  const p = w.S.DB.find('patients', w.A);
  const name = await h.ask(w.S, p, 'What is my name?');
  assert.strictEqual(calls.length, 0, 'name question must not go to the model');
  assert.match(name.text, /Aruna Devi/);
  const g = await h.ask(w.S, p, 'Who wrote the national anthem of India?');
  assert.strictEqual(calls.length, 1, 'general question goes to the model');
  assert.strictEqual(g.engine, 'basic');
  assert.match(g.note, /could not reach the SMIVAI server/);
  assert.match(g.text, /general-knowledge question/);
  w.S.Services.AI.chat = () => Promise.resolve({ ok: true, text: 'Rabindranath Tagore wrote it.', provider: 'HUN (advanced)' });
  const ok = await h.ask(w.S, p, 'Who wrote the national anthem of India?');
  assert.strictEqual(ok.engine, 'advanced');
  assert.match(ok.text, /Tagore/);
});

test('safety answers still come first', async () => {
  const w = world();
  assert.strictEqual((await h.ask(w.S, w.aruna, 'I fell, help me now')).action, 'sos');
  assert.strictEqual((await h.ask(w.S, w.aruna, 'Should I take two tablets?')).intent, 'medical_advice');
});
