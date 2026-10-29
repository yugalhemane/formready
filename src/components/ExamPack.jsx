import { useEffect, useState } from 'react';
import { presets } from '../data/presets';
import { compressImage } from '../lib/compress';
import CropDialog from './CropDialog';
import FilePreview from './FilePreview';
import { Package } from 'lucide-react';
import { track } from '../lib/analytics';
import PaymentButton from './PaymentButton';
import { config } from '../config';
import { accountsEnabled } from '../lib/supabase';
import { setAccountAccessHint, clearAccountAccessHint } from '../lib/accessHint';

const cleanNames = { photo: 'photo.jpg', signature: 'signature.jpg', thumb: 'thumb.jpg', declaration: 'declaration.jpg', certificate: 'certificate.pdf', income: 'certificate.pdf' };
export default function ExamPack({ unlock, setUnlock, t, session, user, authReady }) {
  const [message, setMessage] = useState(''), [exam, setExam] = useState('ibps'), [files, setFiles] = useState({}), [results, setResults] = useState({}), [crop, setCrop] = useState(null), [busy, setBusy] = useState(false), [zip, setZip] = useState(''), [plan, setPlan] = useState('examPack'), [access, setAccess] = useState(null), [checkingAccess, setCheckingAccess] = useState(accountsEnabled||Boolean(unlock?.token)||Boolean(user)), [manualCode, setManualCode] = useState(''), [manualBusy, setManualBusy] = useState(false), [manualError, setManualError] = useState('');
  const p = presets.find(x => x.id === exam);
  useEffect(() => {
    let current = true;
    if (!authReady) return () => { current = false; };
    if (accountsEnabled && !user) { setAccess(null); setCheckingAccess(false); return () => { current = false; }; }
    if (!accountsEnabled && !unlock?.token) { setAccess(null); setCheckingAccess(false); return () => { current = false; }; }
    setCheckingAccess(true);
    fetch('/api/payments/access', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) }, ...(!accountsEnabled ? { body: JSON.stringify({ token: unlock.token }) } : {}) })
      .then(async response => response.ok ? response.json() : null)
      .then(value => { if (current) { setAccess(value); setCheckingAccess(false); if (accountsEnabled && value) setAccountAccessHint(user.id,value.expiresAt); if (!value) { if(accountsEnabled)clearAccountAccessHint(); localStorage.removeItem('fr-unlock'); setUnlock(null); } } })
      .catch(() => { if (current) { setAccess(null); setCheckingAccess(false); } });
    return () => { current = false; };
  }, [unlock?.token, unlock?.expiresAt, user?.id, session?.access_token, authReady, setUnlock]);
  const active = Boolean(access?.expiresAt > Date.now());
  async function redeemManualCode(event) {
    event.preventDefault();
    if (!manualCode.trim() || manualBusy) return;
    setManualBusy(true); setManualError('');
    try {
      const response = await fetch('/api/payments/access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: manualCode.trim() }) });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || 'invalid');
      localStorage.setItem('fr-unlock', JSON.stringify({ ...value, token: manualCode.trim() }));
      setUnlock({ ...value, token: manualCode.trim() });
    } catch { setManualError(t.manualCodeInvalid); }
    finally { setManualBusy(false); }
  }
  function docLabel(s) { return t[`doc_${s.id}`] || s.label; }
  async function processAll() {
    setBusy(true); setMessage(''); const next = {};
    try {
      for (const s of p.slots) {
        const file = files[s.id]; if (!file) continue;
        if (s.id === 'certificate' || s.id === 'income') {
          const { compressPdf } = await import('../lib/pdfTools'); const r = await compressPdf(file, s.maxKB); next[s.id] = { ...r, width: null, height: null, pass: r.pass }; continue;
        }
        next[s.id] = await compressImage(file, { width: s.width, height: s.height, minKB: s.minKB, maxKB: s.maxKB });
      }
      setResults(next);
    } catch (e) { setMessage(e.message || t.processError); }
    finally { setBusy(false); }
  }
  async function download() {
    const JSZip = (await import('jszip')).default, z = new JSZip();
    for (const s of p.slots) { const r = results[s.id]; if (r?.pass) z.file(cleanNames[s.id] || `${s.id}.jpg`, r.blob); }
    const blob = await z.generateAsync({ type: 'blob' }); setZip(URL.createObjectURL(blob));
  }
  return <main className="pack-page">
    <section className="hero compact"><h1>{t.prepareFiles}</h1><p>{t.packIntro}</p></section>
    {checkingAccess ? <section className="card unlock"><p>{t.checkingPayment}</p></section> : !active ? <section className="card unlock">
      <h2>{t.unlockPack}</h2><p>{t.paymentIntro}</p>
      <label>{t.selectPlan}<select id="pack-plan" name="plan" className="form-select" value={plan} onChange={e => setPlan(e.target.value)}><option value="examPack">{t.examPackPrice} — ₹{config.prices.examPack} · {t.dayAccess}</option><option value="seasonPass">{t.seasonPass} — ₹{config.prices.seasonPass} · {t.sixtyDay}</option></select></label>
      <PaymentButton plan={plan} t={t} setUnlock={setUnlock} session={session} user={user}/>
      {!accountsEnabled && <form className="manual-code" onSubmit={redeemManualCode}>
        <label htmlFor="manual-access-code">{t.manualCodeTitle}</label>
        <input className="form-control" id="manual-access-code" value={manualCode} onChange={e => setManualCode(e.target.value)} autoComplete="off" spellCheck="false" placeholder={t.manualCodePlaceholder}/>
        <button className="secondary btn btn-outline-secondary" type="submit" disabled={!manualCode.trim() || manualBusy}>{manualBusy ? t.manualCodeChecking : t.manualCodeSubmit}</button>
        {manualError && <p role="alert" className="error">{manualError}</p>}
      </form>}
      <small>{t.secureCheckoutNote}</small>
    </section> : <section className="card">
      <p className="pass">{t.paymentAccessUntil} {new Date(access.expiresAt).toLocaleString()}</p>
      <label className="pack-exam-select">{t.exam}<select id="pack-exam" name="exam" className="form-select" value={exam} onChange={e => { setExam(e.target.value); setFiles({}); setResults({}); setZip(''); }}>{presets.map(x => <option key={x.id} value={x.id}>{t[`preset_${x.id}`] || x.name}</option>)}</select></label>
      <div className="checklist">{p.slots.map(s => {
        const r = results[s.id], isPdf = s.id === 'certificate' || s.id === 'income';
        return <div key={s.id} className="checkrow"><strong>{docLabel(s)}</strong><span>{r ? (r.pass ? `✓ ${t.pass}` : `✗ ${t.failed}`) : t.notChecked}</span>{files[s.id] && <FilePreview file={files[s.id]} isPdf={isPdf} t={t}/>}<label className="file-picker" htmlFor={`file-${s.id}`}>{files[s.id]?.name || t.chooseFileLabel}</label><input className="file-input" id={`file-${s.id}`} aria-label={`${t.choosePrefix} ${docLabel(s)}`} type="file" accept={isPdf ? '.pdf' : 'image/*,.heic,.heif'} onChange={e => { const f=e.target.files?.[0]; if(f){setFiles(prev=>({...prev,[s.id]:f}));setResults(prev=>({...prev,[s.id]:null}));setZip('');} }}/><small>{r && ` · ${r.width ? `${r.width}×${r.height}px · ` : ''}${r.kb.toFixed(1)} KB (${t.limit} ${s.minKB || 0}–${s.maxKB} KB)`}</small>{files[s.id] && <div className="file-actions">{!isPdf&&<button type="button" className="secondary btn btn-outline-secondary" onClick={() => setCrop({ id: s.id, file: files[s.id], aspect: s.width / s.height })}>{t.crop}</button>}<button type="button" className="secondary btn btn-outline-secondary" onClick={() => document.getElementById(`file-${s.id}`)?.click()}>{t.fileReplace}</button><button type="button" className="secondary btn btn-outline-secondary" onClick={() => {setFiles(prev=>({...prev,[s.id]:null}));setResults(prev=>({...prev,[s.id]:null}));setZip('');const input=document.getElementById(`file-${s.id}`);if(input)input.value='';}}>{t.fileRemove}</button></div>}</div>;
      })}</div>
      <button className="primary btn btn-warning" disabled={busy || p.slots.some(s => !files[s.id])} onClick={processAll}>{busy ? t.processing : t.checkAll}</button>{message && <p className="error" role="alert">{message}</p>}
      <button className="primary btn btn-warning" disabled={!p.slots.every(s => results[s.id]?.pass)} onClick={async () => { await track('zip_downloaded', { exam }); await download(); }}><Package size={16}/> {t.downloadVerifiedZip}</button>{zip && <a className="download-link" href={zip} download={`${exam}-application-pack.zip`}>{t.downloadZip}</a>}
    </section>}
    {crop && <CropDialog file={crop.file} aspect={crop.aspect} t={t} onCancel={() => setCrop(null)} onApply={blob => { setFiles({ ...files, [crop.id]: new File([blob], files[crop.id].name, { type: 'image/jpeg' }) }); setResults({ ...results, [crop.id]: null }); setCrop(null); }}/ >}
  </main>;
}
