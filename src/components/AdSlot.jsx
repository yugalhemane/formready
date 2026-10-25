import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { accountAccessIsActive } from '../lib/accessHint';
import { adsenseClient } from '../config';

function legacyAccessIsActive() {
  try { return JSON.parse(localStorage.getItem('fr-unlock') || 'null')?.expiresAt > Date.now(); }
  catch { return false; }
}

export default function AdSlot({ slot = 'tool-below', label = 'Advertisement' }) {
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
  useEffect(() => { if (enabled) try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {} }, [enabled]);
  if (consent !== 'accepted' || paid || pathname === '/exam-pack') return null;
  return <aside className={`ad-slot ad-${slot}`} aria-label={label}>{enabled ? <ins className="adsbygoogle" style={{ display: 'block', minHeight: 90 }} data-ad-client={client} data-ad-slot={unit} data-ad-format="auto" /> : <span>{label}</span>}</aside>;
}
