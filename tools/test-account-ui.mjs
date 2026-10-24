import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const origin = 'http://127.0.0.1:5196';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5196', '--strictPort'], {
  stdio: 'ignore', env: { ...process.env, VITE_SUPABASE_URL: 'https://formready-test.supabase.co', VITE_SUPABASE_ANON_KEY: 'test-publishable', VITE_RAZORPAY_KEY_ID: '' },
});
let browser;
try {
  let ready = false;
  for (let i=0; i<40; i++) { try { if ((await fetch(origin)).ok) { ready=true; break; } } catch {} await new Promise(r=>setTimeout(r,250)); }
  if (!ready) throw new Error('Vite server did not start');
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage(); const errors=[]; let otpPayload;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/auth/v1/otp**',async route=>{otpPayload=route.request().postDataJSON();await route.fulfill({status:200,contentType:'application/json',body:'{}'});});
  await page.addInitScript(()=>localStorage.setItem('fr-lang','en'));
  await page.goto(`${origin}/account`);
  await page.getByLabel('Full name').fill('Test Buyer');
  await page.getByLabel('Email address').fill('buyer@example.com');
  await page.getByRole('button',{name:'Email me a sign-in link'}).click();
  await page.getByText('Check your email for the sign-in link.').waitFor();
  if(otpPayload?.email!=='buyer@example.com'||otpPayload?.data?.full_name!=='Test Buyer')throw new Error('Email sign-in request did not carry the entered account details');

  const signedIn=await browser.newPage();
  signedIn.on('pageerror',e=>errors.push(e.message));
  const accessToken=`e30.${Buffer.from(JSON.stringify({sub:'f9ee3aad-2f46-453b-a804-6b6473d1b851',aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600,email:'buyer@example.com'})).toString('base64url')}.signature`;
  await signedIn.addInitScript(({accessToken})=>{
    localStorage.setItem('fr-lang','en');
    localStorage.setItem('formready-auth',JSON.stringify({access_token:accessToken,token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,refresh_token:'test-refresh',user:{id:'f9ee3aad-2f46-453b-a804-6b6473d1b851',aud:'authenticated',role:'authenticated',email:'buyer@example.com',user_metadata:{full_name:'Test Buyer'},app_metadata:{provider:'email',providers:['email']},created_at:new Date().toISOString()}}));
  },{accessToken});
  await signedIn.route('https://formready-test.supabase.co/rest/v1/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  await signedIn.route('**/api/payments/access',r=>r.fulfill({status:401,contentType:'application/json',body:'{"error":"access_invalid_or_expired"}'}));
  await signedIn.route('**/api/admin/users**',r=>r.fulfill({status:403,contentType:'application/json',body:'{"error":"admin_required"}'}));
  await signedIn.goto(`${origin}/account`);
  await signedIn.getByText('buyer@example.com').first().waitFor({timeout:10000});
  await signedIn.goto(`${origin}/admin`);
  await signedIn.getByText('This account is not approved for owner access.').waitFor({timeout:10000});
  if(errors.length)throw new Error(`Account page browser errors: ${errors.join('; ')}`);
  console.log(JSON.stringify({emailOtp:'PASS',accountPage:'PASS',nonAdminBlocked:'PASS',errors}));
} finally { await browser?.close(); server.kill(); }
