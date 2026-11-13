begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select has_table('public', 'families', 'families exists');
select has_table('public', 'family_members', 'family_members exists');
select has_table('public', 'babies', 'babies exists');
select has_table('public', 'logs', 'logs exists');

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'me@example.com');
insert into public.families (id, name) values ('10000000-0000-0000-0000-000000000001', 'Nhà A');
insert into public.family_members (family_id, email, user_id, role, display_name)
  values ('10000000-0000-0000-0000-000000000001', 'me@example.com', '00000000-0000-0000-0000-0000000000a1', 'owner', 'Mẹ');
insert into public.babies (id, family_id, name, dob, sex)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Bé', '2026-09-13', 'female');
insert into public.logs (id, baby_id, type, started_at, created_by)
  values ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'sleep', now(), '00000000-0000-0000-0000-0000000000a1');

select throws_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, created_by)
     values ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'sleep', now(), '00000000-0000-0000-0000-0000000000a1') $$,
  '23505', null, 'only one running timer per type per baby');

select throws_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, created_by)
     values ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'diaper', now(), now() - interval '1 minute', '00000000-0000-0000-0000-0000000000a1') $$,
  '23514', null, 'ended_at must not precede started_at');

select throws_ok(
  $$ update public.logs set baby_id = '20000000-0000-0000-0000-000000000009'
     where id = '30000000-0000-0000-0000-000000000001' $$,
  'P0001', 'immutable_column: baby_id', 'baby_id is immutable');

select throws_ok(
  $$ insert into public.family_members (family_id, email, role, display_name)
     values ('10000000-0000-0000-0000-000000000001', 'Dad@Example.com', 'member', 'Ba') $$,
  '23514', null, 'email must be stored lowercase');

select throws_ok(
  $$ delete from public.family_members where email = 'me@example.com' $$,
  'P0001', 'last_owner', 'cannot delete the last owner');

select * from finish();
rollback;
