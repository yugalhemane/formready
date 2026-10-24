import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5182', '--strictPort'], { stdio: 'ignore', env: { ...process.env, VITE_RAZORPAY_KEY_ID: 'rzp_test_ui' } });
let browser;
try {
  for (let i = 0; i < 40; i++) { try { if ((await fetch('http://127.0.0.1:5182')).ok) break; } catch {} await new Promise(resolve => setTimeout(resolve, 250)); }
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  await page.addInitScript(() => { if (!localStorage.getItem('fr-lang')) localStorage.setItem('fr-lang', 'mr'); localStorage.setItem('fr-consent', 'declined'); localStorage.setItem('fr-unlock', JSON.stringify({ token: 'mock-entitlement', plan: 'examPack', expiresAt: Date.now() + 86400000 })); });
  await page.route('**/api/payments/access', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ plan: 'examPack', expiresAt: Date.now() + 86400000 }) }));
  const untranslated = /\b(Choose|your|the|file|files|Prepare|Output|requirements|Download verified ZIP|Download ZIP|Crop, zoom and rotate|Simple pricing|Start free|Free|single image resize|24-hour access|60-day access|per month|UPI QR placeholder|Advertisement|About|Contact|Terms of Use|Disclaimer|Privacy Policy|Not checked|Check all files|Unlock pack|Wrong code|Passport Photo|Signature|Thumb impression|Handwritten declaration|Postcard Photo|Scholarship|Season Pass|Shop Plan|Set your own|application files|custom pixel|Your file|Adjust crop|Use this crop|Compress PDF|Target size|Before|after)\b/i;
  async function auditRoute(route, screenshot) {
    await page.goto(`http://127.0.0.1:5182${route}`);
    await page.waitForTimeout(100);
    const text = await page.locator('body').evaluate(el => { const clone = el.cloneNode(true); clone.querySelectorAll('.guide').forEach(node => node.remove()); return clone.innerText; });
    const match = text.match(untranslated);
    if (match) throw Error(`${route} has untranslated English UI: ${match.join(', ')}`);
    await page.screenshot({ path: `test-shots/mr-${screenshot}.png`, fullPage: true });
    console.log(route, 'UI checked');
  }
  await auditRoute('/', 'home');
  await page.locator('.language-toggle').click();
  await page.locator('.language-options button[lang="en"]').click();
  await page.reload();
  if (!(await page.locator('.language-toggle').innerText()).includes('English')) throw Error('English language preference did not persist');
  await page.locator('.language-toggle').click();
  await page.locator('.language-options button[lang="mr"]').click();
  await page.reload();
  if (!(await page.locator('h1').first().innerText()).includes('फोटो आणि सही')) throw Error('Marathi language preference did not persist/apply');
  await auditRoute('/tool/ibps', 'tool');
  await auditRoute('/exam-pack', 'pack');
  await auditRoute('/pricing', 'pricing');
  for (const route of ['/about', '/contact', '/privacy-policy', '/terms', '/disclaimer']) {
    await page.goto(`http://127.0.0.1:5182${route}`);
    const text = await page.locator('.legal').evaluate(el => { const clone = el.cloneNode(true); clone.querySelectorAll('p:not(.legal-summary)').forEach(node => node.remove()); return clone.innerText; });
    const match = text.match(untranslated);
    if (match) throw Error(`${route} contains untranslated legal chrome: ${match.join(', ')}`);
  }
} finally { await browser?.close(); server.kill(); }
