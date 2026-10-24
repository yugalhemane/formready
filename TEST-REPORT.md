# FormReady QA and completion report

Date: 2026-10-24

## Guides

The eight owner-supplied guides are rendered verbatim below their spec tables and tools. Counts were measured from rendered guide content with `node tools/count-guide-words.mjs`.

| Preset page | Words |
|---|---:|
| IBPS PO / Clerk | 407 |
| SBI PO / Clerk | 353 |
| SSC Signature | 370 |
| RRB NTPC UG 2026 | 386 |
| NEET | 371 |
| UPSC | 390 |
| MPSC | 362 |
| MahaDBT | 395 |

## Translations

- Locale maps contain 171 EN and 171 MR keys. The complete per-string audit is in `TRANSLATION-AUDIT.md`.
- 168 user-interface strings are bilingual. Three legal bodies remain English with Marathi summaries; eight supplied guide bodies remain English verbatim as requested.
- Language persistence and first paint pass. Marathi Playwright screens pass for home, IBPS tool, paid Pack, and pricing; legal page UI chrome is also checked. Screenshots: `test-shots/mr-home.png`, `mr-tool.png`, `mr-pack.png`, and `mr-pricing.png`.

## Payments

Razorpay Standard Checkout is wired through Vercel Functions at `api/payments/order.js`, `verify.js`, and `access.js`.

- The server creates orders using the fixed prices in `site.config.json`; it ignores client-submitted amounts.
- The server checks Razorpay's checkout signature, retrieves the order and payment from Razorpay, compares plan, amount and currency, and grants access only after the payment is captured.
- It issues a signed access token. The expiry is fixed to Razorpay's payment timestamp, so resending an old payment callback cannot extend access.
- Exam Pack costs ₹49 for 24 hours; Season Pass costs ₹99 for 60 days. Both are one-time purchases. The Shop Plan is disabled until its multi-user service is available.
- A payment token is stored in the purchasing browser. There are no accounts or cross-device recovery.
- `npm run test:payments`: **5 passed**, covering fixed order pricing, signature checks, captured-only access, token tampering, and replayed expired payments.
- `npm run test:browser`: **PASS**. Playwright simulates Razorpay Checkout and the payment API; it makes no real charge. It verifies paid access survives reload, ads are hidden for an active purchase, and the full image flow and ZIP still work.

**Live payment status: not configured.** A Razorpay merchant account and keys are required before the button can accept real payments. Set these in Vercel: `VITE_RAZORPAY_KEY_ID` (public key ID), `RAZORPAY_KEY_ID` (same ID), `RAZORPAY_KEY_SECRET` (server-only), and `PACK_TOKEN_SECRET` (new random server-only signing secret). Start with Test Mode keys and complete a test payment before setting activated Live Mode keys. The app build and payment code are ready, but no account-specific credentials were supplied.

## Existing feature regressions

- Production build: **PASS**. Main JS 356.33 KB (111.75 KB gzip); JSZip 95.93 KB; PDF tools 420.90 KB; pdf.js 430.17 KB; worker 1,264.34 KB; HEIC 1,352.13 KB. PDF and HEIC remain lazy-loaded. The worker and HEIC chunks trigger Vite's large-chunk warning.
- Single image: **PASS**, IBPS crop output 200×230 px / 27.8 KB.
- IBPS Pack: **PASS**, 4/4 checklist rows pass. ZIP entries are `photo.jpg`, `signature.jpg`, `thumb.jpg`, and `declaration.jpg`; sizes 29.0, 10.0, 35.3, and 99.6 KB. Full results: `test-shots/browser-results.json`.
- PDF: **PASS**, generated three-page 11,899.9 KB source compresses to 130.6 KB at the 200 KB target. At an impossible 1 KB target, the UI reports the best result, 6.7 KB. Evidence: `test-shots/pdf-results.json` and `node tools/test-pdf-compression.js`.
- Declined consent: **PASS**, image processing works with no ad/analytics scripts or page errors.
- Responsive screenshots at 360, 768 and 1440 px: **PASS**, home and tool pages inspected. No overlap/stretching found; see `test-shots/home-*.jpg` and `test-shots/tool-*.jpg`.

## UI and navigation update (2026-10-24)

- Bootstrap 5 is installed and loaded globally. The responsive navbar/collapse, language selector, form selects, range sliders, form controls, buttons, and responsive home card grid use Bootstrap components/utilities, with the existing FormReady colors retained. Screenshot review: `test-shots/home-360.jpg`, `home-768.jpg`, `home-1440.jpg`, `tool-360.jpg`, `tool-768.jpg`, and `tool-1440.jpg`; no overlap or stretching found.
- Selecting an exam after scrolling the home page now opens the tool at scroll position 0. Playwright asserts this route change in `tools/run-browser-checks.js`. Home in the navbar also returns to the top when already on `/`.
- Crop is available in the single-file tool and every image slot in Exam Pack. Playwright moves both the Zoom and Rotate sliders before applying the crop; the processed result passes at **200 × 230 px / 27.7 KB** (`test-shots/browser-results.json`).
- Language selection is a Bootstrap dropdown with English, Hindi, and Marathi options. The saved choice loads on the first render; Playwright switches to Hindi and reloads, and the Marathi audit also switches and reloads. Screenshots: `test-shots/mr-home.png`, `mr-tool.png`, `mr-pack.png`, `mr-pricing.png`. Hindi UI uses the same string-key set as English; translated strings cover navigation, controls, errors, pricing/payment UI, legal summaries and document labels. Remaining identical values are the brand, language names, access-code format, UPI ID acronym and copyright; exam names/abbreviations are intentionally preserved. Supplied exam guide bodies remain in English.
- Regression browser run: **PASS**. IBPS Pack outputs: photo 200×230 / 29.0 KB, signature 140×60 / 10.0 KB, thumb 240×240 / 35.3 KB, declaration 800×400 / 99.6 KB; all 4 checklist rows passed. ZIP contains exactly `photo.jpg`, `signature.jpg`, `thumb.jpg`, and `declaration.jpg`.
- PDF regression: **PASS**. The generated 11,899.9 KB, three-page test PDF reached 130.6 KB against a 200 KB target. For an impossible 1 KB target, the UI reports the best achieved size, 6.7 KB, instead of a false success.
- Consent regression: **PASS**. Declined-consent image processing completed with zero page errors and no analytics or ad scripts.
- Payment regression: **PASS**, five automated tests; mocked browser checkout persists unlock after reload and hides ads in the active Pack.
- Build: **PASS**. The application JS entry is 462.33 KB (140.83 KB gzip), up from 356.33 KB before Bootstrap. Lazy chunks remain separated: HEIC 1,352.13 KB, PDF tool 420.90 KB, PDF route 430.17 KB, and JSZip 95.93 KB. The existing pdf.js worker is 1,264.34 KB; Vite warns about the worker and HEIC chunk sizes. Bootstrap CSS plus app CSS totals 244.68 KB (34.77 KB gzip).

## Owner setup remaining

1. Activate the Razorpay merchant account and set the four payment environment variables above in Vercel. Test with Test Mode first, then replace with activated Live Mode keys.
2. Set the actual WhatsApp contact number. Configure GA4 and AdSense only if you want those services enabled.
3. Redeploy after setting Vercel environment variables.
