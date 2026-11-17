begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000013', 'ra@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000013', 'rb@example.com'),
  ('cccccccc-0000-0000-0000-000000000013', 'rc@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000013', 'Nhà R');
insert into public.family_members (family_id, email, user_id, role, display_name) values
  ('f0000000-0000-0000-0000-000000000013', 'ra@example.com', 'aaaaaaaa-0000-0000-0000-000000000013', 'owner', 'Mẹ'),
  ('f0000000-0000-0000-0000-000000000013', 'rb@example.com', 'bbbbbbbb-0000-0000-0000-000000000013', 'member', 'Bà');
insert into public.babies (id, family_id, name, dob, sex)
  values ('ba000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000013', 'Bé', '2026-05-01', 'female');

-- Spec 2026-11-17 §4.1: new notification_prefs columns and their defaults.
insert into public.notification_prefs (user_id) values ('aaaaaaaa-0000-0000-0000-000000000013');
select is(
  (select row(medicine, timer_alert, quiet_enabled, quiet_start_min, quiet_end_min, hold_feed_while_asleep)::text
     from public.notification_prefs where user_id = 'aaaaaaaa-0000-0000-0000-000000000013'),
  '(t,t,f,1320,360,f)',
  'new prefs default to: medicine on, timer alert on, quiet hours off 22:00-06:00, no hold while asleep');
select throws_ok(
  $$ update public.notification_prefs set quiet_start_min = 1440
     where user_id = 'aaaaaaaa-0000-0000-0000-000000000013' $$,
  '23514', null, 'quiet_start_min stays within 0-1439');
select throws_ok(
  $$ update public.notification_prefs set quiet_end_min = -1
     where user_id = 'aaaaaaaa-0000-0000-0000-000000000013' $$,
  '23514', null, 'quiet_end_min stays within 0-1439');

-- notification_log accepts the two new kinds.
select lives_ok(
  $$ insert into public.notification_log (user_id, kind, ref_key)
     values ('aaaaaaaa-0000-0000-0000-000000000013', 'medicine', 'med:x:2026-11-17:540') $$,
  'kind medicine is accepted');
select lives_ok(
  $$ insert into public.notification_log (user_id, kind, ref_key)
     values ('aaaaaaaa-0000-0000-0000-000000000013', 'timer', 'timer:x') $$,
  'kind timer is accepted');
select throws_ok(
  $$ insert into public.notification_log (user_id, kind, ref_key)
     values ('aaaaaaaa-0000-0000-0000-000000000013', 'abc', 'abc:x') $$,
  '23514', null, 'an unknown kind is still refused');

-- medicine_schedules checks.
select throws_ok(
  $$ insert into public.medicine_schedules (baby_id, name, remind_at_min, created_by)
     values ('ba000000-0000-0000-0000-000000000013', '  ', 540, 'aaaaaaaa-0000-0000-0000-000000000013') $$,
  '23514', null, 'a blank name is refused');
select throws_ok(
  $$ insert into public.medicine_schedules (baby_id, name, remind_at_min, created_by)
     values ('ba000000-0000-0000-0000-000000000013', 'DHA', 1440, 'aaaaaaaa-0000-0000-0000-000000000013') $$,
  '23514', null, 'remind_at_min stays within 0-1439');

-- As C (outsider)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000013","email":"rc@example.com","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ insert into public.medicine_schedules (baby_id, name, remind_at_min)
     values ('ba000000-0000-0000-0000-000000000013', 'Vitamin D', 540) $$,
  '42501', null, 'an outsider cannot add a schedule');
reset role;

-- As B (member)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000013","email":"rb@example.com","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ insert into public.medicine_schedules (baby_id, name, remind_at_min)
     values ('ba000000-0000-0000-0000-000000000013', 'Vitamin D', 540) $$,
  'a member adds a schedule (enabled and created_by default)');
select throws_ok(
  $$ insert into public.medicine_schedules (baby_id, name, remind_at_min)
     values ('ba000000-0000-0000-0000-000000000013', ' vitamin d ', 600) $$,
  '23505', null, 'the same name in another case is refused for the same baby');
select lives_ok(
  $$ update public.medicine_schedules set remind_at_min = 1170, enabled = false where name = 'Vitamin D' $$,
  'a member changes the time and turns it off');
select throws_ok(
  $$ update public.medicine_schedules set baby_id = 'ba000000-0000-0000-0000-000000000099' where name = 'Vitamin D' $$,
  'P0001', 'immutable_column: baby_id', 'baby_id is immutable');
reset role;
select is(
  (select row(remind_at_min, enabled, created_by)::text
     from public.medicine_schedules where name = 'Vitamin D'),
  '(1170,f,bbbbbbbb-0000-0000-0000-000000000013)',
  'the change took effect and created_by is the member');

-- As C (outsider)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000013","email":"rc@example.com","role":"authenticated"}', true);
set local role authenticated;
select is_empty('select id from public.medicine_schedules', 'an outsider sees no schedules');
reset role;

-- As A (owner)
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000013","email":"ra@example.com","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ delete from public.medicine_schedules where name = 'Vitamin D' $$,
  'another member deletes the schedule');
reset role;

select * from finish();
rollback;
