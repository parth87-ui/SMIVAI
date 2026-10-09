/* Loads Smivai's real device scripts (js/core) into Node, with just enough of
   a browser around them to run their logic. No packages needed.

   Each call to load() gives a fresh, empty device store, so tests never share
   state. Nothing here touches the real app or any browser storage. */
'use strict';
const path = require('node:path');

const CORE = ['utils', 'i18n', 'db', 'models', 'content', 'pictures', 'adaptive', 'scoring', 'reminders', 'sync',
  'langservice', 'voice', 'wakeword', 'media', 'wellness', 'services', 'location', 'doctors', 'plans', 'auth', 'privacy',
  'langdetect', 'companion_i18n', 'companion', 'state', 'content_daily', 'charity_api'];

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] || null,
    get length() { return m.size; }
  };
}

function load() {
  const root = path.join(__dirname, '..', '..', 'js', 'core');
  for (const name of CORE) delete require.cache[path.join(root, name + '.js')];
  const el = () => ({ classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } }, setAttribute() {}, removeAttribute() {}, style: {}, appendChild() {}, querySelector() { return null; } });
  global.window = global;
  global.S = undefined;
  global.localStorage = memoryStorage();
  global.sessionStorage = memoryStorage();
  global.document = { body: el(), documentElement: el(), readyState: 'complete', addEventListener() {}, createElement: el, querySelector() { return null; }, querySelectorAll() { return []; } };
  Object.defineProperty(global, 'navigator', { configurable: true, writable: true, value: { onLine: true, language: 'en-IN' } });
  global.addEventListener = () => {};
  global.speechSynthesis = undefined;
  global.fetch = () => Promise.reject(new Error('no network in tests'));
  for (const name of CORE) require(path.join(root, name + '.js'));
  /* the brain games register themselves in S.Games (needed by the daily plan) */
  /* the game shell (saves a finished game: session, answers, next level) */
  const shell = path.join(__dirname, '..', '..', 'js', 'ui', 'gameshell.js');
  delete require.cache[shell];
  require(shell);
  global.S.Games = global.S.Games || {};
  const games = path.join(__dirname, '..', '..', 'js', 'games');
  for (const f of require('node:fs').readdirSync(games)) { delete require.cache[path.join(games, f)]; require(path.join(games, f)); }
  const S = global.S;
  S.delay = () => Promise.resolve();          // no artificial waits in tests
  S.DB.load();
  return S;
}

/** A patient with an account and a signed-in device session. */
function addPatient(S, o) {
  const p = S.M.newPatient(Object.assign({ language: 'en', language_confirmed: true, age: 72, district: 'Jorhat, Assam' }, o));
  p.plan = o.plan || 'free';
  S.DB.insert('patients', p, { silent: true });
  const acct = S.DB.insert('accounts', { account_id: S.uid('acct'), role: 'patient', entity_id: p.patient_id, name: p.name, settings: {} }, { silent: true });
  return { patient: p, account: acct };
}

function signIn(S, account) {
  S.Auth._start(account);
  S.State.fromSession(S.Auth.session());
}

function ask(S, patient, text, ctx, history) {
  return S.Companion.answer(patient, text.toLowerCase(), ctx || {}, history || [], { det: { lang: 'en', variant: 'en' }, original: text });
}

module.exports = { load, addPatient, signIn, ask };
