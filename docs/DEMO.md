# SMIVAI — five-minute demo script

Start at **http://localhost:8123**. If earlier poking has changed anything,
press **Reset demo data** at the bottom of the welcome screen first.

The single point to land: **it is one system, not three apps.** Everything the
patient does appears for the caregiver and the doctor, because all three read
the same records, keyed by `patient_id` and gated by a care link the patient
created.

Everyone in the demo is fictional, and every prototype integration says so on
screen.

---

## 0 · Welcome (20 seconds)

> "SMIVAI — Care Closer to You. Healthcare that feels human, simple and caring."

Three ways in: Patient, Caregiver, Doctor. Point at the prototype note in the
footer and say it out loud once:

> "Identity checks, one-time codes, payments and emergency alerts here are
> demonstrations. Nothing is connected to UIDAI, ABDM, the NMC, an SMS gateway
> or emergency services — and the app says so at every step."

---

## 1 · Signing in (40 seconds)

**I am a Patient → Use a demo account → Ramesh Das.**

- The Aadhaar field checks length, prefix and the real Verhoeff checksum — type
  a wrong digit and it refuses before any "network" call.
- **Send me a code** → the OTP screen shows the code in a striped demo banner:
  *no SMS is sent in this prototype*.
- Enter it. Six digits submit by themselves.

> "The token behind this is real — signed and expiring. What is a prototype is
> the identity check and the SMS, and both label themselves."

---

## 2 · Patient home (90 seconds)

**Home.** Warm greeting in Ramesh's own language, the hero, four quick actions,
today's activities, the check-in, appointments, health summary, and a right-hand
rail with the date, weather, today's tip and the emergency panel.

Things worth pointing at:

- **Colour carries meaning** — blue for doctors and AI, green for wellness,
  peach for reminders, lavender for brain games. Red appears only in the
  emergency panel.
- **Today's Activities** is one card per thing to do, with the plan's next game
  ready to start.
- **How are you feeling today?** Tap **Worried** — HUN answers warmly, offers
  to talk or to call family, and quietly tells the linked caregiver. No
  clinical language anywhere.

**Settings → Font Size → Largest.** The whole interface grows, not just one
screen — one root value drives every size.

---

## 3 · Talk with HUN (60 seconds)

**Talk with HUN.** HUN is SMIVAI's assistant.

Type (or say) *"What is my next reminder?"* — the answer comes from Ramesh's own
records, not from a model's imagination.

> "The badge at the top says which engine answered: the on-device companion, or
> Advanced AI when the server has a model key. It never pretends."

If the device has a microphone and a supported language, tap the mic: the orb
breathes while listening, and **DONE** ends everything at once — microphone
released, recognition cancelled, audio stopped, late replies dropped. The screen
then says *Conversation ended*.

Ask *"I feel lonely"* to see the empathetic path, and *"should I take more of my
tablet?"* to see the refusal: HUN says that is for the doctor, and offers to
open the booking screen.

---

## 4 · Brain Games and Premium (60 seconds)

**Brain Games.** Four free games, four Premium ones, and two marked *coming
soon*.

Tap a locked game → *Available with SMIVAI Premium*. The lock is not cosmetic:
the URL `#/patient/game/word_hustle` bounces back with the same prompt, and the
API answers `402` to the same request.

**See Premium → Upgrade → Pay (demo).** Nothing is charged; a demo transaction
id comes back. All eight games unlock, and My Progress grows its deeper
insights section.

Play **Complete the Pattern**: instructions screen first, then the board, the
elapsed-time chip, gentle feedback, and a completion card with score, accuracy,
performance and time — plus *"We adjusted your next activity to your level"*
when the Rasch estimate actually moved.

---

## 5 · Memories (45 seconds)

**My Memories → Family Trip to Shillong.**

Photo, date, people, place, and the story. Then **Talk about this memory** —
SMIVAI opens a conversation about that day, and if Ramesh tells it something
new, it offers to add it to the memory.

**+ Add a Memory** takes a photo from the device (resized on the device, kept in
IndexedDB, never in the synced record), a title, the story, a date and the
people — and the caregiver sees it immediately.

---

## 6 · Care team, and the care code (45 seconds)

**Caregiver Support.** The care team, the family contacts, and the patient's own
**care code** — `SMV-XXXXXX`.

> "This is the only way into a patient's record. There is no patient search.
> A caregiver or doctor types the code the patient reads out to them, and the
> patient can remove that access at any time from Settings."

Tap **What they can see** next to Nabanita and untick **Memories** — her
Memories tab now says Ramesh has not shared them. Reminders and SOS stay
shared, because they are about safety.

Request **Companionship visit** for tomorrow — the request goes straight to the
care team.

**Book a Doctor** sorts doctors by your language and town, and a booking is a
*request* — "Waiting for confirmation" until a linked doctor confirms it.
**Order Medicines** needs a prescription photo and saves a *demo* order only —
no pharmacy is contacted and no delivery time is invented. **More → Helplines
& charities** lists Elderline 14567 and verified charity websites.

---

## 7 · Emergency (30 seconds)

**Emergency SOS** (sidebar, or the red card on the phone).

- **Call 112** hands the number to the phone's own dialer.
- **Alert my care team** raises an alert every linked caregiver sees at once.
- **I am safe now** closes it, and tells them that too.

> "SMIVAI does not call emergency services itself, and the screen says exactly
> that."

---

## 8 · Caregiver (60 seconds)

**Profile → Sign out → I am a Caregiver → demo account (Nabanita Sharma).**

- **Home** — needs attention first, and the SOS from a minute ago at the top.
- **Alerts & SOS** — respond to the alert; Ramesh is told. Accept the visit
  request; Ramesh is told that too.
- **Memories** — add one for Ramesh with a photo; it appears on his phone.
- **People I support** — *3 of 6 · Premium*. Switch patients: every panel
  re-reads for that person.
- **Add someone** asks for a care code. On a Free plan, the third person is
  refused with the reason and the upgrade path.

---

## 9 · Doctor (45 seconds)

**Sign out → I am a Doctor → ASMC-45821.**

Insights: performance trend, activity by cognitive domain, reminder adherence
tracked separately from the activity score, care notes, and the personalised
difficulty table with θ and expected success rate.

**Appointments** — confirm the booking the patient made; they are told
immediately. **Care reminders** — set from an existing care plan, with the form
stating plainly that SMIVAI does not prescribe medication.

> "Neutral wording throughout: *recent activity performance*, *change from
> recent average*. No diagnosis anywhere."

---

## 10 · Offline (30 seconds)

Click the **Online** pill in the top bar → it turns **Offline**.

- Mark a reminder done, or play a short game.
- The patient sees *"Offline — your progress is saved"*, not an error.
- The caregiver's **Device & sync** panel shows the pending count rising.

Click it again: *"Connection restored" → "Saving your data…" → "All data synced
· N records"*.

> "The queue, the ordering, the retry and the status are real. The transport is
> a local mirror by default, and the app says so. Point `S.CONFIG.apiBase` at
> the FastAPI service and the same queue posts to PostgreSQL with a signed
> token — nothing else changes."

---

## Questions you should expect

**"How is this AI?"**
Two things. A Rasch / Item-Response-Theory ability model per activity, updated
after every session. It moves up only after about 8 of 10 right and down after
3 of 10 or fewer, one step at a time, so the person is rarely served a level
where they would get half the answers wrong — discouraging for this user group.
It is a progress-tracking aid, not a medical diagnosis. And the companion,
which answers from the patient's own records on the device, with a real model
behind it for Premium when the server holds a key.

**"Does it diagnose anything?"**
No, and it is written so it cannot be read that way: activity vocabulary only,
a disclaimer on every screen, neutral alert wording, and readings recorded but
never interpreted.

**"Is the Aadhaar/ABHA check real?"**
The format and checksum are. The verification is not, and every screen that
touches it says so.

**"What stops a caregiver reading someone else's record?"**
A care link, created only from the patient's own code, checked on the device and
again in the API — which answers 404, not 403, so it never confirms that a
patient id exists.

**"What is not built?"**
Encryption of local data (intended for the mobile build), real Bhashini
credentials, native-speaker validation of the seeded translations, and real
payment, pharmacy, identity and emergency integrations. Each one is named here
and in the app rather than glossed over.
