create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique check (endpoint like 'https://%'),
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_success_at timestamptz
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

create table public.notification_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  feed_reminder boolean not null default true,
  wake_window boolean not null default true,
  vaccine boolean not null default true,
  snooze_until timestamptz,
  updated_at timestamptz not null default now()
);
create trigger notification_prefs_set_updated_at before update on public.notification_prefs
  for each row execute function public.set_updated_at();

create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('feed', 'wake', 'vaccine')),
  ref_key text not null,
  sent_at timestamptz not null default now(),
  unique (user_id, kind, ref_key)
);

alter table public.push_subscriptions enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.notification_log enable row level security;

-- push_subscriptions: rows are written only by /api/push/subscribe with the service role.
create policy push_subscriptions_select on public.push_subscriptions for select to authenticated
  using (user_id = auth.uid());
create policy push_subscriptions_delete on public.push_subscriptions for delete to authenticated
  using (user_id = auth.uid());

-- notification_prefs: each user manages their own row; no row means every switch is on.
create policy notification_prefs_select on public.notification_prefs for select to authenticated
  using (user_id = auth.uid());
create policy notification_prefs_insert on public.notification_prefs for insert to authenticated
  with check (user_id = auth.uid());
create policy notification_prefs_update on public.notification_prefs for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- notification_log: service role only.
revoke all on public.notification_log from anon, authenticated;
