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
  const q = String(req.query?.q || '').trim().slice(0, 100);
  const page = Math.min(9999, Math.max(0, Number.parseInt(req.query?.page || '0', 10) || 0));
  try {
    const profileFilter = q ? `&or=(email.ilike.*${encodeURIComponent(q)}*,full_name.ilike.*${encodeURIComponent(q)}*)` : '';
    const rows = await db(`profiles?select=user_id,email,full_name,created_at&order=created_at.desc&limit=51&offset=${page * 50}${profileFilter}`);
    const hasMore = rows.length > 50;
    const profiles = rows.slice(0, 50);
    const ids = profiles.map(p => p.user_id);
    if (!ids.length) return reply(res, 200, { users: [], page, hasMore: false });
    const filter = `in.(${ids.join(',')})`;
    const [orders, entitlements] = await Promise.all([
      db(`orders?user_id=${filter}&select=user_id,plan,amount,currency,status,razorpay_payment_id,created_at,paid_at&order=created_at.desc`),
      db(`entitlements?user_id=${filter}&select=id,user_id,plan,starts_at,expires_at,status,payment_id,grant_reason,created_at&order=created_at.desc`),
    ]);
    const users = profiles.map(profile => ({ ...profile, orders: orders.filter(x => x.user_id === profile.user_id), entitlements: entitlements.filter(x => x.user_id === profile.user_id) }));
    return reply(res, 200, { users, page, hasMore });
  } catch { return reply(res, 503, { error: 'admin_data_unavailable' }); }
}
