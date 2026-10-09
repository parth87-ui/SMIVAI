/* Book a Doctor: rating, fee and distance sorting on deterministic records. */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const h = require('./harness');

/* Deliberately different ratings, fees and places. Kolkata ≈ 450 km from
   Guwahati; Shillong ≈ 64 km; Jorhat ≈ 250 km. "Nowhere" has no coordinates. */
const DOCS = [
  { id: 'd_a', name: 'Dr A', city: 'Guwahati', fee: 500 },
  { id: 'd_b', name: 'Dr B', city: 'Shillong', fee: 0 },         // free
  { id: 'd_c', name: 'Dr C', city: 'Kolkata' },                  // fee not listed
  { id: 'd_d', name: 'Dr D', city: 'Jorhat', fee: 300 },
  { id: 'd_e', name: 'Dr E', city: 'Nowhere', fee: 300 }         // equal fee to D, unknown place
];
const GUWAHATI = { lat: 26.14, lon: 91.74, precise: true };

function setup() {
  const S = h.load();
  const review = (doc, stars, i) => S.DB.insert('doctor_reviews', { review_id: 'r' + doc + i, appointment_id: 'ap' + doc + i, patient_id: 'p', doctor_id: doc, stars }, { silent: true });
  review('d_a', 5, 1); review('d_a', 4, 2);   // 4.5
  review('d_b', 2, 1);                       // 2.0
  review('d_d', 5, 1);                       // 5.0
  // d_c and d_e: no ratings
  return S;
}
const order = (S, crit, origin) => S.Doctors.sort(S.Doctors.annotate(DOCS, origin === undefined ? GUWAHATI : origin), crit).map((r) => r.doctor.id);

test('rating: highest and lowest first; unrated last either way, never as zero', () => {
  const S = setup();
  assert.deepStrictEqual(order(S, 'rating_desc'), ['d_d', 'd_a', 'd_b', 'd_c', 'd_e']);
  assert.deepStrictEqual(order(S, 'rating_asc'), ['d_b', 'd_a', 'd_d', 'd_c', 'd_e']);
  const rows = S.Doctors.annotate(DOCS, GUWAHATI);
  assert.strictEqual(S.Doctors.ratingText(rows.find((r) => r.doctor.id === 'd_c')), 'No ratings yet');
  assert.match(S.Doctors.ratingText(rows.find((r) => r.doctor.id === 'd_a')), /★ 4\.5 \(2 reviews\)/);
});

test('fee: lowest and highest first on the number; free ≠ unknown; equal fees stable by name', () => {
  const S = setup();
  assert.deepStrictEqual(order(S, 'fee_asc'), ['d_b', 'd_d', 'd_e', 'd_a', 'd_c']);
  assert.deepStrictEqual(order(S, 'fee_desc'), ['d_a', 'd_d', 'd_e', 'd_b', 'd_c']);
  assert.strictEqual(S.Doctors.feeText(0), 'Free consultation');
  assert.strictEqual(S.Doctors.feeText(null), 'Fee not listed');
  assert.strictEqual(S.Doctors.feeText(300), '₹300');
});

test('distance: nearest and farthest first by geography, not by address text', () => {
  const S = setup();
  assert.deepStrictEqual(order(S, 'distance_asc'), ['d_a', 'd_b', 'd_d', 'd_c', 'd_e']);
  assert.deepStrictEqual(order(S, 'distance_desc'), ['d_c', 'd_d', 'd_b', 'd_a', 'd_e']);
  const alphabetical = DOCS.slice().sort((a, b) => a.city < b.city ? -1 : 1).map((d) => d.id);
  assert.notDeepStrictEqual(order(S, 'distance_asc'), alphabetical, 'not sorted by address');
  const rows = S.Doctors.annotate(DOCS, GUWAHATI);
  assert.strictEqual(rows.find((r) => r.doctor.id === 'd_e').distance, null, 'unknown place → unknown distance');
  assert.ok(rows.find((r) => r.doctor.id === 'd_c').distance > 400);
});

test('switching criteria really changes the order', () => {
  const S = setup();
  const a = order(S, 'rating_desc'), b = order(S, 'fee_asc'), c = order(S, 'distance_asc');
  assert.notDeepStrictEqual(a, b);
  assert.notDeepStrictEqual(b, c);
  assert.notDeepStrictEqual(a, c);
});

test('no location (denied/unknown): every distance is unknown, nothing invented', () => {
  const S = setup();
  const rows = S.Doctors.annotate(DOCS, null);
  assert.ok(rows.every((r) => r.distance === null));
  assert.deepStrictEqual(order(S, 'distance_asc', null), ['d_a', 'd_b', 'd_c', 'd_d', 'd_e'], 'stable by name when all unknown');
  assert.strictEqual(S.Location.origin({ district: '' }), null);
});

test('empty list and unknown criterion are handled', () => {
  const S = setup();
  assert.deepStrictEqual(S.Doctors.sort([], 'fee_asc'), []);
  assert.deepStrictEqual(S.Doctors.sort(S.Doctors.annotate(DOCS, GUWAHATI), 'nonsense').map((r) => r.doctor.id), DOCS.map((d) => d.id));
});

test('a review needs your own completed visit, once', () => {
  const S = h.load();
  const appt = { appointment_id: 'ap1', patient_id: 'p1', doctor_id: 'd_x', status: 'completed' };
  assert.strictEqual(S.Doctors.review('p2', appt, 5).ok, false, 'not your visit');
  assert.strictEqual(S.Doctors.review('p1', Object.assign({}, appt, { status: 'confirmed' }), 5).ok, false, 'not completed');
  assert.strictEqual(S.Doctors.review('p1', appt, 9).ok, false, 'stars 1–5');
  assert.strictEqual(S.Doctors.review('p1', appt, 4).ok, true);
  assert.strictEqual(S.Doctors.review('p1', appt, 5).ok, false, 'once only');
  assert.deepStrictEqual(S.Doctors.ratingOf('d_x'), { average: 4, count: 1 });
});
