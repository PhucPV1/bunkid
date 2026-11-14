begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000007', 'ea@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000007', 'eb@example.com'),
  ('cccccccc-0000-0000-0000-000000000007', 'ec@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000007', 'Nhà E');
insert into public.family_members (family_id, email, user_id, role, display_name) values
  ('f0000000-0000-0000-0000-000000000007', 'ea@example.com', 'aaaaaaaa-0000-0000-0000-000000000007', 'owner', 'Mẹ'),
  ('f0000000-0000-0000-0000-000000000007', 'eb@example.com', 'bbbbbbbb-0000-0000-0000-000000000007', 'member', 'Bà');
insert into public.emergency_contacts (id, family_id, label, phone, sort, created_by) values
  ('e0000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000007', 'Bác sĩ Lan', '0901234567', 1, 'aaaaaaaa-0000-0000-0000-000000000007');

select throws_ok(
  $$ insert into public.emergency_contacts (family_id, label, phone, created_by)
     values ('f0000000-0000-0000-0000-000000000007', 'Sai số', '09-01', 'aaaaaaaa-0000-0000-0000-000000000007') $$,
  '23514', null, 'phone must be digits with an optional leading +');

-- As C (outsider)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000007","email":"ec@example.com","role":"authenticated"}', true);
set local role authenticated;
select is_empty('select id from public.emergency_contacts', 'outsider sees no contacts');
reset role;

-- As B (member)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000007","email":"eb@example.com","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ insert into public.emergency_contacts (family_id, label, phone, sort)
     values ('f0000000-0000-0000-0000-000000000007', 'Ông bà nội', '+84912345678', 2) $$,
  'member adds a contact (created_by defaults to them)');
select lives_ok(
  $$ update public.emergency_contacts set phone = '0907654321' where label = 'Bác sĩ Lan' $$,
  'member edits a contact the owner added');
select throws_ok(
  $$ update public.emergency_contacts set family_id = 'f0000000-0000-0000-0000-000000000099' where label = 'Bác sĩ Lan' $$,
  'P0001', 'immutable_column: family_id', 'family_id is immutable');
select lives_ok(
  $$ delete from public.emergency_contacts where label = 'Bác sĩ Lan' $$,
  'member deletes a contact the owner added');
reset role;
select is(
  (select array_agg(label order by sort) from public.emergency_contacts where family_id = 'f0000000-0000-0000-0000-000000000007'),
  array['Ông bà nội'],
  'member edits and deletes took effect');
select is(
  (select created_by from public.emergency_contacts where label = 'Ông bà nội'),
  'bbbbbbbb-0000-0000-0000-000000000007'::uuid,
  'created_by is the member');

select * from finish();
rollback;
