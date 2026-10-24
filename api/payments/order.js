import { method, productFor, randomUUID, razorpay, reply, requiredSecrets } from './_shared.js';
import { accountConfigured, accountsRequested, authenticate, consumeRateLimit, db } from './_account.js';

export default async function handler(req, res) {
  if (!method(req, res) || !requiredSecrets(res)) return;
  const plan = req.body?.plan;
  const product = productFor(plan);
  if (!product) return reply(res, 400, { error: 'invalid_plan' });
  let user = null;
  if (accountsRequested()) {
    if (!accountConfigured()) return reply(res, 503, { error: 'accounts_not_configured' });
    try { user = await authenticate(req); } catch { return reply(res, 503, { error: 'account_check_unavailable' }); }
    if (!user) return reply(res, 401, { error: 'login_required' });
    try { if (!await consumeRateLimit(user.id, 'payment-order', 5, 900)) return reply(res, 429, { error: 'too_many_orders' }); }
    catch { return reply(res, 503, { error: 'account_check_unavailable' }); }
  }
  try {
    const order = await razorpay('/orders', {
      method: 'POST',
      body: JSON.stringify({
        amount: product.amount,
        currency: 'INR',
        receipt: `fr_${randomUUID().replaceAll('-', '').slice(0, 30)}`,
        notes: { product_id: plan, product_name: product.label, application: 'formready', ...(user ? { user_id: user.id } : {}) },
      }),
    });
    if (user) await db('orders', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: user.id, razorpay_order_id: order.id, plan, amount: product.amount, currency: order.currency }) });
    return reply(res, 200, {
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      name: 'FormReady',
      description: product.label,
    });
  } catch {
    return reply(res, 502, { error: 'order_creation_failed' });
  }
}
