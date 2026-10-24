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

Exam Pack is a one-time ₹49 purchase for 24 hours. Season Pass is a one-time ₹99 purchase for 60 days. A captured payment is verified against Razorpay before access is issued. A signed token is saved in the purchasing browser; there is no account or cross-device purchase recovery. The Shop Plan is not available to purchase while its multi-user features are unfinished.

UPI QR payments are manual. Confirm the payment in your UPI merchant/bank app, then issue an access code using the server-only `PACK_TOKEN_SECRET`: `npm run access-code -- examPack <payment-reference>` or `npm run access-code -- seasonPass <payment-reference>`. The owner machine needs that same secret in ignored `.env.local` (for example, obtained with `vercel env pull .env.local`). Send the generated code to the buyer privately; they paste it into Exam Pack. Codes expire after the selected access period, but cannot be revoked or limited to one browser without adding a database. Never put `PACK_TOKEN_SECRET` in a `VITE_` variable or send it to a buyer.

## Free use and abuse limits

The single-file image tools are intentionally free and run entirely on the visitor's device. Refreshing, clearing browser storage, or using a private window cannot be reliably blocked by a static client-only site. Local storage counters are only a speed bump and are not payment security. Repeated one-file use does not consume FormReady server compute, so keep that path free and sell the convenience of multi-file processing, verified checklists, and ZIP download. If strict per-user quotas become necessary, add accounts and a server-side quota store; avoid sending private application files to a server unless the product and privacy promise are deliberately changed. Razorpay access is signed and checked server-side. Manually issued UPI codes are time-limited but shareable and cannot be revoked without a database.

Update the domain, WhatsApp number, prices, and AdSense publisher ID in `site.config.json`. Copy `.env.example` to `.env.local` for local environment-variable names. Set optional GA4, AdSense, and ad-unit IDs in Vercel only if you intend to enable them. Consent still gates analytics and ads.

## Checks

- `npm run test:payments` tests fixed server-side pricing, Razorpay signature and captured-payment validation, and tamper-resistant access tokens.
- `npm run test:browser` exercises crop/process, mocked hosted checkout, Pack unlock, ZIP download, GA events, declined consent, and responsive screenshots.
- `node tools/test-pdf-compression.js` checks PDF compression targets and page preservation.
- `npm run test:assets` generates the local image and PDF fixtures using `sharp` and `pdf-lib`.

See [TEST-REPORT.md](TEST-REPORT.md) for the app's prior feature evidence. Live payment processing remains disabled until Razorpay credentials are configured in Vercel.
