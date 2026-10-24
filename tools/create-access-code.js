import { createHmac, randomUUID } from 'node:crypto';

const [plan, paymentReference = randomUUID()] = process.argv.slice(2);
const products = {
  examPack: 24 * 60 * 60 * 1000,
  seasonPass: 60 * 24 * 60 * 60 * 1000,
};
const secret = process.env.PACK_TOKEN_SECRET;

if (!products[plan] || !secret) {
  console.error('Usage: PACK_TOKEN_SECRET=<server secret> node tools/create-access-code.js <examPack|seasonPass> [payment-reference]');
  process.exit(1);
}

const now = Date.now();
const payload = {
  v: 1,
  plan,
  paymentId: `manual:${String(paymentReference).slice(0, 120)}`,
  issuedAt: now,
  expiresAt: now + products[plan],
};
const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
const signature = createHmac('sha256', secret).update(data).digest('base64url');
console.log(`${data}.${signature}`);
console.error(`Issued ${plan}; expires ${new Date(payload.expiresAt).toISOString()}. Deliver this code privately; keep a payment record.`);
