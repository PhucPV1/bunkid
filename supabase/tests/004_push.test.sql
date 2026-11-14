begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000002', 'pa@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'pb@example.com');
insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values
  ('aaaaaaaa-0000-0000-0000-000000000002', 'https://push.example/a', 'ka', 'aa'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'https://push.example/b', 'kb', 'ab');
insert into public.notification_log (user_id, kind, ref_key)
  values ('bbbbbbbb-0000-0000-0000-000000000002', 'feed', 'feed:x');

select throws_ok(
  $$ insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
     values ('aaaaaaaa-0000-0000-0000-000000000002', 'http://push.example/c', 'k', 'a') $$,
  '23514', null, 'push endpoint must be https');
select throws_ok(
  $$ insert into public.notification_log (user_id, kind, ref_key)
     values ('bbbbbbbb-0000-0000-0000-000000000002', 'feed', 'feed:x') $$,
  '23505', null, 'notification_log refuses the same (user, kind, ref_key) twice');

-- As A
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","email":"pa@example.com","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.push_subscriptions), 1, 'a user sees only their own push subscriptions');
select throws_ok(
  $$ insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
     values ('aaaaaaaa-0000-0000-0000-000000000002', 'https://push.example/a2', 'k', 'a') $$,
  '42501', null, 'users cannot insert push subscriptions directly');
select lives_ok(
  $$ delete from public.push_subscriptions where endpoint = 'https://push.example/b' $$,
  'deleting someone else''s subscription runs but matches nothing');
select lives_ok(
  $$ insert into public.notification_prefs (user_id, feed_reminder) values ('aaaaaaaa-0000-0000-0000-000000000002', false) $$,
  'a user creates their own prefs');
select lives_ok(
  $$ update public.notification_prefs set snooze_until = now() + interval '2 hours' $$,
  'a user updates their own prefs');
select throws_ok(
  $$ insert into public.notification_prefs (user_id) values ('bbbbbbbb-0000-0000-0000-000000000002') $$,
  '42501', null, 'a user cannot create prefs for someone else');
select throws_ok(
  $$ select * from public.notification_log $$,
  '42501', null, 'notification_log is not readable by signed-in users');
select lives_ok(
  $$ delete from public.push_subscriptions where endpoint = 'https://push.example/a' $$,
  'a user deletes their own subscription');
reset role;

select is(
  (select array_agg(endpoint order by endpoint) from public.push_subscriptions where endpoint like 'https://push.example/%'),
  array['https://push.example/b'],
  'only the own subscription was deleted');

set local role anon;
select throws_ok(
  $$ select * from public.notification_log $$,
  '42501', null, 'notification_log is not readable anonymously');
reset role;

select * from finish();
rollback;
