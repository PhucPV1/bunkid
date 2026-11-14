begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000011', 'sa@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000011', 'sb@example.com'),
  ('cccccccc-0000-0000-0000-000000000011', 'sc@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000012', 'Nhà S');
insert into public.family_members (family_id, email, user_id, role, display_name) values
  ('f0000000-0000-0000-0000-000000000012', 'sa@example.com', 'aaaaaaaa-0000-0000-0000-000000000011', 'owner', 'Mẹ'),
  ('f0000000-0000-0000-0000-000000000012', 'sb@example.com', 'bbbbbbbb-0000-0000-0000-000000000011', 'member', 'Bà');
insert into public.babies (id, family_id, name, dob, sex) values
  ('ba000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000012', 'Bé', '2026-09-14', 'female'),
  ('ba000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000012', 'Bé hai', '2026-09-14', 'male');
insert into public.photos (id, baby_id, storage_path, taken_on, size_bytes, created_by) values
  ('a0000000-0000-0000-0000-000000000012', 'ba000000-0000-0000-0000-000000000012',
   'f0000000-0000-0000-0000-000000000012/ba000000-0000-0000-0000-000000000012/a0000000-0000-0000-0000-000000000012.jpg',
   '2026-11-01', 1000, 'aaaaaaaa-0000-0000-0000-000000000011'),
  ('a0000000-0000-0000-0000-000000000013', 'ba000000-0000-0000-0000-000000000013',
   'f0000000-0000-0000-0000-000000000012/ba000000-0000-0000-0000-000000000013/a0000000-0000-0000-0000-000000000013.jpg',
   '2026-11-01', 1000, 'aaaaaaaa-0000-0000-0000-000000000011');
insert into public.milestones_achieved (baby_id, milestone_code, achieved_on, photo_id, created_by) values
  ('ba000000-0000-0000-0000-000000000012', 'm2_social_4', '2026-11-10', 'a0000000-0000-0000-0000-000000000012', 'aaaaaaaa-0000-0000-0000-000000000011');

select throws_ok(
  $$ insert into public.milestones_achieved (baby_id, milestone_code, achieved_on, created_by)
     values ('ba000000-0000-0000-0000-000000000012', 'm2_social_4', '2026-11-11', 'aaaaaaaa-0000-0000-0000-000000000011') $$,
  '23505', null, 'one row per baby and milestone');

-- As C (outsider)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000011","email":"sc@example.com","role":"authenticated"}', true);
set local role authenticated;
select is_empty('select id from public.milestones_achieved', 'outsider sees no milestones');
reset role;

-- As B (member)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000011","email":"sb@example.com","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ insert into public.milestones_achieved (baby_id, milestone_code, achieved_on, photo_id)
     values ('ba000000-0000-0000-0000-000000000012', 'lat', '2026-11-14', 'a0000000-0000-0000-0000-000000000012')
     on conflict (baby_id, milestone_code) do update set achieved_on = excluded.achieved_on $$,
  'member marks a milestone with a photo of the same baby (upsert)');
select throws_ok(
  $$ insert into public.milestones_achieved (baby_id, milestone_code, achieved_on, photo_id)
     values ('ba000000-0000-0000-0000-000000000012', 'ngoi', '2026-11-14', 'a0000000-0000-0000-0000-000000000013') $$,
  '42501', null, 'a photo of another baby cannot be attached');
select is_empty(
  $$ update public.milestones_achieved set note = 'sửa' where milestone_code = 'm2_social_4' returning id $$,
  'member cannot edit the owner''s mark');
select is_empty(
  $$ delete from public.milestones_achieved where milestone_code = 'm2_social_4' returning id $$,
  'member cannot delete the owner''s mark');
select isnt_empty(
  $$ delete from public.milestones_achieved where milestone_code = 'lat' returning id $$,
  'member deletes their own mark');
reset role;

-- As A (owner)
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000011","email":"sa@example.com","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$ update public.milestones_achieved set milestone_code = 'ngoi' where milestone_code = 'm2_social_4' $$,
  'P0001', 'immutable_column: milestone_code', 'milestone_code is immutable');
reset role;

delete from public.photos where id = 'a0000000-0000-0000-0000-000000000012';
select is(
  (select photo_id from public.milestones_achieved where milestone_code = 'm2_social_4'),
  null,
  'deleting a photo clears it from the milestone that showed it');

select * from finish();
rollback;
