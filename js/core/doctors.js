/* ============================================================
   SMIVAI — doctors.js
   Sorting the Book a Doctor list, and patient reviews.

   Three criteria, each on its real data field:
     rating    the average of verified in-app reviews (a review can only be
               left for one's own completed appointment, once). No ratings
               are invented: a doctor nobody has reviewed is "No ratings yet",
               never zero stars.
     fee       the numeric consultation fee. 0 means free; missing means
               "fee not listed" — never shown as free.
     distance  km from where the person is to the doctor's town. The
               person's position is their current location when they allow it
               (kept in memory for this visit only, never saved), otherwise
               the town they chose. Doctor locations in the demo directory are
               town centres, so distances are approximate and say so.

   Unknown values always sort last, in either direction. Ties keep a stable
   order (by name).
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;

  var CRITERIA = {
    recommended: { label: 'Recommended for you' },
    rating_desc: { label: 'Rating: highest first', key: 'rating', dir: -1 },
    rating_asc: { label: 'Rating: lowest first', key: 'rating', dir: 1 },
    fee_asc: { label: 'Fee: lowest first', key: 'fee', dir: 1 },
    fee_desc: { label: 'Fee: highest first', key: 'fee', dir: -1 },
    distance_asc: { label: 'Distance: nearest first', key: 'distance', dir: 1 },
    distance_desc: { label: 'Distance: farthest first', key: 'distance', dir: -1 }
  };

  function num(v) { return typeof v === 'number' && isFinite(v) ? v : null; }

  var Doctors = {
    CRITERIA: CRITERIA,

    /** {average, count} from verified reviews, or {average: null, count: 0}. */
    ratingOf: function (doctorId) {
      var rs = S.DB.where('doctor_reviews', function (r) { return r.doctor_id === doctorId && r.stars >= 1 && r.stars <= 5; });
      if (!rs.length) return { average: null, count: 0 };
      var sum = rs.reduce(function (a, r) { return a + r.stars; }, 0);
      return { average: Math.round((sum / rs.length) * 10) / 10, count: rs.length };
    },

    /** Coordinates of a doctor: their own if the record has them, else their town centre (approx). */
    placeOf: function (d) {
      if (num(d.lat) !== null && num(d.lon) !== null) return { lat: d.lat, lon: d.lon, approx: false };
      var c = S.Location.cityCoords(d.city);
      return c ? { lat: c.lat, lon: c.lon, approx: true } : null;
    },

    /** km from the person to a doctor, or null when either place is unknown. */
    distanceTo: function (d, origin) {
      var to = this.placeOf(d);
      if (!origin || !to) return null;
      return Math.round(S.Location.km(origin.lat, origin.lon, to.lat, to.lon) * 10) / 10;
    },

    /** Each doctor with the values the list shows and sorts on. */
    annotate: function (list, origin) {
      var self = this;
      return list.map(function (d) {
        var r = self.ratingOf(d.id);
        return { doctor: d, rating: r.average, ratingCount: r.count, fee: num(d.fee),
                 distance: self.distanceTo(d, origin), approx: !!(self.placeOf(d) || {}).approx };
      });
    },

    /**
     * Sort annotated rows by a criterion. Rows whose value is unknown go
     * last whatever the direction; equal values fall back to the name.
     */
    sort: function (rows, criterion) {
      var c = CRITERIA[criterion];
      if (!c || !c.key) return rows.slice();
      return rows.slice().sort(function (a, b) {
        var va = a[c.key], vb = b[c.key];
        if (va === null && vb === null) return a.doctor.name < b.doctor.name ? -1 : 1;
        if (va === null) return 1;
        if (vb === null) return -1;
        if (va !== vb) return (va - vb) * c.dir;
        return a.doctor.name < b.doctor.name ? -1 : a.doctor.name > b.doctor.name ? 1 : 0;
      });
    },

    /** Text for a fee: "₹400", "Free consultation", or "Fee not listed". */
    feeText: function (fee) {
      if (fee === null || fee === undefined) return S.tx('fee_unknown', 'Fee not listed');
      if (fee === 0) return S.tx('fee_free', 'Free consultation');
      return '₹' + fee;
    },

    ratingText: function (row) {
      if (!row.ratingCount) return S.tx('no_ratings', 'No ratings yet');
      return '★ ' + row.rating.toFixed(1) + ' (' + row.ratingCount + ' ' + (row.ratingCount === 1 ? S.tx('review', 'review') : S.tx('reviews', 'reviews')) + ')';
    },

    /* ---------------- reviews ---------------- */
    /** Can this patient review this appointment? Only their own, completed, once. */
    canReview: function (patientId, appt) {
      if (!appt || appt.patient_id !== patientId || appt.status !== 'completed') return false;
      return !S.DB.where('doctor_reviews', function (r) { return r.appointment_id === appt.appointment_id; }).length;
    },

    review: function (patientId, appt, stars) {
      stars = Math.round(+stars);
      if (!(stars >= 1 && stars <= 5)) return { ok: false, error: 'Please choose 1 to 5 stars.' };
      if (!this.canReview(patientId, appt)) return { ok: false, error: 'Only a completed visit of your own can be rated, once.' };
      var row = S.DB.insert('doctor_reviews', { review_id: S.uid('rev'), appointment_id: appt.appointment_id, patient_id: patientId,
        doctor_id: appt.doctor_id, stars: stars, created_at: S.stamp() });
      return { ok: true, review: row };
    }
  };

  S.Doctors = Doctors;
})(window);
