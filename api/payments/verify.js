import { createHmac } from 'node:crypto';
import { method, newEntitlement, productFor, razorpay, reply, requiredSecrets, validHexHmac } from './_shared.js';
import { accountConfigured, accountsRequested, authenticate, db } from './_account.js';

export default async function handler(req, res) {
  if (!method(req, res) || !requiredSecrets(res)) return;
  const { plan, orderId, paymentId, signature } = req.body || {};
  const product = productFor(plan);
  if (!product || typeof orderId !== 'string' || !/^order_[A-Za-z0-9]+$/.test(orderId) || typeof paymentId !== 'string' || !/^pay_[A-Za-z0-9]+$/.test(paymentId)) {
    return reply(res, 400, { error: 'invalid_payment_details' });
  }
  let user = null;
  if (accountsRequested()) {
    if (!accountConfigured()) return reply(res, 503, { error: 'accounts_not_configured' });
    try { user = await authenticate(req); } catch { return reply(res, 503, { error: 'account_check_unavailable' }); }
    if (!user) return reply(res, 401, { error: 'login_required' });
  }
  const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  if (!validHexHmac(signature, expected)) return reply(res, 400, { error: 'payment_signature_invalid' });
  try {
    const [order, payment] = await Promise.all([
      razorpay(`/orders/${encodeURIComponent(orderId)}`),
      razorpay(`/payments/${encodeURIComponent(paymentId)}`),
    ]);
    if (order.id !== orderId || order.amount !== product.amount || order.currency !== 'INR' || order.notes?.product_id !== plan || order.notes?.application !== 'formready') {
      return reply(res, 400, { error: 'order_does_not_match' });
    }
    if (payment.order_id !== orderId || payment.amount !== product.amount || payment.currency !== 'INR') return reply(res, 400, { error: 'payment_does_not_match' });
    if (payment.status !== 'captured' || !payment.captured) return reply(res, 202, { error: 'payment_not_captured' });
    if (user) {
      const rows = await db(`orders?razorpay_order_id=eq.${encodeURIComponent(orderId)}&user_id=eq.${encodeURIComponent(user.id)}&select=id,plan,amount,status`);
      const saved = rows?.[0];
      if (!saved || saved.plan !== plan || saved.amount !== product.amount) return reply(res, 403, { error: 'order_not_owned_by_account' });
      const granted = await db('rpc/finalize_razorpay_order', { method: 'POST', body: JSON.stringify({ p_order_id: orderId, p_payment_id: paymentId, p_paid_at: new Date(payment.created_at * 1000).toISOString() }) });
      return reply(res, 200, { plan: granted.plan, expiresAt: new Date(granted.expires_at).getTime() });
    }
    const entitlement = newEntitlement(plan, paymentId, payment.created_at);
    if (!entitlement) return reply(res, 410, { error: 'access_period_expired' });
    return reply(res, 200, entitlement);
  } catch {
    return reply(res, 502, { error: 'payment_verification_unavailable' });
  }
}
