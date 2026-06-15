-- Run recipes.sql first, then this in Supabase Dashboard → SQL Editor.
-- If you already created meal_plans with recipe_name, drop it first:
--   drop table if exists public.meal_plans;

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  meal_type text not null
    check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id uuid not null references public.recipes (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day_of_week, meal_type)
);

comment on column public.meal_plans.day_of_week is '0 = Monday through 6 = Sunday';

create index if not exists meal_plans_user_day_idx
  on public.meal_plans (user_id, day_of_week);

create index if not exists meal_plans_recipe_id_idx
  on public.meal_plans (recipe_id);

alter table public.meal_plans enable row level security;

create policy "Users can read own meal plans"
  on public.meal_plans
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own meal plans"
  on public.meal_plans
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own meal plans"
  on public.meal_plans
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own meal plans"
  on public.meal_plans
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.meal_plans to authenticated;
