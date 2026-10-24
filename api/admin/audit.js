import { adminRequired, authenticate, db, isAdmin } from '../payments/_account.js';
import { reply } from '../payments/_shared.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, private');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return reply(res, 405, { error: 'method_not_allowed' }); }
  if (!adminRequired(res)) return;
  let actor;
  try { actor = await authenticate(req); } catch { return reply(res, 503, { error: 'account_check_unavailable' }); }
  if (!actor) return reply(res, 401, { error: 'login_required' });
  if (!isAdmin(actor.id)) return reply(res, 403, { error: 'admin_required' });
  try {
    const events = await db('admin_audit?select=actor_user_id,subject_user_id,action,reason,entitlement_id,created_at&order=created_at.desc&limit=50');
    return reply(res, 200, { events });
  } catch { return reply(res, 503, { error: 'admin_data_unavailable' }); }
}
