begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000006', 'va@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000006', 'vb@example.com'),
  ('cccccccc-0000-0000-0000-000000000006', 'vc@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000006', 'Nhà V');
insert into public.family_members (family_id, email, user_id, role, display_name) values
  ('f0000000-0000-0000-0000-000000000006', 'va@example.com', 'aaaaaaaa-0000-0000-0000-000000000006', 'owner', 'Mẹ'),
  ('f0000000-0000-0000-0000-000000000006', 'vb@example.com', 'bbbbbbbb-0000-0000-0000-000000000006', 'member', 'Bà');
insert into public.babies (id, family_id, name, dob, sex)
  values ('ba000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000006', 'Bé', '2026-09-14', 'female');
insert into public.vaccine_doses (baby_id, vaccine_code, dose_no, status, given_on, created_by)
  values ('ba000000-0000-0000-0000-000000000006', 'bcg', 1, 'done', '2026-09-14', 'aaaaaaaa-0000-0000-0000-000000000006');

select throws_ok(
  $$ insert into public.vaccine_doses (baby_id, vaccine_code, dose_no, status, created_by)
     values ('ba000000-0000-0000-0000-000000000006', 'hexa', 1, 'rescheduled', 'aaaaaaaa-0000-0000-0000-000000000006') $$,
  '23514', null, 'rescheduled needs due_on_override');
select throws_ok(
  $$ insert into public.vaccine_doses (baby_id, vaccine_code, dose_no, status, created_by)
     values ('ba000000-0000-0000-0000-000000000006', 'bcg', 1, 'skipped', 'aaaaaaaa-0000-0000-0000-000000000006') $$,
  '23505', null, 'one row per (baby, vaccine, dose)');

-- As C (outsider)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000006","email":"vc@example.com","role":"authenticated"}', true);
set local role authenticated;
select is_empty('select id from public.vaccine_doses', 'outsider sees no vaccine doses');
reset role;

-- As B (member)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000006","email":"vb@example.com","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.vaccine_doses), 1, 'member sees the family''s doses');
select lives_ok(
  $$ insert into public.vaccine_doses (baby_id, vaccine_code, dose_no, status, given_on)
     values ('ba000000-0000-0000-0000-000000000006', 'hexa', 1, 'done', '2026-11-13') $$,
  'member marks a dose done (created_by defaults to them)');
select lives_ok(
  $$ update public.vaccine_doses set note = 'tiêm ở trạm' where vaccine_code = 'bcg' $$,
  'member updates a dose someone else recorded');
select lives_ok(
  $$ delete from public.vaccine_doses where vaccine_code = 'bcg' $$,
  'member delete of someone else''s row runs but matches nothing');
reset role;
select is((select note from public.vaccine_doses where vaccine_code = 'bcg'), 'tiêm ở trạm', 'member update applied, row still there');

-- As A (owner)
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000006","email":"va@example.com","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ delete from public.vaccine_doses where vaccine_code = 'hexa' $$,
  'owner deletes a row the member recorded');
reset role;
select is(
  (select array_agg(vaccine_code order by vaccine_code) from public.vaccine_doses where baby_id = 'ba000000-0000-0000-0000-000000000006'),
  array['bcg'],
  'only the owner delete took effect');

select * from finish();
rollback;
