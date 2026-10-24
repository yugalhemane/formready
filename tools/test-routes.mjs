import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { presets } from '../src/data/presets.js';

const origin = 'http://127.0.0.1:5197';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5197', '--strictPort'], { stdio: 'ignore' });
let browser;
try {
  let ready = false;
  for (let n = 0; n < 40; n++) { try { if ((await fetch(origin)).ok) { ready = true; break; } } catch {} await new Promise(resolve => setTimeout(resolve, 250)); }
  if (!ready) throw new Error('Vite server did not start');
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const routes = ['/', '/exam-pack', '/pricing', '/account', '/admin', '/about', '/contact', '/privacy-policy', '/terms', '/disclaimer', '/tool/custom', '/tool/pdf', ...presets.map(p => `/tool/${p.id}`)];
  const failures = [], errors = [];
  for (const width of [1440, 360]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.addInitScript(() => { localStorage.setItem('fr-lang', 'en'); localStorage.setItem('fr-tour-seen-v1', '1'); localStorage.setItem('fr-consent', 'declined'); localStorage.setItem('fr-theme', 'light'); });
    page.on('pageerror', error => errors.push(`${width}px ${page.url()}: ${error.message}`));
    for (const route of routes) {
      const response = await page.goto(`${origin}${route}`);
      const title = await page.title(), h1 = await page.locator('main h1').first().textContent().catch(() => '');
      const meta = await page.locator('meta[name="description"]').getAttribute('content');
      const og = await page.locator('meta[property="og:title"]').getAttribute('content');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      if (!response?.ok() || !title || !h1?.trim() || !meta || !og || overflow) failures.push({ width, route, status: response?.status(), title, h1, description: !!meta, og: !!og, overflow });
    }
    await page.close();
  }
  if (errors.length || failures.length) throw new Error(JSON.stringify({ errors, failures }, null, 2));
  console.log(JSON.stringify({ routeCount: routes.length, widths: [1440, 360], directLoad: 'PASS', h1AndSeo: 'PASS', horizontalOverflow: 'none', pageErrors: errors }, null, 2));
} finally { await browser?.close(); server.kill(); }
