# FormReady

FormReady is a Vite + React application. Image and PDF processing runs in the browser. Vercel Functions handle paid access verification; uploaded documents are never sent to those functions.

## Local development

```sh
npm install
npm run dev
npm run build
```

For the payment endpoints, install/log in to the Vercel CLI and run `vercel dev`; plain `vite` serves the frontend only. The production output is `dist`.

## Deploy and configure payments

Deploy as a Vite static site on Vercel with build command `npm run build` and output directory `dist`. The app is configured for `https://formready-xi.vercel.app` in `site.config.json`.

Create and activate a Razorpay merchant account. Start with Razorpay Test Mode keys and set these Vercel environment variables for Preview:

- `VITE_RAZORPAY_KEY_ID`: public Checkout key ID (the `rzp_test_...` or `rzp_live_...` value).
- `RAZORPAY_KEY_ID`: same key ID, used by the server function.
- `RAZORPAY_KEY_SECRET`: server-only key secret. Never prefix it with `VITE_`.
- `PACK_TOKEN_SECRET`: a new, long random server-only value used to sign access tokens.

After successful test transactions, switch to approved Live Mode keys and set them for Production. Redeploy after changing environment variables. Enable the payment methods you want in the Razorpay account. Never commit `.env.local` or server secrets.

Exam Pack is a ₹49 purchase for 24 hours. Season Pass is a ₹99 purchase for 60 days. With account mode enabled, captured payments create a database entitlement linked to the signed-in account. Without Supabase configured, the legacy signed-token flow works in the purchasing browser only. The Shop Plan remains unavailable until its multi-user features and billing are completed.

UPI QR payments are manual. Confirm funds in your UPI merchant/bank app before granting access. In account mode, the buyer must create an account with the same email they provide with the transfer; use `/admin` to grant a pass after verification. In legacy mode, an owner may issue a time-limited code. Never put `PACK_TOKEN_SECRET` in a `VITE_` variable or send it to a buyer.

## Free use and abuse limits

The single-file image tools are intentionally free and run entirely on the visitor's device. Refreshing, clearing browser storage, or using a private window cannot be reliably blocked by a static client-only site. Local storage counters are only a speed bump and are not payment security. Repeated one-file use does not consume FormReady server compute, so keep that path free and sell the convenience of multi-file processing, verified checklists, and ZIP download. If strict per-user quotas become necessary, add accounts and a server-side quota store; avoid sending private application files to a server unless the product and privacy promise are deliberately changed. Razorpay access is checked server-side. In account mode, entitlements are database-backed and tied to the account; legacy codes remain shareable until their expiry.

Update the domain, WhatsApp number, prices, and AdSense publisher ID in `site.config.json`. Copy `.env.example` to `.env.local` for local environment-variable names. Set optional GA4, AdSense, and ad-unit IDs in Vercel only if you intend to enable them. Consent still gates analytics and ads.

## Checks

- `npm run test:payments` tests fixed server-side pricing, Razorpay signature and captured-payment validation, and tamper-resistant access tokens.
- `npm run test:browser` exercises crop/process, mocked hosted checkout, Pack unlock, ZIP download, GA events, declined consent, and responsive screenshots.
- `node tools/test-pdf-compression.js` checks PDF compression targets and page preservation.
- `npm run test:assets` generates the local image and PDF fixtures using `sharp` and `pdf-lib`.

See [TEST-REPORT.md](TEST-REPORT.md) for the app's prior feature evidence. Live payment processing remains disabled until Razorpay credentials are configured in Vercel.

## Account-backed paid access rollout

The account flow is opt-in until the owner configures Supabase. When configured, users sign in by email link, Razorpay orders are attached to their account, and a captured payment creates a server-side entitlement. Access is checked against Postgres, so clearing local storage does not erase a paid pass. Image and PDF processing still runs only in the browser; the database stores account, payment reference, and access dates, never uploaded application files.

### Owner setup

1. Create a Supabase project and apply `supabase/migrations/202610250001_account_entitlements.sql` using the Supabase CLI or SQL editor.
2. In Vercel, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or publishable-key equivalent) for the browser; add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SECRET_KEY` server-side. The secret/service-role key must never use a `VITE_` prefix.
3. Add the Razorpay keys described above, plus `RAZORPAY_WEBHOOK_SECRET`. Configure the Razorpay webhook URL as `https://<your-domain>/api/payments/webhook` and subscribe to `payment.captured` and `order.paid`.
4. Sign in once with the owner email, find that user's UUID in Supabase Auth, and set it in server-only `ADMIN_USER_IDS` (comma-separated for multiple owners). Do not use user-editable profile metadata as an admin role.
5. Set the same public Supabase URL/key in Preview and Production and redeploy. Test with Razorpay Test Mode before switching to Live Mode.

`/account` provides email sign-in, current access, and payment history. `/admin` is protected by `ADMIN_USER_IDS` and can search users, grant a manually verified UPI pass, or revoke a pass; each owner action records a reason and audit entry. UPI payments still require the owner to confirm funds in the UPI/bank app. The webhook and browser callback both finalize payments idempotently, so a browser closing after payment does not lose a captured purchase. Supabase Postgres and Auth are required before account-bound checkout is active. The legacy signed-token flow remains only for deployments that have not requested account mode; once `SUPABASE_URL` is configured, API calls do not fall back to browser tokens.

Vercel Functions scale with traffic within the configured project plan and platform limits. The file work stays client-side, so simultaneous users do not send image/PDF compute to a FormReady server. Monitor Vercel function errors and Supabase database/auth usage as traffic grows; configure database backups/retention in Supabase for the selected plan.
