begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

select is(
  (select schedule from cron.job where jobname = 'push-dispatch'),
  '* * * * *',
  'push-dispatch runs every minute');
select ok(
  (select command like '%/api/push/dispatch%' from cron.job where jobname = 'push-dispatch'),
  'push-dispatch calls /api/push/dispatch');
select ok(
  (select command like '%vault.decrypted_secrets%' and command not like '%vercel.app%'
   from cron.job where jobname = 'push-dispatch'),
  'push-dispatch reads the URL and secret from Vault');

-- Without the Vault secrets the job must run cleanly and send nothing.
select lives_ok(
  (select command from cron.job where jobname = 'push-dispatch'),
  'push-dispatch is a no-op until app_url and cron_secret exist');

select * from finish();
rollback;
