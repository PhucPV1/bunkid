-- Spec 2026-11-17 §3.1: four more instant log types. Only widens the check on logs.type.
alter table public.logs drop constraint logs_type_check;
alter table public.logs add constraint logs_type_check
  check (type in ('breast', 'bottle', 'sleep', 'diaper', 'medicine', 'temperature', 'pump', 'tummy',
                  'solids', 'water', 'bath', 'note'));
