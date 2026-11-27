begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000017', 'ia@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000017', 'ib@example.com'),
  ('cccccccc-0000-0000-0000-000000000017', 'ic@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000017', 'Nhà I');
insert into public.family_members (family_id, email, user_id, role, display_name) values
  ('f0000000-0000-0000-0000-000000000017', 'ia@example.com', 'aaaaaaaa-0000-0000-0000-000000000017', 'owner', 'Mẹ'),
  ('f0000000-0000-0000-0000-000000000017', 'ib@example.com', 'bbbbbbbb-0000-0000-0000-000000000017', 'member', 'Bố');
insert into public.babies (id, family_id, name, dob, sex) values
  ('ba000000-0000-0000-0000-000000000017', 'f0000000-0000-0000-0000-000000000017', 'Bé', '2026-05-01', 'female'),
  ('ba000000-0000-0000-0000-000000000117', 'f0000000-0000-0000-0000-000000000017', 'Em', '2026-05-01', 'male');

-- Spec 2026-11-26 §4.1: the table, its checks and the no-overlap constraint.
select has_table('public', 'illness_episodes', 'illness_episodes exists');
select lives_ok(
  $$ insert into public.illness_episodes (id, baby_id, started_at, ended_at, created_by)
     values ('e0000000-0000-0000-0000-000000000001', 'ba000000-0000-0000-0000-000000000017',
             '2026-11-01 08:00+07', '2026-11-03 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000017') $$,
  'a closed episode is accepted');
select throws_ok(
  $$ insert into public.illness_episodes (id, baby_id, started_at, ended_at, created_by)
     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000017',
             '2026-10-01 08:00+07', '2026-10-01 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000017') $$,
  '23514', null, 'ended_at equal to started_at is refused');
select throws_ok(
  $$ insert into public.illness_episodes (id, baby_id, started_at, ended_at, created_by)
     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000017',
             '2026-10-02 08:00+07', '2026-10-01 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000017') $$,
  '23514', null, 'ended_at before started_at is refused');
select throws_ok(
  $$ insert into public.illness_episodes (id, baby_id, started_at, ended_at, created_by)
     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000017',
             '2026-11-02 08:00+07', '2026-11-04 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000017') $$,
  '23P01', null, 'two episodes that overlap are refused');
select lives_ok(
  $$ insert into public.illness_episodes (id, baby_id, started_at, ended_at, created_by)
     values ('e0000000-0000-0000-0000-000000000002', 'ba000000-0000-0000-0000-000000000017',
             '2026-11-03 08:00+07', '2026-11-05 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000017') $$,
  'an episode may start at the moment another one ends');
select lives_ok(
  $$ insert into public.illness_episodes (id, baby_id, started_at, created_by)
     values ('e0000000-0000-0000-0000-000000000003', 'ba000000-0000-0000-0000-000000000017',
             '2026-11-10 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000017') $$,
  'an open episode is accepted');
select throws_ok(
  $$ insert into public.illness_episodes (id, baby_id, started_at, created_by)
     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000017',
             '2026-11-20 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000017') $$,
  '23P01', null, 'a second open episode is refused');
select throws_ok(
  $$ insert into public.illness_episodes (id, baby_id, started_at, ended_at, created_by)
     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000017',
             '2026-11-12 08:00+07', '2026-11-13 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000017') $$,
  '23P01', null, 'a closed episode after the start of the open one is refused');
select throws_ok(
  $$ update public.illness_episodes set ended_at = null
     where id = 'e0000000-0000-0000-0000-000000000001' $$,
  '23P01', null, 'reopening an episode that has a later one is refused');
select lives_ok(
  $$ insert into public.illness_episodes (id, baby_id, started_at, created_by)
     values ('e0000000-0000-0000-0000-000000000004', 'ba000000-0000-0000-0000-000000000117',
             '2026-11-10 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000017') $$,
  'another baby may have an open episode at the same time');
select is_empty(
  $$ select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'illness_episodes' $$,
  'illness_episodes is not published to realtime');

-- As C (outsider)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000017","email":"ic@example.com","role":"authenticated"}', true);
set local role authenticated;
select is_empty('select id from public.illness_episodes', 'outsider sees no episodes');
select throws_ok(
  $$ insert into public.illness_episodes (id, baby_id, started_at, ended_at)
     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000017', '2026-09-01 08:00+07', '2026-09-02 08:00+07') $$,
  '42501', null, 'outsider cannot add an episode');
select is_empty(
  $$ update public.illness_episodes set ended_at = '2026-11-11 08:00+07'
     where id = 'e0000000-0000-0000-0000-000000000003' returning id $$,
  'outsider cannot edit an episode');
select is_empty(
  $$ delete from public.illness_episodes where id = 'e0000000-0000-0000-0000-000000000001' returning id $$,
  'outsider cannot delete an episode');
reset role;

-- As B (member, not the owner)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000017","email":"ib@example.com","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.illness_episodes), 4, 'member sees the family''s episodes');
select lives_ok(
  $$ insert into public.illness_episodes (id, baby_id, started_at, ended_at) values
       ('e0000000-0000-0000-0000-000000000005', 'ba000000-0000-0000-0000-000000000017', '2026-09-01 08:00+07', '2026-09-02 08:00+07'),
       ('e0000000-0000-0000-0000-000000000006', 'ba000000-0000-0000-0000-000000000017', '2026-09-05 08:00+07', '2026-09-06 08:00+07') $$,
  'member adds episodes with client ids');
select throws_ok(
  $$ insert into public.illness_episodes (id, baby_id, started_at, ended_at, created_by)
     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000017', '2026-08-01 08:00+07', '2026-08-02 08:00+07',
             'aaaaaaaa-0000-0000-0000-000000000017') $$,
  '42501', null, 'member cannot add an episode in someone else''s name');
select isnt_empty(
  $$ update public.illness_episodes set ended_at = '2026-11-11 08:00+07'
     where id = 'e0000000-0000-0000-0000-000000000003' returning id $$,
  'member closes the episode the owner opened');
select is_empty(
  $$ delete from public.illness_episodes where id = 'e0000000-0000-0000-0000-000000000001' returning id $$,
  'member cannot delete the owner''s episode');
select isnt_empty(
  $$ delete from public.illness_episodes where id = 'e0000000-0000-0000-0000-000000000005' returning id $$,
  'member deletes the episode they created');
reset role;

-- As A (owner)
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000017","email":"ia@example.com","role":"authenticated"}', true);
set local role authenticated;
select isnt_empty(
  $$ delete from public.illness_episodes where id = 'e0000000-0000-0000-0000-000000000006' returning id $$,
  'owner deletes the member''s episode');
select throws_ok(
  $$ update public.illness_episodes set baby_id = 'ba000000-0000-0000-0000-000000000117'
     where id = 'e0000000-0000-0000-0000-000000000002' $$,
  'P0001', 'immutable_column: baby_id', 'baby_id is immutable');
select throws_ok(
  $$ update public.illness_episodes set created_by = 'bbbbbbbb-0000-0000-0000-000000000017'
     where id = 'e0000000-0000-0000-0000-000000000002' $$,
  'P0001', 'immutable_column: created_by', 'created_by is immutable');
select throws_ok(
  $$ update public.illness_episodes set id = 'e0000000-0000-0000-0000-000000000099'
     where id = 'e0000000-0000-0000-0000-000000000002' $$,
  'P0001', 'immutable_column: id', 'id is immutable');
reset role;

select is(
  (select count(*)::int from public.illness_episodes where id = 'e0000000-0000-0000-0000-000000000001'),
  1,
  'the outsider''s and the member''s delete of the owner''s episode had no effect');
delete from public.babies where id = 'ba000000-0000-0000-0000-000000000117';
select is_empty(
  $$ select id from public.illness_episodes where baby_id = 'ba000000-0000-0000-0000-000000000117' $$,
  'deleting a baby removes its episodes');

select * from finish();
rollback;
