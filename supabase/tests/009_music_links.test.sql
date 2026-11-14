begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000009', 'ma@example.com'),
  ('bbbbbbbb-0000-0000-0000-000000000009', 'mb@example.com'),
  ('cccccccc-0000-0000-0000-000000000009', 'mc@example.com');
insert into public.families (id, name) values ('f0000000-0000-0000-0000-000000000009', 'Nhà M');
insert into public.family_members (family_id, email, user_id, role, display_name) values
  ('f0000000-0000-0000-0000-000000000009', 'ma@example.com', 'aaaaaaaa-0000-0000-0000-000000000009', 'owner', 'Mẹ'),
  ('f0000000-0000-0000-0000-000000000009', 'mb@example.com', 'bbbbbbbb-0000-0000-0000-000000000009', 'member', 'Bà');
insert into public.music_links (id, family_id, category, title, youtube_video_id, created_by) values
  ('a1000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000009', 'relax', 'Ru con', 'dQw4w9WgXcQ', 'aaaaaaaa-0000-0000-0000-000000000009');

select throws_ok(
  $$ insert into public.music_links (family_id, category, created_by)
     values ('f0000000-0000-0000-0000-000000000009', 'relax', 'aaaaaaaa-0000-0000-0000-000000000009') $$,
  '23514', null, 'a link needs a preset, a video or a playlist');
select throws_ok(
  $$ insert into public.music_links (family_id, category, youtube_video_id, created_by)
     values ('f0000000-0000-0000-0000-000000000009', 'relax', 'bad id', 'aaaaaaaa-0000-0000-0000-000000000009') $$,
  '23514', null, 'video id must look like a YouTube id');

-- As C (outsider)
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000009","email":"mc@example.com","role":"authenticated"}', true);
set local role authenticated;
select is_empty('select id from public.music_links', 'outsider sees no music links');
reset role;

-- As B (member)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000009","email":"mb@example.com","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$ insert into public.music_links (family_id, category, preset_code, hidden)
     values ('f0000000-0000-0000-0000-000000000009', 'brain', 'brain_mozart', true)
     on conflict (family_id, preset_code)
     do update set hidden = excluded.hidden $$,
  'member hides a preset with an upsert');
select isnt_empty(
  $$ update public.music_links set hidden = true where id = 'a1000000-0000-0000-0000-000000000009' returning id $$,
  'member hides a link the owner added (spec §10.2)');
select is_empty(
  $$ delete from public.music_links where id = 'a1000000-0000-0000-0000-000000000009' returning id $$,
  'member cannot delete a link the owner added (spec §10.2)');
reset role;

-- As A (owner)
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000009","email":"ma@example.com","role":"authenticated"}', true);
set local role authenticated;
select isnt_empty(
  $$ delete from public.music_links where preset_code = 'brain_mozart' returning id $$,
  'owner deletes the member''s row');
select throws_ok(
  $$ update public.music_links set family_id = 'f0000000-0000-0000-0000-000000000099' where id = 'a1000000-0000-0000-0000-000000000009' $$,
  'P0001', 'immutable_column: family_id', 'family_id is immutable');
reset role;
select is(
  (select hidden from public.music_links where id = 'a1000000-0000-0000-0000-000000000009'),
  true,
  'the member''s hide was saved and the row still exists');

select * from finish();
rollback;
