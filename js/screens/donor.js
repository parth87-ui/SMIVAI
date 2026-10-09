/* ============================================================
   SMIVAI — donor.js
   Donating to the Smivai Care Fund. The browser only starts a payment;
   the server checks it with Razorpay before anything is counted
   (backend/app/donations.py). A payment window closing "successfully"
   is never shown as a donation until the server says it is paid.
   Donors see totals only — never who was helped.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;
  var esc = S.esc;
  function tx(k, f, v) { return S.tx(k, f, v); }

  var CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
  var STATUS = {
    created: ['Not paid', 'chip-blue'], pending: ['Being confirmed', 'chip-amber'], paid: ['Received — thank you', 'chip-green'],
    failed: ['Payment failed', 'chip-red'], cancelled: ['Cancelled', 'chip-blue'], refunded: ['Refunded', 'chip-lav']
  };
  var THANKS = [
    'Every visit you help pay for is an older person seen by a doctor, close to home.',
    'Small gifts add up: a few hundred rupees can cover a consultation in many towns.',
    'Thank you for caring for people you may never meet.'
  ];
  function chip(st) { var s = STATUS[st] || [st, '']; return '<span class="chip ' + s[1] + '">' + esc(tx('don_' + st, s[0])) + '</span>'; }
  function when(iso) { if (!iso) return '—'; var d = S.serverDate(iso); return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

  function loadCheckout() {
    if (global.Razorpay) return Promise.resolve(true);
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = CHECKOUT_SRC; s.async = true;
      s.onload = function () { resolve(!!global.Razorpay); };
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
    });
  }

  var Donor = {
    amount: 500,

    render: function (page) {
      if (!S.Api.available()) {
        S.mount(S.qs('#app'), '<div class="page page-narrow anim-in"><h1 class="t-h1">' + esc(tx('donate', 'Donate')) + '</h1>' +
          '<div class="card" style="margin-top:1rem"><p class="t-body">' + esc(tx('needs_server', 'This account works with the Smivai server, which is not connected on this device.')) + '</p></div></div>', {});
        return;
      }
      return page === 'history' ? this.history() : this.dashboard();
    },

    dashboard: function () {
      var self = this;
      S.mount(S.qs('#app'), '<div class="page page-narrow anim-in"><h1 class="t-h1">' + esc(tx('donate', 'Donate')) + '</h1><p class="muted">' + esc(tx('loading', 'Loading…')) + '</p></div>', {});
      Promise.all([S.Api.get('/donations/config'), S.Api.get('/donations/impact')]).then(function (r) {
        if (!r[0].ok) { S.toast(r[0].error); return; }
        self.draw(r[0].data, r[1].ok ? r[1].data : null);
      });
    },

    draw: function (cfg, impact) {
      var self = this, live = cfg.mode === 'razorpay_test';
      var thanks = THANKS[S.hashSeed(S.todayISO ? S.todayISO() : String(new Date().toDateString())) % THANKS.length];
      var html = '<div class="page page-narrow anim-in">' +
        '<section class="page-hero tone-peach"><div class="grow"><h1>' + esc(tx('donor_hero', 'Help an elder see a doctor')) + '</h1>' +
          '<p>' + esc(tx('donor_hero_sub', 'Your gift goes into the Smivai Care Fund, which pays the full fee for up to five doctor visits for older people from low-income families, after Smivai and a charity partner approve them.')) + '</p></div></section>' +
        '<div class="demo-note" style="margin-top:1rem">' + S.icon('info') + '<span>' + esc(cfg.note) + '</span></div>' +
        '<article class="card" style="margin-top:1rem"><h2 class="card-title">' + esc(tx('choose_amount', 'Choose an amount')) + '</h2>' +
          '<div class="row" style="gap:.5rem;flex-wrap:wrap;margin-top:.75rem">' + cfg.presets.map(function (a) {
            return '<button class="btn ' + (a === self.amount ? '' : 'btn-outline') + '" data-act="preset" data-arg="' + a + '" aria-pressed="' + (a === self.amount) + '">' + esc(S.rupees(a)) + '</button>';
          }).join('') + '</div>' +
          '<div class="field" style="margin-top:1rem"><label for="dn-amt">' + esc(tx('other_amount', 'Or another amount (₹)')) + '</label>' +
            '<input class="input" id="dn-amt" inputmode="numeric" maxlength="6" value="' + esc(self.amount) + '">' +
            '<div class="hint">' + esc(tx('amount_range', 'From {a} to {b}.', { a: S.rupees(cfg.min_rupees), b: S.rupees(cfg.max_rupees) })) + '</div></div>' +
          '<div class="err" id="dn-err" role="alert" style="color:#A34A3C;font-weight:600;margin-top:.5rem"></div>' +
          '<button class="btn btn-lg btn-block" style="margin-top:1rem" data-act="give" ' + (live ? '' : 'disabled aria-disabled="true"') + '>' + S.icon('heart') +
            esc(live ? tx('give_test', 'Donate (test mode)') : tx('give_off', 'Donations are not available yet')) + '</button>' +
        '</article>' +
        (impact ? '<article class="card" style="margin-top:1rem"><h2 class="card-title">' + esc(tx('fund_now', 'The fund today')) + '</h2>' +
          '<div class="set-row"><div>' + esc(tx('received', 'Donations received')) + '</div><b>' + esc(S.rupees(impact.donations_rupees)) + '</b></div>' +
          '<div class="set-row"><div>' + esc(tx('paid_out', 'Paid for doctor visits')) + '</div><b>' + esc(S.rupees(impact.consultations_rupees)) + '</b></div>' +
          '<div class="set-row"><div>' + esc(tx('available', 'Available')) + '</div><b>' + esc(S.rupees(impact.available_rupees)) + '</b></div>' +
          '<p class="t-small muted" style="margin-top:.5rem">' + esc(tx('impact_note', 'Totals only. To protect their privacy, donors never see who is helped. Test-mode amounts are not real money.')) + '</p></article>' : '') +
        '<p class="t-body" style="margin-top:1rem">' + esc(tx('thanks_' + THANKS.indexOf(thanks), thanks)) + '</p>' +
      '</div>';
      S.mount(S.qs('#app'), html, {
        preset: function (el, ev, a) { self.amount = +a; self.draw(cfg, impact); },
        give: function () { if (live) self.give(cfg); }
      });
    },

    error: function (msg) { var el = S.qs('#dn-err'); if (el) el.textContent = msg || ''; },

    give: function (cfg) {
      var self = this;
      var amt = parseInt(String(S.qs('#dn-amt').value).replace(/[,\s₹]/g, ''), 10);
      if (!(amt >= cfg.min_rupees && amt <= cfg.max_rupees)) { this.error(tx('amount_range', 'From {a} to {b}.', { a: S.rupees(cfg.min_rupees), b: S.rupees(cfg.max_rupees) })); return; }
      this.amount = amt; this.error('');
      loadCheckout().then(function (ok) {
        if (!ok) { self.error(tx('checkout_fail', 'The payment window could not be loaded. Nothing was charged.')); return null; }
        return S.Api.post('/donations', { amount_rupees: amt });
      }).then(function (r) {
        if (!r) return;
        if (!r.ok) { self.error(r.error); return; }
        var d = r.data, settled = false;
        var rzp = new global.Razorpay({
          key: d.key_id, amount: d.amount_paise, currency: d.currency, name: d.name, order_id: d.order_id,
          description: tx('rzp_desc', 'Donation to the Smivai Care Fund (test mode)'),
          handler: function (resp) {
            settled = true;
            self.checking();
            S.Api.post('/donations/' + encodeURIComponent(d.donation_id) + '/verify', {
              razorpay_order_id: resp.razorpay_order_id, razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature
            }).then(function (v) { self.result(v.ok ? v.data : null, v.error); });
          },
          modal: { ondismiss: function () {
            if (settled) return;
            S.Api.post('/donations/' + encodeURIComponent(d.donation_id) + '/cancel').then(function () { S.toast(tx('don_cancelled', 'Cancelled. Nothing was charged.')); });
          } },
          theme: { color: '#2F5D9E' }
        });
        rzp.on('payment.failed', function () { self.error(tx('pay_failed', 'The payment did not go through. You can try again.')); });
        rzp.open();
      });
    },

    checking: function () {
      S.Modal.open({ title: tx('confirming', 'Confirming your donation'),
        body: '<p class="t-body">' + esc(tx('confirming_s', 'Checking the payment with Razorpay. This takes a moment.')) + '</p>' });
    },

    /** Shows only what the server confirmed. */
    result: function (d, err) {
      var self = this;
      var paid = d && d.status === 'paid';
      S.Modal.open({
        title: paid ? tx('thank_you', 'Thank you') : d && d.status === 'pending' ? tx('being_confirmed', 'Being confirmed') : tx('not_recorded', 'Not recorded'),
        body: '<p class="t-body">' + esc(paid
          ? tx('paid_msg', 'Your donation of {a} was received. Receipt {r}.', { a: S.rupees(d.amount_rupees), r: d.receipt }) + (d.test_mode ? ' ' + tx('test_money', '(Test mode — no real money moved.)') : '')
          : d && d.status === 'pending' ? tx('pending_msg', 'Razorpay has not confirmed the payment yet. It will appear in My donations once it is confirmed.')
          : (err || tx('not_recorded_msg', 'The payment could not be confirmed, so no donation was recorded.'))) + '</p>',
        footer: '<button class="btn btn-lg btn-block" data-act="ok">' + esc(tx('ok', 'OK')) + '</button>',
        handlers: { ok: function () { S.Modal.close(); S.Router.go('#/donor/history'); self.history(); } }
      });
    },

    history: function () {
      S.mount(S.qs('#app'), '<div class="page page-narrow anim-in"><h1 class="t-h1">' + esc(tx('my_donations', 'My donations')) + '</h1><p class="muted">' + esc(tx('loading', 'Loading…')) + '</p></div>', {});
      S.Api.get('/donations').then(function (r) {
        if (!r.ok) { S.toast(r.error); return; }
        var rows = r.data || [];
        var total = rows.filter(function (d) { return d.status === 'paid'; }).reduce(function (a, d) { return a + d.amount_rupees; }, 0);
        S.mount(S.qs('#app'), '<div class="page page-narrow anim-in"><h1 class="t-h1">' + esc(tx('my_donations', 'My donations')) + '</h1>' +
          (total ? '<p class="t-lg" style="margin-top:.5rem">' + esc(tx('you_gave', 'You have given {a}. Thank you.', { a: S.rupees(total) })) + '</p>' : '') +
          (rows.length ? '<div class="stack stack-2" style="margin-top:1rem">' + rows.map(function (d) {
            return '<article class="card"><div class="row" style="justify-content:space-between;gap:.5rem;flex-wrap:wrap"><b class="t-lg">' + esc(S.rupees(d.amount_rupees)) + '</b>' + chip(d.status) + '</div>' +
              '<div class="t-small muted" style="margin-top:.35rem">' + esc(when(d.created_at) + ' · ' + tx('receipt', 'Receipt') + ' ' + d.receipt) + (d.test_mode ? ' · ' + esc(tx('test_mode', 'Test mode')) : '') + '</div></article>';
          }).join('') + '</div>' : '<div class="card" style="margin-top:1rem"><p class="t-body">' + esc(tx('no_donations', 'No donations yet.')) + '</p>' +
            '<button class="btn btn-lg" style="margin-top:1rem" data-act="give">' + S.icon('heart') + esc(tx('donate', 'Donate')) + '</button></div>') +
        '</div>', { give: function () { S.Router.go('#/donor/dashboard'); } });
      });
    }
  };

  S.Donor = Donor;
})(window);
