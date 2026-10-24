export function track(name, params = {}) {
  if (!import.meta.env.VITE_GA_ID || localStorage.getItem('fr-consent') !== 'accepted') return Promise.resolve();
  return new Promise(resolve => {
    let finished = false;
    const finish = () => { if (!finished) { finished = true; clearTimeout(fallback); resolve(); } };
    const fallback = setTimeout(finish, 400);
    const send = () => window.gtag?.('event', name, {
      ...params,
      transport_type: 'beacon',
      event_callback: finish,
      event_timeout: 400,
    });
    if (window.__frGtagReady) send();
    else (window.__frAnalyticsQueue ||= []).push(send);
  });
}

export function flushAnalyticsQueue() {
  window.__frGtagReady = true;
  for (const send of window.__frAnalyticsQueue || []) send();
  window.__frAnalyticsQueue = [];
}
