/* Batch 5/6 helpers: rupee formatting, server times, and the no-server guard. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const h = require('./harness');

test('rupees use Indian digit grouping', () => {
  const S = h.load();
  assert.strictEqual(S.rupees(150000), '₹1,50,000');
  assert.strictEqual(S.rupees(999), '₹999');
  assert.strictEqual(S.rupees(1000), '₹1,000');
  assert.strictEqual(S.rupees(12345678), '₹1,23,45,678');
  assert.strictEqual(S.rupees(400.5), '₹400.50');
  assert.strictEqual(S.rupees(null), '—');
});

test('server times without a zone are read as UTC', () => {
  const S = h.load();
  assert.strictEqual(S.serverDate('2026-10-09T21:32:32.7').toISOString(), '2026-10-09T21:32:32.700Z');
  assert.strictEqual(S.serverDate('2026-10-09T21:32:32+05:30').toISOString(), '2026-10-09T16:02:32.000Z');
});

test('without a server, charity calls fail honestly and send nothing', async () => {
  const S = h.load();
  S.CONFIG.apiBase = null;
  let called = false;
  global.fetch = () => { called = true; return Promise.reject(new Error('should not be called')); };
  assert.strictEqual(S.Api.available(), false);
  const r = await S.CharityApi.mine();
  assert.strictEqual(r.ok, false);
  assert.match(r.error, /not connected/);
  assert.strictEqual(called, false);
});

test('a 401 from the server signs the person out', async () => {
  const S = h.load();
  S.CONFIG.apiBase = 'http://api.test';
  let expired = false;
  S.Auth.session = () => ({ token: 't', mode: 'server', role: 'admin' });
  S.Auth.expire = () => { expired = true; };
  global.fetch = () => Promise.resolve({ status: 401, ok: false, json: () => Promise.resolve({}) });
  const r = await S.CharityApi.list();
  assert.strictEqual(r.status, 401);
  assert.strictEqual(expired, true);
});
