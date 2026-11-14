create table public.music_links (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  category text not null check (category in ('relax', 'brain')),
  title text check (title is null or length(btrim(title)) between 1 and 80),
  youtube_video_id text check (youtube_video_id is null or youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  youtube_playlist_id text check (youtube_playlist_id is null or youtube_playlist_id ~ '^[A-Za-z0-9_-]{10,64}$'),
  preset_code text check (preset_code is null or preset_code ~ '^[a-z0-9_]{1,40}$'),
  hidden boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  check (preset_code is not null or youtube_video_id is not null or youtube_playlist_id is not null),
  -- One row per preset per family, so hiding a preset is an upsert. NULLs never clash,
  -- so pasted links (preset_code null) are not limited.
  unique (family_id, preset_code)
);
create index music_links_family_idx on public.music_links (family_id, created_at);

create trigger music_links_immutable before update on public.music_links
  for each row execute function public.forbid_immutable_change('id', 'family_id', 'created_by');

alter table public.music_links enable row level security;

-- Spec §5.2: every member hides, unhides and edits; delete only your own row, or any row as owner.
create policy music_links_select on public.music_links for select to authenticated
  using (public.is_member(family_id));
create policy music_links_insert on public.music_links for insert to authenticated
  with check (public.is_member(family_id) and created_by = auth.uid());
create policy music_links_update on public.music_links for update to authenticated
  using (public.is_member(family_id))
  with check (public.is_member(family_id));
create policy music_links_delete on public.music_links for delete to authenticated
  using (
    public.is_owner(family_id)
    or (public.is_member(family_id) and created_by = auth.uid())
  );
