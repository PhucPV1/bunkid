-- Spec 2026-11-26 §8.1: a doctor's visit during an illness episode, and the
-- photos of its prescription. A visit belongs to its episode by episode_id,
-- not by time: moving the episode's times never moves a visit out of it.
-- Visits and their photos are written straight to the server (no outbox); the
-- id still comes from the client (crypto.randomUUID()).
create table public.illness_visits (
  id uuid primary key,
  episode_id uuid not null,
  baby_id uuid not null references public.babies (id) on delete cascade,
  visited_at timestamptz not null,
  place text check (place is null or length(btrim(place)) between 1 and 80),
  conclusion text check (conclusion is null or length(btrim(conclusion)) between 1 and 120),
  advice text check (advice is null or length(btrim(advice)) between 1 and 500),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- No cascade: an episode with a visit cannot be deleted. Deleting the baby
  -- still removes everything through baby_id.
  foreign key (episode_id, baby_id) references public.illness_episodes (id, baby_id),
  unique (id, baby_id)
);
create index illness_visits_episode_idx on public.illness_visits (episode_id, visited_at);

create trigger illness_visits_set_updated_at before update on public.illness_visits
  for each row execute function public.set_updated_at();
create trigger illness_visits_immutable before update on public.illness_visits
  for each row execute function public.forbid_immutable_change('id', 'episode_id', 'baby_id', 'created_by');

alter table public.illness_visits enable row level security;

-- As illness_episodes: any member reads, adds and edits; the owner of the
-- family or whoever added the visit deletes it.
create policy illness_visits_select on public.illness_visits for select to authenticated
  using (public.is_member(public.baby_family(baby_id)));
create policy illness_visits_insert on public.illness_visits for insert to authenticated
  with check (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid());
create policy illness_visits_update on public.illness_visits for update to authenticated
  using (public.is_member(public.baby_family(baby_id)))
  with check (public.is_member(public.baby_family(baby_id)));
create policy illness_visits_delete on public.illness_visits for delete to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  );

-- A photo of a prescription points at its visit, of the same baby. No cascade:
-- a visit with a photo cannot be deleted. A photo never changes visit.
alter table public.photos add column visit_id uuid;
alter table public.photos add foreign key (visit_id, baby_id)
  references public.illness_visits (id, baby_id);
create index photos_visit_idx on public.photos (visit_id) where visit_id is not null;

drop trigger photos_immutable on public.photos;
create trigger photos_immutable before update on public.photos
  for each row execute function public.forbid_immutable_change('id', 'baby_id', 'created_by', 'storage_path', 'visit_id');
