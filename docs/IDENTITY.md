# SMIVAI — identity, sign-in and roles: what is real

Status as of Phase 2. Nothing below is connected to UIDAI, ABDM, the NMC, an
SMS gateway or Firebase. Every screen and API response that touches those
says **Demo mode**.

## Sign-in today

| Step | Device mode (default, no backend) | Server mode (`S.CONFIG.apiBase` set) |
|---|---|---|
| Aadhaar / ABHA / licence | Format + Verhoeff checksum only | Same check, in `backend/app/auth.py` |
| One-time code | Generated on the device and shown on screen | Generated with `secrets`; returned **only** when the API runs with `SMIVAI_DEMO_OTP=1`, otherwise `/auth/start` answers 503 |
| Session | Random device token | HMAC-SHA256 signed, expiring token (30 d patient, 24 h caregiver, 12 h doctor) |
| What is stored | Salted hash of the ID + last 4 digits | Same. The full Aadhaar/ABHA number is never stored |

Server-side protections (verified by `backend/tests/test_auth_hardening.py`):

* rate limits: 20 code requests per address and 5 per identity per 10 minutes;
  30 code checks and 10 profile creations per address per 10 minutes;
  `429` with `Retry-After`
* 3 wrong codes end a challenge; codes expire after 5 minutes
* `/auth/resend` replaces the code (old one stops working), 20-second cooldown
* an account can only be created with a ticket issued **after** a correct code
* the rate limiter is in-process memory — fine for one local server, not for
  several workers (a shared store such as Redis would be needed)

## Roles

Implemented and enforced on the backend: **patient, caregiver, doctor**.
A caregiver or doctor reaches a patient only through an active care link
created from the patient's own care code (`backend/app/deps.py`).

**Not implemented: pharmacy and administrator.** Adding them needs product
decisions first — what a pharmacy may see (orders only? prescriptions?), who
appoints an administrator, and what an administrator may read under the DPDP
Act. They are listed for Phase 6 (pharmacy) and Phase 8 (admin/privacy).

## Firebase phone OTP — blocked (needs a Firebase project)

There is no Firebase code in this repository. To add real SMS codes:

1. Create a Firebase project, enable Phone sign-in, add `localhost` as an
   authorised domain, and download a service-account key (keep it out of the
   repo; point `GOOGLE_APPLICATION_CREDENTIALS` at it).
2. Client: Firebase JS SDK phone sign-in (reCAPTCHA is part of that flow).
3. Server: `pip install firebase-admin`, then verify the ID token the client
   sends with `firebase_admin.auth.verify_id_token(token, check_revoked=True)`,
   handling `InvalidIdTokenError`, `ExpiredIdTokenError`, `RevokedIdTokenError`
   and `UserDisabledError` — never trusting a user id sent by the client.
   (Firebase docs: <https://firebase.google.com/docs/auth/admin/verify-id-tokens>)
4. Map the verified phone number to the SMIVAI account; issue the SMIVAI
   session token as today.

Requires from you: the Firebase project, its web config, and a service-account
key. Phone auth may incur SMS charges on Firebase's billing plans.

## ABHA / ABDM — blocked (needs NHA sandbox credentials)

Today SMIVAI only checks that an ABHA number has 14 digits. Real ABHA
creation, verification and linking go through ABDM's **Milestone 1 (M1)** APIs,
which require:

1. Registering as an integrator on the ABDM sandbox and receiving a
   client id / secret (<https://sandbox.abdm.gov.in>; M1 docs are referenced from
   the ABDM developer forum: <https://devforum.abdm.gov.in>).
2. Implementing the M1 flows from the current sandbox documentation (ABHA
   creation/verification with OTP). Endpoint names change between API
   versions, so they must be read from the live docs, not guessed.
3. Passing NHA's sandbox-exit review before any production key is issued.
   Third-party guides disagree on whether M1 alone is enough, so confirm the
   criteria with NHA.

Rules SMIVAI will keep regardless:

* no direct UIDAI access; Aadhaar-based flows only through ABDM's APIs
* never store a full Aadhaar number; store the ABHA number/address only with
  consent, and keep the last-4 display
* label sandbox results as sandbox; never present them as production ABHA

Requires from you: ABDM sandbox registration and credentials.

## Donor and staff accounts (server only)

Donors, Smivai administrators and charity partners sign in with a **10-digit
Indian mobile number** and a one-time code (`id_type: "mobile"`). As with the
other identifiers, only a salted hash and the last four digits are stored. No
SMS provider is connected: in local development (`SMIVAI_DEMO_OTP=1`) the code
is shown on screen, labelled Demo mode. Administrator and charity-partner
accounts cannot be created by sign-up; `python -m app.manage create-staff` makes
them (see docs/CHARITY.md). These roles have no device-only mode.
