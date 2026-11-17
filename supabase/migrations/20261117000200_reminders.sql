-- Spec 2026-11-17 §4.1: reminder switches and quiet hours per user, two more
-- notification kinds, and one reminder time per medicine per baby.
alter table public.notification_prefs
  add column medicine boolean not null default true,
  add column timer_alert boolean not null default true,
  add column quiet_enabled boolean not null default false,
  add column quiet_start_min int not null default 1320 check (quiet_start_min between 0 and 1439),
  add column quiet_end_min int not null default 360 check (quiet_end_min between 0 and 1439),
  add column hold_feed_while_asleep boolean not null default false;

alter table public.notification_log drop constraint notification_log_kind_check;
alter table public.notification_log add constraint notification_log_kind_check
  check (kind in ('feed', 'wake', 'vaccine', 'medicine', 'timer'));

create table public.medicine_schedules (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  -- Minutes after 00:00 Vietnam time.
  remind_at_min int not null check (remind_at_min between 0 and 1439),
  enabled boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index medicine_schedules_baby_name_idx
  on public.medicine_schedules (baby_id, lower(btrim(name)));

create trigger medicine_schedules_set_updated_at before update on public.medicine_schedules
  for each row execute function public.set_updated_at();
create trigger medicine_schedules_immutable before update on public.medicine_schedules
  for each row execute function public.forbid_immutable_change('id', 'baby_id', 'created_by');

alter table public.medicine_schedules enable row level security;

-- Every member of the baby's family reads, adds, edits and deletes (like emergency_contacts).
create policy medicine_schedules_select on public.medicine_schedules for select to authenticated
  using (public.is_member(public.baby_family(baby_id)));
create policy medicine_schedules_insert on public.medicine_schedules for insert to authenticated
  with check (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid());
create policy medicine_schedules_update on public.medicine_schedules for update to authenticated
  using (public.is_member(public.baby_family(baby_id)))
  with check (public.is_member(public.baby_family(baby_id)));
create policy medicine_schedules_delete on public.medicine_schedules for delete to authenticated
  using (public.is_member(public.baby_family(baby_id)));
