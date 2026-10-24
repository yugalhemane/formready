import { createHmac } from 'node:crypto';
import { method, newEntitlement, productFor, razorpay, reply, requiredSecrets, validHexHmac } from './_shared.js';

export default async function handler(req, res) {
  if (!method(req, res) || !requiredSecrets(res)) return;
  const { plan, orderId, paymentId, signature } = req.body || {};
  const product = productFor(plan);
  if (!product || typeof orderId !== 'string' || !/^order_[A-Za-z0-9]+$/.test(orderId) || typeof paymentId !== 'string' || !/^pay_[A-Za-z0-9]+$/.test(paymentId)) {
    return reply(res, 400, { error: 'invalid_payment_details' });
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
    const entitlement = newEntitlement(plan, paymentId, payment.created_at);
    if (!entitlement) return reply(res, 410, { error: 'access_period_expired' });
    return reply(res, 200, entitlement);
  } catch {
    return reply(res, 502, { error: 'payment_verification_unavailable' });
  }
}
