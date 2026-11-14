create table public.vaccine_doses (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies (id) on delete cascade,
  vaccine_code text not null check (vaccine_code ~ '^[a-z0-9_]{1,40}$'),
  dose_no int not null check (dose_no between 1 and 10),
  status text not null check (status in ('done', 'skipped', 'rescheduled')),
  given_on date,
  due_on_override date,
  place text check (place is null or length(place) <= 120),
  note text check (note is null or length(note) <= 500),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (baby_id, vaccine_code, dose_no),
  check (status <> 'rescheduled' or due_on_override is not null)
);

create trigger vaccine_doses_set_updated_at before update on public.vaccine_doses
  for each row execute function public.set_updated_at();
create trigger vaccine_doses_immutable before update on public.vaccine_doses
  for each row execute function public.forbid_immutable_change('id', 'baby_id', 'created_by');

alter table public.vaccine_doses enable row level security;

-- Spec §5.2: every member reads and marks doses; delete only your own row, or any row as owner.
create policy vaccine_doses_select on public.vaccine_doses for select to authenticated
  using (public.is_member(public.baby_family(baby_id)));
create policy vaccine_doses_insert on public.vaccine_doses for insert to authenticated
  with check (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid());
create policy vaccine_doses_update on public.vaccine_doses for update to authenticated
  using (public.is_member(public.baby_family(baby_id)))
  with check (public.is_member(public.baby_family(baby_id)));
create policy vaccine_doses_delete on public.vaccine_doses for delete to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  );
