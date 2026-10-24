import { adminRequired, authenticate, db, isAdmin } from '../payments/_account.js';
import { reply } from '../payments/_shared.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, private');
  if (!['POST', 'DELETE'].includes(req.method)) { res.setHeader('Allow', 'POST, DELETE'); return reply(res, 405, { error: 'method_not_allowed' }); }
  if (!adminRequired(res)) return;
  let actor;
  try { actor = await authenticate(req); } catch { return reply(res, 503, { error: 'account_check_unavailable' }); }
  if (!actor) return reply(res, 401, { error: 'login_required' });
  if (!isAdmin(actor.id)) return reply(res, 403, { error: 'admin_required' });
  const reason = String(req.body?.reason || '').trim().slice(0, 500);
  if (!reason) return reply(res, 400, { error: 'reason_required' });
  try {
    if (req.method === 'POST') {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const plan = req.body?.plan;
      const days = plan === 'examPack' ? 1 : plan === 'seasonPass' ? 60 : 0;
      if (!email || !days) return reply(res, 400, { error: 'invalid_user_or_plan' });
      const entitlement = await db('rpc/admin_grant_entitlement', { method: 'POST', body: JSON.stringify({ p_actor: actor.id, p_email: email, p_plan: plan, p_reason: reason }) });
      return reply(res, 200, { entitlement });
    }
    const id = String(req.body?.id || '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return reply(res, 400, { error: 'invalid_entitlement' });
    const result = await db('rpc/admin_revoke_entitlement', { method: 'POST', body: JSON.stringify({ p_actor: actor.id, p_entitlement: id, p_reason: reason }) });
    return reply(res, 200, result);
  } catch (error) {
    if (error.message === 'user_not_found') return reply(res, 404, { error: 'user_not_found' });
    if (error.message === 'entitlement_not_found') return reply(res, 404, { error: 'entitlement_not_found' });
    return reply(res, 503, { error: 'admin_action_failed' });
  }
}
