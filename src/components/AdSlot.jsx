import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { accountAccessIsActive } from '../lib/accessHint';
import { adsenseClient } from '../config';

function legacyAccessIsActive() {
  try { return JSON.parse(localStorage.getItem('fr-unlock') || 'null')?.expiresAt > Date.now(); }
  catch { return false; }
}

export default function AdSlot({ slot = 'tool-below', label = 'Advertisement' }) {
  const adRef = useRef(null);
  const { pathname } = useLocation();
  const [paid, setPaid] = useState(() => accountAccessIsActive() || legacyAccessIsActive());
  const consent = localStorage.getItem('fr-consent');
  const unit = import.meta.env[`VITE_AD_SLOT_${slot.toUpperCase().replaceAll('-', '_')}`];
  const client = adsenseClient;
  const enabled = consent === 'accepted' && !paid && pathname !== '/exam-pack' && client && unit;
  useEffect(() => {
    const update = () => setPaid(accountAccessIsActive() || legacyAccessIsActive());
    window.addEventListener('formready-access-change', update);
    window.addEventListener('storage', update);
    return () => { window.removeEventListener('formready-access-change', update); window.removeEventListener('storage', update); };
  }, []);
  useEffect(() => {
    if (!enabled || !adRef.current) return;
    let pushed = false;
    const pushWhenMeasurable = () => {
      if (pushed || !window.__frAdsReady || !adRef.current) return;
      if (adRef.current.getBoundingClientRect().width <= 0) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed = true;
      } catch {}
    };
    const observer = new ResizeObserver(pushWhenMeasurable);
    observer.observe(adRef.current);
    window.addEventListener('formready-ads-ready', pushWhenMeasurable);
    window.addEventListener('resize', pushWhenMeasurable);
    pushWhenMeasurable();
    return () => {
      observer.disconnect();
      window.removeEventListener('formready-ads-ready', pushWhenMeasurable);
      window.removeEventListener('resize', pushWhenMeasurable);
    };
  }, [enabled]);
  if (consent !== 'accepted' || paid || pathname === '/exam-pack') return null;
  return <aside className={`ad-slot ad-${slot}`} aria-label={label}>{enabled ? <ins ref={adRef} className="adsbygoogle" style={{ display: 'block', minHeight: 90 }} data-ad-client={client} data-ad-slot={unit} data-ad-format="auto" /> : <span>{label}</span>}</aside>;
}
