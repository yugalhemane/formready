import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { presets } from '../src/data/presets.js';

const origin = 'http://127.0.0.1:5197';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5197', '--strictPort'], { stdio: 'ignore', env: { ...process.env, VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://formready-route-test.supabase.co', VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'route-test-anon-key' } });
let browser;
try {
  let ready = false;
  for (let n = 0; n < 40; n++) { try { if ((await fetch(origin)).ok) { ready = true; break; } } catch {} await new Promise(resolve => setTimeout(resolve, 250)); }
  if (!ready) throw new Error('Vite server did not start');
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const routes = ['/', '/exam-pack', '/pricing', '/account', '/admin', '/about', '/contact', '/privacy-policy', '/terms', '/disclaimer', '/tool/custom', '/tool/pdf', ...presets.map(p => `/tool/${p.id}`)];
  const failures = [], errors = [];
  for (const theme of ['light', 'dark']) for (const width of [360, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.addInitScript(themeName => { localStorage.setItem('fr-lang', 'en'); localStorage.setItem('fr-tour-seen-v1', '1'); localStorage.setItem('fr-consent', 'declined'); localStorage.setItem('fr-theme', themeName); }, theme);
    page.on('pageerror', error => errors.push(`${theme} ${width}px ${page.url()}: ${error.message}`));
    for (const route of routes) {
      const response = await page.goto(`${origin}${route}`);
      await page.waitForFunction(themeName => document.documentElement.dataset.theme === themeName, theme);
      await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
      const title = await page.title(), h1 = await page.locator('main h1').first().textContent().catch(() => '');
      const meta = await page.locator('meta[name="description"]').getAttribute('content');
      const og = await page.locator('meta[property="og:title"]').getAttribute('content');
      const visual = await page.evaluate(() => {
        const rgb = value => value.match(/\d+/g)?.slice(0, 3).map(Number) || [];
        const root = getComputedStyle(document.documentElement).backgroundColor;
        const body = getComputedStyle(document.body).backgroundColor;
        const isDark = root === 'rgb(17, 24, 39)' && body === 'rgb(17, 24, 39)';
        const buttons = [...document.querySelectorAll('.btn,.consent button')].filter(el => el.getClientRects().length).map(el => {
          const s = getComputedStyle(el), fg = rgb(s.color); let node = el, bg = [];
          while (node && !bg.length) { const value = getComputedStyle(node).backgroundColor, channels = rgb(value); if (channels.length === 3 && !value.endsWith(', 0)')) bg = channels; node = node.parentElement; }
          if (!bg.length) bg = rgb(getComputedStyle(document.body).backgroundColor);
          const lum = c => { c /= 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
          const [a,b] = [bg.map(lum).reduce((x,v,i)=>x+[.2126,.7152,.0722][i]*v,0), fg.map(lum).reduce((x,v,i)=>x+[.2126,.7152,.0722][i]*v,0)].sort((x,y)=>y-x);
          return { contrast: (a + .05) / (b + .05), background: bg, color: fg, disabled: el.disabled, text: el.innerText };
        });
        return { root, body, isDark, minButtonContrast: buttons.length ? Math.min(...buttons.map(p=>p.contrast)) : null, buttons, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
      });
      if (!response?.ok() || !title || !h1?.trim() || !meta || !og || visual.overflow || (theme === 'dark' && !visual.isDark) || visual.minButtonContrast !== null && visual.minButtonContrast < 4.5) failures.push({ theme, width, route, status: response?.status(), title, h1, description: !!meta, og: !!og, ...visual });
      if (theme === 'dark' && route === '/pricing') {
        const cta = page.locator('.payment-login-cta').first();
        if (await cta.count() && await cta.getAttribute('href') !== '/account?next=%2Fpricing') failures.push({ theme, width, route, loginReturn: await cta.getAttribute('href') });
        if (!(await cta.count())) failures.push({ theme, width, route, loginReturn: 'missing sign-in CTA' });
      }
      if (route === '/') {
        const icons = await page.evaluate(async () => {
          const favicon = document.querySelector('link[rel="icon"]')?.href;
          const apple = document.querySelector('link[rel="apple-touch-icon"]')?.href;
          const dimensions = async src => { const image = new Image(); image.src = src; await image.decode(); return [image.naturalWidth, image.naturalHeight]; };
          return { favicon: await dimensions(favicon), apple: await dimensions(apple), brandLogo: document.querySelectorAll('img.brand-logo').length };
        });
        if (icons.favicon[0] !== 64 || icons.apple[0] !== 180 || icons.brandLogo < 1) failures.push({ theme, width, route, icons });
      }
      if (route === '/' || route === '/tool/ibps' || route === '/pricing') await page.screenshot({ path: `test-shots/${theme}-${route === '/' ? 'home' : route === '/pricing' ? 'pricing' : 'tool'}-${width}.png`, fullPage: true });
    }
    await page.close();
  }
  if (errors.length || failures.length) throw new Error(JSON.stringify({ errors, failures }, null, 2));
  console.log(JSON.stringify({ routeCount: routes.length, themes: ['light', 'dark'], widths: [360, 768, 1440], directLoad: 'PASS', h1AndSeo: 'PASS', darkCanvas: 'PASS', allVisibleButtonContrast: '>=4.5:1', signedOutPurchaseRedirect: 'PASS', horizontalOverflow: 'none', pageErrors: errors }, null, 2));
} finally { await browser?.close(); server.kill(); }
