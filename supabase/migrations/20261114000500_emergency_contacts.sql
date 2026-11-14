create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  label text not null check (length(btrim(label)) between 1 and 60),
  phone text not null check (phone ~ '^\+?[0-9]{3,15}$'),
  sort int not null default 0,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);
create index emergency_contacts_family_idx on public.emergency_contacts (family_id, sort);

create trigger emergency_contacts_immutable before update on public.emergency_contacts
  for each row execute function public.forbid_immutable_change('id', 'family_id', 'created_by');

alter table public.emergency_contacts enable row level security;

-- Spec §5.2: every member reads, adds, edits and deletes the family's contacts.
create policy emergency_contacts_select on public.emergency_contacts for select to authenticated
  using (public.is_member(family_id));
create policy emergency_contacts_insert on public.emergency_contacts for insert to authenticated
  with check (public.is_member(family_id) and created_by = auth.uid());
create policy emergency_contacts_update on public.emergency_contacts for update to authenticated
  using (public.is_member(family_id))
  with check (public.is_member(family_id));
create policy emergency_contacts_delete on public.emergency_contacts for delete to authenticated
  using (public.is_member(family_id));
