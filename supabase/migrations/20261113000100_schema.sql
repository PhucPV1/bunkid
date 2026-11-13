create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  email text not null check (email = lower(email) and position('@' in email) > 1),
  user_id uuid references auth.users (id) on delete set null,
  role text not null check (role in ('owner', 'member')),
  display_name text not null check (length(trim(display_name)) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (family_id, email)
);
create index family_members_user_idx on public.family_members (user_id);

create table public.babies (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  dob date not null,
  sex text not null check (sex in ('male', 'female')),
  birth_weight_g int check (birth_weight_g between 300 and 7000),
  birth_length_cm numeric(4, 1) check (birth_length_cm between 20 and 70),
  birth_head_cm numeric(4, 1) check (birth_head_cm between 15 and 50),
  blood_type text,
  allergies text,
  notes text,
  feed_interval_min int not null default 180 check (feed_interval_min between 60 and 360),
  vaccine_choices jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index babies_family_idx on public.babies (family_id);

create table public.logs (
  id uuid primary key,
  baby_id uuid not null references public.babies (id) on delete cascade,
  type text not null check (type in ('breast', 'bottle', 'sleep', 'diaper', 'medicine', 'temperature', 'pump', 'tummy')),
  started_at timestamptz not null,
  ended_at timestamptz,
  details jsonb not null default '{}'::jsonb,
  note text,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);
create index logs_baby_started_idx on public.logs (baby_id, started_at desc);
create unique index logs_one_running_timer on public.logs (baby_id, type) where ended_at is null;

create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create function public.forbid_immutable_change() returns trigger
language plpgsql as $$
declare
  col text;
begin
  foreach col in array tg_argv loop
    if (to_jsonb(new) -> col) is distinct from (to_jsonb(old) -> col) then
      raise exception 'immutable_column: %', col using errcode = 'P0001';
    end if;
  end loop;
  return new;
end $$;

create function public.keep_last_owner() returns trigger
language plpgsql as $$
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    if not exists (
      select 1 from public.family_members
      where family_id = old.family_id and role = 'owner' and id <> old.id
    ) then
      -- Cascade from deleting the whole family: the parent row is already gone.
      if tg_op = 'DELETE' and not exists (select 1 from public.families where id = old.family_id) then
        return old;
      end if;
      raise exception 'last_owner' using errcode = 'P0001';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end $$;

create trigger babies_set_updated_at before update on public.babies
  for each row execute function public.set_updated_at();
create trigger logs_set_updated_at before update on public.logs
  for each row execute function public.set_updated_at();

create trigger babies_immutable before update on public.babies
  for each row execute function public.forbid_immutable_change('id', 'family_id');
create trigger family_members_immutable before update on public.family_members
  for each row execute function public.forbid_immutable_change('id', 'family_id');
create trigger logs_immutable before update on public.logs
  for each row execute function public.forbid_immutable_change('id', 'baby_id', 'created_by');

create trigger family_members_keep_owner before update or delete on public.family_members
  for each row execute function public.keep_last_owner();

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.babies enable row level security;
alter table public.logs enable row level security;
