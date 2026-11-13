begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

-- Fixtures (run as the superuser that executes the test).
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'b@example.com'),
  ('cccccccc-0000-0000-0000-000000000001', 'c@example.com'),
  ('dddddddd-0000-0000-0000-000000000001', 'd@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000001', 'Nhà A');
insert into public.family_members (family_id, email, user_id, role, display_name) values
  ('f0000000-0000-0000-0000-000000000001', 'a@example.com', 'aaaaaaaa-0000-0000-0000-000000000001', 'owner', 'Mẹ'),
  ('f0000000-0000-0000-0000-000000000001', 'b@example.com', 'bbbbbbbb-0000-0000-0000-000000000001', 'member', 'Bà'),
  ('f0000000-0000-0000-0000-000000000001', 'd@example.com', null, 'member', 'Ba'),
  ('f0000000-0000-0000-0000-000000000001', 'e@example.com', null, 'member', 'Cô');
insert into public.babies (id, family_id, name, dob, sex)
  values ('ba000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Bé', '2026-09-13', 'female');
insert into public.logs (id, baby_id, type, started_at, ended_at, created_by) values
  ('1a000000-0000-0000-0000-000000000001', 'ba000000-0000-0000-0000-000000000001', 'sleep', now() - interval '1 hour', null, 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('1b000000-0000-0000-0000-000000000001', 'ba000000-0000-0000-0000-000000000001', 'diaper', now(), now(), 'bbbbbbbb-0000-0000-0000-000000000001');

-- As C (signed in, not in any family)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000001","email":"c@example.com","role":"authenticated"}', true);
set local role authenticated;
select is_empty('select id from public.logs', 'outsider sees no logs');
select is_empty('select id from public.babies', 'outsider sees no babies');
select is_empty('select id from public.families', 'outsider sees no families');
select is_empty('select id from public.family_members', 'outsider sees no members');
select is(public.can_create_family(), false, 'cannot create a family once one exists');
select throws_ok($$ select public.create_family('Nhà C', 'Ba') $$, 'P0001', 'family_exists', 'create_family refuses when a family exists');
select throws_ok(
  $$ select public.stop_timer('1a000000-0000-0000-0000-000000000001', now()) $$,
  '42501', 'permission_denied', 'outsider cannot stop a timer');
reset role;

-- As B (member)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000001","email":"b@example.com","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.logs), 2, 'member sees every log of the family');
select lives_ok($$ update public.logs set note = 'b' where id = '1a000000-0000-0000-0000-000000000001' $$, 'update of another member log runs without error');
select lives_ok($$ update public.logs set note = 'b' where id = '1b000000-0000-0000-0000-000000000001' $$, 'member updates own log');
select lives_ok($$ delete from public.logs where id = '1a000000-0000-0000-0000-000000000001' $$, 'delete of another member log runs without error');
select throws_ok(
  $$ insert into public.family_members (family_id, email, role, display_name)
     values ('f0000000-0000-0000-0000-000000000001', 'x@example.com', 'member', 'X') $$,
  '42501', null, 'member cannot add a Gmail');
select throws_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, created_by)
     values ('1c000000-0000-0000-0000-000000000001', 'ba000000-0000-0000-0000-000000000001', 'diaper', now(), now(), 'aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501', null, 'member cannot insert a log on behalf of someone else');
select isnt(
  (select ended_at from public.stop_timer('1a000000-0000-0000-0000-000000000001', now())),
  null, 'member can stop a timer another person started');
reset role;

select is((select note from public.logs where id = '1a000000-0000-0000-0000-000000000001'), null, 'member update of another log changed nothing');
select is((select count(*)::int from public.logs where id = '1a000000-0000-0000-0000-000000000001'), 1, 'member delete of another log removed nothing');
select is((select note from public.logs where id = '1b000000-0000-0000-0000-000000000001'), 'b', 'member update of own log applied');

-- As A (owner)
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","email":"a@example.com","role":"authenticated"}', true);
set local role authenticated;
select lives_ok($$ update public.logs set note = 'by-owner' where id = '1b000000-0000-0000-0000-000000000001' $$, 'owner updates a member log');
select throws_ok(
  $$ delete from public.family_members where email = 'a@example.com' $$,
  'P0001', 'last_owner', 'owner cannot remove the last owner');
reset role;
select is((select note from public.logs where id = '1b000000-0000-0000-0000-000000000001'), 'by-owner', 'owner update applied');

-- As D (invited, first sign-in)
select set_config('request.jwt.claims', '{"sub":"dddddddd-0000-0000-0000-000000000001","email":"D@Example.com","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.claim_membership()), 1, 'claim_membership returns the family');
reset role;
select is(
  (select user_id from public.family_members where email = 'd@example.com'),
  'dddddddd-0000-0000-0000-000000000001'::uuid, 'claim_membership links the matching email (case-insensitive)');
select is(
  (select user_id from public.family_members where email = 'e@example.com'),
  null, 'claim_membership leaves other emails alone');

-- Empty database: the first person may create a family
delete from public.families;
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000001","email":"c@example.com","role":"authenticated"}', true);
set local role authenticated;
select is(public.can_create_family(), true, 'can create a family when none exists');
select lives_ok($$ select public.create_family('Nhà C', 'Ba') $$, 'create_family succeeds on an empty database');
reset role;
select is(
  (select count(*)::int from public.family_members where user_id = 'cccccccc-0000-0000-0000-000000000001' and role = 'owner'),
  1, 'creator becomes the owner');

select * from finish();
rollback;
