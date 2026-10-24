# FormReady

Static Vite + React app. Image and PDF work runs in the browser; there is no application backend.

## Local development

```sh
npm install
npm run dev
npm run build
```

The production output is `dist`. Deploy it as a Vite static site on Vercel with build command `npm run build` and output directory `dist`.

## Owner configuration

- Set the site domain, UPI ID, WhatsApp number, and prices in [site.config.json](site.config.json). `npm run build` generates `public/sitemap.xml`, `public/robots.txt`, and `public/ads.txt` from this file and the route list.
- Copy `.env.example` to `.env.local`. Add the optional GA4 ID and AdSense client plus all six ad unit IDs. Scripts only load after consent is accepted. The ads.txt publisher ID belongs in `site.config.json`.
- Set `VITE_PACK_SECRET` at build time. Generate today's V1 pack code locally with `PACK_SECRET=your-secret node tools/generate-code.js` (PowerShell: `$env:PACK_SECRET='your-secret'; node tools/generate-code.js`). Codes are an honour-system gate; the secret is embedded in the static JavaScript and is not secure payment enforcement.
- UPI QR currently remains a placeholder; setting the UPI ID alone does not generate a real QR image.

## Tests and test assets

- `npm run test:assets` creates the sample photo, signature, certificate scan, and three-page PDF in `test-assets/` using `sharp` and `pdf-lib`.
- `npm run test:browser` runs Playwright against local Chrome. Set `CHROME_PATH` if Chrome is not installed at the default Windows path. It captures the home and IBPS tool at 360, 768, and 1440 pixels and runs the single-image and IBPS Pack flows.
- `node tools/test-pdf-compression.js` checks PDF targets and page preservation.

See [TEST-REPORT.md](TEST-REPORT.md) for the latest build, browser, PDF, translation, and analytics evidence. Before deployment, set the owner-specific domain, publisher, analytics, payment, and contact configuration described above.
