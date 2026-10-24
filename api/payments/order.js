import { method, productFor, randomUUID, razorpay, reply, requiredSecrets } from './_shared.js';

export default async function handler(req, res) {
  if (!method(req, res) || !requiredSecrets(res)) return;
  const plan = req.body?.plan;
  const product = productFor(plan);
  if (!product) return reply(res, 400, { error: 'invalid_plan' });
  try {
    const order = await razorpay('/orders', {
      method: 'POST',
      body: JSON.stringify({
        amount: product.amount,
        currency: 'INR',
        receipt: `fr_${randomUUID().replaceAll('-', '').slice(0, 30)}`,
        notes: { product_id: plan, product_name: product.label, application: 'formready' },
      }),
    });
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
