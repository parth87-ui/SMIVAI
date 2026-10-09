/* Run with:  node --test tests/frontend
   Exercises js/core/wakeword.js without a browser, using a fake recogniser. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

function load(srFactory) {
  delete require.cache[require.resolve('../../js/core/wakeword.js')];
  global.window = {
    S: {
      LangService: { providers: { local: { supportsAsr: (c) => ['en', 'hi', 'bn', 'ne'].includes(c) } } },
      I18N: { lang: (c) => ({ bcp47: c === 'hi' ? 'hi-IN' : 'en-IN' }) }
    },
    SpeechRecognition: srFactory || undefined
  };
  require(path.join(__dirname, '../../js/core/wakeword.js'));
  return global.window.S.WakeWord;
}

test('wakes on a greeting followed by HUN, and returns what came after', () => {
  const W = load();
  assert.deepStrictEqual(W.match('hey hun what is my next reminder'), { hit: true, rest: 'what is my next reminder' });
  assert.deepStrictEqual(W.match('Hey HUN'), { hit: true, rest: '' });
  assert.deepStrictEqual(W.match('hi, hun, how are you'), { hit: true, rest: 'how are you' });
  assert.deepStrictEqual(W.match('OK hoon play a game'), { hit: true, rest: 'play a game' });
  assert.deepStrictEqual(W.match('हे हुन मेरा अगला काम क्या है'), { hit: true, rest: 'मेरा अगला काम क्या है' });
});

test('does not wake on everyday Hindi "hun" or on similar words', () => {
  const W = load();
  for (const s of ['main theek hun', 'hun', 'I am fine hun', 'they hunt deer', 'hey hunter', 'ok hund', 'what is hey hun', 'मैं ठीक हूँ']) {
    assert.strictEqual(W.match(s).hit, false, s);
  }
});

test('supported only with a browser recogniser and a language it really handles', () => {
  assert.strictEqual(load().supported('en'), false);               // no SpeechRecognition
  const W = load(function () {});
  assert.strictEqual(W.supported('en'), true);
  assert.strictEqual(W.supported('as'), false);                   // Assamese: not supported by Chrome
});

function fakeRecogniser(log) {
  return function FakeSR() {
    const self = this;
    log.instances.push(self);
    self.start = () => log.events.push('start');
    self.abort = () => { log.events.push('abort'); };
    self.say = (text) => self.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: text }], { isFinal: true })] });
  };
}

test('listens continuously, wakes once, pauses, resumes and releases the microphone', () => {
  const log = { events: [], instances: [] };
  const W = load(fakeRecogniser(log));
  const states = [], wakes = [];
  assert.ok(W.start('en', { onWake: (r) => wakes.push(r), onState: (s) => states.push(s) }));
  const rec = log.instances[0];
  assert.strictEqual(rec.continuous, true);
  assert.strictEqual(rec.lang, 'en-IN');

  rec.say('main theek hun');                       // ordinary speech: nothing happens
  assert.deepStrictEqual(wakes, []);
  rec.say('hey hun tell me a joke');
  assert.deepStrictEqual(wakes, ['tell me a joke']);
  assert.ok(log.events.includes('abort'), 'the wake recogniser is closed while HUN handles the turn');
  assert.strictEqual(W.listening(), false);

  W.resume();
  assert.strictEqual(log.instances.length, 2);
  assert.strictEqual(W.listening(), true);

  W.stop();
  assert.strictEqual(W.listening(), false);
  assert.strictEqual(states[states.length - 1], 'stopped');
});

test('a denied microphone switches it off and says why', () => {
  const log = { events: [], instances: [] };
  const W = load(fakeRecogniser(log));
  const states = [];
  W.start('en', { onWake() {}, onState: (s, note) => states.push([s, note]) });
  log.instances[0].onerror({ error: 'not-allowed' });
  log.instances[0].onend();
  assert.deepStrictEqual(states[states.length - 1][0], 'denied');
  assert.strictEqual(log.instances.length, 1, 'no reopen after a denial');
});
