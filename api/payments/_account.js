const base = () => (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const publishable = () => process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';
const secret = () => process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const accountConfigured = () => Boolean(base() && publishable() && secret());
export const accountsRequested = () => Boolean(base());

export function bearer(req) {
  const value = req.headers?.authorization || req.headers?.Authorization || '';
  return /^Bearer [A-Za-z0-9._~-]+$/.test(value) ? value.slice(7) : null;
}

export async function authenticate(req) {
  const token = bearer(req);
  if (!token || !base() || !publishable()) return null;
  const response = await fetch(`${base()}/auth/v1/user`, {
    headers: { apikey: publishable(), Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;
  const user = await response.json().catch(() => null);
  return user?.id && user?.email ? user : null;
}

export async function db(path, options = {}) {
  if (!base() || !secret()) throw new Error('supabase_not_configured');
  const key = secret();
  // Supabase's new sb_secret_* API keys are not JWTs. Send them only via
  // apikey; legacy service_role keys are JWTs and also act as the bearer role.
  const authorization = key.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${key}` };
  const response = await fetch(`${base()}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key, ...authorization,
      'Content-Type': 'application/json', ...options.headers,
    },
    signal: AbortSignal.timeout(10000),
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) { const error = new Error(body?.message || 'database_request_failed'); error.status = response.status; throw error; }
  return body;
}

export function isAdmin(userId) {
  return (process.env.ADMIN_USER_IDS || '').split(',').map(value => value.trim()).filter(Boolean).includes(userId);
}

export async function consumeRateLimit(userId, action, limit, windowSeconds) {
  const allowed = await db('rpc/consume_api_rate_limit', { method: 'POST', body: JSON.stringify({ p_key: `${action}:${userId}`, p_limit: limit, p_window_seconds: windowSeconds }) });
  return allowed === true;
}

export function adminRequired(res) {
  if (accountConfigured()) return true;
  res.status(503).json({ error: 'accounts_not_configured' });
  return false;
}
