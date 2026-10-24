import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const origin = 'http://127.0.0.1:5196';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5196', '--strictPort'], {
  stdio: 'ignore', env: { ...process.env, VITE_SUPABASE_URL: 'https://formready-test.supabase.co', VITE_SUPABASE_ANON_KEY: 'test-publishable', VITE_RAZORPAY_KEY_ID: 'rzp_test_account' },
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
  await page.addInitScript(()=>{localStorage.setItem('fr-lang','en');localStorage.setItem('fr-tour-seen-v1','1')});
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
    localStorage.setItem('fr-lang','en');localStorage.setItem('fr-tour-seen-v1','1');
    localStorage.setItem('formready-auth',JSON.stringify({access_token:accessToken,token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,refresh_token:'test-refresh',user:{id:'f9ee3aad-2f46-453b-a804-6b6473d1b851',aud:'authenticated',role:'authenticated',email:'buyer@example.com',user_metadata:{full_name:'Test Buyer'},app_metadata:{provider:'email',providers:['email']},created_at:new Date().toISOString()}}));
  },{accessToken});
  await signedIn.route('https://formready-test.supabase.co/rest/v1/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  let paid=false, orderAuth, verifyAuth, verified=false;
  await signedIn.route('**/api/payments/access',r=>paid?r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({plan:'examPack',expiresAt:Date.now()+86400000})}):r.fulfill({status:401,contentType:'application/json',body:'{"error":"access_invalid_or_expired"}'}));
  await signedIn.route('**/api/payments/order',async r=>{orderAuth=r.request().headers().authorization;await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({keyId:'rzp_test_account',orderId:'order_account123',amount:4900,currency:'INR',name:'FormReady',description:'Exam Pack'})})});
  await signedIn.route('**/api/payments/verify',async r=>{verified=true;verifyAuth=r.request().headers().authorization;paid=true;await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({plan:'examPack',expiresAt:Date.now()+86400000})})});
  await signedIn.route('https://checkout.razorpay.com/v1/checkout.js',r=>r.fulfill({contentType:'application/javascript',body:"window.Razorpay=class{constructor(options){this.options=options}on(){}open(){setTimeout(()=>this.options.handler({razorpay_order_id:'order_account123',razorpay_payment_id:'pay_account123',razorpay_signature:'mock-signature'}),0)}}"}));
  await signedIn.route('**/api/admin/users**',r=>r.fulfill({status:403,contentType:'application/json',body:'{"error":"admin_required"}'}));
  await signedIn.route('**/api/admin/audit',r=>r.fulfill({status:403,contentType:'application/json',body:'{"error":"admin_required"}'}));
  await signedIn.goto(`${origin}/account`);
  await signedIn.getByText('buyer@example.com').first().waitFor({timeout:10000});
  await signedIn.reload();
  await signedIn.getByText('buyer@example.com').first().waitFor({timeout:10000});
  await signedIn.goto(`${origin}/pricing`);
  await signedIn.getByRole('button',{name:'Pay securely'}).first().click();
  for(let i=0;i<50&&!verified;i++)await new Promise(resolve=>setTimeout(resolve,100));
  if(!verified)throw new Error('Payment verification endpoint was not called');
  await signedIn.goto(`${origin}/exam-pack`);
  await signedIn.getByRole('button',{name:'Check all files'}).waitFor({timeout:10000});
  if(!orderAuth?.startsWith('Bearer ')||!verifyAuth?.startsWith('Bearer '))throw new Error('Account checkout order/verification did not carry the signed-in session');
  await signedIn.reload();
  await signedIn.getByRole('button',{name:'Check all files'}).waitFor({timeout:10000});
  await signedIn.goto(`${origin}/admin`);
  await signedIn.getByText('This account is not approved for owner access.').waitFor({timeout:10000});
  await signedIn.unroute('**/api/admin/users**');
  await signedIn.unroute('**/api/admin/audit');
  const entitlement={id:'38c95b1e-b97f-481f-bd97-3bbd49bd9f12',plan:'examPack',status:'active',expires_at:new Date(Date.now()+86400000).toISOString()};
  const ownerRecord={user_id:'45de97a8-97dc-47ce-a56a-123fa4f3dc51',email:'customer@example.com',full_name:'Customer Example',created_at:new Date().toISOString(),orders:[{plan:'examPack',amount:4900,status:'paid'}],entitlements:[entitlement]};
  let adminQuery='';
  await signedIn.route('**/api/admin/users**',r=>{const url=new URL(r.request().url());adminQuery=url.searchParams.get('q')||'';const currentPage=Number(url.searchParams.get('page')||0);return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({users:[ownerRecord],page:currentPage,hasMore:currentPage===0})})});
  await signedIn.route('**/api/admin/audit',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({events:[{action:'grant',reason:'Test audit entry',subject_user_id:ownerRecord.user_id,created_at:new Date().toISOString()}]})}));
  let adminAction;
  await signedIn.route('**/api/admin/entitlements',async r=>{adminAction={method:r.request().method(),body:r.request().postDataJSON()};await r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'})});
  await signedIn.goto(`${origin}/admin`);
  await signedIn.getByText('customer@example.com').waitFor({timeout:10000});
  await signedIn.getByText('Test audit entry').waitFor({timeout:10000});
  await signedIn.getByPlaceholder('Search by name or email').fill('customer');
  await signedIn.getByRole('button',{name:'Search'}).click();
  for(let i=0;i<50&&adminQuery!=='customer';i++)await new Promise(resolve=>setTimeout(resolve,100));
  await signedIn.getByRole('button',{name:'Next'}).click();
  await signedIn.getByText('Page 2').waitFor();
  await signedIn.getByRole('button',{name:'Previous'}).click();
  await signedIn.getByText('Page 1').waitFor();
  await signedIn.getByPlaceholder('Email address').fill('customer@example.com');
  await signedIn.getByPlaceholder('Reason for this action').fill('Verified test purchase');
  await signedIn.getByRole('button',{name:'Grant access'}).click();
  for(let i=0;i<50&&adminAction?.method!=='POST';i++)await new Promise(resolve=>setTimeout(resolve,100));
  if(adminAction?.method!=='POST'||adminAction.body?.reason!=='Verified test purchase')throw new Error('Admin grant did not submit the required reason');
  await signedIn.getByPlaceholder('Reason for this action').fill('Refund verified');
  await signedIn.getByRole('button',{name:'Revoke'}).click();
  for(let i=0;i<50&&adminAction?.method!=='DELETE';i++)await new Promise(resolve=>setTimeout(resolve,100));
  if(adminAction?.method!=='DELETE'||adminAction.body?.id!==entitlement.id||adminAction.body?.reason!=='Refund verified')throw new Error('Admin revoke did not send the entitlement ID');
  if(errors.length)throw new Error(`Account page browser errors: ${errors.join('; ')}`);
  console.log(JSON.stringify({emailOtp:'PASS',accountPage:'PASS',sessionPersists:'PASS',accountCheckout:'PASS',paidAccessPersists:'PASS',nonAdminBlocked:'PASS',adminDashboard:'PASS',searchAndPagination:'PASS',grantWithReason:'PASS',revoke:'PASS',errors}));
} finally { await browser?.close(); server.kill(); }
