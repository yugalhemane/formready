import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { accountsEnabled } from '../lib/supabase';

export function AccountPage({ user, session, supabase, t }) {
  const [name, setName] = useState(''), [email, setEmail] = useState(user?.email || ''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [entitlements, setEntitlements] = useState([]), [orders, setOrders] = useState([]);
  const [params] = useSearchParams();
  useEffect(() => {
    if (!user || !supabase) return;
    const fullName = String(user.user_metadata?.full_name || '').trim();
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
  if (!accountsEnabled) return <main className="account-page container"><section className="card"><h1>{t.accountTitle}</h1><p>{t.accountConfigMissing}</p></section></main>;
  if (!user) return <main className="account-page container"><section className="card"><h1>{t.signInTitle}</h1><p>{t.signInIntro}</p><form onSubmit={signIn} className="account-form"><label>{t.fullName}<input className="form-control" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required/></label><label>{t.emailAddress}<input className="form-control" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required/></label><button className="primary btn btn-warning" disabled={busy}>{busy ? t.sendingLink : t.emailSignIn}</button></form>{message&&<p role="status">{message}</p>}</section></main>;
  return <main className="account-page container"><section className="card"><div className="account-heading"><div><span className="eyebrow">{t.accountTitle}</span><h1>{user.user_metadata?.full_name || user.email}</h1><p>{user.email}</p></div><button className="secondary btn btn-outline-secondary" onClick={() => supabase.auth.signOut()}>{t.signOut}</button></div><h2>{t.yourAccess}</h2>{entitlements.length ? entitlements.map((item,i)=><p className="account-record" key={`${item.plan}-${item.starts_at}-${i}`}>{item.plan === 'seasonPass' ? t.seasonPass : t.examPack} · {item.status} · {t.expiresAt} {new Date(item.expires_at).toLocaleString()}</p>) : <p>{t.noAccess}</p>}<h2>{t.paymentHistory}</h2>{orders.length ? orders.map((item,i)=><p className="account-record" key={`${item.created_at}-${i}`}>{item.plan} · ₹{(item.amount/100).toFixed(0)} · {item.status} · {new Date(item.created_at).toLocaleDateString()}</p>) : <p>{t.noPayments}</p>}<Link className="secondary btn btn-outline-secondary" to="/exam-pack">{t.openExamPack}</Link></section></main>;
}

export function AdminPage({ user, session, t }) {
  const [users, setUsers] = useState([]), [query, setQuery] = useState(''), [email, setEmail] = useState(''), [plan, setPlan] = useState('examPack'), [reason, setReason] = useState(''), [message, setMessage] = useState('');
  async function load(q = query) {
    if (!session?.access_token) return;
    const response = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
    const body = await response.json(); setMessage(response.ok ? '' : t[`error_${body.error}`] || t.adminActionError); if (response.ok) setUsers(body.users || []);
  }
  useEffect(() => { load(''); }, [session?.access_token]);
  async function mutate(method, payload) {
    const response = await fetch('/api/admin/entitlements', { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }, body: JSON.stringify({ ...payload, reason }) });
    const body = await response.json(); setMessage(response.ok ? t.adminSaved : t[`error_${body.error}`] || t.adminActionError); if (response.ok) await load();
  }
  if (!user) return <main className="container account-page"><section className="card"><h1>{t.adminTitle}</h1><p>{t.adminSignIn}</p><Link to="/account">{t.signInTitle}</Link></section></main>;
  return <main className="container account-page"><section className="card"><h1>{t.adminTitle}</h1><p>{t.adminDescription}</p><div className="admin-search"><input className="form-control" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.searchUsers}/><button className="secondary btn btn-outline-secondary" onClick={()=>load()}>{t.search}</button></div><div className="admin-grant"><h2>{t.grantAccess}</h2><input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={t.emailAddress}/><select className="form-select" value={plan} onChange={e=>setPlan(e.target.value)}><option value="examPack">{t.examPack} · 24h</option><option value="seasonPass">{t.seasonPass} · 60d</option></select><input className="form-control" value={reason} onChange={e=>setReason(e.target.value)} placeholder={t.reasonRequired}/><button className="primary btn btn-warning" onClick={()=>mutate('POST',{email,plan})}>{t.grantAccess}</button></div>{message&&<p role="status">{message}</p>}{users.map(account=><article className="admin-user" key={account.user_id}><h2>{account.full_name||account.email}</h2><p>{account.email} · {new Date(account.created_at).toLocaleDateString()}</p><h3>{t.paymentHistory}</h3>{account.orders.map((order,i)=><p key={i}>{order.plan} · ₹{order.amount/100} · {order.status}</p>)}<h3>{t.yourAccess}</h3>{account.entitlements.map(item=><p key={item.id}>{item.plan} · {item.status} · {new Date(item.expires_at).toLocaleString()} {item.status==='active'&&<button className="btn btn-sm btn-outline-danger" onClick={()=>mutate('DELETE',{id:item.id})}>{t.revokeAccess}</button>}</p>)}</article>)}</section></main>;
}
