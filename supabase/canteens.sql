-- Run this in Supabase Dashboard → SQL Editor for project:
-- https://supabase.com/dashboard/project/<your-project-ref>/sql

create table if not exists public.canteens (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  avg_price_min integer not null check (avg_price_min >= 0),
  avg_price_max integer not null check (avg_price_max >= avg_price_min),
  macro_friendly_tags text[] not null default '{}',
  venue_type text not null default 'carinderia'
    check (venue_type in ('carinderia', 'canteen', 'vendor', 'fastfood')),
  source text not null default 'crowdsourced'
    check (source in ('verified', 'crowdsourced')),
  hours text,
  is_open boolean not null default true,
  hero_combo_description text,
  hero_combo_price integer check (hero_combo_price is null or hero_combo_price >= 0),
  submitted_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists canteens_created_at_idx on public.canteens (created_at desc);

alter table public.canteens enable row level security;

create policy "Anyone can read canteens"
  on public.canteens
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can add canteens"
  on public.canteens
  for insert
  to authenticated
  with check (true);

grant select on public.canteens to anon, authenticated;
grant insert on public.canteens to authenticated;
