-- FormReady account-bound passes. Apply in the Supabase SQL editor or CLI.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  razorpay_order_id text not null unique,
  razorpay_payment_id text unique,
  plan text not null check (plan in ('examPack', 'seasonPass')),
  amount integer not null check (amount > 0),
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('examPack', 'seasonPass')),
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  payment_id text unique,
  granted_by uuid references auth.users(id) on delete set null,
  grant_reason text,
  created_at timestamptz not null default now(),
  check (expires_at > starts_at)
);

create table if not exists public.webhook_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id),
  subject_user_id uuid not null references auth.users(id),
  action text not null check (action in ('grant', 'revoke')),
  reason text not null,
  entitlement_id uuid references public.entitlements(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.api_rate_limits (
  key text primary key,
  window_started_at timestamptz not null,
  hits integer not null default 0
);

create index if not exists entitlements_user_expiry_idx on public.entitlements(user_id, expires_at desc);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(user_id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (user_id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of email on auth.users
for each row execute procedure public.handle_new_user();
insert into public.profiles(user_id, email, full_name)
select id, coalesce(email, ''), coalesce(raw_user_meta_data ->> 'full_name', '') from auth.users
on conflict (user_id) do update set email = excluded.email;

create or replace function public.finalize_razorpay_order(
  p_order_id text, p_payment_id text, p_paid_at timestamptz
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders%rowtype; v_entitlement public.entitlements%rowtype; v_duration interval; v_start timestamptz;
begin
  select * into o from public.orders where razorpay_order_id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if o.razorpay_payment_id is not null and o.razorpay_payment_id <> p_payment_id then raise exception 'order_payment_conflict'; end if;
  if o.status = 'paid' then
    select * into v_entitlement from public.entitlements where payment_id = p_payment_id;
    return jsonb_build_object('user_id', o.user_id, 'plan', o.plan, 'expires_at', v_entitlement.expires_at, 'existing', true);
  end if;
  v_duration := case o.plan when 'examPack' then interval '24 hours' when 'seasonPass' then interval '60 days' end;
  update public.orders set status = 'paid', razorpay_payment_id = p_payment_id, paid_at = p_paid_at where id = o.id;
  select greatest(p_paid_at, coalesce(max(expires_at), p_paid_at)) into v_start from public.entitlements
  where user_id = o.user_id and status = 'active' and expires_at > p_paid_at;
  insert into public.entitlements(user_id, plan, starts_at, expires_at, payment_id)
  values (o.user_id, o.plan, v_start, v_start + v_duration, p_payment_id)
  returning * into v_entitlement;
  return jsonb_build_object('user_id', o.user_id, 'plan', o.plan, 'expires_at', v_entitlement.expires_at, 'existing', false);
end;
$$;

create or replace function public.admin_grant_entitlement(p_actor uuid, p_email text, p_plan text, p_reason text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_start timestamptz; v_duration interval; v_entitlement public.entitlements%rowtype;
begin
  if p_plan not in ('examPack', 'seasonPass') or length(trim(p_reason)) = 0 then raise exception 'invalid_grant'; end if;
  select user_id into v_user from public.profiles where lower(email) = lower(trim(p_email)) limit 1;
  if v_user is null then raise exception 'user_not_found'; end if;
  v_duration := case p_plan when 'examPack' then interval '24 hours' when 'seasonPass' then interval '60 days' end;
  select greatest(now(), coalesce(max(expires_at), now())) into v_start from public.entitlements
  where user_id = v_user and status = 'active' and expires_at > now();
  insert into public.entitlements(user_id, plan, starts_at, expires_at, granted_by, grant_reason)
  values (v_user, p_plan, v_start, v_start + v_duration, p_actor, trim(p_reason)) returning * into v_entitlement;
  insert into public.admin_audit(actor_user_id, subject_user_id, action, reason, entitlement_id)
  values (p_actor, v_user, 'grant', trim(p_reason), v_entitlement.id);
  return jsonb_build_object('user_id', v_user, 'plan', p_plan, 'starts_at', v_entitlement.starts_at, 'expires_at', v_entitlement.expires_at, 'id', v_entitlement.id);
end;
$$;

create or replace function public.admin_revoke_entitlement(p_actor uuid, p_entitlement uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_entitlement public.entitlements%rowtype;
begin
  if length(trim(p_reason)) = 0 then raise exception 'invalid_reason'; end if;
  select * into v_entitlement from public.entitlements where id = p_entitlement for update;
  if not found then raise exception 'entitlement_not_found'; end if;
  update public.entitlements set status = 'revoked' where id = p_entitlement;
  insert into public.admin_audit(actor_user_id, subject_user_id, action, reason, entitlement_id)
  values (p_actor, v_entitlement.user_id, 'revoke', trim(p_reason), p_entitlement);
  return jsonb_build_object('revoked', true, 'user_id', v_entitlement.user_id);
end;
$$;

create or replace function public.consume_api_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_hits integer;
begin
  insert into public.api_rate_limits as current_limit(key, window_started_at, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when current_limit.window_started_at + make_interval(secs => p_window_seconds) <= now() then 1 else current_limit.hits + 1 end,
    window_started_at = case when current_limit.window_started_at + make_interval(secs => p_window_seconds) <= now() then now() else current_limit.window_started_at end
  returning hits into v_hits;
  return v_hits <= p_limit;
end;
$$;

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.entitlements enable row level security;
alter table public.webhook_events enable row level security;
alter table public.admin_audit enable row level security;
alter table public.api_rate_limits enable row level security;

revoke all on public.profiles, public.orders, public.entitlements, public.webhook_events, public.admin_audit, public.api_rate_limits from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select on public.orders, public.entitlements to authenticated;
grant all on public.profiles, public.orders, public.entitlements, public.webhook_events, public.admin_audit, public.api_rate_limits to service_role;

create policy "users read own profile" on public.profiles for select to authenticated using (auth.uid() = user_id);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users read own orders" on public.orders for select to authenticated using (auth.uid() = user_id);
create policy "users read own entitlements" on public.entitlements for select to authenticated using (auth.uid() = user_id);

revoke all on function public.finalize_razorpay_order(text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.finalize_razorpay_order(text, text, timestamptz) to service_role;
revoke all on function public.admin_grant_entitlement(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.admin_revoke_entitlement(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.consume_api_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.admin_grant_entitlement(uuid, text, text, text) to service_role;
grant execute on function public.admin_revoke_entitlement(uuid, uuid, text) to service_role;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;
