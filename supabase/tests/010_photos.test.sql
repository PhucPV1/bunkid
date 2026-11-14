begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000010', 'pa@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000010', 'pb@example.com'),
  ('cccccccc-0000-0000-0000-000000000010', 'pc@example.com');
insert into public.families (id, name) values
  ('f0000000-0000-0000-0000-000000000010', 'Nhà P'),
  ('f0000000-0000-0000-0000-000000000011', 'Nhà khác');
insert into public.family_members (family_id, email, user_id, role, display_name) values
  ('f0000000-0000-0000-0000-000000000010', 'pa@example.com', 'aaaaaaaa-0000-0000-0000-000000000010', 'owner', 'Mẹ'),
  ('f0000000-0000-0000-0000-000000000010', 'pb@example.com', 'bbbbbbbb-0000-0000-0000-000000000010', 'member', 'Bà'),
  ('f0000000-0000-0000-0000-000000000011', 'pc@example.com', 'cccccccc-0000-0000-0000-000000000010', 'owner', 'Khác');
insert into public.babies (id, family_id, name, dob, sex) values
  ('ba000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000010', 'Bé', '2026-09-14', 'female'),
  ('ba000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000011', 'Bé khác', '2026-09-14', 'male');
insert into storage.objects (bucket_id, name, owner_id) values
  ('photos', 'f0000000-0000-0000-0000-000000000010/ba000000-0000-0000-0000-000000000010/a0000000-0000-0000-0000-000000000010.jpg', 'aaaaaaaa-0000-0000-0000-000000000010');
insert into public.photos (id, baby_id, storage_path, taken_on, size_bytes, created_by) values
  ('a0000000-0000-0000-0000-000000000010', 'ba000000-0000-0000-0000-000000000010',
   'f0000000-0000-0000-0000-000000000010/ba000000-0000-0000-0000-000000000010/a0000000-0000-0000-0000-000000000010.jpg',
   '2026-11-01', 250000, 'aaaaaaaa-0000-0000-0000-000000000010');

select is((select public from storage.buckets where id = 'photos'), false, 'the photos bucket is private');

-- The Storage API deletes objects with this flag set; tests delete directly the same way.
select set_config('storage.allow_delete_query', 'true', true);

-- As C (other family)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000010","email":"pc@example.com","role":"authenticated"}', true);
set local role authenticated;
select is_empty('select id from public.photos', 'outsider sees no photo rows');
select is_empty($$ select name from storage.objects where bucket_id = 'photos' and name like 'f0000000-0000-0000-0000-000000000010/%' $$,
  'outsider sees no photo objects of another family');
reset role;

-- As B (member)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000010","email":"pb@example.com","role":"authenticated"}', true);
set local role authenticated;
select isnt_empty(
  $$ select name from storage.objects where name like '%/a0000000-0000-0000-0000-000000000010.jpg' $$,
  'member can read the owner''s object (needed for signed URLs)');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id) values
     ('photos', 'f0000000-0000-0000-0000-000000000010/ba000000-0000-0000-0000-000000000010/b0000000-0000-0000-0000-000000000010.jpg', 'bbbbbbbb-0000-0000-0000-000000000010') $$,
  'member uploads into the family folder');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id) values
     ('photos', 'f0000000-0000-0000-0000-000000000010/ba000000-0000-0000-0000-000000000010/e0000000-0000-0000-0000-000000000010.jpg', 'bbbbbbbb-0000-0000-0000-000000000010') $$,
  'member uploads a second object');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id) values
     ('photos', 'f0000000-0000-0000-0000-000000000010/ba000000-0000-0000-0000-000000000011/c0000000-0000-0000-0000-000000000010.jpg', 'bbbbbbbb-0000-0000-0000-000000000010') $$,
  '42501', null, 'member cannot upload under a baby of another family');
select lives_ok(
  $$ insert into public.photos (id, baby_id, storage_path, taken_on, size_bytes) values
     ('b0000000-0000-0000-0000-000000000010', 'ba000000-0000-0000-0000-000000000010',
      'f0000000-0000-0000-0000-000000000010/ba000000-0000-0000-0000-000000000010/b0000000-0000-0000-0000-000000000010.jpg',
      '2026-11-14', 180000) $$,
  'member adds the photo row');
select throws_ok(
  $$ insert into public.photos (id, baby_id, storage_path, taken_on, size_bytes) values
     ('d0000000-0000-0000-0000-000000000010', 'ba000000-0000-0000-0000-000000000010',
      'f0000000-0000-0000-0000-000000000011/ba000000-0000-0000-0000-000000000011/d0000000-0000-0000-0000-000000000010.jpg',
      '2026-11-14', 180000) $$,
  '42501', null, 'a photo row cannot point into another family''s folder');
select is_empty(
  $$ delete from storage.objects where name like '%/a0000000-0000-0000-0000-000000000010.jpg' returning name $$,
  'member cannot delete the owner''s object');
select is_empty(
  $$ delete from public.photos where id = 'a0000000-0000-0000-0000-000000000010' returning id $$,
  'member cannot delete the owner''s photo row');
select isnt_empty(
  $$ delete from storage.objects where name like '%/e0000000-0000-0000-0000-000000000010.jpg' returning name $$,
  'member deletes an object they uploaded (upload rollback)');
select is(public.photos_total_bytes(), 430000::bigint, 'member sees the family''s total bytes');
reset role;

-- As A (owner)
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000010","email":"pa@example.com","role":"authenticated"}', true);
set local role authenticated;
select isnt_empty(
  $$ delete from storage.objects where name like '%/b0000000-0000-0000-0000-000000000010.jpg' returning name $$,
  'owner deletes the member''s object');
select isnt_empty(
  $$ delete from public.photos where id = 'b0000000-0000-0000-0000-000000000010' returning id $$,
  'owner deletes the member''s photo row');
reset role;

select * from finish();
rollback;
