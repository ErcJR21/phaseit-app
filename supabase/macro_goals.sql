-- Run in Supabase Dashboard → SQL Editor after profiles exists.

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

create index if not exists macro_goals_user_id_idx on public.macro_goals (user_id);

alter table public.macro_goals enable row level security;

create policy "Users can read own macro goals"
  on public.macro_goals
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own macro goals"
  on public.macro_goals
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own macro goals"
  on public.macro_goals
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.macro_goals to authenticated;
