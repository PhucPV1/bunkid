begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

insert into auth.users (id, email) values ('aaaaaaaa-0000-0000-0000-000000000016', 'so@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000026', 'Nhà S');
insert into public.family_members (family_id, email, user_id, role, display_name)
  values ('f0000000-0000-0000-0000-000000000026', 'so@example.com', 'aaaaaaaa-0000-0000-0000-000000000016', 'owner', 'Mẹ');
insert into public.babies (id, family_id, name, dob, sex)
  values ('ba000000-0000-0000-0000-000000000026', 'f0000000-0000-0000-0000-000000000026', 'Bé', '2026-05-01', 'female');

-- Spec 2026-11-26 §3.1: symptom is an instant type (ended_at = started_at).
select lives_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, details, created_by)
     values ('1f000000-0000-0000-0000-000000000001', 'ba000000-0000-0000-0000-000000000026', 'symptom', now(), now(),
             '{"codes": ["runny_nose", "cough"], "note": "Ho nhiều hơn về đêm"}', 'aaaaaaaa-0000-0000-0000-000000000016') $$,
  'symptom is accepted');
select throws_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, created_by)
     values ('1f000000-0000-0000-0000-000000000002', 'ba000000-0000-0000-0000-000000000026', 'symptoms', now(), now(),
             'aaaaaaaa-0000-0000-0000-000000000016') $$,
  '23514', null, 'an unknown type is still refused');
select lives_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, details, created_by)
     values ('1f000000-0000-0000-0000-000000000003', 'ba000000-0000-0000-0000-000000000026', 'note', now(), now(),
             '{"text": "Bé cười nhiều"}', 'aaaaaaaa-0000-0000-0000-000000000016') $$,
  'an old type still passes');

select * from finish();
rollback;
