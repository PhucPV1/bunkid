-- Spec §5: one row per (baby, milestone). Spec §9: written through the outbox as an
-- upsert on (baby_id, milestone_code) without sending id.
create table public.milestones_achieved (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies (id) on delete cascade,
  milestone_code text not null check (milestone_code ~ '^[a-z0-9_]{1,40}$'),
  achieved_on date not null,
  note text check (note is null or length(btrim(note)) between 1 and 500),
  photo_id uuid references public.photos (id) on delete set null,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  unique (baby_id, milestone_code)
);

create trigger milestones_achieved_immutable before update on public.milestones_achieved
  for each row execute function public.forbid_immutable_change('id', 'baby_id', 'created_by', 'milestone_code');

-- A milestone may only show a photo of the same baby. Security invoker: the caller
-- already sees their family's photos through photos_select, and outsiders see none.
create function public.photo_matches_baby(p_photo uuid, p_baby uuid) returns boolean
language sql stable security invoker set search_path = '' as $$
  select p_photo is null
    or exists (select 1 from public.photos where id = p_photo and baby_id = p_baby)
$$;

alter table public.milestones_achieved enable row level security;

-- Spec §5.2: same rules as logs.
create policy milestones_achieved_select on public.milestones_achieved for select to authenticated
  using (public.is_member(public.baby_family(baby_id)));
create policy milestones_achieved_insert on public.milestones_achieved for insert to authenticated
  with check (
    public.is_member(public.baby_family(baby_id))
    and created_by = auth.uid()
    and public.photo_matches_baby(photo_id, baby_id)
  );
create policy milestones_achieved_update on public.milestones_achieved for update to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  )
  with check (
    (
      public.is_owner(public.baby_family(baby_id))
      or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
    )
    and public.photo_matches_baby(photo_id, baby_id)
  );
create policy milestones_achieved_delete on public.milestones_achieved for delete to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  );
