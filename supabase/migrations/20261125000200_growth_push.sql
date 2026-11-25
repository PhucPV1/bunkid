-- Spec 2026-11-25 §8.1: two more reminder switches per user, both on by
-- default, and two more notification kinds.
alter table public.notification_prefs
  add column growth_alert boolean not null default true,
  add column growth_measure boolean not null default true;

alter table public.notification_log drop constraint notification_log_kind_check;
alter table public.notification_log add constraint notification_log_kind_check
  check (kind in ('feed', 'wake', 'vaccine', 'medicine', 'timer', 'growth_alert', 'growth_measure'));
