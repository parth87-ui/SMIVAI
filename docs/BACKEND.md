# SMIVAI — backend service

FastAPI + SQLAlchemy + PostgreSQL. **Optional** — the web app is fully
functional without it, using its offline-first device store and a local
"central store" mirror. With it, sign-in produces a signed token, plan limits
are enforced server-side, and Premium conversations can reach a real model.

## Run

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

To test sign-in locally, the API needs `SMIVAI_DEMO_OTP=1` (no SMS provider is
connected; see [Sign-in](#sign-in)). In Git Bash:

```bash
SMIVAI_DEMO_OTP=1 uvicorn app.main:app --reload --port 8000
```

See [`.env.example`](../backend/.env.example) for every setting. The SQLite fallback file is
always `backend/smivai_local.db`, whichever directory you start from.

## Tests

```bash
pip install -r requirements-dev.txt
python -m pytest tests -q
```

The suite uses a temporary database and never touches `smivai_local.db`.

Interactive docs: http://localhost:8000/docs

### Database

```bash
export SMIVAI_DATABASE_URL="postgresql+psycopg://smivai:smivai@localhost:5432/smivai"
```

If PostgreSQL is unreachable the service falls back to a local SQLite file
(`smivai_local.db`) so the API still runs. Tables are created on startup;
[`../backend/schema.sql`](../backend/schema.sql) is the canonical PostgreSQL DDL, including
the indexes and constraints SQLAlchemy's `create_all` does not fully express.

### Environment

| Variable | Purpose |
|---|---|
| `SMIVAI_DATABASE_URL` | PostgreSQL URL; SQLite fallback otherwise |
| `SMIVAI_AUTH_SECRET` | HMAC secret for session tokens. **Set this in any real deployment** — a random per-process secret is used otherwise, so tokens die on restart |
| `SMIVAI_ID_SALT` | Salt for identity hashes; must match across instances |
| `ANTHROPIC_API_KEY` | Enables `POST /ai/chat`. Never reaches the device |
| `SMIVAI_AI_MODEL` | Model id, default `claude-opus-5-5` |
| `SMIVAI_AI_TIMEOUT` | Seconds per model call attempt, default 30 (2 SDK retries) |
| `SMIVAI_DEMO_OTP=1` | Return the one-time code in `/auth/start` (labelled demo). Without it sign-in answers 503, because no SMS is sent |
| `SMIVAI_CORS_ORIGINS` | Browser origins allowed to call the API; default `http://localhost:8123,http://127.0.0.1:8123` |
| `SMIVAI_ALLOW_HEADER_AUTH=1` | Accept the old `X-SMIVAI-Role`/`X-SMIVAI-Actor` header pair for local development. Off by default |
| `BHASHINI_*` | ULCA credentials for the language proxy (see `app/language.py`) |

## Point the web app at it

In the browser console:

```js
S.CONFIG.apiBase = 'http://localhost:8000';
```

Sign-in then runs through this service (`/auth/start` → `/auth/verify`), the
sync queue posts with `Authorization: Bearer …`, and the caregiver **Device &
sync** panel reports `fastapi` instead of `local-cloud-mirror`.

## Sign-in

```
POST /auth/start    {role, id_type, id_number}  → {challenge_id, mobile_tail, demo_code, …}
POST /auth/resend   {challenge_id}              → {challenge_id, demo_code, …}   (20 s cooldown)
POST /auth/verify   {challenge_id, code}        → {token, expires_at, account} | {needs_profile, ticket}
POST /auth/profile  {ticket, name, …}           → {token, expires_at, account}
GET  /auth/me                                   → the signed-in account
```

The token is real: HMAC-SHA256 signed, expiring (30 days patient, 24 h
caregiver, 12 h doctor), verified on every request. The identity check and the
one-time code are **demo mode** and say so in their own responses
(`identity_check`, `otp_delivery`): no UIDAI, ABDM, NMC or SMS connection
exists. Codes come from `secrets`, and `demo_code` is returned only with
`SMIVAI_DEMO_OTP=1`. No identity number is stored — only a salted SHA-256 hash
and the last four digits.

Every step is rate limited (in-process memory; `429` + `Retry-After`), three
wrong codes end a challenge, and `/auth/profile` accepts only a ticket issued
after a correct code. Details, and what Firebase or ABDM would need, are in
[`../docs/IDENTITY.md`](IDENTITY.md).

The `/language/translate`, `/tts` and `/asr` proxies require a signed-in
account (60 requests a minute per account, across the three), accept at most 2,000 characters of text or
about 2 MB of audio, and answer 503 when no Bhashini/AI4Bharat credentials are
configured. `/language/status` stays public.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/sync/push` | Drain a device queue, in queued order; `results` says, per record, whether it was saved (see *Sync rules*) |
| `GET` | `/patients` | Patients visible to the caller |
| `GET` | `/patients/{id}` | One patient |
| `GET` | `/patients/{id}/sessions` | Activity history · scope `activity` |
| `POST` | `/patients/{id}/sessions` | Record an activity — **402** if the plan excludes that game · scope `activity` |
| `GET` | `/patients/{id}/games` | Which games this patient's plan includes |
| `GET` | `/patients/{id}/insights` | Activity + performance summary · scope `activity` |
| `GET` | `/patients/{id}/scores` | Daily Cognitive Activity Score · scope `activity` |
| `GET` | `/patients/{id}/ability` | Rasch θ ± error per activity · scope `activity` |
| `GET`/`POST` | `/patients/{id}/reminders` | Reminder rules (create: caregiver or doctor; **409** for a duplicate) |
| `PATCH`/`DELETE` | `/reminders/{id}` | Manage (PATCH accepts only editable fields) |
| `GET` | `/patients/{id}/memories` | Memory Bank · scope `memories` |
| `GET` | `/patients/{id}/notes` | Care notes |
| `GET` | `/patients/{id}/appointments` | Bookings |
| `GET` | `/patients/{id}/vitals` | Self-reported readings · scope `health` |
| `GET`/`POST` | `/patients/{id}/alerts` | SOS and critical alerts |
| `GET` | `/notifications` | The caller's own notifications |
| `GET`/`POST`/`DELETE` | `/links` | Care relationships, created from a care code; `GET` includes each link's `scopes` |
| `PATCH` | `/links/{id}/scopes` | The patient chooses what one care-team member sees (`memories`, `health`, `activity`) |
| `GET` | `/calibration` | Doctors only — aggregate level difficulties from answers |
| `GET` | `/me/profile` | Your own profile (incl. care code for a patient), so a new device has it |
| `GET` | `/me/export` | A copy of your own records — never an identity hash |
| `GET` | `/me/consents` | What you agreed to, and when |
| `POST` | `/me/erase` | Delete your account and records — body `{"confirm": "DELETE"}` |
| `POST` | `/auth/start` · `/auth/resend` · `/auth/verify` · `/auth/profile` | Sign-in (see above); `/auth/profile` needs `consent: true` |
| `POST` | `/language/translate` · `/tts` · `/asr` | Bhashini proxy — signed-in callers only |
| `GET` | `/plan` · `POST /plan/upgrade` | Plan summary and the demo upgrade |
| `POST` | `/ai/chat` · `GET /ai/status` | HUN's Premium conversation — the patient only (see below) |
| `GET` | `/health` | Liveness, active database, whether advanced AI is configured |
| `GET` | `/charity/policy` | Income limit, approval rule, benefit, accepted documents, demo flag |
| `POST`/`GET` | `/charity/applications` | Apply (patient or linked caregiver with `health`) · list (own, or all non-drafts for reviewers) |
| `GET`/`PATCH` | `/charity/applications/{id}` | One application · edit while `draft`/`info_requested` |
| `POST` | `/charity/applications/{id}/documents` · `/submit` | Upload a PDF/JPG/PNG (≤ 5 MB) · submit (income below the limit, declaration, consent, ≥ 1 document) |
| `GET`/`DELETE` | `/charity/documents/{id}` | Applicant and reviewers only, `no-store` |
| `POST` | `/charity/applications/{id}/review` · `/activate` | Reviewers: `start_review`, `request_info`, `approve`, `reject` · admin activates after both approvals |
| `GET`/`POST` | `/charity/applications/{id}/claims` · `POST /charity/claims/{id}/reverse` | Cover a completed visit (≤ 5, once each, funds permitting) · reverse |
| `GET` | `/charity/fund` · `/charity/ledger` | Totals (reviewers, donors) · the add-only ledger (reviewers) |
| `POST` | `/charity/ledger/adjustments` · `/charity/providers` | Admin: correction with reason + unique reference · participating doctor |
| `GET` | `/donations/config` · `/donations` · `/donations/impact` | Donor: mode (demo / test / live blocked), own donations, fund totals |
| `POST` | `/donations` · `/donations/{id}/verify` · `/donations/{id}/cancel` | Server-created Razorpay test order · signature + server-to-server check · cancel |
| `POST` | `/payments/razorpay/webhook` | Signed webhook (`X-Razorpay-Signature`), deduplicated by `x-razorpay-event-id` |

## Access control

Every patient-scoped route passes through `authorize_patient`
([`app/deps.py`](../backend/app/deps.py)), which allows a patient only their own record and
a caregiver or doctor only a patient they hold an **active care link** to. Links
are created from `POST /links` with the patient's own care code — there is no
search, and no other way in. An unauthorised request returns **404, not 403**,
so the API never confirms that a patient id exists.

**What each person sees.** A care link also carries the patient's choices
(`scopes`): `memories`, `health` (orders, readings) and `activity` (games,
scores, progress, mood). Reads and writes of those kinds of record need the
scope (`authorize_scope` and `shares` in `app/deps.py`); a reachable patient
whose record is not shared answers **403**. Reminders, appointments, alerts
and care notes are always shared. Links made before scopes existed share
everything until the patient narrows them.

### Sync rules

`POST /sync/push` applies the same rule per record, judged on the row **as it is
stored**, not only on the pushed payload: a row cannot reach into another
patient's record, move to a different patient, or delete someone else's data.
Care links cannot be pushed (only `POST /links` creates them), profiles cannot
be deleted, and `plan`, `share_code` and licence fields are ignored if pushed.
Each record is committed on its own, and the response's `results` list lines up
with the request by position, so the device keeps exactly the rows that were
refused instead of discarding the whole batch. Further rules:

* **appointments** — only the appointment's own doctor can set `confirmed`; one
  open booking per doctor and time.
* **orders** — a new order needs a prescription reference; a device may set
  only `demo` or `cancelled`, never a status only a pharmacy could report.
* **reminders** — an identical active reminder is refused as a duplicate.
* **links** — never created through sync; the patient may change `scopes` or
  end a link (`status: removed`) from their device.
* A care-team member needs the matching scope to write memories, health
  records or activity.

## Database migrations

`create_all` makes new tables; changes to existing tables go through
[`app/migrations.py`](../backend/app/migrations.py) — additive only, recorded in
`schema_migrations`, applied at start-up, and **a SQLite file is copied to
`backend/backups/` first** (that copy contains personal data). Current
migrations: v1 `care_links.scopes`, v2 `patients.level_lock`.

```bash
python -m app.migrations
```

That lists applied and pending migrations (run it from `backend/`). Rollback:
restore the backup, or drop the added column and delete the version row;
migrations never remove data.

## Privacy

`app/privacy.py` implements export, consents and erasure; security headers
are set on every response. The assessment against the DPDP Act and Rules —
and the gaps still open — is in [`../docs/PRIVACY.md`](PRIVACY.md).

## Plans

[`app/plans.py`](../backend/app/plans.py) is a deliberate mirror of
[`../js/core/plans.js`](../js/core/plans.js): the same four free games, the same
2 / 6 caregiver limits, the same 2 / 6 patients for a caregiver and 100 / 500
for a doctor, the same demo prices. The device enforces them so the interface
stays honest offline; the service enforces them so a hand-made request cannot
walk past them. **If you change one, change both.**

`POST /plan/upgrade` flips the plan and returns
`"payment": "Demo payment — no money was charged"`. There is no gateway.

## Advanced AI

`POST /ai/chat` is HUN's Premium conversation (HUN is the assistant; SMIVAI is the app). It calls Claude through the
official Anthropic SDK with the key held here, never in the browser, and gives
the device a distinct status for each way it can be unavailable:

* `402` — the patient is not on Premium
* `503` — no `ANTHROPIC_API_KEY` on this server (or the `anthropic` package is not installed)
* `502` — the model could not be reached, declined, or returned no text
* `429` — more than 20 messages a minute for one patient

In every case the device falls back to the on-device companion
([`../js/core/companion.js`](../js/core/companion.js)) and tells the patient
which one answered. The system prompt forbids diagnosis, medicine advice and
invented facts, and routes emergencies to SOS / 112.

**What the model sees.** The device sends only the message, recent turns, and
hints (`reply_language`, `local_date`, `local_time`, `focus_memory_id`). The
server builds the rest from the authorised patient's own records
(`build_context` in `app/ai.py`): first name, up to 6 active reminders, the next
2 appointments, up to 6 family names, up to 8 memory titles, today's game count,
and — only when the person is talking about one memory — that memory's note.
No age, no identity numbers, no other memory notes, and never another
patient's data. Older devices that still send a full context have it ignored.

**Safety on the device.** Messages that look like an emergency or a medicine
question are answered by the fixed on-device rules even with Advanced AI on,
so the SOS / doctor button never depends on a model or a network.

**Request.** `claude-opus-5-5` through `client.beta.messages.create` with
effort `low` (a short chat turn), `max_tokens` 4000 (Opus 5.5 always thinks and
thinking counts against the cap; the reply itself stays short by prompt),
30 s timeout and 2 SDK retries. `fallbacks="default"` with beta
`server-side-fallback-2026-07-01` lets the API retry a safety-classifier
decline on Anthropic's recommended model inside the same call; `stop_reason`
is checked before any text is read, and only `text` blocks reach the person.
The `provider` field names the model that actually answered.

Not yet verified against the live API: this machine has no `anthropic`
package or key, so the request shape is checked with a fake client
(`tests/test_hun_chat.py`), not with a real call.

## Scoring parity

[`app/scoring.py`](../backend/app/scoring.py) is a deliberate mirror of
[`../js/core/scoring.js`](../js/core/scoring.js) and
[`../js/core/adaptive.js`](../js/core/adaptive.js) — same weights, same Rasch
constants, same level rule (up when the next level is predicted ≥50%, down
when the current one is below 40%, never on fewer than 4 answers) and the same
MAP ability estimate (prior mean −1, sd 1.5, last 12 games). A figure computed
on the device and the same figure computed on the server agree;
`tests/test_rasch.py` runs both and compares. If you change one, change both.

| Endpoint | Purpose |
|---|---|
| `GET /patients/{id}/ability` | θ ± standard error per activity, `provisional` under 20 answers |
| `GET /calibration` | Doctors only. Level difficulties estimated from everyone's `item_responses` (aggregate; no personal data). A level is `calibrated` only with ≥30 answers from ≥5 people; the scale is anchored to the design values' mean. Devices do not use these values yet |

## Layout

```
app/
  main.py       routes: sync, patients, links, plans, records
  auth.py       sign-in, OTP (mock), HMAC session tokens
  plans.py      Free / Premium limits — mirrors js/core/plans.js
  ai.py         Premium conversation via the Anthropic SDK
  language.py   Bhashini / AI4Bharat proxy (keeps ULCA credentials off devices)
  database.py   engine + session, PostgreSQL with SQLite fallback
  models.py     SQLAlchemy models + client→column mapping
  schemas.py    pydantic request/response models
  deps.py       token auth and care-link scoping
  scoring.py    server-side score + Rasch helpers
schema.sql      canonical PostgreSQL DDL
```
