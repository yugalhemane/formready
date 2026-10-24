import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { PDFDocument } from 'pdf-lib';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5196', '--strictPort'], { stdio: 'ignore' });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser;
try {
  let up = false;
  for (let n = 0; n < 40; n++) { try { if ((await fetch('http://127.0.0.1:5196')).ok) { up = true; break; } } catch {} await wait(300); }
  if (!up) throw new Error('Vite did not start');
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } }), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { localStorage.setItem('fr-lang', 'en'); localStorage.setItem('fr-consent', 'declined'); localStorage.setItem('fr-tour-seen-v1', '1'); });
  await page.goto('http://127.0.0.1:5196/tool/pdf');
  await page.getByRole('button', { name: 'Dark mode' }).click();
  if (await page.locator('html').getAttribute('data-theme') !== 'dark') throw new Error('Dark mode did not activate');
  await page.reload();
  if (await page.locator('html').getAttribute('data-theme') !== 'dark') throw new Error('Dark mode did not persist on reload');
  await page.screenshot({ path: 'test-shots/dark-mode-1440.jpg', fullPage: true, type: 'jpeg', quality: 65 });
  await page.getByRole('button', { name: 'Light mode' }).click();
  await page.getByRole('tab', { name: 'Images to PDF' }).click();
  await page.locator('input[type=file]').setInputFiles(['test-assets/noisy-photo.jpg', 'test-assets/signature.jpg']);
  await page.getByRole('button', { name: 'Create PDF' }).click();
  const imagePdf = await page.locator('.document-result a').evaluate(async link => {const b=new Uint8Array(await(await fetch(link.href)).arrayBuffer());let s='';for(let i=0;i<b.length;i+=32768)s+=String.fromCharCode(...b.subarray(i,i+32768));return btoa(s)});
  const imagePages = (await PDFDocument.load(Buffer.from(imagePdf,'base64'))).getPageCount();
  if (imagePages !== 2) throw new Error(`Image conversion expected 2 pages, got ${imagePages}`);
  await page.getByRole('tab', { name: 'Merge PDFs' }).click();
  const bytes = Buffer.from(imagePdf,'base64');
  await page.locator('input[type=file]').setInputFiles([{ name: 'photos-a.pdf', mimeType: 'application/pdf', buffer: bytes }, { name: 'photos-b.pdf', mimeType: 'application/pdf', buffer: bytes }]);
  await page.getByRole('button', { name: 'Merge PDFs' }).click();
  const merged = await page.locator('.document-result a').evaluate(async link => {const b=new Uint8Array(await(await fetch(link.href)).arrayBuffer());let s='';for(let i=0;i<b.length;i+=32768)s+=String.fromCharCode(...b.subarray(i,i+32768));return btoa(s)});
  const mergedPages = (await PDFDocument.load(Buffer.from(merged,'base64'))).getPageCount();
  if (mergedPages !== 4) throw new Error(`PDF merge expected 4 pages, got ${mergedPages}`);
  await page.screenshot({ path: 'test-shots/document-workspace-1440.jpg', fullPage: true, type: 'jpeg', quality: 65 });
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
  console.log(JSON.stringify({ imagesToPdf: { inputImages: 2, outputPages: imagePages, outputKB: +(Buffer.from(imagePdf,'base64').length / 1024).toFixed(1) }, merge: { inputPdfs: 2, outputPages: mergedPages, outputKB: +(Buffer.from(merged,'base64').length / 1024).toFixed(1) }, errors }, null, 2));
} finally { await browser?.close(); server.kill(); }
