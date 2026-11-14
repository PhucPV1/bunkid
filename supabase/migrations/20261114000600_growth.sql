-- Spec §5: id comes from the client (crypto.randomUUID()) so outbox retries never duplicate a row.
create table public.growth (
  id uuid primary key,
  baby_id uuid not null references public.babies (id) on delete cascade,
  measured_on date not null,
  weight_g int check (weight_g is null or weight_g between 300 and 40000),
  length_cm numeric(4, 1) check (length_cm is null or length_cm between 20 and 130),
  head_cm numeric(4, 1) check (head_cm is null or head_cm between 20 and 60),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (weight_g is not null or length_cm is not null or head_cm is not null)
);
create index growth_baby_measured_idx on public.growth (baby_id, measured_on desc);

create trigger growth_set_updated_at before update on public.growth
  for each row execute function public.set_updated_at();
create trigger growth_immutable before update on public.growth
  for each row execute function public.forbid_immutable_change('id', 'baby_id', 'created_by');

alter table public.growth enable row level security;

-- Spec §5.2: same rules as logs.
create policy growth_select on public.growth for select to authenticated
  using (public.is_member(public.baby_family(baby_id)));
create policy growth_insert on public.growth for insert to authenticated
  with check (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid());
create policy growth_update on public.growth for update to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  )
  with check (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  );
create policy growth_delete on public.growth for delete to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  );
