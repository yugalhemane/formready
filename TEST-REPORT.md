# Prompt E completion report

Date: 2026-10-24

## Guide word counts (rendered guide body)

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

The supplied `GUIDES-CONTENT.md` text is rendered verbatim below each preset's spec table and tool. Counts are from `node tools/count-guide-words.mjs` against the rendered guide page content.

## Translation audit

- Files scanned: `src/App.jsx`, `src/components/HomePage.jsx`, `src/components/ExamPack.jsx`, `src/components/CroppableTool.jsx`, `src/components/CropDialog.jsx`, `src/components/AdSlot.jsx`, `src/components/Seo.jsx`, `src/data/presets.js`, `src/data/strings.js`, `src/data/guides.json`.
- Found: 151 distinct UI string-map entries plus 8 supplied guide bodies (159 audited content units).
- Moved: 148 UI strings to the bilingual strings map; guide text remains English verbatim by explicit owner instruction.
- Exceptions: 3 English legal bodies, each preceded by a Marathi summary; 8 verbatim English guides; proper nouns, exam names, units, formats, and owner-approved glossary terms.
- First paint and localStorage persistence: PASS. `node tools/test-mr-ui.mjs` passed for home, IBPS tool, unlocked Pack, and pricing; screenshots: `test-shots/mr-home.png`, `mr-tool.png`, `mr-pack.png`, `mr-pricing.png`.
- Audit table: `TRANSLATION-AUDIT.md`. Every mapped row is marked moved; legal-body rows give the permitted exception reason.

## GA4 intercepted collect evidence

One Playwright session accepted consent using `G-TESTFORMREADY`, used the single-file tool, unlocked the Pack, and downloaded the ZIP. The GA endpoint batched the three app events into a single POST collect request. Captured request:

```text
POST https://www.google-analytics.com/g/collect?v=2&tid=G-TESTFORMREADY&…
Body:
en=tool_used&_ee=1&ep.kind=image&ep.transport_type=beacon&…
en=pack_unlocked&_ee=1&ep.transport_type=beacon&…
en=zip_downloaded&_ee=1&ep.exam=ibps&ep.transport_type=beacon&…
```

The test intercepted the request before aborting it and asserted all three `en` values. Full URL and body are preserved in `test-shots/browser-results.json`. `rg "gtag\\(" src` finds only initialization/configuration in `ConsentScripts.jsx`; all app events use the shared queued `track()` helper.

## Regression

- Production build: PASS. `npm run build`; generated 18 route sitemap entries. Main JS 349.90 KB (110.18 KB gzip); JSZip 95.93 KB; PDF tools 420.90 KB; pdf.js 430.17 KB; PDF worker 1,264.34 KB; HEIC 1,352.13 KB. HEIC/PDF remain lazy chunks. The build reports expected large lazy worker/HEIC chunk warnings.
- IBPS single-file crop/process: PASS, 200×230 px, 27.8 KB (20–50 KB).
- IBPS Pack: PASS, 4/4 actual output checklist rows pass; ZIP contains `photo.jpg`, `signature.jpg`, `thumb.jpg`, `declaration.jpg`; measured sizes are 29.0, 10.0, 35.3, and 99.6 KB. Evidence: `test-shots/browser-results.json`.
- PDF: PASS. Three-page generated 11,899.9 KB source reached 130.6 KB at 200 KB target; impossible 1 KB target reports best 6.7 KB and explicitly states target was 1 KB. Evidence: `test-shots/pdf-results.json`; reproduced with `node tools/test-pdf-compression.js`.
- Consent declined: PASS; image flow completes, no ad/tracking slots or scripts, zero page errors.
- GA events: PASS; same-session intercepted collect POST includes `tool_used`, `pack_unlocked`, `zip_downloaded`.
- Responsive screenshots: PASS, inspected home and tool at 360, 768 and 1440 px; no overlap or stretching. Files: `test-shots/home-{360,768,1440}.jpg`, `test-shots/tool-{360,768,1440}.jpg`.
- Marathi screenshots / persistence: PASS (four screenshot files listed above).

## Owner checklist

- Set real site domain and AdSense publisher/ad-slot IDs in the single site/env config.
- Set production GA4 measurement ID in deployment environment.
- Set UPI and WhatsApp contact values in config.
- Deploy static `dist/` to Vercel and verify the production domain/ads.txt before submitting to AdSense.

Ready to deploy
