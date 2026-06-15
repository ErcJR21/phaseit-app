-- =============================================================================
-- PhaseIt — comprehensive Supabase schema (idempotent / safe to re-run)
-- Run in Supabase Dashboard → SQL Editor
--
-- Conventions
--   • CREATE TABLE IF NOT EXISTS for all tables
--   • ALTER TABLE … ADD COLUMN IF NOT EXISTS to extend existing tables
--   • DROP POLICY IF EXISTS before every CREATE POLICY
--   • User-owned rows: auth.uid() = user_id (profiles uses id = auth.uid())
--   • campus_stalls: public read for anon + authenticated
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null default 'student'
    check (role in ('student', 'parent')),
  setup_completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists role text,
  add column if not exists setup_completed boolean not null default false,
  add column if not exists created_at timestamptz not null default now();

-- Backfill NOT NULL full_name for legacy rows (safe no-op when already set)
update public.profiles
set full_name = coalesce(full_name, 'PhaseIt User')
where full_name is null;

alter table public.profiles
  alter column full_name set not null,
  alter column role set default 'student',
  alter column setup_completed set default false;

create index if not exists profiles_setup_completed_idx
  on public.profiles (setup_completed);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant select, insert, update on public.profiles to authenticated;

-- Optional: auto-create profile row on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'PhaseIt User'),
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- macro_goals
-- ---------------------------------------------------------------------------
create table if not exists public.macro_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  weight_kg numeric(5, 2) not null check (weight_kg > 0),
  height_cm numeric(5, 2) not null check (height_cm > 0),
  age smallint not null check (age > 0),
  gender text not null check (gender in ('male', 'female')),
  activity_level text not null
    check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  calories integer not null check (calories > 0),
  protein integer not null check (protein >= 0),
  carbs integer not null check (carbs >= 0),
  fat integer not null check (fat >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.macro_goals
  add column if not exists weight_kg numeric(5, 2),
  add column if not exists height_cm numeric(5, 2),
  add column if not exists age smallint,
  add column if not exists gender text,
  add column if not exists activity_level text,
  add column if not exists calories integer,
  add column if not exists protein integer,
  add column if not exists carbs integer,
  add column if not exists fat integer,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists macro_goals_user_id_idx
  on public.macro_goals (user_id);

alter table public.macro_goals enable row level security;

drop policy if exists "Users can read own macro goals" on public.macro_goals;
create policy "Users can read own macro goals"
  on public.macro_goals
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own macro goals" on public.macro_goals;
create policy "Users can insert own macro goals"
  on public.macro_goals
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own macro goals" on public.macro_goals;
create policy "Users can update own macro goals"
  on public.macro_goals
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own macro goals" on public.macro_goals;
create policy "Users can delete own macro goals"
  on public.macro_goals
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.macro_goals to authenticated;

-- ---------------------------------------------------------------------------
-- jar (daily allowance + emergency fund wallet)
-- ---------------------------------------------------------------------------
create table if not exists public.jar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  daily_allowance integer not null default 250 check (daily_allowance >= 0),
  emergency_fund integer not null default 200 check (emergency_fund >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.jar
  add column if not exists daily_allowance integer not null default 250,
  add column if not exists emergency_fund integer not null default 200,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists jar_user_id_idx
  on public.jar (user_id);

alter table public.jar enable row level security;

drop policy if exists "Users can read own jar" on public.jar;
create policy "Users can read own jar"
  on public.jar
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own jar" on public.jar;
create policy "Users can insert own jar"
  on public.jar
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own jar" on public.jar;
create policy "Users can update own jar"
  on public.jar
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own jar" on public.jar;
create policy "Users can delete own jar"
  on public.jar
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.jar to authenticated;

-- ---------------------------------------------------------------------------
-- budgets (streak + budget tracking metadata; one row per user)
-- ---------------------------------------------------------------------------
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  daily_allowance integer not null default 250 check (daily_allowance >= 0),
  emergency_fund integer not null default 200 check (emergency_fund >= 0),
  days_under_budget integer not null default 0 check (days_under_budget >= 0),
  last_budget_date date,
  budget_hero_rewarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.budgets
  add column if not exists daily_allowance integer not null default 250,
  add column if not exists emergency_fund integer not null default 200,
  add column if not exists days_under_budget integer not null default 0,
  add column if not exists last_budget_date date,
  add column if not exists budget_hero_rewarded boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists budgets_user_id_idx
  on public.budgets (user_id);

alter table public.budgets enable row level security;

drop policy if exists "Users can read own budget" on public.budgets;
create policy "Users can read own budget"
  on public.budgets
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own budget" on public.budgets;
create policy "Users can insert own budget"
  on public.budgets
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own budget" on public.budgets;
create policy "Users can update own budget"
  on public.budgets
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own budget" on public.budgets;
create policy "Users can delete own budget"
  on public.budgets
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.budgets to authenticated;

-- ---------------------------------------------------------------------------
-- campus_stalls (public read; authenticated users may contribute)
-- Uses lat/lng to match existing PhaseIt Supabase project columns.
-- ---------------------------------------------------------------------------
create table if not exists public.campus_stalls (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat double precision not null,
  lng double precision not null,
  avg_price_min integer check (avg_price_min is null or avg_price_min >= 0),
  avg_price_max integer check (avg_price_max is null or avg_price_max >= 0),
  macro_friendly_tags text[] not null default '{}',
  venue_type text not null default 'carinderia'
    check (venue_type in ('carinderia', 'canteen', 'vendor', 'fastfood')),
  source text not null default 'crowdsourced'
    check (source in ('verified', 'crowdsourced')),
  hours text,
  is_open boolean not null default true,
  hero_combo_description text,
  hero_combo_price integer check (hero_combo_price is null or hero_combo_price >= 0),
  submitted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.campus_stalls
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists avg_price_min integer,
  add column if not exists avg_price_max integer,
  add column if not exists macro_friendly_tags text[] not null default '{}',
  add column if not exists venue_type text not null default 'carinderia',
  add column if not exists source text not null default 'crowdsourced',
  add column if not exists hours text,
  add column if not exists is_open boolean not null default true,
  add column if not exists hero_combo_description text,
  add column if not exists hero_combo_price integer,
  add column if not exists submitted_by uuid,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists campus_stalls_created_at_idx
  on public.campus_stalls (created_at desc);

create index if not exists campus_stalls_location_idx
  on public.campus_stalls (lat, lng);

alter table public.campus_stalls enable row level security;

drop policy if exists "Anyone can read campus stalls" on public.campus_stalls;
create policy "Anyone can read campus stalls"
  on public.campus_stalls
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can add campus stalls" on public.campus_stalls;
create policy "Authenticated users can add campus stalls"
  on public.campus_stalls
  for insert
  to authenticated
  with check (true);

drop policy if exists "Submitters can update own campus stalls" on public.campus_stalls;
create policy "Submitters can update own campus stalls"
  on public.campus_stalls
  for update
  to authenticated
  using (submitted_by is null or auth.uid() = submitted_by)
  with check (submitted_by is null or auth.uid() = submitted_by);

drop policy if exists "Submitters can delete own campus stalls" on public.campus_stalls;
create policy "Submitters can delete own campus stalls"
  on public.campus_stalls
  for delete
  to authenticated
  using (submitted_by is null or auth.uid() = submitted_by);

grant select on public.campus_stalls to anon, authenticated;
grant insert, update, delete on public.campus_stalls to authenticated;

-- ---------------------------------------------------------------------------
-- meals_log
-- ---------------------------------------------------------------------------
create table if not exists public.meals_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_name text not null,
  calories integer not null default 0 check (calories >= 0),
  protein integer not null default 0 check (protein >= 0),
  carbs integer not null default 0 check (carbs >= 0),
  fat integer not null default 0 check (fat >= 0),
  cost integer not null default 0 check (cost >= 0),
  meal_date date not null default (timezone('utc', now()))::date,
  logged_at timestamptz not null default now(),
  image_uri text,
  campus_stall_id uuid references public.campus_stalls (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meals_log
  add column if not exists meal_name text,
  add column if not exists calories integer not null default 0,
  add column if not exists protein integer not null default 0,
  add column if not exists carbs integer not null default 0,
  add column if not exists fat integer not null default 0,
  add column if not exists cost integer not null default 0,
  add column if not exists meal_date date not null default (timezone('utc', now()))::date,
  add column if not exists logged_at timestamptz not null default now(),
  add column if not exists image_uri text,
  add column if not exists campus_stall_id uuid,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.meals_log
set meal_name = coalesce(meal_name, 'Logged meal')
where meal_name is null;

alter table public.meals_log
  alter column meal_name set not null;

create index if not exists meals_log_user_id_idx
  on public.meals_log (user_id);

create index if not exists meals_log_user_meal_date_idx
  on public.meals_log (user_id, meal_date desc);

create index if not exists meals_log_logged_at_idx
  on public.meals_log (logged_at desc);

alter table public.meals_log enable row level security;

drop policy if exists "Users can read own meals log" on public.meals_log;
create policy "Users can read own meals log"
  on public.meals_log
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own meals log" on public.meals_log;
create policy "Users can insert own meals log"
  on public.meals_log
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own meals log" on public.meals_log;
create policy "Users can update own meals log"
  on public.meals_log
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own meals log" on public.meals_log;
create policy "Users can delete own meals log"
  on public.meals_log
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.meals_log to authenticated;

-- meals_log → campus_stalls FK (safe if column already exists)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'meals_log_campus_stall_id_fkey'
      and conrelid = 'public.meals_log'::regclass
  ) then
    alter table public.meals_log
      add constraint meals_log_campus_stall_id_fkey
      foreign key (campus_stall_id)
      references public.campus_stalls (id)
      on delete set null;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- updated_at helper (optional shared trigger)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists macro_goals_set_updated_at on public.macro_goals;
create trigger macro_goals_set_updated_at
  before update on public.macro_goals
  for each row
  execute function public.set_updated_at();

drop trigger if exists jar_set_updated_at on public.jar;
create trigger jar_set_updated_at
  before update on public.jar
  for each row
  execute function public.set_updated_at();

drop trigger if exists budgets_set_updated_at on public.budgets;
create trigger budgets_set_updated_at
  before update on public.budgets
  for each row
  execute function public.set_updated_at();

drop trigger if exists meals_log_set_updated_at on public.meals_log;
create trigger meals_log_set_updated_at
  before update on public.meals_log
  for each row
  execute function public.set_updated_at();

drop trigger if exists campus_stalls_set_updated_at on public.campus_stalls;
create trigger campus_stalls_set_updated_at
  before update on public.campus_stalls
  for each row
  execute function public.set_updated_at();
