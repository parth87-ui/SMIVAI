/* ============================================================
   SMIVAI — ui/premium.js
   The Premium screen, the locked-feature prompt and the (demo) payment.

   Premium is enforced in S.Plans and mirrored on the server; this module
   only explains it and takes the demo payment.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;
  function tx(k, en, p) { return S.tx(k, en, p); }
  function esc(s) { return S.esc(s); }

  var COPY = {
    patient: { title: 'SMIVAI Premium', sub: 'More games, deeper conversations, and a clearer picture of your week.' },
    caregiver: { title: 'SMIVAI Premium for caregivers', sub: 'Support more people, with more detail for each of them.' },
    doctor: { title: 'SMIVAI Premium for doctors', sub: 'A larger patient list and printable summaries.' }
  };

  var Premium = {

    open: function () {
      var sess = S.Auth.session();
      if (!sess) { S.Router.go('#/'); return; }
      var role = sess.role;
      var plan = S.Plans.planOf(role, sess.actor_id);
      var free = S.Plans.features(role, 'free'), prem = S.Plans.features(role, 'premium');
      var price = S.Plans.PRICE[role];
      var copy = COPY[role];

      S.Modal.open({
        title: copy.title,
        subtitle: plan === 'premium' ? tx('prem_on', 'Premium is active on your account.') : copy.sub,
        body:
          '<div class="prem">' +
            '<div class="prem-art">' + S.Art.orb() + '</div>' +
            '<div class="prem-cols">' +
              planCol('free', tx('plan_free', 'Free'), '₹0', free.perks, plan === 'free') +
              planCol('premium', tx('plan_premium', 'Premium'), '₹' + price, prem.perks, plan === 'premium') +
            '</div>' +
            '<div class="demo-note" style="margin-top:1rem">' + S.icon('card') + '<span><b>' + esc(S.Services.Payment.label) + '.</b> ' +
              esc(tx('pay_demo', 'Demo mode — there is no payment gateway, so nothing is charged and no card details are ever asked for.')) + '</span></div>' +
          '</div>',
        footer: plan === 'premium'
          ? '<button class="btn btn-outline" data-act="downgrade">' + esc(tx('back_to_free', 'Switch back to Free')) + '</button>' +
            '<button class="btn" data-modal-close>' + esc(S.t('close')) + '</button>'
          : '<button class="btn btn-outline" data-modal-close>' + esc(tx('not_now2', 'Not now')) + '</button>' +
            '<button class="btn btn-premium" data-act="upgrade">' + S.icon('sparkle') + esc(tx('upgrade_btn', 'Upgrade to Premium')) + '</button>',
        handlers: {
          upgrade: function () { Premium.pay(role, sess.actor_id, price); },
          downgrade: function () {
            S.Modal.confirm({ title: tx('back_to_free', 'Switch back to Free'), message: tx('downgrade_msg', 'Premium games and insights will be locked again. People already in your list stay, but you cannot add more beyond the Free limit.'), okText: tx('switch', 'Switch') })
              .then(function (ok) {
                if (!ok) return;
                S.Plans.downgrade(role, sess.actor_id);
                S.Modal.close();
                S.toast(tx('now_free', 'You are on the Free plan.'), 'ok');
              });
          }
        }
      });

      function planCol(id, name, price, perks, current) {
        return '<div class="prem-col ' + id + (current ? ' is-current' : '') + '">' +
          '<div class="pc-head"><b>' + esc(name) + '</b><span class="pc-price">' + esc(price) + '<small>' + esc(tx('per_month', '/month')) + '</small></span>' +
            (current ? '<span class="chip chip-green">' + S.icon('check') + esc(tx('your_plan', 'Your plan')) + '</span>' : '') + '</div>' +
          '<ul class="pc-list">' + perks.map(function (x) { return '<li>' + S.icon(id === 'premium' ? 'sparkle' : 'check') + esc(x) + '</li>'; }).join('') + '</ul>' +
        '</div>';
      }
    },

    /** Demo payment: choose a method, then a simulated charge. */
    pay: function (role, actorId, price) {
      var method = 'upi';
      S.Modal.open({
        title: tx('choose_payment', 'Choose how to pay'),
        subtitle: tx('demo_pay_sub', 'Demo only — no money is charged and no card details are collected.'),
        body:
          '<div class="stack stack-2">' +
            '<div class="pay-row"><span>' + esc(tx('plan_premium', 'Premium')) + ' · ' + esc(S.titleCase(role)) + '</span><b>₹' + price + esc(tx('per_month', '/month')) + '</b></div>' +
            '<div class="choice-grid" id="pay-methods">' +
              method_('upi', 'card', 'UPI') + method_('netbanking', 'card', tx('netbanking', 'Net banking')) + method_('cod', 'truck', tx('pay_later', 'Pay later')) +
            '</div>' +
            '<div class="err" id="pay-err" role="alert" hidden></div>' +
          '</div>',
        footer: '<button class="btn btn-outline" data-modal-close>' + esc(S.t('cancel')) + '</button>' +
          '<button class="btn btn-premium" data-act="go">' + S.icon('sparkle') + esc(tx('pay_now', 'Pay ₹{n} (demo)', { n: price })) + '</button>',
        handlers: {
          m: function (el, ev, id) {
            method = id;
            S.qsa('#pay-methods .choice').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-arg') === id ? 'true' : 'false'); });
          },
          go: function (el) {
            var err = S.qs('#pay-err');
            err.hidden = true;
            el.disabled = true;
            el.innerHTML = '<span class="spinner" style="border-top-color:#fff;border-color:rgba(255,255,255,.35)"></span>' + esc(tx('paying', 'Processing…'));
            S.Plans.upgrade(role, actorId, method).then(function (res) {
              el.disabled = false;
              el.innerHTML = S.icon('sparkle') + esc(tx('pay_now', 'Pay ₹{n} (demo)', { n: price }));
              if (!res.ok) { err.textContent = res.error; err.hidden = false; return; }
              S.Modal.close();
              Premium.welcome(role, res.txnId);
            });
          }
        }
      });
      function method_(id, ico, name) {
        return '<button class="choice" data-act="m" data-arg="' + id + '" aria-pressed="' + (id === method) + '">' + S.icon(ico) + esc(name) + '</button>';
      }
    },

    welcome: function (role, txn) {
      S.Modal.open({
        title: tx('prem_welcome', 'Welcome to Premium'),
        body: '<div class="center"><div style="width:9rem;margin:0 auto">' + S.Art.trophy() + '</div>' +
          '<p class="t-lg" style="margin-top:1rem">' + esc(role === 'patient'
            ? tx('prem_welcome_p', 'All eight brain games are unlocked, your progress now shows the full picture, and HUN can talk with you in more depth.')
            : role === 'caregiver' ? tx('prem_welcome_c', 'You can now support up to 6 people.')
            : tx('prem_welcome_d', 'You can now care for up to 500 patients.')) + '</p>' +
          '<p class="t-small muted" style="margin-top:.75rem">' + esc(tx('demo_txn', 'Demo transaction {t} — no money was charged.', { t: txn })) + '</p></div>',
        footer: '<button class="btn btn-lg btn-block" data-modal-close>' + S.icon('check') + esc(tx('lets_go', 'Let’s go')) + '</button>'
      });
      S.Router.handle();
    },

    /** Shown when someone opens something their plan does not include. */
    locked: function (what) {
      var sess = S.Auth.session();
      var role = sess ? sess.role : 'patient';
      S.Modal.open({
        title: tx('with_premium', 'Available with SMIVAI Premium'),
        body: '<div class="locked-modal">' +
            '<div class="lm-art">' + S.Art.orb() + '</div>' +
            '<h3>' + esc(what || tx('this_feature', 'This feature')) + '</h3>' +
            '<p>' + esc(role === 'patient'
              ? tx('locked_p', 'Premium adds four more brain games, personalised activities, deeper conversations with HUN and a fuller view of your progress.')
              : tx('locked_o', 'Premium raises your limits and adds more detail for the people you look after.')) + '</p>' +
          '</div>',
        footer: '<button class="btn btn-outline" data-modal-close>' + esc(tx('not_now2', 'Not now')) + '</button>' +
          '<button class="btn btn-premium" data-act="see">' + S.icon('sparkle') + esc(tx('see_premium', 'See Premium')) + '</button>',
        handlers: { see: function () { S.Modal.close(); Premium.open(); } }
      });
    }
  };

  S.Premium = Premium;
})(window);
