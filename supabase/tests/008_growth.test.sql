begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000008', 'ga@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000008', 'gb@example.com'),
  ('cccccccc-0000-0000-0000-000000000008', 'gc@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000008', 'Nhà G');
insert into public.family_members (family_id, email, user_id, role, display_name) values
  ('f0000000-0000-0000-0000-000000000008', 'ga@example.com', 'aaaaaaaa-0000-0000-0000-000000000008', 'owner', 'Mẹ'),
  ('f0000000-0000-0000-0000-000000000008', 'gb@example.com', 'bbbbbbbb-0000-0000-0000-000000000008', 'member', 'Bà');
insert into public.babies (id, family_id, name, dob, sex)
  values ('ba000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000008', 'Bé', '2026-09-14', 'female');
insert into public.growth (id, baby_id, measured_on, weight_g, created_by) values
  ('a0000000-0000-0000-0000-000000000008', 'ba000000-0000-0000-0000-000000000008', '2026-10-14', 4300, 'aaaaaaaa-0000-0000-0000-000000000008');

select throws_ok(
  $$ insert into public.growth (id, baby_id, measured_on, created_by)
     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000008', '2026-11-01', 'aaaaaaaa-0000-0000-0000-000000000008') $$,
  '23514', null, 'a measurement needs at least one value');
select throws_ok(
  $$ insert into public.growth (id, baby_id, measured_on, weight_g, created_by)
     values (gen_random_uuid(), 'ba000000-0000-0000-0000-000000000008', '2026-11-01', 100, 'aaaaaaaa-0000-0000-0000-000000000008') $$,
  '23514', null, 'weight below 300 g is rejected');

-- As C (outsider)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000008","email":"gc@example.com","role":"authenticated"}', true);
set local role authenticated;
select is_empty('select id from public.growth', 'outsider sees no measurements');
reset role;

-- As B (member)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000008","email":"gb@example.com","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.growth), 1, 'member sees the family''s measurements');
select lives_ok(
  $$ insert into public.growth (id, baby_id, measured_on, length_cm, head_cm)
     values ('b0000000-0000-0000-0000-000000000008', 'ba000000-0000-0000-0000-000000000008', '2026-11-14', 58.5, 39.0) $$,
  'member adds a measurement with a client id');
select is_empty(
  $$ update public.growth set weight_g = 4400 where id = 'a0000000-0000-0000-0000-000000000008' returning id $$,
  'member cannot edit the owner''s measurement');
select is_empty(
  $$ delete from public.growth where id = 'a0000000-0000-0000-0000-000000000008' returning id $$,
  'member cannot delete the owner''s measurement');
reset role;

-- As A (owner)
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000008","email":"ga@example.com","role":"authenticated"}', true);
set local role authenticated;
select isnt_empty(
  $$ update public.growth set head_cm = 39.5 where id = 'b0000000-0000-0000-0000-000000000008' returning id $$,
  'owner edits the member''s measurement');
select throws_ok(
  $$ update public.growth set baby_id = 'ba000000-0000-0000-0000-000000000099' where id = 'b0000000-0000-0000-0000-000000000008' $$,
  'P0001', 'immutable_column: baby_id', 'baby_id is immutable');
reset role;
select is(
  (select weight_g from public.growth where id = 'a0000000-0000-0000-0000-000000000008'),
  4300,
  'the member''s edit and delete of the owner''s row had no effect');

select * from finish();
rollback;
