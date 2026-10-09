/* ============================================================
   SMIVAI — charity.js
   Charity assistance: the patient's application (S.Charity) and the
   reviewers' screens for Smivai administrators and charity partners
   (S.Staff). Every rule — the income limit, both approvals, the five
   covered visits, the fund — is enforced by the server
   (backend/app/charity.py). These screens only show what it says.
   ============================================================ */
(function (global) {
  'use strict';
  var S = global.S;
  var esc = S.esc;
  function tx(k, f, v) { return S.tx(k, f, v); }
  var API = function () { return S.CharityApi; };

  var STATUS_TONE = { draft: 'chip-blue', submitted: 'chip-lav', under_review: 'chip-lav', info_requested: 'chip-amber',
                      rejected: 'chip-red', approved: 'chip-green', active: 'chip-green', completed: 'chip-blue' };
  function statusChip(st) { return '<span class="chip ' + (STATUS_TONE[st] || '') + '">' + esc(API().statusText(st)) + '</span>'; }
  function when(iso) { if (!iso) return '—'; var d = S.serverDate(iso); return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function demoNote(text) { return '<div class="demo-note" style="margin-top:1rem">' + S.icon('info') + '<span>' + esc(text) + '</span></div>'; }
  function loading(title) {
    S.mount(S.qs('#app'), '<div class="page page-narrow anim-in"><h1 class="t-h1">' + esc(title) + '</h1><p class="muted" style="margin-top:1rem">' + esc(tx('loading', 'Loading…')) + '</p></div>', {});
  }
  function failed(title, err, retry) {
    S.mount(S.qs('#app'), '<div class="page page-narrow anim-in"><h1 class="t-h1">' + esc(title) + '</h1>' +
      '<div class="card" style="margin-top:1rem"><p class="t-body">' + esc(err) + '</p>' +
      '<button class="btn btn-lg" style="margin-top:1rem" data-act="retry">' + S.icon('refresh') + esc(tx('try_again', 'Try again')) + '</button></div></div>',
      { retry: retry });
  }
  function val(id) { var el = S.qs('#' + id); return el ? el.value : ''; }
  function checked(id) { var el = S.qs('#' + id); return !!(el && el.checked); }
  function intOrNull(v) { v = String(v || '').replace(/[,\s₹]/g, ''); return v === '' || isNaN(+v) ? null : Math.round(+v); }

  /* ============================================================
     Patient: apply for charity assistance
     ============================================================ */
  var Charity = {
    TITLE: function () { return tx('charity_t', 'Charity assistance'); },

    render: function () {
      var self = this, p = S.State.patient();
      if (!S.Api.available()) {
        S.mount(S.qs('#app'),
          '<div class="page page-narrow anim-in"><section class="page-hero tone-peach"><div class="grow"><h1>' + esc(this.TITLE()) + '</h1>' +
          '<p>' + esc(tx('charity_sub', 'Help with doctor fees for families with a low income.')) + '</p></div></section>' +
          '<div class="card"><p class="t-body">' + esc(tx('charity_needs_server', 'Applications are checked by people at Smivai and a charity partner, so they are kept on the Smivai server. This device is not connected to it, so an application cannot be made here.')) + '</p></div>' +
          demoNote(tx('charity_demo', 'Demo mode: no real charity partner is connected yet, so no real assistance can be approved.')) + '</div>', {});
        return;
      }
      loading(this.TITLE());
      Promise.all([API().policy(), API().mine()]).then(function (r) {
        if (!r[0].ok) return failed(self.TITLE(), r[0].error, function () { self.render(); });
        if (!r[1].ok) return failed(self.TITLE(), r[1].error, function () { self.render(); });
        var mine = (r[1].data || []).filter(function (a) { return a.patient_id === p.patient_id; });
        var open = mine.filter(function (a) { return a.status !== 'rejected' && a.status !== 'completed'; })[0];
        self.draw(r[0].data, open, mine.filter(function (a) { return a !== open; }));
      });
    },

    draw: function (policy, app, past) {
      var self = this;
      var editable = !app || app.status === 'draft' || app.status === 'info_requested';
      var html =
        '<div class="page page-narrow anim-in">' +
          '<section class="page-hero tone-peach"><div class="grow"><h1>' + esc(this.TITLE()) + '</h1>' +
            '<p>' + esc(tx('charity_sub', 'Help with doctor fees for families with a low income.')) + '</p></div></section>' +
          (policy.demo ? demoNote(policy.demo_note) : '') +
          '<article class="card" style="margin-top:1rem"><h2 class="card-title">' + esc(tx('how_it_works', 'How it works')) + '</h2>' +
            '<ul class="t-body" style="margin:.5rem 0 0 1.25rem;display:grid;gap:.4rem">' +
              '<li>' + esc(policy.rule) + '</li><li>' + esc(policy.approval) + '</li><li>' + esc(policy.benefit) + '</li></ul></article>' +
          (app ? this.statusCard(app) : '') +
          (editable ? this.form(policy, app) : '') +
          (app ? this.docsCard(policy, app, editable) : '') +
          (app && editable ? '<div class="row" style="margin-top:1rem;gap:.75rem;flex-wrap:wrap">' +
            '<button class="btn btn-lg" data-act="submit">' + S.icon('send') + esc(app.status === 'info_requested' ? tx('resubmit', 'Send again for review') : tx('submit_app', 'Submit for review')) + '</button></div>' +
            '<p class="t-small muted" style="margin-top:.5rem">' + esc(tx('submit_note', 'Submitting is not an approval. You will be told here about every change.')) + '</p>' : '') +
          (past.length ? '<article class="card" style="margin-top:1rem"><h2 class="card-title">' + esc(tx('earlier_apps', 'Earlier applications')) + '</h2>' +
            past.map(function (a) { return '<div class="set-row"><div>' + esc(when(a.created_at)) + (a.rejection_reason ? '<div class="t-small muted">' + esc(a.rejection_reason) + '</div>' : '') + '</div>' + statusChip(a.status) + '</div>'; }).join('') + '</article>' : '') +
          '<p class="t-small muted" style="margin-top:1rem">' + esc(tx('charity_privacy', 'Only you, the people you let see your health records, and the Smivai and charity reviewers can see this application. Donors never see who applied.')) + '</p>' +
        '</div>';
      S.mount(S.qs('#app'), html, {
        save: function () { self.save(app); },
        upload: function () { self.upload(app); },
        openDoc: function (el, ev, id) { Staff.openDocument(id); },
        removeDoc: function (el, ev, id) {
          API().removeDocument(id).then(function (r) { if (!r.ok) S.toast(r.error); self.render(); });
        },
        submit: function () {
          self.save(app, true).then(function (ok) {
            if (!ok) return;
            API().submit(app.application_id).then(function (r) {
              if (!r.ok) { self.showError(r.error); return; }
              S.toast(tx('app_sent', 'Your application was sent for review.'));
              self.render();
            });
          });
        }
      });
      S.scrollTop();
    },

    statusCard: function (a) {
      return '<article class="card" style="margin-top:1rem"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:.5rem">' +
          '<h2 class="card-title">' + esc(tx('your_app', 'Your application')) + '</h2>' + statusChip(a.status) + '</div>' +
        (a.info_request ? '<div class="demo-note" style="margin-top:.75rem">' + S.icon('alert') + '<span><b>' + esc(tx('info_needed', 'The reviewers ask:')) + '</b> ' + esc(a.info_request) + '</span></div>' : '') +
        (a.status === 'active' || a.status === 'completed'
          ? '<p class="t-lg" style="margin-top:.75rem">' + esc(tx('visits_left', '{n} of {m} covered visits left', { n: a.visits_remaining, m: a.visits_allowed })) + '</p>' +
            '<p class="t-small muted">' + esc(tx('visits_rule', 'Only completed visits with a participating doctor are covered, while the fund has money.')) + '</p>' : '') +
        (a.status === 'approved' ? '<p class="t-body" style="margin-top:.75rem">' + esc(tx('approved_wait', 'Both reviewers approved it. An administrator will now activate the assistance.')) + '</p>' : '') +
        '<div class="t-small muted" style="margin-top:.5rem">' + esc(tx('started_on', 'Started {d}', { d: when(a.created_at) })) +
          (a.submitted_at ? ' · ' + esc(tx('sent_on', 'sent {d}', { d: when(a.submitted_at) })) : '') + '</div></article>';
    },

    form: function (policy, a) {
      a = a || {};
      var limit = S.rupees(policy.income_limit_rupees);
      function input(id, label, value, attrs, hint) {
        return '<div class="field"><label for="' + id + '">' + esc(label) + '</label>' +
          '<input class="input" id="' + id + '" value="' + esc(value == null ? '' : value) + '" ' + (attrs || '') + '>' +
          (hint ? '<div class="hint">' + esc(hint) + '</div>' : '') + '</div>';
      }
      return '<article class="card" style="margin-top:1rem"><h2 class="card-title">' + esc(a.application_id ? tx('app_details', 'Application details') : tx('start_app', 'Apply for charity assistance')) + '</h2>' +
        '<p class="t-small muted">' + esc(tx('name_from_profile', 'Your name is taken from your Smivai profile.')) + '</p>' +
        '<div class="stack stack-2" style="margin-top:.75rem">' +
          input('ch-income', tx('ch_annual_income', 'Annual family income (₹)'), a.annual_income_rupees, 'inputmode="numeric" maxlength="12" placeholder="e.g. 90000"',
            tx('income_hint', 'Everyone in the household, for one year. It must be below {l}.', { l: limit })) +
          input('ch-household', tx('ch_household_size', 'People in the household'), a.household_size, 'inputmode="numeric" maxlength="2"') +
          input('ch-phone', tx('ch_contact_phone', 'Phone number for the reviewers (optional)'), a.contact_phone, 'inputmode="tel" maxlength="14"') +
          input('ch-cg', tx('ch_helper_name', 'Name of a family member helping you (optional)'), a.caregiver_name, 'maxlength="80"') +
          '<div class="field"><label for="ch-circ">' + esc(tx('ch_circumstances', 'Your situation, in a few words')) + '</label>' +
            '<textarea class="textarea" id="ch-circ" maxlength="1000" style="min-height:5rem">' + esc(a.circumstances || '') + '</textarea></div>' +
          '<div class="field"><label for="ch-need">' + esc(tx('ch_help_needed', 'What help do you need?')) + '</label>' +
            '<textarea class="textarea" id="ch-need" maxlength="500" style="min-height:4rem">' + esc(a.assistance_requested || '') + '</textarea></div>' +
          '<label class="row" style="gap:.6rem;align-items:flex-start"><input type="checkbox" id="ch-decl" ' + (a.declaration ? 'checked' : '') + ' style="margin-top:.3rem">' +
            '<span>' + esc(tx('ch_declaration', 'The information I give is true, to the best of my knowledge.')) + '</span></label>' +
          '<label class="row" style="gap:.6rem;align-items:flex-start"><input type="checkbox" id="ch-consent" ' + (a.consent ? 'checked' : '') + ' style="margin-top:.3rem">' +
            '<span>' + esc(tx('charity_consent', 'Smivai and the charity partner may see this application and my documents to decide on it.')) + '</span></label>' +
          '<div class="err" id="ch-err" role="alert" style="color:#A34A3C;font-weight:600"></div>' +
          '<button class="btn btn-lg btn-outline" data-act="save">' + S.icon('check') + esc(a.application_id ? tx('ch_save_changes', 'Save changes') : tx('ch_save_draft', 'Save and continue')) + '</button>' +
        '</div></article>';
    },

    docsCard: function (policy, a, editable) {
      var types = policy.documents || {};
      return '<article class="card" style="margin-top:1rem"><h2 class="card-title">' + esc(tx('charity_docs', 'Documents')) + '</h2>' +
        '<p class="t-small muted">' + esc(policy.documents_note) + '</p>' +
        (a.documents.length ? a.documents.map(function (d) {
          return '<div class="set-row"><div><b>' + esc(d.label || d.doc_type) + '</b><div class="t-small muted">' +
            esc(Math.max(1, Math.round(d.size_bytes / 1024)) + ' KB · ' + when(d.uploaded_at)) + '</div></div>' +
            '<div class="row" style="gap:.5rem"><button class="btn btn-sm btn-outline" data-act="openDoc" data-arg="' + esc(d.document_id) + '">' + S.icon('eye') + esc(tx('open', 'Open')) + '</button>' +
            (editable ? '<button class="btn btn-sm btn-ghost" data-act="removeDoc" data-arg="' + esc(d.document_id) + '" aria-label="' + esc(tx('remove', 'Remove')) + '">' + S.icon('trash') + '</button>' : '') + '</div></div>';
        }).join('') : '<p class="t-body" style="margin:.75rem 0">' + esc(tx('no_docs', 'No documents yet.')) + '</p>') +
        (editable ? '<div class="stack stack-2" style="margin-top:.75rem">' +
          '<div class="field"><label for="ch-dtype">' + esc(tx('doc_type', 'Type of document')) + '</label><select class="input" id="ch-dtype">' +
            Object.keys(types).map(function (k) { return '<option value="' + esc(k) + '">' + esc(types[k]) + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label for="ch-file">' + esc(tx('doc_file', 'File (PDF, JPG or PNG, up to 5 MB)')) + '</label>' +
            '<input class="input" type="file" id="ch-file" accept="application/pdf,image/jpeg,image/png"></div>' +
          '<button class="btn btn-lg btn-outline" data-act="upload">' + S.icon('upload') + esc(tx('upload', 'Upload')) + '</button></div>' : '') +
        '</article>';
    },

    collect: function () {
      return {
        annual_income_rupees: intOrNull(val('ch-income')), household_size: intOrNull(val('ch-household')),
        contact_phone: val('ch-phone').trim() || null, caregiver_name: val('ch-cg').trim() || null,
        circumstances: val('ch-circ').trim() || null, assistance_requested: val('ch-need').trim() || null,
        declaration: checked('ch-decl'), consent: checked('ch-consent')
      };
    },

    showError: function (msg) {
      var el = S.qs('#ch-err');
      if (el) { el.textContent = msg; el.scrollIntoView({ block: 'center' }); } else S.toast(msg);
    },

    /** Create or update the draft. @returns {Promise<boolean>} */
    save: function (app, quiet) {
      var self = this, body = this.collect();
      if (body.household_size !== null && (body.household_size < 1 || body.household_size > 30)) { this.showError(tx('household_err', 'Please enter between 1 and 30 people.')); return Promise.resolve(false); }
      var req = app ? API().update(app.application_id, body)
        : API().create(Object.assign({ patient_id: S.State.patient().patient_id }, body));
      return req.then(function (r) {
        if (!r.ok) { self.showError(r.error); return false; }
        if (!quiet) { S.toast(tx('saved', 'Saved')); self.render(); }
        return true;
      });
    },

    upload: function (app) {
      var self = this, f = S.qs('#ch-file') && S.qs('#ch-file').files[0];
      if (!f) { S.toast(tx('pick_file', 'Please choose a file first.')); return; }
      if (f.size > 5 * 1024 * 1024) { S.toast(tx('file_big', 'The file is larger than 5 MB.')); return; }
      API().upload(app.application_id, val('ch-dtype'), f).then(function (r) {
        S.toast(r.ok ? tx('uploaded', 'Document uploaded') : r.error);
        if (r.ok) self.render();
      });
    }
  };

  /* ============================================================
     Reviewers: Smivai administrators and charity partners
     ============================================================ */
  var FILTERS = ['', 'submitted', 'under_review', 'info_requested', 'approved', 'active', 'rejected', 'completed'];

  var Staff = {
    filter: '',
    role: function () { var s = S.Auth.session(); return s && s.role; },
    go: function (path) { S.Router.go('#/' + this.role() + '/' + path); },

    render: function (page, arg) {
      if (page === 'app' && arg) return this.detail(arg);
      if (page === 'fund') return this.fund();
      return this.list();
    },

    list: function () {
      var self = this;
      loading(tx('applications', 'Applications'));
      API().list(this.filter).then(function (r) {
        if (!r.ok) return failed(tx('applications', 'Applications'), r.error, function () { self.list(); });
        var rows = r.data || [];
        var html = '<div class="page anim-in">' +
          '<section class="page-hero tone-blue"><div class="grow"><h1>' + esc(tx('applications', 'Applications')) + '</h1>' +
            '<p>' + esc(tx('apps_sub', 'Charity assistance applications. A Smivai administrator and the charity partner must both approve.')) + '</p></div></section>' +
          '<div class="segmented" role="tablist" style="margin-top:1rem">' + FILTERS.map(function (f) {
            return '<button role="tab" data-act="filter" data-arg="' + f + '" aria-selected="' + (self.filter === f) + '">' + esc(f ? API().statusText(f).split(' —')[0] : tx('all', 'All')) + '</button>';
          }).join('') + '</div>' +
          (rows.length ? '<div class="stack stack-2" style="margin-top:1rem">' + rows.map(function (a) {
            return '<button class="card" style="text-align:left;width:100%" data-act="open" data-arg="' + esc(a.application_id) + '">' +
              '<div class="row" style="justify-content:space-between;gap:.5rem;flex-wrap:wrap"><b class="t-lg">' + esc(a.applicant_name) + '</b>' + statusChip(a.status) + '</div>' +
              '<div class="t-small muted" style="margin-top:.35rem">' + esc(tx('income_is', 'Income {i} a year', { i: S.rupees(a.annual_income_rupees) })) +
                ' · ' + esc(tx('docs_n', '{n} document(s)', { n: a.documents.length })) + ' · ' + esc(tx('sent_on', 'sent {d}', { d: when(a.submitted_at) })) + '</div>' +
              '<div class="t-small" style="margin-top:.35rem">' + self.decisions(a) + '</div></button>';
          }).join('') + '</div>' : '<div class="card" style="margin-top:1rem"><p class="t-body">' + esc(tx('no_apps', 'No applications here.')) + '</p></div>') +
          demoNote(tx('charity_demo', 'Demo mode: no real charity partner is connected yet, so no real assistance can be approved.')) +
        '</div>';
        S.mount(S.qs('#app'), html, {
          filter: function (el, ev, f) { self.filter = f || ''; self.list(); },
          open: function (el, ev, id) { self.go('app/' + id); }
        });
      });
    },

    decisions: function (a) {
      function d(label, v) { return esc(label) + ': <b>' + esc(v ? S.titleCase(v) : tx('pending', 'Pending')) + '</b>'; }
      return d(tx('admin', 'Administrator'), a.admin_decision) + ' · ' + d(tx('partner', 'Charity partner'), a.partner_decision);
    },

    detail: function (id) {
      var self = this, role = this.role();
      loading(tx('application', 'Application'));
      Promise.all([API().get(id), API().claims(id)]).then(function (r) {
        if (!r[0].ok) return failed(tx('application', 'Application'), r[0].error, function () { self.detail(id); });
        var a = r[0].data, claims = r[1].ok ? r[1].data : [];
        var mine = role === 'admin' ? a.admin_decision : a.partner_decision;
        var acts = [];
        if (a.status === 'submitted') acts.push(['start_review', tx('start_review', 'Start review'), '']);
        if (a.status === 'under_review' && !mine) acts.push(['approve', tx('approve', 'Approve'), '']);
        if (a.status === 'submitted' || a.status === 'under_review') acts.push(['request_info', tx('ask_info', 'Ask for more information'), 'btn-outline']);
        if (['submitted', 'under_review', 'info_requested'].indexOf(a.status) !== -1) acts.push(['reject', tx('reject', 'Reject'), 'btn-danger']);
        function row(k, v) { return '<div class="set-row"><div class="t-small muted">' + esc(k) + '</div><div style="text-align:right">' + esc(v == null || v === '' ? '—' : v) + '</div></div>'; }
        var html = '<div class="page page-narrow anim-in">' +
          '<button class="btn btn-ghost btn-sm" data-act="back">' + S.icon('arrowLeft') + esc(tx('applications', 'Applications')) + '</button>' +
          '<div class="row" style="justify-content:space-between;gap:.5rem;flex-wrap:wrap;margin-top:.5rem"><h1 class="t-h1">' + esc(a.applicant_name) + '</h1>' + statusChip(a.status) + '</div>' +
          (a.demo ? demoNote(tx('charity_demo', 'Demo mode: no real charity partner is connected yet, so no real assistance can be approved.')) : '') +
          '<article class="card" style="margin-top:1rem"><h2 class="card-title">' + esc(tx('app_details', 'Application details')) + '</h2>' +
            row(tx('annual_income', 'Annual family income (₹)'), S.rupees(a.annual_income_rupees) + (a.below_income_limit ? '' : ' — ' + tx('not_below', 'not below the limit'))) +
            row(tx('household_size', 'People in the household'), a.household_size) +
            row(tx('contact_phone', 'Phone number'), a.contact_phone) +
            row(tx('helper_name', 'Family member helping'), a.caregiver_name) +
            row(tx('applied_by', 'Applied by'), S.M.roleName(a.submitted_by_role)) +
            row(tx('circumstances', 'Situation'), a.circumstances) +
            row(tx('help_needed', 'Help needed'), a.assistance_requested) +
            row(tx('declaration_t', 'Declaration / consent'), (a.declaration ? '✓' : '✗') + ' / ' + (a.consent ? '✓' : '✗')) +
          '</article>' +
          '<article class="card" style="margin-top:1rem"><h2 class="card-title">' + esc(tx('charity_docs', 'Documents')) + '</h2>' +
            '<p class="t-small muted">' + esc(tx('docs_private', 'Private. Open only to decide on this application; do not save copies.')) + '</p>' +
            (a.documents.length ? a.documents.map(function (d) {
              return '<div class="set-row"><div><b>' + esc(d.label || d.doc_type) + '</b><div class="t-small muted">' + esc(d.mime + ' · ' + Math.max(1, Math.round(d.size_bytes / 1024)) + ' KB') + '</div></div>' +
                '<button class="btn btn-sm btn-outline" data-act="doc" data-arg="' + esc(d.document_id) + '">' + S.icon('eye') + esc(tx('open', 'Open')) + '</button></div>';
            }).join('') : '<p class="t-body">' + esc(tx('no_docs', 'No documents yet.')) + '</p>') + '</article>' +
          '<article class="card" style="margin-top:1rem"><h2 class="card-title">' + esc(tx('decision', 'Decision')) + '</h2>' +
            '<p class="t-body">' + self.decisions(a) + '</p>' +
            (a.info_request ? '<p class="t-small" style="margin-top:.5rem"><b>' + esc(tx('asked', 'Asked:')) + '</b> ' + esc(a.info_request) + '</p>' : '') +
            (a.rejection_reason ? '<p class="t-small" style="margin-top:.5rem"><b>' + esc(tx('reason', 'Reason:')) + '</b> ' + esc(a.rejection_reason) + '</p>' : '') +
            (mine && a.status === 'under_review' ? '<p class="t-small muted" style="margin-top:.5rem">' + esc(tx('wait_other', 'You have approved. Waiting for the other reviewer.')) + '</p>' : '') +
            '<div class="row" style="gap:.5rem;flex-wrap:wrap;margin-top:.75rem">' +
              acts.map(function (x) { return '<button class="btn ' + x[2] + '" data-act="review" data-arg="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join('') +
              (role === 'admin' && a.status === 'approved' ? '<button class="btn" data-act="activate">' + S.icon('check') + esc(tx('activate', 'Activate assistance')) + '</button>' : '') +
            '</div></article>' +
          (a.status === 'active' || a.status === 'completed' || claims.length ? self.claimsCard(a, claims, role) : '') +
          '<article class="card" style="margin-top:1rem"><h2 class="card-title">' + esc(tx('history', 'History')) + '</h2>' +
            (a.events || []).map(function (e) {
              return '<div class="set-row"><div><b>' + esc(S.titleCase(String(e.action).replace(/_/g, ' '))) + '</b> · ' + esc(S.M.roleName(e.actor_role)) +
                (e.note ? '<div class="t-small muted">' + esc(e.note) + '</div>' : '') + '</div><div class="t-small muted">' + esc(when(e.at)) + '</div></div>';
            }).join('') + '</article>' +
        '</div>';
        S.mount(S.qs('#app'), html, {
          back: function () { self.go('dashboard'); },
          doc: function (el, ev, docId) { self.openDocument(docId); },
          review: function (el, ev, action) { self.review(a, action); },
          activate: function () {
            API().activate(a.application_id).then(function (res) { S.toast(res.ok ? tx('activated', 'Assistance is active') : res.error); self.detail(a.application_id); });
          },
          claim: function () {
            var appt = val('cl-appt').trim();
            if (!appt) { S.toast(tx('appt_needed', 'Enter the appointment ID.')); return; }
            API().claim(a.application_id, appt).then(function (res) {
              S.toast(res.ok ? (res.data.note || tx('covered', 'Visit covered: {f}', { f: S.rupees(res.data.covered_rupees) })) : res.error);
              self.detail(a.application_id);
            });
          },
          reverse: function (el, ev, claimId) { self.ask(tx('reverse_t', 'Reverse this covered visit?'), tx('reverse_why', 'Why? (kept in the ledger)'), function (why) {
            return API().reverse(claimId, why).then(function (res) { if (res.ok) self.detail(a.application_id); return res; });
          }); }
        });
        S.scrollTop();
      });
    },

    claimsCard: function (a, claims, role) {
      return '<article class="card" style="margin-top:1rem"><h2 class="card-title">' + esc(tx('covered_visits', 'Covered visits')) + '</h2>' +
        '<p class="t-body">' + esc(tx('visits_used', '{u} of {m} used', { u: a.visits_used, m: a.visits_allowed })) + '</p>' +
        claims.map(function (c) {
          return '<div class="set-row"><div><b>' + esc(c.appointment_id) + '</b><div class="t-small muted">' + esc(S.titleCase(c.status.replace(/_/g, ' ')) + ' · ' + tx('fee', 'fee') + ' ' + S.rupees(c.fee_rupees)) + '</div></div>' +
            (role === 'admin' && c.status === 'covered' ? '<button class="btn btn-sm btn-outline" data-act="reverse" data-arg="' + esc(c.claim_id) + '">' + esc(tx('reverse', 'Reverse')) + '</button>' : '') + '</div>';
        }).join('') +
        (role === 'admin' && a.status === 'active' ? '<div class="row" style="gap:.5rem;margin-top:.75rem;flex-wrap:wrap">' +
          '<input class="input grow" id="cl-appt" maxlength="64" placeholder="' + esc(tx('appt_id', 'Completed appointment ID')) + '" aria-label="' + esc(tx('appt_id', 'Completed appointment ID')) + '">' +
          '<button class="btn" data-act="claim">' + esc(tx('cover_visit', 'Cover this visit')) + '</button></div>' +
          '<p class="t-small muted" style="margin-top:.5rem">' + esc(tx('cover_rule', 'The server checks that the visit is completed, with a participating doctor, not already covered, and that the fund has the full fee.')) + '</p>' : '') +
        '</article>';
    },

    /** A note box in a modal, then `fn(note)` → Promise<{ok, error}>. */
    ask: function (title, label, fn, optional) {
      S.Modal.open({
        title: title,
        body: '<div class="field"><label for="ask-note">' + esc(label) + '</label><textarea class="textarea" id="ask-note" maxlength="1000" style="min-height:5rem"></textarea>' +
          '<div class="err" id="ask-err" role="alert"></div></div>',
        footer: '<button class="btn btn-secondary" data-act="no">' + esc(tx('cancel', 'Cancel')) + '</button><button class="btn" data-act="yes">' + esc(tx('confirm', 'Confirm')) + '</button>',
        handlers: {
          no: function () { S.Modal.close(); },
          yes: function () {
            var note = val('ask-note').trim();
            if (!note && !optional) { S.qs('#ask-err').textContent = tx('need_note', 'Please write a short note.'); return; }
            fn(note).then(function (res) { if (res.ok) S.Modal.close(); else S.qs('#ask-err').textContent = res.error; });
          }
        }
      });
    },

    review: function (a, action) {
      var self = this;
      function done(res) { if (res.ok) { S.toast(tx('saved', 'Saved')); self.detail(a.application_id); } return res; }
      if (action === 'request_info') return this.ask(tx('ask_info', 'Ask for more information'), tx('what_needed', 'What is needed? The applicant will see this.'), function (n) { return API().review(a.application_id, action, n).then(done); });
      if (action === 'reject') return this.ask(tx('reject', 'Reject'), tx('reject_why', 'Reason — the applicant will see this.'), function (n) { return API().review(a.application_id, action, n).then(done); });
      if (action === 'approve') {
        return this.ask(tx('approve', 'Approve'), tx('approve_note', 'Note (optional). Confirm you checked the documents and the income.'), function (n) { return API().review(a.application_id, action, n).then(done); }, true);
      }
      API().review(a.application_id, action).then(function (res) { if (!res.ok) S.toast(res.error); done(res); });
    },

    /** Open a private document in a new tab, from memory — never a public link. */
    openDocument: function (docId) {
      var win = global.open('', '_blank');
      API().document(docId).then(function (r) {
        if (!r.ok) { if (win) win.close(); S.toast(r.error); return; }
        var url = URL.createObjectURL(r.data);
        if (win) win.location.href = url; else global.location.assign(url);
        setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
      });
    },

    fund: function () {
      var self = this, role = this.role();
      loading(tx('fund', 'Fund'));
      Promise.all([API().fund(), API().ledger()]).then(function (r) {
        if (!r[0].ok) return failed(tx('fund', 'Fund'), r[0].error, function () { self.fund(); });
        var f = r[0].data, rows = r[1].ok ? r[1].data : [];
        function stat(label, v) { return '<div class="card"><div class="t-small muted">' + esc(label) + '</div><div class="t-h2" style="margin-top:.25rem">' + esc(v) + '</div></div>'; }
        var html = '<div class="page anim-in">' +
          '<section class="page-hero tone-blue"><div class="grow"><h1>' + esc(role === 'admin' ? tx('fund_ledger', 'Fund & ledger') : tx('fund', 'Fund')) + '</h1>' +
            '<p>' + esc(tx('fund_sub', 'Worked out on the server from the add-only ledger. Entries are never edited or deleted; corrections are new entries.')) + '</p></div></section>' +
          '<div class="grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.75rem;margin-top:1rem">' +
            stat(tx('available', 'Available'), S.rupees(f.available_rupees)) + stat(tx('received', 'Donations received'), S.rupees(f.donations_rupees)) +
            stat(tx('paid_out', 'Paid for visits'), S.rupees(f.consultations_rupees)) + stat(tx('active_apps', 'Active applications'), f.applications_active) +
            stat(tx('visits_cov', 'Visits covered'), f.visits_covered) + '</div>' +
          (role === 'admin' ? '<div class="grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(18rem,1fr));gap:.75rem;margin-top:1rem">' +
            '<article class="card"><h2 class="card-title">' + esc(tx('adjustment', 'Ledger adjustment')) + '</h2><div class="stack stack-2" style="margin-top:.5rem">' +
              '<select class="input" id="adj-dir" aria-label="' + esc(tx('direction', 'Direction')) + '"><option value="in">' + esc(tx('adj_in', 'Money in')) + '</option><option value="out">' + esc(tx('adj_out', 'Money out')) + '</option></select>' +
              '<input class="input" id="adj-amt" inputmode="numeric" maxlength="9" placeholder="' + esc(tx('amount_rs', 'Amount in ₹')) + '" aria-label="' + esc(tx('amount_rs', 'Amount in ₹')) + '">' +
              '<input class="input" id="adj-ref" maxlength="100" placeholder="' + esc(tx('ext_ref', 'External reference (bank or receipt no.)')) + '" aria-label="' + esc(tx('ext_ref', 'External reference')) + '">' +
              '<textarea class="textarea" id="adj-why" maxlength="500" placeholder="' + esc(tx('reason_ph2', 'Reason')) + '" aria-label="' + esc(tx('reason_ph2', 'Reason')) + '"></textarea>' +
              '<button class="btn" data-act="adjust">' + esc(tx('record', 'Record')) + '</button></div></article>' +
            '<article class="card"><h2 class="card-title">' + esc(tx('provider', 'Participating doctor')) + '</h2>' +
              '<p class="t-small muted">' + esc(tx('provider_sub', 'Record a doctor who has agreed how charity-covered fees are settled.')) + '</p><div class="stack stack-2" style="margin-top:.5rem">' +
              '<input class="input" id="pv-doc" maxlength="64" placeholder="' + esc(tx('doctor_id', 'Doctor ID')) + '" aria-label="' + esc(tx('doctor_id', 'Doctor ID')) + '">' +
              '<textarea class="textarea" id="pv-terms" maxlength="1000" placeholder="' + esc(tx('terms', 'Agreed terms')) + '" aria-label="' + esc(tx('terms', 'Agreed terms')) + '"></textarea>' +
              '<button class="btn" data-act="provider">' + esc(tx('save', 'Save')) + '</button></div></article></div>' : '') +
          '<article class="card" style="margin-top:1rem;overflow-x:auto"><h2 class="card-title">' + esc(tx('ledger', 'Ledger')) + '</h2>' +
            (rows.length ? '<table class="table" style="width:100%;border-collapse:collapse;margin-top:.5rem"><thead><tr>' +
              ['Date', 'Kind', 'Amount', 'Reference / note'].map(function (h) { return '<th style="text-align:left;padding:.4rem">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
              rows.map(function (e) {
                return '<tr style="border-top:1px solid var(--line)"><td style="padding:.4rem">' + esc(when(e.created_at)) + '</td><td style="padding:.4rem">' + esc(S.titleCase(e.kind.replace(/_/g, ' '))) + (e.demo ? ' <span class="chip chip-amber">Demo</span>' : '') + '</td>' +
                  '<td style="padding:.4rem;white-space:nowrap">' + (e.direction === 'in' ? '+' : '−') + esc(S.rupees(e.amount_rupees)) + '</td><td style="padding:.4rem">' + esc([e.reference, e.note].filter(Boolean).join(' · ')) + '</td></tr>';
              }).join('') + '</tbody></table>' : '<p class="t-body">' + esc(tx('no_entries', 'No entries yet.')) + '</p>') + '</article>' +
        '</div>';
        S.mount(S.qs('#app'), html, {
          adjust: function () {
            API().adjust({ direction: val('adj-dir'), amount_rupees: intOrNull(val('adj-amt')), reference: val('adj-ref').trim(), reason: val('adj-why').trim() })
              .then(function (res) { S.toast(res.ok ? tx('recorded', 'Recorded') : res.error); if (res.ok) self.fund(); });
          },
          provider: function () {
            API().addProvider(val('pv-doc').trim(), val('pv-terms').trim()).then(function (res) { S.toast(res.ok ? tx('saved', 'Saved') : res.error); });
          }
        });
      });
    }
  };

  S.Charity = Charity;
  S.Staff = Staff;
})(window);
