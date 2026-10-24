const key = 'fr-account-access-hint';
export function setAccountAccessHint(userId, expiresAt) {
  localStorage.setItem(key, JSON.stringify({ userId, expiresAt }));
  window.dispatchEvent(new Event('formready-access-change'));
}
export function clearAccountAccessHint() {
  localStorage.removeItem(key);
  window.dispatchEvent(new Event('formready-access-change'));
}
export function accountAccessIsActive() {
  try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return Boolean(value?.expiresAt > Date.now()); }
  catch { return false; }
}
