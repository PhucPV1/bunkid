-- Spec 2026-11-26 §4.1: an illness episode is a stretch of time with a start and
-- an end. id comes from the client (crypto.randomUUID()) so outbox retries never
-- duplicate a row. Logs belong to an episode by their time; there is no foreign
-- key from logs.
create extension if not exists btree_gist with schema extensions;

create table public.illness_episodes (
  id uuid primary key,
  baby_id uuid not null references public.babies (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at > started_at),
  unique (id, baby_id),
  -- No two episodes of one baby share a moment. An open episode runs to
  -- infinity, so this also allows only one open episode per baby.
  constraint illness_episodes_no_overlap exclude using gist (
    baby_id with =,
    tstzrange(started_at, coalesce(ended_at, 'infinity'::timestamptz), '[)') with &&
  )
);

create trigger illness_episodes_set_updated_at before update on public.illness_episodes
  for each row execute function public.set_updated_at();
create trigger illness_episodes_immutable before update on public.illness_episodes
  for each row execute function public.forbid_immutable_change('id', 'baby_id', 'created_by');

alter table public.illness_episodes enable row level security;

-- Unlike logs, any member may update: one parent opens the episode, the other
-- may close it. Delete stays with the owner of the family or the creator.
create policy illness_episodes_select on public.illness_episodes for select to authenticated
  using (public.is_member(public.baby_family(baby_id)));
create policy illness_episodes_insert on public.illness_episodes for insert to authenticated
  with check (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid());
create policy illness_episodes_update on public.illness_episodes for update to authenticated
  using (public.is_member(public.baby_family(baby_id)))
  with check (public.is_member(public.baby_family(baby_id)));
create policy illness_episodes_delete on public.illness_episodes for delete to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  );
