import { strict as assert } from 'node:assert';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { newEntitlement, readAccess, validHexHmac } from '../api/payments/_shared.js';
import verifyHandler from '../api/payments/verify.js';
import orderHandler from '../api/payments/order.js';

process.env.RAZORPAY_KEY_ID = 'rzp_test_demo';
process.env.RAZORPAY_KEY_SECRET = 'razorpay-secret-for-tests';
process.env.PACK_TOKEN_SECRET = 'long-test-token-secret';
const response = () => ({ statusCode: 200, headers: {}, status(n) { this.statusCode = n; return this; }, setHeader(k, v) { this.headers[k] = v; }, json(value) { this.data = value; return this; } });
const signature = (orderId, paymentId) => createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');

test('signed access tokens accept authentic, unexpired entitlements and reject edits', () => {
  const entitlement = newEntitlement('examPack', 'pay_demo123', Date.now() / 1000);
  assert.equal(readAccess(entitlement.token)?.plan, 'examPack');
  const [payload, sig] = entitlement.token.split('.');
  assert.equal(readAccess(`${payload.slice(0, -1)}A.${sig}`), null);
  assert.equal(readAccess(`${payload}.${'0'.repeat(sig.length)}`), null);
});

test('payment verify requires matching captured Razorpay order and payment', async () => {
  const orderId = 'order_demo123', paymentId = 'pay_demo123';
  globalThis.fetch = async url => {
    const isOrder = String(url).includes('/orders/');
    return new Response(JSON.stringify(isOrder
      ? { id: orderId, amount: 4900, currency: 'INR', notes: { product_id: 'examPack', application: 'formready' } }
      : { id: paymentId, order_id: orderId, amount: 4900, currency: 'INR', status: 'captured', captured: true, created_at: Math.floor(Date.now() / 1000) }), { status: 200 });
  };
  const res = response();
  await verifyHandler({ method: 'POST', body: { plan: 'examPack', orderId, paymentId, signature: signature(orderId, paymentId) } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(readAccess(res.data.token)?.plan, 'examPack');
  assert.equal(validHexHmac('0'.repeat(64), signature(orderId, paymentId)), false);
});

test('payment verify does not grant access before capture', async () => {
  globalThis.fetch = async url => new Response(JSON.stringify(String(url).includes('/orders/')
    ? { id: 'order_demo123', amount: 4900, currency: 'INR', notes: { product_id: 'examPack', application: 'formready' } }
    : { id: 'pay_demo123', order_id: 'order_demo123', amount: 4900, currency: 'INR', status: 'authorized', captured: false, created_at: Math.floor(Date.now() / 1000) }), { status: 200 });
  const res = response();
  await verifyHandler({ method: 'POST', body: { plan: 'examPack', orderId: 'order_demo123', paymentId: 'pay_demo123', signature: signature('order_demo123', 'pay_demo123') } }, res);
  assert.equal(res.statusCode, 202);
  assert.equal(res.data.error, 'payment_not_captured');
});

test('order creation ignores client prices and uses the server catalog', async () => {
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.amount, 4900);
    assert.equal(body.currency, 'INR');
    assert.equal(body.notes.product_id, 'examPack');
    return new Response(JSON.stringify({ id: 'order_demo123', amount: body.amount, currency: body.currency }), { status: 200 });
  };
  const res = response();
  await orderHandler({ method: 'POST', body: { plan: 'examPack', amount: 1 } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.data.keyId, 'rzp_test_demo');
  const invalid = response();
  await orderHandler({ method: 'POST', body: { plan: 'unknown' } }, invalid);
  assert.equal(invalid.statusCode, 400);
});

test('order creation returns a server error when Razorpay rejects the order request', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { description: 'test failure' } }), { status: 401 });
  const res = response();
  await orderHandler({ method: 'POST', body: { plan: 'examPack' } }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.data.error, 'order_creation_failed');
});

test('an old captured payment cannot mint fresh access by replaying its callback', () => {
  const createdAt = Math.floor((Date.now() - 25 * 60 * 60 * 1000) / 1000);
  assert.equal(newEntitlement('examPack', 'pay_replayed', createdAt), null);
});
