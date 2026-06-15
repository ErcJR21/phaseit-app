-- Run in Supabase Dashboard → SQL Editor after profiles exists.

create table if not exists public.jar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  daily_allowance integer not null default 250 check (daily_allowance >= 0),
  emergency_fund integer not null default 200 check (emergency_fund >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists jar_user_id_idx on public.jar (user_id);

alter table public.jar enable row level security;

create policy "Users can read own jar"
  on public.jar
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own jar"
  on public.jar
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own jar"
  on public.jar
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.jar to authenticated;
