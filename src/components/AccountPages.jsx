import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { accountsEnabled } from '../lib/supabase';

export function AccountPage({ user, session, supabase, t }) {
  const [name, setName] = useState(''), [email, setEmail] = useState(user?.email || ''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [entitlements, setEntitlements] = useState([]), [orders, setOrders] = useState([]);
  const [params] = useSearchParams();
  useEffect(() => {
    if (!user || !supabase) return;
    const fullName = String(user.user_metadata?.full_name || '').trim();
    setName(fullName);
    setEmail(user.email || '');
    if (fullName) supabase.from('profiles').update({ full_name: fullName }).eq('user_id', user.id);
    supabase.from('entitlements').select('plan,starts_at,expires_at,status').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => setEntitlements(data || []));
    supabase.from('orders').select('plan,amount,currency,status,created_at,paid_at').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => setOrders(data || []));
  }, [user?.id, supabase]);
  async function signIn(event) {
    event.preventDefault(); if (!supabase || busy) return;
    setBusy(true); setMessage('');
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}${params.get('next') || '/account'}` } });
    setMessage(error ? t.authSendError : t.authLinkSent); setBusy(false);
  }
  async function updateProfile(event) {
    event.preventDefault(); if (!supabase || !user || busy) return;
    setBusy(true); setMessage('');
    const fullName = name.trim();
    const nextEmail = email.trim();
    const { error: metadataError } = await supabase.auth.updateUser({ data: { ...user.user_metadata, full_name: fullName } });
    if (metadataError) { setMessage(t.profileUpdateError); setBusy(false); return; }
    const { error: profileError } = await supabase.from('profiles').update({ full_name: fullName }).eq('user_id', user.id);
    if (profileError) { setMessage(t.profileUpdateError); setBusy(false); return; }
    if (nextEmail && nextEmail.toLowerCase() !== (user.email || '').toLowerCase()) {
      const { error } = await supabase.auth.updateUser({ email: nextEmail }, { emailRedirectTo: `${window.location.origin}/account` });
      setMessage(error ? t.emailChangeError : t.emailChangeSent);
    } else setMessage(t.profileSaved);
    setBusy(false);
  }
  if (!accountsEnabled) return <main className="account-page container"><section className="card"><h1>{t.accountTitle}</h1><p>{t.accountConfigMissing}</p></section></main>;
  if (!user) return <main className="account-page container"><section className="card"><h1>{t.signInTitle}</h1><p>{t.signInIntro}</p><form onSubmit={signIn} className="account-form"><label>{t.fullName}<input id="signin-full-name" name="fullName" className="form-control" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required/></label><label>{t.emailAddress}<input id="signin-email" name="email" className="form-control" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required/></label><button className="primary btn btn-warning" disabled={busy}>{busy ? t.sendingLink : t.emailSignIn}</button></form>{message&&<p role="status">{message}</p>}</section></main>;
  return <main className="account-page container"><section className="card"><div className="account-heading"><div><span className="eyebrow">{t.accountTitle}</span><h1>{user.user_metadata?.full_name || user.email}</h1><p>{user.email}</p></div><button className="secondary btn btn-outline-secondary" onClick={() => supabase.auth.signOut()}>{t.signOut}</button></div><form className="account-form" onSubmit={updateProfile}><h2>{t.profileSettings}</h2><label>{t.fullName}<input id="profile-full-name" name="fullName" className="form-control" autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required/></label><label>{t.emailAddress}<input id="profile-email" name="email" className="form-control" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><button className="primary btn btn-warning" disabled={busy}>{busy?t.savingProfile:t.saveProfile}</button>{message&&<p role="status">{message}</p>}</form><h2>{t.yourAccess}</h2>{entitlements.length ? entitlements.map((item,i)=><p className="account-record" key={`${item.plan}-${item.starts_at}-${i}`}>{item.plan === 'seasonPass' ? t.seasonPass : t.examPack} · {item.status} · {t.expiresAt} {new Date(item.expires_at).toLocaleString()}</p>) : <p>{t.noAccess}</p>}<h2>{t.paymentHistory}</h2>{orders.length ? orders.map((item,i)=><p className="account-record" key={`${item.created_at}-${i}`}>{item.plan} · ₹{(item.amount/100).toFixed(0)} · {item.status} · {new Date(item.created_at).toLocaleDateString()}</p>) : <p>{t.noPayments}</p>}<Link className="secondary btn btn-outline-secondary" to="/exam-pack">{t.openExamPack}</Link></section></main>;
}

export function AdminPage({ user, session, t }) {
  const [users, setUsers] = useState([]), [events, setEvents] = useState([]), [query, setQuery] = useState(''), [email, setEmail] = useState(''), [plan, setPlan] = useState('examPack'), [reason, setReason] = useState(''), [message, setMessage] = useState(''), [page, setPage] = useState(0), [hasMore, setHasMore] = useState(false), [busy, setBusy] = useState(false);
  async function load(q = query, targetPage = page) {
    if (!session?.access_token) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}&page=${targetPage}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
      const body = await response.json();
      setMessage(response.ok ? '' : t[`error_${body.error}`] || t.adminActionError);
      if (response.ok) { setUsers(body.users || []); setPage(body.page || 0); setHasMore(Boolean(body.hasMore)); }
    } catch { setMessage(t.adminActionError); }
    finally { setBusy(false); }
  }
  async function loadEvents() {
    if (!session?.access_token) return;
    try {
      const response = await fetch('/api/admin/audit', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const body = await response.json();
      if (response.ok) setEvents(body.events || []);
    } catch { setMessage(t.adminActionError); }
  }
  useEffect(() => { load('', 0); loadEvents(); }, [session?.access_token]);
  async function mutate(method, payload) {
    if (!reason.trim() || (method === 'POST' && !email.trim()) || busy) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/admin/entitlements', { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify({ ...payload, reason }) });
      const body = await response.json();
      setMessage(response.ok ? t.adminSaved : t[`error_${body.error}`] || t.adminActionError);
      if (response.ok) { if (method === 'POST') setEmail(''); setReason(''); await load(); await loadEvents(); }
    } catch { setMessage(t.adminActionError); }
    finally { setBusy(false); }
  }
  if (!user) return <main className="container account-page"><section className="card"><h1>{t.adminTitle}</h1><p>{t.adminSignIn}</p><Link to="/account">{t.signInTitle}</Link></section></main>;
  return <main className="container account-page"><section className="card">
    <h1>{t.adminTitle}</h1><p>{t.adminDescription}</p><p className="admin-privacy-note">{t.adminPrivacyNote}</p>
    <div className="admin-search"><input id="admin-user-search" name="query" className="form-control" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.searchUsers}/><button className="secondary btn btn-outline-secondary" disabled={busy} onClick={()=>load(query,0)}>{t.search}</button></div>
    <div className="admin-pagination"><button className="btn btn-outline-secondary" disabled={busy||page===0} onClick={()=>load(query,page-1)}>{t.previousPage}</button><span>{t.adminPageLabel} {page+1}</span><button className="btn btn-outline-secondary" disabled={busy||!hasMore} onClick={()=>load(query,page+1)}>{t.nextPage}</button></div>
    <form className="admin-grant" onSubmit={event=>{event.preventDefault();mutate('POST',{email,plan})}}><h2>{t.grantAccess}</h2><input id="grant-email" name="email" className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={t.emailAddress} required/><select id="grant-plan" name="plan" className="form-select" value={plan} onChange={e=>setPlan(e.target.value)}><option value="examPack">{t.examPack} · 24h</option><option value="seasonPass">{t.seasonPass} · 60d</option></select><input id="grant-reason" name="reason" className="form-control" value={reason} onChange={e=>setReason(e.target.value)} placeholder={t.reasonRequired} required/><button className="primary btn btn-warning" disabled={busy||!email.trim()||!reason.trim()} type="submit">{busy?t.processing:t.grantAccess}</button></form>
    {message&&<p role="status">{message}</p>}
    {users.map(account=><article className="admin-user" key={account.user_id}><h2>{account.full_name||account.email}</h2><p>{account.email} · {new Date(account.created_at).toLocaleDateString()}</p><h3>{t.paymentHistory}</h3>{account.orders.map((order,i)=><p key={i}>{order.plan} · ₹{order.amount/100} · {order.status}</p>)}{!account.orders.length&&<p>{t.noPayments}</p>}<h3>{t.yourAccess}</h3>{account.entitlements.map(item=><p key={item.id}>{item.plan} · {item.status} · {new Date(item.expires_at).toLocaleString()} {item.status==='active'&&<button className="btn btn-sm btn-outline-danger" disabled={busy||!reason.trim()} onClick={()=>mutate('DELETE',{id:item.id})}>{t.revokeAccess}</button>}</p>)}{!account.entitlements.length&&<p>{t.noAccess}</p>}</article>)}
    <section className="admin-audit"><h2>{t.adminActivity}</h2>{events.length?events.map((event,i)=><article className="account-record" key={`${event.created_at}-${i}`}><strong>{event.action==='grant'?t.auditGrant:t.auditRevoke}</strong><p>{event.reason}</p><small>{new Date(event.created_at).toLocaleString()} · {event.subject_user_id}</small></article>):<p>{t.noAdminActivity}</p>}</section>
  </section></main>;
}
