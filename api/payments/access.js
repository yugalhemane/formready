import { method, readAccess, reply, tokenConfigured } from './_shared.js';
import { accountConfigured, accountsRequested, authenticate, db } from './_account.js';

export default async function handler(req, res) {
  if (!method(req, res)) return;
  if (accountsRequested()) {
    if (!accountConfigured()) return reply(res, 503, { error: 'accounts_not_configured' });
    let user;
    try { user = await authenticate(req); } catch { return reply(res, 503, { error: 'account_check_unavailable' }); }
    if (!user) return reply(res, 401, { error: 'login_required' });
    try {
      const rows = await db(`entitlements?user_id=eq.${encodeURIComponent(user.id)}&status=eq.active&starts_at=lte.${encodeURIComponent(new Date().toISOString())}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=plan,expires_at&order=expires_at.desc&limit=1`);
      const current = rows?.[0];
      if (!current) return reply(res, 401, { error: 'access_invalid_or_expired' });
      return reply(res, 200, { plan: current.plan, expiresAt: new Date(current.expires_at).getTime() });
    } catch { return reply(res, 503, { error: 'account_check_unavailable' }); }
  }
  if (!tokenConfigured()) return reply(res, 503, { error: 'payments_not_configured' });
  const entitlement = readAccess(req.body?.token);
  if (!entitlement) return reply(res, 401, { error: 'access_invalid_or_expired' });
  return reply(res, 200, { plan: entitlement.plan, expiresAt: entitlement.expiresAt });
}
