import { strict as assert } from 'node:assert';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import orderHandler from '../api/payments/order.js';
import verifyHandler from '../api/payments/verify.js';
import accessHandler from '../api/payments/access.js';
import webhookHandler from '../api/payments/webhook.js';
import adminUsersHandler from '../api/admin/users.js';
import adminEntitlementsHandler from '../api/admin/entitlements.js';
import adminAuditHandler from '../api/admin/audit.js';

process.env.RAZORPAY_KEY_ID = 'rzp_test_accounts';
process.env.RAZORPAY_KEY_SECRET = 'razorpay-test-secret';
process.env.SUPABASE_URL = 'https://formready-test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-publishable';
process.env.SUPABASE_SECRET_KEY = 'test-server-secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook-test-secret';
delete process.env.PACK_TOKEN_SECRET;
const uid = 'f9ee3aad-2f46-453b-a804-6b6473d1b851';
const response = () => ({ statusCode: 200, headers: {}, status(n) { this.statusCode = n; return this; }, setHeader(k,v) { this.headers[k]=v; }, json(value) { this.data=value; return this; } });
const authHeader = { authorization: 'Bearer test-user-jwt' };
const paymentSignature = (orderId, paymentId) => createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');

test('account checkout authenticates and persists the server-priced order', async () => {
  const urls=[];
  globalThis.fetch = async (url, options={}) => {
    urls.push(String(url));
    if (String(url).endsWith('/auth/v1/user')) return new Response(JSON.stringify({ id: uid, email: 'buyer@example.com' }));
    if (String(url).includes('/rest/v1/rpc/consume_api_rate_limit')) return new Response('true');
    if (String(url).includes('/rest/v1/orders')) {
      assert.match(options.headers.Authorization,/test-server-secret/);
      assert.equal(JSON.parse(options.body).user_id,uid);
      return new Response('',{status:201});
    }
    if (String(url).endsWith('/v1/orders')) {
      const body=JSON.parse(options.body); assert.equal(body.amount,4900); assert.equal(body.notes.user_id,uid);
      return new Response(JSON.stringify({ id:'order_account1', amount:4900, currency:'INR' }));
    }
    throw new Error(`unexpected fetch ${url}`);
  };
  const res=response(); await orderHandler({method:'POST',headers:authHeader,body:{plan:'examPack',amount:1}},res);
  assert.equal(res.statusCode,200); assert.equal(res.data.orderId,'order_account1'); assert.ok(urls.some(url=>url.includes('/rest/v1/orders')));
});

test('account checkout refuses missing authentication', async () => {
  globalThis.fetch = async () => new Response('{}',{status:401});
  const res=response(); await orderHandler({method:'POST',headers:{},body:{plan:'examPack'}},res);
  assert.equal(res.statusCode,401); assert.equal(res.data.error,'login_required');
});

test('captured checkout callback grants the persisted order to its owning account', async () => {
  const orderId='order_account2', paymentId='pay_account2';
  globalThis.fetch=async (url,options={})=>{
    const u=String(url);
    if(u.endsWith('/auth/v1/user'))return new Response(JSON.stringify({id:uid,email:'buyer@example.com'}));
    if(u.includes('/v1/orders/'))return new Response(JSON.stringify({id:orderId,amount:4900,currency:'INR',notes:{product_id:'examPack',user_id:uid,application:'formready'}}));
    if(u.includes('/v1/payments/'))return new Response(JSON.stringify({id:paymentId,order_id:orderId,amount:4900,currency:'INR',status:'captured',captured:true,created_at:Math.floor(Date.now()/1000)}));
    if(u.includes('/rest/v1/orders?'))return new Response(JSON.stringify([{user_id:uid,plan:'examPack',amount:4900,status:'created'}]));
    if(u.includes('/rest/v1/rpc/finalize_razorpay_order'))return new Response(JSON.stringify({plan:'examPack',expires_at:new Date(Date.now()+86400000).toISOString()}));
    throw new Error(`unexpected fetch ${url}`);
  };
  const res=response(); await verifyHandler({method:'POST',headers:authHeader,body:{plan:'examPack',orderId,paymentId,signature:paymentSignature(orderId,paymentId)}},res);
  assert.equal(res.statusCode,200); assert.equal(res.data.plan,'examPack'); assert.ok(res.data.expiresAt>Date.now());
});

test('account access is read from a live database entitlement', async () => {
  globalThis.fetch=async url=>{
    if(String(url).endsWith('/auth/v1/user'))return new Response(JSON.stringify({id:uid,email:'buyer@example.com'}));
    if(String(url).includes('/rest/v1/entitlements?'))return new Response(JSON.stringify([{plan:'seasonPass',expires_at:new Date(Date.now()+3600000).toISOString()}]));
    throw new Error(`unexpected fetch ${url}`);
  };
  const res=response(); await accessHandler({method:'POST',headers:authHeader,body:{}},res);
  assert.equal(res.statusCode,200); assert.equal(res.data.plan,'seasonPass');
});

test('signed captured-payment webhook finalizes a browser-abandoned order and rejects bad signatures', async () => {
  const body=Buffer.from(JSON.stringify({event:'payment.captured',payload:{payment:{entity:{id:'pay_hook1',order_id:'order_hook1',amount:4900,currency:'INR',status:'captured',captured:true,created_at:Math.floor(Date.now()/1000)}}}}));
  let finalized=false;
  globalThis.fetch=async (url,options={})=>{
    const u=String(url);
    if(u.includes('/rest/v1/orders?'))return new Response(JSON.stringify([{razorpay_order_id:'order_hook1',plan:'examPack',amount:4900,currency:'INR'}]));
    if(u.includes('/rest/v1/rpc/finalize_razorpay_order')){finalized=true;return new Response(JSON.stringify({plan:'examPack'}));}
    if(u.includes('/rest/v1/webhook_events'))return new Response('',{status:201});
    throw new Error(`unexpected fetch ${url}`);
  };
  const signature=createHmac('sha256',process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');
  const req={method:'POST',headers:{'x-razorpay-signature':signature,'x-razorpay-event-id':'evt_account1'},rawBody:body};
  const res=response(); await webhookHandler(req,res); assert.equal(res.statusCode,200); assert.equal(finalized,true);
  const bad=response(); await webhookHandler({...req,headers:{...req.headers,'x-razorpay-signature':'0'.repeat(64)}},bad); assert.equal(bad.statusCode,400);
});

test('owner dashboard lists account orders and entitlements through the server credential', async () => {
  process.env.ADMIN_USER_IDS=uid;
  globalThis.fetch=async(url,options={})=>{
    const u=String(url); if(u.endsWith('/auth/v1/user'))return new Response(JSON.stringify({id:uid,email:'owner@example.com'}));
    assert.match(options.headers.Authorization,/test-server-secret/);
    if(u.includes('/rest/v1/profiles?'))return new Response(JSON.stringify([{user_id:uid,email:'buyer@example.com',full_name:'Buyer',created_at:new Date().toISOString()}]));
    if(u.includes('/rest/v1/orders?'))return new Response(JSON.stringify([{user_id:uid,plan:'examPack',amount:4900,status:'paid'}]));
    if(u.includes('/rest/v1/entitlements?'))return new Response(JSON.stringify([{id:'e3b1d364-8e95-4b1c-9974-027c94c85082',user_id:uid,plan:'examPack',status:'active'}]));
    throw new Error(`unexpected fetch ${url}`);
  };
  const res=response(); await adminUsersHandler({method:'GET',headers:authHeader,query:{}},res);
  assert.equal(res.statusCode,200); assert.equal(res.data.users[0].orders[0].amount,4900); assert.equal(res.data.users[0].entitlements[0].status,'active');
});

test('owner pass grant and revoke use atomic audited database functions', async () => {
  process.env.ADMIN_USER_IDS=uid; const calls=[];
  globalThis.fetch=async(url,options={})=>{
    const u=String(url); if(u.endsWith('/auth/v1/user'))return new Response(JSON.stringify({id:uid,email:'owner@example.com'}));
    if(u.includes('/rest/v1/rpc/')){const payload=JSON.parse(options.body);calls.push({url:u,payload});return new Response(JSON.stringify(u.includes('admin_grant')?{id:'e3b1d364-8e95-4b1c-9974-027c94c85082',plan:payload.p_plan,expires_at:new Date(Date.now()+86400000).toISOString()}:{revoked:true}));}
    throw new Error(`unexpected fetch ${url}`);
  };
  const grant=response(); await adminEntitlementsHandler({method:'POST',headers:authHeader,body:{email:'buyer@example.com',plan:'examPack',reason:'UPI transfer checked'}},grant);
  assert.equal(grant.statusCode,200); assert.equal(calls[0].payload.p_actor,uid); assert.equal(calls[0].payload.p_reason,'UPI transfer checked');
  const revoke=response(); await adminEntitlementsHandler({method:'DELETE',headers:authHeader,body:{id:'e3b1d364-8e95-4b1c-9974-027c94c85082',reason:'Refunded'}},revoke);
  assert.equal(revoke.statusCode,200); assert.equal(revoke.data.revoked,true); assert.equal(calls[1].payload.p_entitlement,'e3b1d364-8e95-4b1c-9974-027c94c85082');
});

test('owner user search paginates account records and reports whether more exist', async () => {
  process.env.ADMIN_USER_IDS=uid;
  globalThis.fetch=async url=>{
    const u=String(url); if(u.endsWith('/auth/v1/user'))return new Response(JSON.stringify({id:uid,email:'owner@example.com'}));
    if(u.includes('/rest/v1/profiles?')){assert.match(u,/limit=51&offset=50/);return new Response(JSON.stringify([{user_id:uid,email:'buyer@example.com',full_name:'Buyer',created_at:new Date().toISOString()}]));}
    if(u.includes('/rest/v1/orders?')||u.includes('/rest/v1/entitlements?'))return new Response('[]');
    throw new Error(`unexpected fetch ${url}`);
  };
  const res=response(); await adminUsersHandler({method:'GET',headers:authHeader,query:{page:'1'}},res);
  assert.equal(res.statusCode,200); assert.equal(res.data.page,1); assert.equal(res.data.hasMore,false);
});

test('owner audit endpoint returns recent administrative actions and blocks non-admins', async () => {
  process.env.ADMIN_USER_IDS=uid;
  globalThis.fetch=async url=>{
    const u=String(url); if(u.endsWith('/auth/v1/user'))return new Response(JSON.stringify({id:uid,email:'owner@example.com'}));
    if(u.includes('/rest/v1/admin_audit?'))return new Response(JSON.stringify([{action:'grant',reason:'UPI verified'}]));
    throw new Error(`unexpected fetch ${url}`);
  };
  const allowed=response(); await adminAuditHandler({method:'GET',headers:authHeader},allowed);
  assert.equal(allowed.statusCode,200); assert.equal(allowed.data.events[0].reason,'UPI verified');
  globalThis.fetch=async()=>new Response(JSON.stringify({id:'00000000-0000-4000-8000-000000000000',email:'buyer@example.com'}));
  const denied=response(); await adminAuditHandler({method:'GET',headers:authHeader},denied);
  assert.equal(denied.statusCode,403); assert.equal(denied.data.error,'admin_required');
});

test('non-admin account cannot access owner endpoints', async () => {
  process.env.ADMIN_USER_IDS=uid;
  globalThis.fetch=async url=>new Response(JSON.stringify({id:'00000000-0000-4000-8000-000000000000',email:'buyer@example.com'}));
  const res=response(); await adminUsersHandler({method:'GET',headers:authHeader,query:{}},res);
  assert.equal(res.statusCode,403); assert.equal(res.data.error,'admin_required');
});
