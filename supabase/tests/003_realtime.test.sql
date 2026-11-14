begin;
create extension if not exists pgtap with schema extensions;
select plan(1);
select ok(
  exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'logs'
  ),
  'logs is published to supabase_realtime');
select * from finish();
rollback;
