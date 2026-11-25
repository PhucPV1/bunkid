begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000015', 'ga@example.com');

-- Spec 2026-11-25 §8.1: two more switches, both on by default.
select col_not_null('public', 'notification_prefs', 'growth_alert', 'growth_alert is never null');
select col_not_null('public', 'notification_prefs', 'growth_measure', 'growth_measure is never null');
insert into public.notification_prefs (user_id) values ('aaaaaaaa-0000-0000-0000-000000000015');
select is(
  (select row(growth_alert, growth_measure)::text
     from public.notification_prefs where user_id = 'aaaaaaaa-0000-0000-0000-000000000015'),
  '(t,t)',
  'new prefs default to: growth alert on, measure reminder on');

-- notification_log accepts the two new kinds and keeps the older ones.
select lives_ok(
  $$ insert into public.notification_log (user_id, kind, ref_key)
     values ('aaaaaaaa-0000-0000-0000-000000000015', 'growth_alert', 'growth:x') $$,
  'kind growth_alert is accepted');
select lives_ok(
  $$ insert into public.notification_log (user_id, kind, ref_key)
     values ('aaaaaaaa-0000-0000-0000-000000000015', 'growth_measure', 'measure:x:2026-11-25') $$,
  'kind growth_measure is accepted');
select lives_ok(
  $$ insert into public.notification_log (user_id, kind, ref_key)
     values ('aaaaaaaa-0000-0000-0000-000000000015', 'timer', 'timer:x') $$,
  'an older kind is still accepted');
select throws_ok(
  $$ insert into public.notification_log (user_id, kind, ref_key)
     values ('aaaaaaaa-0000-0000-0000-000000000015', 'growth', 'growth:x') $$,
  '23514', null, 'an unknown kind is still refused');

select * from finish();
rollback;
