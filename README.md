# SMIVAI — Care Closer to You

An elderly-first healthcare, cognitive-wellness and caregiver-support app:
conversation with **HUN** (SMIVAI's assistant), brain games, photo memories, reminders, simple progress, doctor
and pharmacy services, and an emergency path — with caregivers and doctors kept
close through one shared, permission-based record.

The web app is a **static folder**: no build step, no framework, works offline.
The FastAPI service in [`backend/`](backend/) is optional; turn it on and the
same app switches to signed tokens, server-enforced plan limits and a real
model-backed conversation.

Local development only — nothing here deploys anything.

```bash
python -m http.server 8123
```

That is the whole app at http://localhost:8123, running on its own.
Optionally, the API (from `backend/`; `SMIVAI_DEMO_OTP=1` is needed for sign-in
because no SMS provider is connected):

```bash
SMIVAI_DEMO_OTP=1 uvicorn app.main:app --reload --port 8000
```

Then point the app at it in the browser console:

```js
S.CONFIG.apiBase = 'http://localhost:8000';
```

Settings are listed in [`backend/.env.example`](backend/.env.example).

---

## Three ways in

| Role | Signs in with | Sees |
|---|---|---|
| **Patient** | Aadhaar or ABHA + one-time code | Home, Talk with HUN, Brain Games, Memories, Reminders, Progress, doctor / medicines / caregiver / records, Settings |
| **Caregiver** | Aadhaar + one-time code | The people they support: progress, reminders, memories, alerts & SOS, doctor guidance, language |
| **Doctor** | Medical registration number + one-time code | Patient list, activity insights, appointments, care reminders |
| **Donor** *(server only)* | Mobile number + one-time code | Donate to the Smivai Care Fund (Razorpay **test mode**, or Demo mode with no keys), own donation history, fund totals |
| **Smivai administrator / Charity partner** *(server only, created with `python -m app.manage create-staff`)* | Mobile number + one-time code | Review charity applications (both must approve), fund & ledger |

A caregiver or doctor can only reach a patient after the patient reads out their
**care code** (`SMV-XXXXXX`, shown under Caregiver Support). There is no patient
search, and no way to link without the code. The patient then chooses, per
person, what they see — **memories**, **health records** (orders, readings) and
**progress & activity** can each be withheld; reminders, appointments and SOS
are always shared (Caregiver Support → *What they can see*). The server enforces
the same choices. A pharmacy role does not exist yet. Charity assistance and
donations are described in [docs/CHARITY.md](docs/CHARITY.md).

Demo sign-in details are listed on the sign-in screen itself — tap **Use a demo
account**. Everyone in the demo is fictional.

---

## What is real, and what is a prototype

Real, and worth looking at closely:

- **Offline-first store and sync queue.** Every write lands on the device first;
  the queue drains in order when a connection returns. Flip the connectivity
  pill in the top bar to watch it.
- **Adaptive difficulty.** A Rasch (1PL) model per activity. The level moves
  one step at a time, only after a game of at least 4 answers: up when the
  next level is predicted at ≥50% success (about 8 of 10 right), down when
  the current one is predicted below 40% (3 of 10 or fewer) — so the served
  level sits where predicted success is roughly 40–73%. Ability θ is a MAP
  estimate over the last 12 games with its standard error, marked provisional
  under 20 answers. Every answer is logged (`item_responses`) so level
  difficulties can be calibrated (`/calibration`); until then they are fixed
  design values. A level chosen by hand never moves the automatic level, and
  "Always use this level" pauses adaptation for that game. Device and server
  agree, and `backend/tests/test_rasch.py` checks it by running both.
  *A progress-tracking aid, not a medical diagnosis.*
- **Plan enforcement.** Free / Premium limits are checked where the action
  happens — starting a premium game, linking a patient, asking the advanced AI —
  in `js/core/plans.js` and again in `backend/app/plans.py`.
- **Role separation.** Every patient-scoped read goes through a care link and the
  patient's sharing choices, on the device and in the API (`backend/app/deps.py`:
  404 for a patient you cannot reach, 403 for something not shared with you).
  Every pushed record is checked against the row as stored, so no account can
  write, move or delete another patient's data (`backend/app/main.py`).
- **Session tokens and sign-in limits.** HMAC-signed, expiring bearer tokens;
  only a salted hash of an identity number is stored; sign-in is rate-limited
  and an account can only be created after a correct code and agreeing to the
  privacy notice.
- **Your data.** "Export my data" gives only your own records; "Delete my
  account" erases them on the device and the server ([`docs/PRIVACY.md`](docs/PRIVACY.md)).
- **HUN.** The on-device companion answers from your own records; emergencies
  and medicine questions always get the fixed safe answer with an SOS / doctor
  button. With Premium and a server model key, HUN's advanced mode sends the
  model only a small server-built summary — never another person's data.
- **Languages.** 122+ interface strings resolve per patient, North-East first,
  with honest per-language capability badges (interface / voice / speech).

Demo mode — each one says so on screen, every time:

| Area | Status |
|---|---|
| Aadhaar / ABHA check | Format and checksum only. Not connected to UIDAI or ABDM — blocked on ABDM sandbox credentials ([`docs/IDENTITY.md`](docs/IDENTITY.md)). |
| Medical registration check | Format only. Not checked against the NMC or a state council. |
| One-time code | No SMS is sent. On the device the code is shown on screen; the API returns it only with `SMIVAI_DEMO_OTP=1`. Firebase phone OTP is blocked on a Firebase project. |
| Payment | No gateway. Nothing is charged; a demo transaction id is returned. |
| Medicine orders | Saved as **demo orders** only — a prescription photo is required, no pharmacy is contacted, no delivery time is shown ([`docs/MEDICINES.md`](docs/MEDICINES.md)). |
| Doctor directory | Fictional doctors. A booking is a **request**; only a linked doctor in SMIVAI can confirm it, and a directory doctor never will. Doctors are sorted by your language and distance from your town. |
| Location | Browser location matched to the nearest known town (only the town name is kept), or a town you choose. No maps provider. |
| Helplines & charities | Official contacts only (Elderline 14567, HelpAge India, ARDSI). SMIVAI takes no donations. |
| Emergency | SMIVAI alerts linked caregivers in the app and hands 112 to the phone's dialer. It does not contact emergency services itself. |
| Reminders | Shown while SMIVAI is open on the device; there is no push service yet, and the screen says so. |
| Advanced AI | Only with Premium, a server, `anthropic` installed and `ANTHROPIC_API_KEY`. Not yet tested against the live API. |
| Local encryption | Not implemented in this web version. |

SMIVAI describes **activity and performance**. It does not diagnose, and no
screen implies that it does.

---

## Design system

One set of tokens in [`css/theme.css`](css/theme.css) drives everything:

- **Canvas** warm off-white `#F8F7F2`; surfaces white and `#FFFDF9`.
- **Primary** calm blue `#5B82C4`; **text** navy `#202A44`.
- **Pastels by meaning** — blue for AI, communication and doctors; green for
  wellness and progress; peach for reminders and friendly actions; lavender for
  brain games and Premium; cream for memories. Emergency red `#E63946` appears
  **only** in SOS and critical alerts.
- **Type** Manrope, sized in `rem` so the Font Size setting scales the entire
  interface (Standard → Largest) from one root value.
- **Soft 3D** comes from one light model: a top-left key light, a thin highlight
  edge, and a soft ambient shadow. Illustrations are hand-drawn SVG
  ([`js/ui/art.js`](js/ui/art.js)) so they ship with the app, stay sharp and cost
  a few KB; icons are one rounded 24px line family
  ([`js/ui/icons.js`](js/ui/icons.js)) and always pair with a word.

Accessibility is part of the system, not a pass at the end: ≥60px primary touch
targets in patient mode, 4.5:1 minimum text contrast, focus rings everywhere,
`prefers-reduced-motion` honoured plus an explicit toggle, high-contrast mode,
and icon + label on every important control.

---

## Layout

```
index.html              the whole shell: sidebar · top bar · main · bottom nav
css/
  theme.css             design tokens, base layer, font scaling
  components.css        shell, buttons, cards, forms, modals, toasts
  patient.css           patient screens, welcome and sign-in
  dashboard.css         caregiver and doctor dashboards
  games.css             brain-game surfaces
  language.css          language picker and capability badges
js/core/
  db.js                 offline-first device store (localStorage / memory)
  media.js              photos in IndexedDB, resized on device
  models.js             domain constants, record factories, access scope
  auth.js  plans.js     sign-in, sessions, Free/Premium, care links and what each person may see
  privacy.js            privacy notice, export your own data, delete your account
  location.js           nearest town, from the browser or chosen by hand
  services.js           every external integration, each labelled
  companion.js          the on-device conversation engine (HUN)
  wakeword.js           hands-free "Hey HUN" on the Talk screen (opt-in)
  adaptive.js scoring.js  ability model and activity scores
  reminders.js sync.js  reminder rules and the offline queue
  i18n.js langservice.js  languages, Bhashini/AI4Bharat client
  wellness.js           daily fact, skills, tips, doctor directory
  seed.js seed_v2.js    the fictional demo world
js/ui/                  icons, illustrations, shell, charts, game shell, premium
js/screens/             welcome, sign-in, patient, talk, memories, care,
                        settings, caregiver, doctor, language console
js/games/               8 brain games
backend/                FastAPI + SQLAlchemy service (optional) — see docs/BACKEND.md
tests/frontend/         Node tests for device logic (no packages)
docs/DEMO.md            a five-minute walkthrough
docs/IDENTITY.md        sign-in, roles, Firebase and ABDM: what is real and what is blocked
docs/MEDICINES.md       why medicine ordering is demo-only, and what a real one needs
docs/PRIVACY.md         data-protection assessment (DPDP Act) — not legal advice
```

See [`docs/DEMO.md`](docs/DEMO.md) for the guided tour and
[`docs/BACKEND.md`](docs/BACKEND.md) for the API.

## Tests

```bash
pip install -r backend/requirements-dev.txt
python -m pytest backend/tests -q
```

The backend suite runs against a throwaway SQLite file, never `backend/smivai_local.db`.
Some backend tests also run `js/core/adaptive.js` under Node to check that the
device and the server agree.

Frontend logic tests use Node's built-in runner (no packages):

```bash
node --test "tests/frontend/**/*.test.js"
```

## HUN's voice

* **Push-to-talk** — the microphone button on *Talk with HUN*; **DONE** stops
  everything and releases the microphone.
* **Hands-free "Hey HUN"** — opt-in, on the Talk screen only. Say "Hey HUN"
  (or "Hi / OK HUN", "हे हुन") and what follows is the message. It uses the
  browser's own speech recogniser (Chrome / Edge send audio to their speech
  service), so it works only where that recogniser supports the language
  (English, Hindi, Bengali, Nepali on this device) and the option is hidden
  elsewhere. It pauses while HUN speaks, stops on DONE or when leaving the
  screen, and **does not run in the background**. A bare "hun" never wakes
  it — "hun" is everyday Hindi ("main theek hun").
* **Hear again / Stop voice** — large buttons for HUN's last spoken answer.
* Typing always works, and HUN answers in text when no voice is available
  for the language.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Changes do not show in the browser | Assets are versioned (`?v=` in `index.html`); a hard reload (Ctrl+Shift+R) clears an old copy. |
| Sign-in through the API says "No SMS provider is connected" | Start the API with `SMIVAI_DEMO_OTP=1`. |
| Everyone is signed out after restarting the API | Set `SMIVAI_AUTH_SECRET`; otherwise each start uses a new random secret. |
| Browser blocks calls to the API (CORS) | Serve the app from `http://localhost:8123` or add your origin to `SMIVAI_CORS_ORIGINS`. |
| "This account lives on this device only" | A demo account made without the API cannot sync to it; sign up again with the API on. |
| HUN says advanced AI is not connected | Needs Premium, the API, `pip install anthropic` and `ANTHROPIC_API_KEY`. |
| "Hey HUN" option missing | The browser has no speech recogniser for the patient's language (Chrome/Edge support English, Hindi, Bengali, Nepali here). |
| A `backend/backups/` folder appeared | The API backed up the SQLite file before a schema migration. It holds personal data — keep it private, delete it when not needed. |
| Demo data looks wrong | Welcome screen → **Reset demo data**. |

## Known limitations

* With the API on, the device sends its changes and receives only profiles and
  care links — a caregiver on a different device sees a patient's name but not
  yet their reminders, memories or progress (no full download from the server).
* Several people on one device share one browser store; there is no
  encryption at rest on the device or in the SQLite file.
* Rate limits and sign-in challenges are kept in the API's memory (one process).
* Non-English text is machine-drafted and awaits native-speaker review.
* Charity assistance and donations run in Demo / Razorpay test mode only — no
  charity partner, merchant account or legal arrangement exists yet (docs/CHARITY.md).
* The fund lock covers one API process; several workers need a database row lock.
* Two open tabs of the app on one browser can overwrite each other's local store.
