# SMIVAI — medicines and home delivery: what is real

Status as of Phase 6 (October 2026).

## What SMIVAI does today — demo only

| Step | Status |
|---|---|
| Medicine list | The patient's own **medicine reminders** (entered by them, a caregiver or a doctor). SMIVAI never suggests a medicine, a dose or a substitute. |
| Prescription | A photo is **required** for every order. It is checked to be an image, resized and re-encoded on the device (which strips hidden metadata), and stored in the device's IndexedDB. Only its id travels with the order; the photo never syncs. |
| "Order" | Saved as a **demo order** (`status: "demo"`, reference `DEMO-RX-…`). No pharmacy is contacted, nothing is charged, no delivery time is shown — none is invented. Patient, caregiver and the order list all say "Demo · not sent". |
| Server rules (`backend/app/main.py · _check_order`) | A new order must reference a prescription; a device may only set `demo` or `cancelled` — never `dispatched`, `delivered` or any status only a pharmacy could report. Tested in `backend/tests/test_orders.py`. |

## Why there is no real ordering — the blocker

1. **No public ordering API.** Research found no public developer API or
   self-serve partner programme for Tata 1mg, PharmEasy or Apollo 24|7; their
   channels are their own apps, websites and (for Apollo) WhatsApp. Any
   integration would be a commercial partnership negotiated with the company.
   *Not confirmed either way* — check each company's partnerships contact.
2. **Unsettled regulation.** Draft e-pharmacy rules (amending the Drugs and
   Cosmetics Rules, 1945) were published in 2018 — registration with the
   central licensing authority, a valid prescription for Schedule H/H1 drugs,
   no sale of narcotics or psychotropics online — but were not finalised;
   courts have intervened, and in 2023 the Health Ministry issued show-cause
   notices to major online sellers. A 2025 review found no law specifically
   governing e-pharmacies. **The 2026 position could not be verified** — check
   CDSCO and the Gazette of India before building anything real.
3. **A licensed pharmacy must be in the loop.** Dispensing, prescription
   verification and Schedule H checks are the pharmacist's legal role, not an
   app's.

## What could be built next, and what it needs

| Capability | Needs |
|---|---|
| Send an order to a partner pharmacy | A signed partnership, its API documentation and credentials; a licensed pharmacy; legal review |
| Real stock, price, serviceability | The partner's catalogue/inventory API |
| Order and delivery tracking | Status pushed by the partner (webhook), verified on the server — never set by the device |
| Prescription verification | The partner pharmacist; the image would then have to be uploaded securely (encrypted at rest, access-logged, retention period agreed) |
| Medicine information (not ordering) | A licensed, attributable drug-information source; none free and official was identified for India |

Until one of these exists, SMIVAI keeps medicine ordering as a clearly
labelled demo and points the person to their own pharmacy or caregiver.

## Sources consulted

- Inc42 — Flipkart / 1mg partnership and AIOCD objections: <https://inc42.com/buzz/flipkart-1mg-forge-alliance-to-take-on-amazon-reliance>
- Scroll — 2018 draft rules to regulate online sale of medicines: <https://scroll.in/latest/893030/health-ministry-releases-draft-rules-to-regulate-online-sale-of-medicines>
- SCC Online — Regulation of online pharmacies in India (2023): <https://www.scconline.com/blog/post/2023/11/02/regulation-of-online-pharmacies-in-india/>
- Deccan Herald — court asks Centre about draft-rule consultations: <https://www.deccanherald.com/india/centre-told-to-inform-outcome-of-consultations-of-draft-rules-to-regulate-e-pharmacies-1222717>
- Indian Journal of Medical Ethics — Emerging e-pharmacy sector (2025): <https://ijme.in/articles/emerging-e-pharmacy-sector-in-india-ethical-and-regulatory-concerns/>

These are secondary sources; this page is not legal advice.
