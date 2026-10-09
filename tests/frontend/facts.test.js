/* The Daily Facts section: three content types, sources, per-patient daily
   rotation without repeats, offline (bundled) content. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const h = require('./harness');

test('the collection has all three types, sourced or labelled', () => {
  const S = h.load();
  const items = S.Daily.ITEMS;
  const by = (t) => items.filter((i) => i.type === t);
  assert.ok(by('story').length >= 8 && by('fact').length >= 12 && by('message').length >= 12, 'enough of each type');
  for (const it of by('story').concat(by('fact'))) {
    assert.ok(it.source && /^https:\/\//.test(it.source.url) && it.source.name, it.id + ' needs a source');
  }
  for (const it of by('message')) {
    assert.ok(it.by, it.id + ' needs an attribution or the original label');
    if (it.by !== 'Original Smivai message') assert.ok(it.source, it.id + ': a quotation needs a source');
  }
  assert.strictEqual(new Set(items.map((i) => i.id)).size, items.length, 'ids are unique');
  const text = JSON.stringify(items);
  assert.doesNotMatch(text, /Octopus|three hearts/i, 'old trivia is gone');
  assert.doesNotMatch(text, /cure[sd]? dementia|reverse[sd]? (dementia|decline)|prevents? dementia/i, 'no cure claims');
});

test('the same day shows the same item; days rotate through the types', () => {
  const S = h.load();
  const d1 = S.Daily.forDay('pat_a', 0, '2026-10-10');
  assert.strictEqual(S.Daily.forDay('pat_a', 0, '2026-10-10').id, d1.id, 'stable within a day');
  const types = ['2026-10-10', '2026-10-11', '2026-10-12'].map((d) => S.Daily.forDay('pat_a', 0, d).type);
  assert.deepStrictEqual(new Set(types).size, 3, 'three days give three different types');
  assert.notStrictEqual(S.Daily.forDay('pat_a', 1, '2026-10-10').id, d1.id, '"another" gives a different item');
});

test('no repeats until every item of a type has been shown', () => {
  const S = h.load();
  const facts = S.Daily.ITEMS.filter((i) => i.type === 'fact').length;
  const seen = [];
  let day = Date.parse('2027-01-01T00:00:00Z');
  while (seen.length < facts) {
    const iso = new Date(day).toISOString().slice(0, 10);
    const it = S.Daily.forDay('pat_b', 0, iso);
    if (it.type === 'fact') seen.push(it.id);
    day += 86400000;
  }
  assert.strictEqual(new Set(seen).size, facts, 'every fact once before any repeat');
});

test('rotation is per patient, and history is kept per patient', () => {
  const S = h.load();
  for (let i = 0; i < 5; i++) S.Daily.forDay('pat_c', i, '2026-10-10');
  assert.strictEqual(S.Daily.seen('pat_c').length, 5);
  assert.strictEqual(S.Daily.seen('pat_d').length, 0);
});

test('the Facts screen helper returns the label and source the page shows', () => {
  const S = h.load();
  const { account } = h.addPatient(S, { name: 'Aruna Devi' });
  h.signIn(S, account);
  const f = S.Wellness.factOfDay(0);
  assert.ok(f.title && f.text && f.tag);
  assert.ok(['Real-life story', 'Health & wellbeing fact', 'Encouraging message'].includes(f.tag));
  if (f.type !== 'message') assert.ok(f.source && f.source.url);
});

test('works with no network (content ships with the app)', () => {
  const S = h.load();                       // the harness makes every fetch fail
  assert.ok(S.Daily.forDay('pat_e', 0).title);
});
