create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Every minute, POST /api/push/dispatch. The app URL and the shared secret live in
-- Supabase Vault (secrets "app_url" and "cron_secret"), never in this file.
-- Until both secrets exist the job does nothing.
select cron.schedule(
  'push-dispatch',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'app_url')
      || '/api/push/dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  )
  where exists (select 1 from vault.decrypted_secrets where name = 'app_url')
    and exists (select 1 from vault.decrypted_secrets where name = 'cron_secret');
  $$
);
