begin;
create extension if not exists pgtap with schema extensions;
select plan(40);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000018', 'va@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000018', 'vb@example.com'),
  ('cccccccc-0000-0000-0000-000000000018', 'vc@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000018', 'Nhà V');
insert into public.family_members (family_id, email, user_id, role, display_name) values
  ('f0000000-0000-0000-0000-000000000018', 'va@example.com', 'aaaaaaaa-0000-0000-0000-000000000018', 'owner', 'Mẹ'),
  ('f0000000-0000-0000-0000-000000000018', 'vb@example.com', 'bbbbbbbb-0000-0000-0000-000000000018', 'member', 'Bố');
insert into public.babies (id, family_id, name, dob, sex) values
  ('ba000000-0000-0000-0000-000000000018', 'f0000000-0000-0000-0000-000000000018', 'Bé', '2026-05-01', 'female'),
  ('ba000000-0000-0000-0000-000000000118', 'f0000000-0000-0000-0000-000000000018', 'Em', '2026-05-01', 'male');
insert into public.illness_episodes (id, baby_id, started_at, ended_at, created_by) values
  ('e0000000-0000-0000-0000-000000000018', 'ba000000-0000-0000-0000-000000000018',
   '2026-11-01 08:00+07', '2026-11-05 08:00+07', 'aaaaaaaa-0000-0000-0000-000000000018'),
  ('e0000000-0000-0000-0000-000000000118', 'ba000000-0000-0000-0000-000000000118',
   '2026-11-02 08:00+07', null, 'aaaaaaaa-0000-0000-0000-000000000018');
-- A photo of the Photos page: no visit.
insert into public.photos (id, baby_id, storage_path, taken_on, size_bytes, created_by) values
  ('a0000000-0000-0000-0000-000000000018', 'ba000000-0000-0000-0000-000000000018',
   'f0000000-0000-0000-0000-000000000018/ba000000-0000-0000-0000-000000000018/a0000000-0000-0000-0000-000000000018.jpg',
   '2026-11-01', 250000, 'aaaaaaaa-0000-0000-0000-000000000018');

-- Spec 2026-11-26 §8.1: the table, its checks and the two new foreign keys.
select has_table('public', 'illness_visits', 'illness_visits exists');
select lives_ok(
  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at, place, conclusion, advice, created_by)
     values ('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000018',
             'ba000000-0000-0000-0000-000000000018', '2026-11-02 09:00+07', 'Phòng khám Nhi',
             'Viêm họng', 'Uống nhiều nước', 'aaaaaaaa-0000-0000-0000-000000000018') $$,
  'a visit with every field is accepted');
select lives_ok(
  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at, created_by)
     values ('d0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000018',
             'ba000000-0000-0000-0000-000000000018', '2026-11-03 09:00+07', 'aaaaaaaa-0000-0000-0000-000000000018') $$,
  'a visit with only its time is accepted');
select throws_ok(
  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at, created_by)
     values (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000018',
             'ba000000-0000-0000-0000-000000000118', '2026-11-03 09:00+07', 'aaaaaaaa-0000-0000-0000-000000000018') $$,
  '23503', null, 'a visit must belong to the baby of its episode');
select throws_ok(
  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at, place, created_by)
     values (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000018',
             'ba000000-0000-0000-0000-000000000018', '2026-11-03 09:00+07', '   ', 'aaaaaaaa-0000-0000-0000-000000000018') $$,
  '23514', null, 'a blank place is refused');
select throws_ok(
  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at, place, created_by)
     values (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000018',
             'ba000000-0000-0000-0000-000000000018', '2026-11-03 09:00+07', repeat('a', 81), 'aaaaaaaa-0000-0000-0000-000000000018') $$,
  '23514', null, 'a place of 81 characters is refused');
select throws_ok(
  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at, conclusion, created_by)
     values (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000018',
             'ba000000-0000-0000-0000-000000000018', '2026-11-03 09:00+07', repeat('a', 121), 'aaaaaaaa-0000-0000-0000-000000000018') $$,
  '23514', null, 'a conclusion of 121 characters is refused');
select throws_ok(
  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at, advice, created_by)
     values (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000018',
             'ba000000-0000-0000-0000-000000000018', '2026-11-03 09:00+07', repeat('a', 501), 'aaaaaaaa-0000-0000-0000-000000000018') $$,
  '23514', null, 'advice of 501 characters is refused');
select lives_ok(
  $$ insert into public.photos (id, baby_id, storage_path, taken_on, size_bytes, created_by, visit_id)
     values ('a0000000-0000-0000-0000-000000000118', 'ba000000-0000-0000-0000-000000000018',
             'f0000000-0000-0000-0000-000000000018/ba000000-0000-0000-0000-000000000018/a0000000-0000-0000-0000-000000000118.jpg',
             '2026-11-02', 200000, 'bbbbbbbb-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000001') $$,
  'a photo may belong to a visit of its baby');
select throws_ok(
  $$ insert into public.photos (id, baby_id, storage_path, taken_on, size_bytes, created_by, visit_id)
     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000118',
             'f0000000-0000-0000-0000-000000000018/ba000000-0000-0000-0000-000000000118/a0000000-0000-0000-0000-000000000218.jpg',
             '2026-11-02', 200000, 'bbbbbbbb-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000001') $$,
  '23503', null, 'a photo cannot belong to a visit of another baby');
select throws_ok(
  $$ update public.photos set visit_id = 'd0000000-0000-0000-0000-000000000002'
     where id = 'a0000000-0000-0000-0000-000000000118' $$,
  'P0001', 'immutable_column: visit_id', 'the visit of a photo cannot change');
select throws_ok(
  $$ update public.photos set visit_id = 'd0000000-0000-0000-0000-000000000002'
     where id = 'a0000000-0000-0000-0000-000000000018' $$,
  'P0001', 'immutable_column: visit_id', 'a photo of the Photos page cannot join a visit');
select throws_ok(
  $$ delete from public.illness_episodes where id = 'e0000000-0000-0000-0000-000000000018' $$,
  '23503', null, 'an episode with a visit cannot be deleted');
select throws_ok(
  $$ delete from public.illness_visits where id = 'd0000000-0000-0000-0000-000000000001' $$,
  '23503', null, 'a visit with a photo cannot be deleted');
select throws_ok(
  $$ update public.illness_visits set episode_id = 'e0000000-0000-0000-0000-000000000118'
     where id = 'd0000000-0000-0000-0000-000000000002' $$,
  'P0001', 'immutable_column: episode_id', 'the episode of a visit cannot change');
select is_empty(
  $$ select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'illness_visits' $$,
  'illness_visits is not published to realtime');

-- As C (outsider)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000018","email":"vc@example.com","role":"authenticated"}', true);
set local role authenticated;
select is_empty('select id from public.illness_visits', 'outsider sees no visits');
select throws_ok(
  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at)
     values (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000018',
             'ba000000-0000-0000-0000-000000000018', '2026-11-03 10:00+07') $$,
  '42501', null, 'outsider cannot add a visit');
select is_empty(
  $$ update public.illness_visits set place = 'Nhà'
     where id = 'd0000000-0000-0000-0000-000000000002' returning id $$,
  'outsider cannot edit a visit');
select is_empty(
  $$ delete from public.illness_visits where id = 'd0000000-0000-0000-0000-000000000002' returning id $$,
  'outsider cannot delete a visit');
reset role;

-- As B (member, not the owner)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000018","email":"vb@example.com","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.illness_visits), 2, 'member sees the family''s visits');
select lives_ok(
  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at) values
       ('d0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000018',
        'ba000000-0000-0000-0000-000000000018', '2026-11-04 09:00+07'),
       ('d0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000118',
        'ba000000-0000-0000-0000-000000000118', '2026-11-04 10:00+07') $$,
  'member adds visits with client ids');
select throws_ok(
  $$ insert into public.illness_visits (id, episode_id, baby_id, visited_at, created_by)
     values (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000018',
             'ba000000-0000-0000-0000-000000000018', '2026-11-04 11:00+07', 'aaaaaaaa-0000-0000-0000-000000000018') $$,
  '42501', null, 'member cannot add a visit in someone else''s name');
select isnt_empty(
  $$ update public.illness_visits set conclusion = 'Viêm họng cấp'
     where id = 'd0000000-0000-0000-0000-000000000001' returning id $$,
  'member edits the visit the owner added');
select is_empty(
  $$ delete from public.illness_visits where id = 'd0000000-0000-0000-0000-000000000002' returning id $$,
  'member cannot delete the owner''s visit');
select isnt_empty(
  $$ delete from public.illness_visits where id = 'd0000000-0000-0000-0000-000000000003' returning id $$,
  'member deletes the visit they added');
reset role;

-- As A (owner)
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000018","email":"va@example.com","role":"authenticated"}', true);
set local role authenticated;
select isnt_empty(
  $$ delete from public.illness_visits where id = 'd0000000-0000-0000-0000-000000000004' returning id $$,
  'owner deletes the member''s visit');
select throws_ok(
  $$ update public.illness_visits set baby_id = 'ba000000-0000-0000-0000-000000000118'
     where id = 'd0000000-0000-0000-0000-000000000002' $$,
  'P0001', 'immutable_column: baby_id', 'baby_id is immutable');
select throws_ok(
  $$ update public.illness_visits set created_by = 'bbbbbbbb-0000-0000-0000-000000000018'
     where id = 'd0000000-0000-0000-0000-000000000002' $$,
  'P0001', 'immutable_column: created_by', 'created_by is immutable');
select throws_ok(
  $$ update public.illness_visits set id = 'd0000000-0000-0000-0000-000000000099'
     where id = 'd0000000-0000-0000-0000-000000000002' $$,
  'P0001', 'immutable_column: id', 'id is immutable');
select isnt_empty(
  $$ update public.illness_visits set visited_at = '2026-11-03 10:30+07', place = null
     where id = 'd0000000-0000-0000-0000-000000000002' returning id $$,
  'owner edits the time and clears the place');
reset role;

select is(
  (select count(*)::int from public.illness_visits where id = 'd0000000-0000-0000-0000-000000000002'),
  1,
  'the outsider''s and the member''s delete of the owner''s visit had no effect');
select has_index('public', 'illness_visits', 'illness_visits_episode_idx', array['episode_id', 'visited_at'],
  'visits are indexed by episode and time');
select has_index('public', 'photos', 'photos_visit_idx', array['visit_id'], 'photos are indexed by visit');
select lives_ok(
  $$ delete from public.photos where id = 'a0000000-0000-0000-0000-000000000118' $$,
  'the photo of a visit can be deleted');
select lives_ok(
  $$ delete from public.illness_visits where id = 'd0000000-0000-0000-0000-000000000001' $$,
  'then its visit can be deleted');
-- Put a visit with a photo back, so deleting the baby meets all three.
insert into public.photos (id, baby_id, storage_path, taken_on, size_bytes, created_by, visit_id) values
  ('a0000000-0000-0000-0000-000000000318', 'ba000000-0000-0000-0000-000000000018',
   'f0000000-0000-0000-0000-000000000018/ba000000-0000-0000-0000-000000000018/a0000000-0000-0000-0000-000000000318.jpg',
   '2026-11-03', 200000, 'aaaaaaaa-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000002');
select lives_ok(
  $$ delete from public.babies where id = 'ba000000-0000-0000-0000-000000000018' $$,
  'a baby with an episode, a visit and a visit''s photo can be deleted');
select is_empty(
  $$ select id from public.illness_episodes where baby_id = 'ba000000-0000-0000-0000-000000000018' $$,
  'deleting a baby removes its episodes');
select is_empty(
  $$ select id from public.illness_visits where baby_id = 'ba000000-0000-0000-0000-000000000018' $$,
  'deleting a baby removes its visits');
select is_empty(
  $$ select id from public.photos where baby_id = 'ba000000-0000-0000-0000-000000000018' $$,
  'deleting a baby removes its photos, those of visits too');

select * from finish();
rollback;
