import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import config from '../../site.config.json' with { type: 'json' };

const catalog = {
  examPack: { amount: config.prices.examPack * 100, durationMs: 24 * 60 * 60 * 1000, label: 'Exam Pack · 24-hour access' },
  seasonPass: { amount: config.prices.seasonPass * 100, durationMs: 60 * 24 * 60 * 60 * 1000, label: 'Season Pass · 60-day access' },
};
export function productFor(id) { return catalog[id] || null; }
export function configured() { return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.PACK_TOKEN_SECRET); }
export function tokenConfigured() { return Boolean(process.env.PACK_TOKEN_SECRET); }
export function reply(res, status, data) { res.setHeader('Cache-Control', 'no-store, private'); return res.status(status).json(data); }
export function method(req, res) { if (req.method === 'POST') return true; res.setHeader('Allow', 'POST'); reply(res, 405, { error: 'method_not_allowed' }); return false; }
export function requiredSecrets(res) {
  const accountMode = Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && (accountMode || process.env.PACK_TOKEN_SECRET)) return true;
  reply(res, 503, { error: 'payments_not_configured' }); return false;
}
export function razorpayAuth() { return `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`; }
export async function razorpay(path, options = {}) {
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...options,
    headers: { Authorization: razorpayAuth(), 'Content-Type': 'application/json', ...options.headers },
    signal: AbortSignal.timeout(10000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error('Razorpay request failed'); error.status = response.status; throw error; }
  return body;
}
export function validHexHmac(value, expected) {
  if (typeof value !== 'string' || !/^[a-f\d]{64}$/i.test(value)) return false;
  const supplied = Buffer.from(value, 'hex'); const digest = Buffer.from(expected, 'hex');
  return supplied.length === digest.length && timingSafeEqual(supplied, digest);
}
export function signAccess(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', process.env.PACK_TOKEN_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}
export function readAccess(token) {
  if (typeof token !== 'string' || token.length > 2000 || !tokenConfigured()) return null;
  const [data, signature, extra] = token.split('.');
  if (!data || !signature || extra) return null;
  const expected = createHmac('sha256', process.env.PACK_TOKEN_SECRET).update(data).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.v !== 1 || !productFor(payload.plan) || !Number.isFinite(payload.expiresAt) || payload.expiresAt <= Date.now()) return null;
    return payload;
  } catch { return null; }
}
export function newEntitlement(plan, paymentId, paymentCreatedAt) {
  const product = productFor(plan); const now = Date.now();
  const createdAt = Number(paymentCreatedAt) * 1000;
  if (!product || !Number.isFinite(createdAt) || createdAt <= 0 || createdAt > now + 60000) return null;
  const expiresAt = createdAt + product.durationMs;
  if (expiresAt <= now) return null;
  const payload = { v: 1, plan, paymentId, issuedAt: now, expiresAt };
  return { token: signAccess(payload), plan, expiresAt };
}
export { randomUUID };

