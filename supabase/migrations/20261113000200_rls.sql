create function public.is_member(fam uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.family_members m
    where m.family_id = fam and m.user_id = auth.uid()
  );
$$;

create function public.is_owner(fam uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.family_members m
    where m.family_id = fam and m.user_id = auth.uid() and m.role = 'owner'
  );
$$;

create function public.baby_family(b uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select family_id from public.babies where id = b;
$$;

-- families
create policy families_select on public.families for select to authenticated
  using (public.is_member(id));
create policy families_update on public.families for update to authenticated
  using (public.is_owner(id)) with check (public.is_owner(id));

-- family_members
create policy family_members_select on public.family_members for select to authenticated
  using (public.is_member(family_id));
create policy family_members_insert on public.family_members for insert to authenticated
  with check (public.is_owner(family_id));
create policy family_members_update on public.family_members for update to authenticated
  using (public.is_owner(family_id)) with check (public.is_owner(family_id));
create policy family_members_delete on public.family_members for delete to authenticated
  using (public.is_owner(family_id));

-- babies
create policy babies_select on public.babies for select to authenticated
  using (public.is_member(family_id));
create policy babies_insert on public.babies for insert to authenticated
  with check (public.is_owner(family_id));
create policy babies_update on public.babies for update to authenticated
  using (public.is_owner(family_id)) with check (public.is_owner(family_id));
create policy babies_delete on public.babies for delete to authenticated
  using (public.is_owner(family_id));

-- logs
create policy logs_select on public.logs for select to authenticated
  using (public.is_member(public.baby_family(baby_id)));
create policy logs_insert on public.logs for insert to authenticated
  with check (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid());
create policy logs_update on public.logs for update to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  )
  with check (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  );
create policy logs_delete on public.logs for delete to authenticated
  using (
    public.is_owner(public.baby_family(baby_id))
    or (public.is_member(public.baby_family(baby_id)) and created_by = auth.uid())
  );

-- RPC
create function public.claim_membership() returns setof public.families
language plpgsql security definer set search_path = '' as $$
declare
  em text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  update public.family_members set user_id = auth.uid()
    where email = em and user_id is null;
  return query
    select f.* from public.families f
    join public.family_members m on m.family_id = f.id
    where m.user_id = auth.uid()
    order by f.created_at;
end $$;

create function public.can_create_family() returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.families);
$$;

create function public.create_family(name text, display_name text) returns public.families
language plpgsql security definer set search_path = '' as $$
declare
  em text := lower(coalesce(auth.jwt() ->> 'email', ''));
  fam public.families;
begin
  if auth.uid() is null or em = '' then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  lock table public.families in exclusive mode;
  if exists (select 1 from public.families) then
    raise exception 'family_exists' using errcode = 'P0001';
  end if;
  insert into public.families (name) values (create_family.name) returning * into fam;
  insert into public.family_members (family_id, email, user_id, role, display_name)
    values (fam.id, em, auth.uid(), 'owner', create_family.display_name);
  return fam;
end $$;

-- Deviation from spec (approved in plan M1): any member may stop a running timer.
create function public.stop_timer(p_log_id uuid, p_ended_at timestamptz) returns public.logs
language plpgsql security definer set search_path = '' as $$
declare
  l public.logs;
begin
  select * into l from public.logs where id = p_log_id for update;
  if not found or not public.is_member(public.baby_family(l.baby_id)) then
    raise exception 'permission_denied' using errcode = '42501';
  end if;
  if l.ended_at is null then
    update public.logs set ended_at = greatest(p_ended_at, l.started_at)
      where id = p_log_id returning * into l;
  end if;
  return l;
end $$;

revoke execute on function
  public.is_member(uuid), public.is_owner(uuid), public.baby_family(uuid),
  public.claim_membership(), public.can_create_family(), public.create_family(text, text),
  public.stop_timer(uuid, timestamptz)
  from public, anon;
grant execute on function
  public.is_member(uuid), public.is_owner(uuid), public.baby_family(uuid),
  public.claim_membership(), public.can_create_family(), public.create_family(text, text),
  public.stop_timer(uuid, timestamptz)
  to authenticated;
