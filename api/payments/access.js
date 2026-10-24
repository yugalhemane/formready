import { method, readAccess, reply, tokenConfigured } from './_shared.js';

export default async function handler(req, res) {
  if (!method(req, res)) return;
  if (!tokenConfigured()) return reply(res, 503, { error: 'payments_not_configured' });
  const entitlement = readAccess(req.body?.token);
  if (!entitlement) return reply(res, 401, { error: 'access_invalid_or_expired' });
  return reply(res, 200, { plan: entitlement.plan, expiresAt: entitlement.expiresAt });
}
