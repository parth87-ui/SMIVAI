# SMIVAI — privacy and data protection assessment

**Status:** an engineering assessment, October 2026. It is **not legal advice
and not a statement of compliance**. Before real patients use SMIVAI, a
lawyer familiar with the Digital Personal Data Protection Act, 2023 (DPDP
Act), the DPDP Rules, 2025 and Indian health-record rules must review it.

## The law, as far as could be verified

- **DPDP Act, 2023** — the framework (consent, notice, purpose limitation,
  data principal rights, security, breach notification, penalties).
- **DPDP Rules, 2025** — notified 13 November 2025 (Gazette 14 November 2025),
  in stages: Data Protection Board provisions immediately; consent-manager
  provisions (Rule 4) about one year later — *sources disagree whether a
  fixed date applies*; the core duties (notice, security safeguards, breach
  intimation, data principal rights — Rules 3, 5–16, 22–23) **18 months
  after publication, around 13–14 May 2027**.
  Sources: JSA Law ([summary](https://www.jsalaw.com/wp-content/uploads/2025/11/JSA-Prism-InfoTech-November-2025-DPDP-Rules.Final_.pdf)),
  DSK Legal ([update](https://dsklegal.com/?p=26455)),
  SCC Online ([highlights](https://www.scconline.com/blog/post/2025/12/26/digital-personal-data-protection-rules-2025-key-highlights/)).
  Confirm dates in the Gazette / MeitY notifications.
- Health information is sensitive in practice even though the DPDP Act has
  no separate "sensitive data" class; ABDM has its own health-data rules if
  SMIVAI ever joins ABDM (see `docs/IDENTITY.md`).

## What SMIVAI does now — mapped to the obligations

| Obligation | What exists (file) | Status |
|---|---|---|
| **Notice** in clear language | Privacy notice shown at sign-up (`js/core/privacy.js · NOTICE`), versioned `2026-10-09` | Draft — needs legal review and translation by native speakers |
| **Consent**, specific and recorded | Required tick-box before an account is created, on device and server; server stores a `consents` row (purpose, notice version, time) — `backend/app/auth.py`, `GET /me/consents` | Implemented. Withdrawal = delete the account or narrow sharing; a separate "withdraw consent" control is not built |
| **Purpose limitation / minimisation** | Only last 4 ID digits + salted hash; HUN's AI receives only a server-built minimal context (`backend/app/ai.py · build_context`); location kept as a town name only (`js/core/location.js`); prescriptions stay on the device | Implemented |
| **Right of access** | "Export my data" — only the signed-in person's records, no identity hash (`js/core/privacy.js`); server `GET /me/export` | Implemented. Before Phase 8 the export dumped the whole device database, including other people's records — fixed |
| **Right to erasure** | "Delete my account" in Settings; server `POST /me/erase` deletes every patient-keyed row in one transaction (tables discovered from the models, so new tables are covered) | Implemented. Whether some records must be retained by law (medical-record duties) is a **legal question still open** |
| **Correction** | Profile, reminders, memories editable by the patient | Partly — identity fields are not editable |
| **Sharing with others** | Care team only via the patient's care code; per-person scopes (memories / health / activity) chosen by the patient, enforced on the server (`backend/app/deps.py · shares`) and device | Implemented (Phase 7) |
| **Caregiver consent on behalf of a patient** | Not assumed: a caregiver cannot create links, change scopes or consent for the patient | By design. Lawful representation (guardianship for a person without capacity) is **not modelled** — legal input needed |
| **Security safeguards** | Signed expiring tokens; rate limits; role + ownership checks on every write; CORS limited to localhost; security headers; no secrets in code; no PII in logs | Partly — see gaps |
| **Breach notification** | No process | **Gap** |
| **Retention** | Data kept until the person deletes it | **Gap** — no retention period defined |
| **Children's data** | Sign-up requires age 18–120 | Adequate for the audience |

## Known gaps (to close before any real use)

1. **No encryption at rest** on the device (localStorage, IndexedDB) or for
   the SQLite file. A production database needs encryption and access logs.
2. **No breach-response procedure** or contact for the Data Protection Board.
3. **No retention schedule**; backups made by migrations (`backend/backups/`)
   also hold personal data and must be deleted when no longer needed.
4. **Data Protection Officer / grievance contact** not named (required for
   Significant Data Fiduciaries; a grievance channel is expected generally).
5. **Cross-border transfer:** HUN's advanced mode sends a minimal context to
   Anthropic (outside India). Check the Rules' cross-border provisions and any
   government restrictions, and say so in the notice (it does).
6. **Rate limits and challenges are in memory** — fine locally, not across servers.
7. **Translations of the notice** are machine-drafted, like the rest of the
   non-English text.

## Where to look in the code

`backend/app/privacy.py` (export, erase, consents) · `backend/app/deps.py`
(who may see what) · `backend/app/main.py` (sync write rules) ·
`backend/app/migrations.py` (schema changes, backups) · `js/core/privacy.js`
(device export, erase, notice) · tests: `backend/tests/test_privacy.py`,
`test_care_team.py`, `test_sync_security.py`.
