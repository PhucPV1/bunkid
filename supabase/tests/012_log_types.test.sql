begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email) values ('aaaaaaaa-0000-0000-0000-000000000012', 'la@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000022', 'Nhà L');
insert into public.family_members (family_id, email, user_id, role, display_name)
  values ('f0000000-0000-0000-0000-000000000022', 'la@example.com', 'aaaaaaaa-0000-0000-0000-000000000012', 'owner', 'Mẹ');
insert into public.babies (id, family_id, name, dob, sex)
  values ('ba000000-0000-0000-0000-000000000022', 'f0000000-0000-0000-0000-000000000022', 'Bé', '2026-05-01', 'female');

-- Spec 2026-11-17 §3.1: four more instant types (ended_at = started_at).
select lives_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, details, created_by)
     values ('1e000000-0000-0000-0000-000000000001', 'ba000000-0000-0000-0000-000000000022', 'solids', now(), now(),
             '{"food": "Cháo bí đỏ", "amount": "some", "isNew": true}', 'aaaaaaaa-0000-0000-0000-000000000012') $$,
  'solids is accepted');
select lives_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, details, created_by)
     values ('1e000000-0000-0000-0000-000000000002', 'ba000000-0000-0000-0000-000000000022', 'water', now(), now(),
             '{"ml": 30}', 'aaaaaaaa-0000-0000-0000-000000000012') $$,
  'water is accepted');
select lives_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, details, created_by)
     values ('1e000000-0000-0000-0000-000000000003', 'ba000000-0000-0000-0000-000000000022', 'bath', now(), now(),
             '{}', 'aaaaaaaa-0000-0000-0000-000000000012') $$,
  'bath is accepted');
select lives_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, details, created_by)
     values ('1e000000-0000-0000-0000-000000000004', 'ba000000-0000-0000-0000-000000000022', 'note', now(), now(),
             '{"text": "Bé cười nhiều"}', 'aaaaaaaa-0000-0000-0000-000000000012') $$,
  'note is accepted');

select throws_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, created_by)
     values ('1e000000-0000-0000-0000-000000000005', 'ba000000-0000-0000-0000-000000000022', 'abc', now(), now(),
             'aaaaaaaa-0000-0000-0000-000000000012') $$,
  '23514', null, 'an unknown type is still refused');
select lives_ok(
  $$ insert into public.logs (id, baby_id, type, started_at, ended_at, created_by)
     values ('1e000000-0000-0000-0000-000000000006', 'ba000000-0000-0000-0000-000000000022', 'tummy', now(), now(),
             'aaaaaaaa-0000-0000-0000-000000000012') $$,
  'an old type still passes');

select * from finish();
rollback;
