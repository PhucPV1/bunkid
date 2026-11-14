-- Spec §5, §5.2, §6.14: photo rows plus the private Storage bucket "photos",
-- objects stored at <family_id>/<baby_id>/<uuid>.jpg.
create table public.photos (
  id uuid primary key,
  baby_id uuid not null references public.babies (id) on delete cascade,
  storage_path text not null unique
    check (storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'),
  taken_on date not null,
  caption text check (caption is null or length(btrim(caption)) between 1 and 200),
  size_bytes int not null check (size_bytes between 1 and 5242880),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);
create index photos_baby_taken_idx on public.photos (baby_id, taken_on desc);

create trigger photos_immutable before update on public.photos
  for each row execute function public.forbid_immutable_change('id', 'baby_id', 'created_by', 'storage_path');

alter table public.photos enable row level security;

create policy photos_select on public.photos for select to authenticated
  using (public.is_member(public.baby_family(baby_id)));
-- The row must point at an object inside its own family's and baby's folder.
create policy photos_insert on public.photos for insert to authenticated
  with check (
    public.is_member(public.baby_family(baby_id))
    and created_by = auth.uid()
    and storage_path like public.baby_family(baby_id)::text || '/' || baby_id::text || '/%'
  );
create policy photos_update on public.photos for update to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  )
  with check (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  );
create policy photos_delete on public.photos for delete to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  );

-- Spec §6.14: bytes used by the photos the caller can see (their family's). An
-- aggregate, so the quota stays right past the 1000-row page limit.
create function public.photos_total_bytes() returns bigint
language sql stable security invoker set search_path = '' as $$
  select coalesce(sum(size_bytes), 0)::bigint from public.photos
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg'])
on conflict (id) do nothing;

-- Folder 1 of an object name as a family id, or null when it is not a uuid
-- (so a malformed name never raises inside a policy).
create function public.object_family(object_name text) returns uuid
language sql immutable set search_path = '' as $$
  select case
    when (storage.foldername(object_name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then ((storage.foldername(object_name))[1])::uuid
  end
$$;

create function public.object_baby(object_name text) returns uuid
language sql immutable set search_path = '' as $$
  select case
    when (storage.foldername(object_name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then ((storage.foldername(object_name))[2])::uuid
  end
$$;

create policy photos_objects_select on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.is_member(public.object_family(name)));
create policy photos_objects_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'photos'
    and public.is_member(public.object_family(name))
    and public.baby_family(public.object_baby(name)) = public.object_family(name)
  );
create policy photos_objects_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'photos'
    and (
      public.is_owner(public.object_family(name))
      or (public.is_member(public.object_family(name)) and owner_id = auth.uid()::text)
    )
  );
