begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000014', 'ha@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000014', 'hb@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000014', 'Nhà H');
insert into public.family_members (family_id, email, user_id, role, display_name) values
  ('f0000000-0000-0000-0000-000000000014', 'ha@example.com', 'aaaaaaaa-0000-0000-0000-000000000014', 'owner', 'Mẹ'),
  ('f0000000-0000-0000-0000-000000000014', 'hb@example.com', 'bbbbbbbb-0000-0000-0000-000000000014', 'member', 'Bà');
insert into public.babies (id, family_id, name, dob, sex)
  values ('ba000000-0000-0000-0000-000000000014', 'f0000000-0000-0000-0000-000000000014', 'Bé', '2026-09-14', 'male');

-- Spec 2026-11-25 §6.1: three optional heights on the baby's profile.
select has_column('public', 'babies', 'father_height_cm', 'babies has father_height_cm');
select has_column('public', 'babies', 'mother_height_cm', 'babies has mother_height_cm');
select has_column('public', 'babies', 'target_height_cm', 'babies has target_height_cm');
select col_is_null('public', 'babies', 'father_height_cm', 'father_height_cm is optional');
select col_is_null('public', 'babies', 'mother_height_cm', 'mother_height_cm is optional');
select col_is_null('public', 'babies', 'target_height_cm', 'target_height_cm is optional');

-- Each height stays within 120–220 cm.
select throws_ok(
  $$ update public.babies set father_height_cm = 119.9 where id = 'ba000000-0000-0000-0000-000000000014' $$,
  '23514', null, 'father_height_cm below 120 is rejected');
select throws_ok(
  $$ update public.babies set father_height_cm = 220.1 where id = 'ba000000-0000-0000-0000-000000000014' $$,
  '23514', null, 'father_height_cm above 220 is rejected');
select lives_ok(
  $$ update public.babies set father_height_cm = 120 where id = 'ba000000-0000-0000-0000-000000000014' $$,
  'father_height_cm 120 is accepted');
select lives_ok(
  $$ update public.babies set father_height_cm = 220 where id = 'ba000000-0000-0000-0000-000000000014' $$,
  'father_height_cm 220 is accepted');
select throws_ok(
  $$ update public.babies set mother_height_cm = 119.9 where id = 'ba000000-0000-0000-0000-000000000014' $$,
  '23514', null, 'mother_height_cm below 120 is rejected');
select throws_ok(
  $$ update public.babies set mother_height_cm = 220.1 where id = 'ba000000-0000-0000-0000-000000000014' $$,
  '23514', null, 'mother_height_cm above 220 is rejected');
select lives_ok(
  $$ update public.babies set mother_height_cm = 120 where id = 'ba000000-0000-0000-0000-000000000014' $$,
  'mother_height_cm 120 is accepted');
select lives_ok(
  $$ update public.babies set mother_height_cm = 220 where id = 'ba000000-0000-0000-0000-000000000014' $$,
  'mother_height_cm 220 is accepted');
select throws_ok(
  $$ update public.babies set target_height_cm = 119.9 where id = 'ba000000-0000-0000-0000-000000000014' $$,
  '23514', null, 'target_height_cm below 120 is rejected');
select throws_ok(
  $$ update public.babies set target_height_cm = 220.1 where id = 'ba000000-0000-0000-0000-000000000014' $$,
  '23514', null, 'target_height_cm above 220 is rejected');
select lives_ok(
  $$ update public.babies set target_height_cm = 120 where id = 'ba000000-0000-0000-0000-000000000014' $$,
  'target_height_cm 120 is accepted');
select lives_ok(
  $$ update public.babies set target_height_cm = 220 where id = 'ba000000-0000-0000-0000-000000000014' $$,
  'target_height_cm 220 is accepted');

-- As B (member): reads the heights, cannot change them.
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000014","email":"hb@example.com","role":"authenticated"}', true);
set local role authenticated;
select is(
  (select row(father_height_cm, mother_height_cm, target_height_cm)::text from public.babies
    where id = 'ba000000-0000-0000-0000-000000000014'),
  '(220.0,220.0,220.0)',
  'a member reads the three heights');
select is_empty(
  $$ update public.babies set father_height_cm = 175, mother_height_cm = 160, target_height_cm = 180
     where id = 'ba000000-0000-0000-0000-000000000014' returning id $$,
  'a member who is not the owner cannot change the heights');
reset role;

-- As A (owner)
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000014","email":"ha@example.com","role":"authenticated"}', true);
set local role authenticated;
select isnt_empty(
  $$ update public.babies set father_height_cm = 175, mother_height_cm = 160.5, target_height_cm = null
     where id = 'ba000000-0000-0000-0000-000000000014' returning id $$,
  'the owner changes the heights and clears the goal');
reset role;

select * from finish();
rollback;
