/* Deployment: scripts/build.js writes js/config.js; sync.js reads it. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { apiBase, configJs } = require('../../scripts/build.js');

test('the API address must be an https server root', () => {
  assert.strictEqual(apiBase('https://smivai-api.onrender.com/'), 'https://smivai-api.onrender.com');
  assert.strictEqual(apiBase(''), '');
  assert.strictEqual(apiBase('http://localhost:8000'), 'http://localhost:8000');
  assert.throws(() => apiBase('http://smivai-api.onrender.com'), /https/);
  assert.throws(() => apiBase('https://smivai-api.onrender.com/api'), /root/);
  assert.throws(() => apiBase('not a url'), /valid URL/);
});

test('config holds only the address and mode, nothing secret', () => {
  const js = configJs({ SMIVAI_API_BASE_URL: 'https://x.onrender.com', SMIVAI_FULL_SERVER_MODE: '1', RAZORPAY_KEY_SECRET: 'nope' });
  assert.match(js, /"API_BASE_URL":"https:\/\/x\.onrender\.com"/);
  assert.match(js, /"FULL_SERVER_MODE":true/);
  assert.doesNotMatch(js, /nope/);
});

function loadWith(env) {
  global.SMIVAI_ENV = env;
  const h = require('./harness');
  const S = h.load();
  delete global.SMIVAI_ENV;
  return S;
}

test('by default only donors and staff use the configured server', () => {
  const S = loadWith({ API_BASE_URL: 'https://x.onrender.com', FULL_SERVER_MODE: false });
  assert.strictEqual(S.CONFIG.apiBase, null);
  assert.strictEqual(S.Server.base('donor'), 'https://x.onrender.com');
  assert.strictEqual(S.Server.base('patient'), null);
});

test('full server mode sends every role to the server', () => {
  const S = loadWith({ API_BASE_URL: 'https://x.onrender.com', FULL_SERVER_MODE: true });
  assert.strictEqual(S.Server.base('patient'), 'https://x.onrender.com');
});
