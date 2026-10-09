# Charity assistance and donations

Status: **local development, demo / test mode only.** No real charity partner,
merchant account or legal arrangement exists yet, so no real assistance can be
approved and no real money can be taken. Every screen says so.

## Who does what

| Role | Signs in with | Can |
|---|---|---|
| Patient | Aadhaar/ABHA + code | Apply for themself, upload income documents, follow the status |
| Caregiver | Aadhaar + code | Apply for a linked patient who shares **health** records with them |
| Smivai administrator (`admin`) | Mobile number + code | Review, approve or reject, activate, cover visits, record ledger adjustments and participating doctors |
| Charity partner (`charity_partner`) | Mobile number + code | Review, approve or reject |
| Donor | Mobile number + code | Donate (Razorpay test mode), see their own donations and fund **totals** |

Administrator and charity-partner accounts cannot sign themselves up. They are
created on the server:

```bash
python -m app.manage create-staff --role admin --mobile 98XXXXXXXX --name "Name" 
python -m app.manage create-staff --role charity_partner --mobile 98XXXXXXXX --name "Name" --org "Charity"
python -m app.manage list-staff
```

(Run from `backend/`.) These roles exist only on the server; with no server
connected, their sign-in screens say so.

## Eligibility and benefit (enforced by `backend/app/charity.py`)

* Annual family income **strictly below ₹1,50,000** (`SMIVAI_CHARITY_INCOME_LIMIT_RUPEES`,
  default `150000`). Exactly ₹1,50,000 or more cannot be submitted. Being below the
  limit lets an application be reviewed; it is not an approval.
* At least one income document: income certificate, BPL card, Antyodaya (AAY)
  ration card, or another document the partner accepts. PDF/JPG/PNG, ≤ 5 MB,
  checked by content (magic bytes), stored under server-made names in
  `SMIVAI_UPLOAD_DIR` (default `backend/private_uploads/`, git-ignored), served
  only to the applicant and reviewers with `Cache-Control: no-store`.
  **No full Aadhaar number, no Aadhaar OTP, no Aadhaar card upload.**
* Declaration and consent are required.
* **Both** an administrator and a charity partner must approve; either may
  reject or ask for more information (which clears earlier approvals). Then an
  administrator activates.
* Benefit: the **full consultation fee for up to 5 completed visits** with a
  participating doctor, while the fund has money. Cancelled or unfinished visits
  never count; each appointment can be covered once; if the fund cannot cover
  the whole fee the claim is recorded as `awaiting_funds`, not covered.
* Statuses: `draft → submitted → under_review → (info_requested) → approved → active → completed`,
  or `rejected`. Every step is written to `charity_events`.

Donors never see applicants, documents or which visits were paid; `/charity/fund`
and `/donations/impact` return totals only.

## The ledger

`ledger_entries` is add-only. Kinds: `donation` (in), `consultation_payment` (out),
`reversal` (in), `refund` (out), `adjustment` (in/out, admin only, needs a reason
and a unique external reference). Every entry has a unique `idempotency_key`, so
the same donation, visit, refund or adjustment can never be counted twice. The
balance is always computed from the ledger on the server.

Concurrency: balance checks and the entries they allow run under one
process-wide lock (`FUND_LOCK`) plus the unique keys. **With several worker
processes this lock is not enough** — on PostgreSQL use a row lock
(`SELECT … FOR UPDATE` on a fund row) before running more than one worker.

## Donations — Razorpay test mode (`backend/app/donations.py`)

Checked against Razorpay's documentation in October 2026:
[Standard Checkout integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/),
[validating webhooks](https://razorpay.com/docs/webhooks/validate-test/),
[payment](https://razorpay.com/docs/webhooks/payloads/payments/) and
[refund](https://razorpay.com/docs/webhooks/payloads/refunds/) payloads.

1. The donor picks an amount (₹10 – ₹1,00,000). The **server** creates a Razorpay
   order (`POST /v1/orders`, Basic auth with the key id and secret, amount in paise).
2. The browser opens Razorpay Checkout with the order id and the public key id only.
3. Checkout returns `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`.
   The server recomputes `HMAC_SHA256(order_id_from_our_db + "|" + payment_id, key_secret)`
   and compares in constant time, then asks Razorpay for the payment and checks the
   order id, amount and `captured` status. Only then is a `donation` ledger entry written.
   `authorized` → `pending` (the webhook finishes it); `failed` → `failed`.
4. Webhook `POST /payments/razorpay/webhook`: `X-Razorpay-Signature` is checked as
   HMAC-SHA256 of the **raw** body with the webhook secret; `x-razorpay-event-id`
   is stored so a repeated event is ignored. Handles `payment.captured`,
   `payment.failed`, `refund.processed` (adds a `refund` out-entry once per refund id).

A browser success message is never treated as payment. Secrets never leave the
server. Test-mode ledger entries are marked `demo`.

| Environment | Meaning |
|---|---|
| none | **Demo mode** — the donor screen explains; nothing can be paid or recorded |
| `RAZORPAY_KEY_ID=rzp_test_…` + `RAZORPAY_KEY_SECRET` | Test mode (no real money) |
| `RAZORPAY_WEBHOOK_SECRET` | Enables the webhook endpoint |
| `RAZORPAY_KEY_ID=rzp_live_…` | **Refused** (`live_blocked`) until legal, merchant and operational approvals exist |

To receive webhooks locally Razorpay needs a public HTTPS URL (e.g. a tunnel);
without one, step 3's server-to-server check still records captured payments.

## Before any real money or real assistance

* A written agreement with a registered charity partner (and its approval
  process), and decisions on 80G receipts, FCRA (foreign donors) and refunds.
* A Razorpay merchant account approved for this purpose; live keys stored in a
  secret manager; the webhook URL registered.
* Multi-process fund locking (above), backups, and an audit review of the ledger.
* Encrypted storage for uploaded documents and a retention period for them.
