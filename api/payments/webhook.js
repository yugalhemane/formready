import { createHmac } from 'node:crypto';
import { db } from './_account.js';
import { validHexHmac } from './_shared.js';

export const config = { api: { bodyParser: false } };

async function rawBody(req) {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (typeof req.rawBody === 'string') return Buffer.from(req.rawBody);
  if (Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method_not_allowed' }); }
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !process.env.SUPABASE_URL || !(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) return res.status(503).json({ error: 'webhook_not_configured' });
  try {
    const raw = await rawBody(req);
    const signature = req.headers['x-razorpay-signature'];
    const expected = createHmac('sha256', secret).update(raw).digest('hex');
    if (!validHexHmac(signature, expected)) return res.status(400).json({ error: 'signature_invalid' });
    const eventId = req.headers['x-razorpay-event-id'];
    if (typeof eventId !== 'string' || !eventId) return res.status(400).json({ error: 'event_id_missing' });
    const event = JSON.parse(raw.toString('utf8'));
    if (!['payment.captured', 'order.paid'].includes(event.event)) return res.status(200).json({ ignored: true });
    const entity = event.payload?.payment?.entity;
    if (!entity?.order_id || !entity?.id || entity.status !== 'captured' || entity.captured !== true) return res.status(400).json({ error: 'captured_payment_missing' });
    const orders = await db(`orders?razorpay_order_id=eq.${encodeURIComponent(entity.order_id)}&select=razorpay_order_id,plan,amount,currency`);
    const order = orders?.[0];
    const notePlan = event.payload?.order?.entity?.notes?.product_id;
    if (!order || order.amount !== entity.amount || order.currency !== entity.currency || (event.event === 'order.paid' && notePlan && order.plan !== notePlan)) return res.status(400).json({ error: 'payment_order_mismatch' });
    await db('rpc/finalize_razorpay_order', { method: 'POST', body: JSON.stringify({ p_order_id: entity.order_id, p_payment_id: entity.id, p_paid_at: new Date(entity.created_at * 1000).toISOString() }) });
    await db('webhook_events', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify({ event_id: eventId, event_type: event.event, processed_at: new Date().toISOString() }) });
    return res.status(200).json({ received: true });
  } catch {
    return res.status(500).json({ error: 'webhook_processing_failed' });
  }
}
