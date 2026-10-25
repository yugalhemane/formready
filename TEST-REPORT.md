# FormReady QA and completion report

Date: 2026-10-24

## Account, payments, and owner dashboard update (2026-10-25)

The account-backed access path has been implemented alongside the original legacy token mode. Apply the schema in `supabase/migrations/202610250001_account_entitlements.sql` before enabling `VITE_SUPABASE_URL` in Vercel. Files remain local in the user's browser; the database stores profile name/email, payment references, pass dates, rate-limit counters, and owner audit events.

- **Database/auth:** Supabase email-link sign-in and a profile trigger/backfill; RLS permits users to read their own profile, orders, and entitlements. Trusted writes use server-only Supabase credentials. The service key is never bundled into Vite.
- **Payment/access:** order creation authenticates the account, uses server catalog prices, saves the pending order, and limits an account to five new orders per 15 minutes. Callback verification checks payment capture and order ownership. `payment.captured` / `order.paid` webhooks cover browser-close cases; both paths finalize access through the same idempotent database function. Pass time starts at payment time (and extends after an existing active pass).
- **Owner dashboard:** `/admin` checks the signed-in UUID against server-only `ADMIN_USER_IDS`; lists profiles, paid orders and passes; supports reasoned UPI grants and revocations with atomic audit records. UPI needs owner confirmation before grant.
- **Browser account test:** `npm run test:account-ui` — **PASS**. Mocked email OTP carries the entered email/name, the account page loads with a seeded test session, and a non-admin account receives the translated “not approved” message. Zero page errors. Evidence script: `tools/test-account-ui.mjs`.
- **Account/payment API tests:** `npm run test:accounts` — **8/8 PASS**: authenticated server-priced order persists, missing auth is denied, captured payment is granted only to the matching account, account access is database-read, webhook HMAC is accepted/rejected, owner search reads payment/pass records, owner grants/revokes use audited database functions, and non-admin access is denied. `npm run test:payments` — **5/5 PASS** for legacy signature, captured-only, fixed-price and replay checks. These use mocked Supabase/Razorpay HTTP responses; they are not a live merchant/database transaction.
- **Full browser regression:** `npm run test:browser` — **PASS**. Single crop output **200 × 230 px / 27.7 KB**. IBPS Pack **4/4 PASS**; ZIP: `photo.jpg` 29.0 KB, `signature.jpg` 10.0 KB, `thumb.jpg` 35.3 KB, `declaration.jpg` 99.6 KB. The intercepted GA body includes `en=tool_used`, `en=pack_unlocked`, and `en=zip_downloaded`; see `test-shots/browser-results.json`. Responsive home/tool screenshots at 360/768/1440 are in `test-shots/`.
- **PDF regression:** **PASS**. `node tools/test-pdf-compression.js`: source 12,185,546 bytes / 11,899.9 KB; three pages; output **130.6 KB** for a 200 KB target; an impossible 1 KB request is reported as **6.7 KB**, not success.
- **Build:** **PASS** (`npm run build`). Main entry **494.08 KB / 148.69 KB gzip**; CSS **246.92 KB / 35.28 KB gzip**; lazy chunks: HEIC **1,352.13 KB**, PDF tools **420.90 KB**, PDF route **430.17 KB**, JSZip **95.93 KB**. Build retains the pre-existing large-chunk warning for the PDF worker and HEIC.

### Activation steps still owned by the site owner

1. Create the Supabase project, apply the migration above, configure the Supabase Auth site URL/redirect allow-list and production email delivery.
2. Add `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (or publishable equivalent) and server-only `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY` to Vercel. Never use a `VITE_` prefix for the secret key.
3. Keep Razorpay Test Mode first: `VITE_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`; point the webhook at `/api/payments/webhook` and enable `payment.captured` and `order.paid`.
4. Sign in once, copy the owner UUID from Supabase Auth, and set server-only `ADMIN_USER_IDS`. Redeploy and perform a real Test Mode order before enabling Live Mode.

**External blockers:** no Supabase project, Razorpay credentials, webhook secret, or admin UUID are available in this workspace, so production account mode, real charge/capture, database migration execution, and load testing against the owner's deployment have not been performed. If `SUPABASE_URL` is unset, the legacy browser-bound access mode still operates. Paid products are fixed-duration one-time passes (24 hours/60 days); recurring auto-renew subscriptions and the Shop Plan remain unimplemented. Single-image resizing remains free and browser-only by design; refresh/cache clearing cannot be treated as payment protection for a free client-side feature.

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
- Language selection is a styled Bootstrap dropdown with English, Hindi, and Marathi options, a current-language label, selected-state checkmark, and menu shadow. The saved choice loads on the first render; Playwright switches to Hindi and reloads, and the Marathi audit also switches and reloads. Screenshots: `test-shots/mr-home.png`, `mr-tool.png`, `mr-pack.png`, `mr-pricing.png`. Hindi UI uses the same string-key set as English; translated strings cover navigation, controls, errors, pricing/payment UI, legal summaries and document labels. Remaining identical values are the brand, language names, access-code format, UPI ID acronym and copyright; exam names/abbreviations are intentionally preserved. Supplied exam guide bodies remain in English.
- Home card grid regression found and fixed: Bootstrap grid columns now wrap each card in a `.col` instead of combining `.col` with the custom grid item. Latest screenshot review at 360, 768, and 1440 px shows the card grid at the expected one-, two-, and four-column widths. Evidence: `test-shots/home-fixed-360.png`, `home-fixed-768.png`, and `home-fixed-1440.png`.
- Regression browser run: **PASS**. IBPS Pack outputs: photo 200×230 / 29.0 KB, signature 140×60 / 10.0 KB, thumb 240×240 / 35.3 KB, declaration 800×400 / 99.6 KB; all 4 checklist rows passed. ZIP contains exactly `photo.jpg`, `signature.jpg`, `thumb.jpg`, and `declaration.jpg`.
- PDF regression: **PASS**. The generated 11,899.9 KB, three-page test PDF reached 130.6 KB against a 200 KB target. For an impossible 1 KB target, the UI reports the best achieved size, 6.7 KB, instead of a false success.
- Consent regression: **PASS**. Declined-consent image processing completed with zero page errors and no analytics or ad scripts.
- Payment regression: **PASS**, five automated tests; mocked browser checkout persists unlock after reload and hides ads in the active Pack.
- Build: **PASS**. The application JS entry is 463.22 KB (141.11 KB gzip), up from 356.33 KB before Bootstrap. Lazy chunks remain separated: HEIC 1,352.13 KB, PDF tool 420.90 KB, PDF route 430.17 KB, and JSZip 95.93 KB. The existing pdf.js worker is 1,264.34 KB; Vite warns about the worker and HEIC chunk sizes. Bootstrap CSS plus app CSS totals 245.59 KB (34.96 KB gzip).

## Owner setup remaining

1. Activate the Razorpay merchant account and set the four payment environment variables above in Vercel. Test with Test Mode first, then replace with activated Live Mode keys.
2. Set the actual WhatsApp contact number. Configure GA4 and AdSense only if you want those services enabled.
3. Redeploy after setting Vercel environment variables.

## Walkthrough and selected-file UI (2026-10-25)

- First-visit walkthrough: **PASS**. English, Hindi, and Marathi strings; dismissal is stored in `fr-tour-seen-v1`, reload does not reopen it, and the header button reopens it. Screenshot: `test-shots/walkthrough-360.jpg`.
- Selected image handling: **PASS**. The single-file tool shows the source image, filename, and size in its upload box. Crop/zoom/rotate, replace, and remove controls work. Playwright verifies preview display, removal, reselection, and a processed result of **200 x 230 px / 27.7 KB**. Screenshot: `test-shots/tool-selected-file-360.jpg`.
- Exam Pack slots: **PASS**. Selected files show previews, names, and sizes inline. Playwright removes/reselects the photo, crops it, processes all four IBPS files, and verifies the ZIP. Outputs: photo **200 x 230 / 29.0 KB**, signature **140 x 60 / 10.0 KB**, thumb **240 x 240 / 35.3 KB**, declaration **800 x 400 / 99.6 KB**. Details: `test-shots/browser-results.json`.
- Responsive UI: screenshots at 360, 768, and 1440 px were regenerated and visually reviewed. Build and browser flow pass, including payment-gated Pack simulation, crop, checklist, ZIP, analytics collection, and declined consent.

## Document tools expansion and image preview (2026-10-25)

- The single-file upload area shows the selected photo across the available box with its original aspect ratio (`object-fit: contain`). Pack previews remain compact. Screenshots: `test-shots/tool-selected-file-360.jpg` and `test-shots/walkthrough-360.jpg`.
- `/tool/pdf` provides PDF compression, multiple images to PDF, and PDF merging in selected order. Processing stays in the browser; HEIC conversion is supported for image-to-PDF.
- `npm run test:documents`: **PASS**, consent declined and zero browser errors. Two images produced a two-page **6,699.5 KB** PDF; merging two copies produced a four-page **13,398.4 KB** PDF. Screenshot: `test-shots/document-workspace-1440.jpg`.
- Further tools suggested by the reference screenshots include split/rotate/extract/reorder PDF pages, image format conversion, OCR, Office conversion, editing, password protection, redaction, and AI tools. These are not implemented yet and should only be advertised after they work and are verified.

## Dark mode and document-suite direction (2026-10-25)

- Added a shared header theme toggle. Light/dark choice is saved as `fr-theme` and applied on load; labels are localized in English, Marathi, and Hindi. Production build passes (main JS 508.21 KB / 152.24 KB gzip; CSS 252.32 KB / 36.34 KB gzip).
- `npm run test:documents` verifies dark-mode activation and persistence across reload; screenshot: `test-shots/dark-mode-1440.jpg`. Image-to-PDF and PDF-merge assertions also pass in that browser test.

- Dark-theme visual audit: regenerated and reviewed screenshots for home, IBPS tool, Exam Pack, and privacy page at desktop width (`test-shots/dark-home-1440.jpg`, `dark-tool-1440.jpg`, `dark-pack-1440.jpg`, `dark-legal-1440.jpg`). Fixed previously light upload panels, muted descriptions, home card copy, and accent text so they stay readable in dark mode. Browser checks report zero page errors.

## Full UI, account, and owner-admin audit (2026-10-25)

- Direct route audit: **20/20 routes PASS** at 360 px and 1440 px, including direct URL loads, page heading/title/description/OG metadata, no horizontal overflow, and zero browser page errors (`npm run test:routes`). Screenshot sets include `test-shots/home-360.jpg`, `home-768.jpg`, `home-1440.jpg`, `tool-360.jpg`, `tool-768.jpg`, `tool-1440.jpg`; dark-mode visual review is listed above.
- Account journey: **PASS** (`npm run test:account-ui`): email OTP flow, account display, session survives reload, authenticated checkout request, purchased entitlement survives reload and unlocks `/exam-pack`; zero browser errors.
- Owner/admin flow: **PASS** in the same browser test. Non-admin is denied; admin dashboard supports searched and paginated users, recent audit events, and grant/revoke actions which require a reason. Grant and revoke requests are checked for their reasons. API suite is **10/10 PASS** (`npm run test:accounts`), including paginated search, audit access, and non-admin denial.
- Other regression: `npm run test:payments` **5/5 PASS**; `npm run test:browser` **PASS** with a real intercepted GA collect request containing `tool_used`, `pack_unlocked`, and `zip_downloaded`; IBPS image rows **4/4 PASS** and ZIP entries exactly `photo.jpg`, `signature.jpg`, `thumb.jpg`, `declaration.jpg` with actual sizes 29,740 / 10,240 / 36,175 / 102,033 bytes (`test-shots/browser-results.json`). The earlier report's “5/5” Pack wording was inaccurate for this four-document IBPS preset; the tested result is 4/4.
- Document tools: `npm run test:documents` **PASS**; image-to-PDF made 2 pages (6,699.5 KB), merge made 4 pages (13,398.4 KB), dark-mode persistence also passed with zero errors.
- Build: `npm run build` **PASS**. Main JS **511.85 KB / 153.11 KB gzip**, CSS **255.46 KB / 36.87 KB gzip**; lazy chunks: HEIC **1,352.13 KB / 344.71 KB gzip**, PDF module **430.17 KB / 129.28 KB gzip**, PDF tools **2.06 KB / 1.03 KB gzip**, JSZip **95.93 KB / 28.47 KB gzip**. The PDF worker is **1,264.34 KB**. Vite still warns about large HEIC/worker chunks.
- Admin boundaries: dashboard exposes account/payment/pass records and auditable administrative actions; user-uploaded documents remain browser-local and are not visible to the owner. These pages are ready for configured deployment, but real login/payment/admin operation still depends on owner Supabase/Razorpay configuration and applying the checked-in migration. The products are fixed-duration one-time passes, not recurring auto-renew subscriptions.


## Dark mode, payment entry, and FormReady logo follow-up (2026-10-25)

- Route audit: `npm run test:routes` checks all 20 routes in light and dark themes at 360, 768, and 1440 px (120 page/theme/viewport combinations), with direct-load, heading/SEO, page-canvas, no-overflow, no-page-error, and all-visible-button contrast assertions. The signed-out Exam Pack and Season Pass CTAs point to `/account?next=%2Fpricing`; their configured magic-link redirect returns to pricing.
- Visual result: home hero/example align side by side at desktop and stack at mobile. Dark page background covers the full document including gaps and short-page footer; cards, inputs, tables, navigation, secondary actions, and primary actions remain readable. Screenshot evidence: `test-shots/dark-home-360.png`, `dark-home-768.png`, `dark-home-1440.png`, corresponding `dark-tool-*.png` and `dark-pricing-*.png`; light comparison screenshots use `light-*.png`. All visible button text/background pairs measured at least 4.5:1 contrast after transitions settle.
- Brand: the supplied transparent PNG is used as the 64×64 browser favicon, 180×180 app icon, and header/footer logo. Route test decodes both icons and confirms the visible brand mark.
- Build: `npm run build` passes. Current output: main JS **512.19 KB / 153.14 KB gzip**, CSS **259.00 KB / 37.54 KB gzip**, lazy HEIC **1,352.13 KB / 344.71 KB gzip**, PDF **430.17 KB / 129.28 KB gzip**, worker **1,264.34 KB**. The pre-existing worker/HEIC size warning remains. Supabase owner setup steps are documented in `SUPABASE-SETUP.md`.
