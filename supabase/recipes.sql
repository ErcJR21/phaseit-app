-- Run this in Supabase Dashboard → SQL Editor before meal_plans.sql

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  emoji text not null default '🍽️',
  cost integer not null check (cost >= 0),
  place text,
  created_at timestamptz not null default now()
);

alter table public.recipes enable row level security;

create policy "Anyone can read recipes"
  on public.recipes
  for select
  to anon, authenticated
  using (true);

grant select on public.recipes to anon, authenticated;

insert into public.recipes (name, emoji, cost, place) values
  ('Sinangag + Itlog', '🍳', 45, 'Canteen A'),
  ('Adobo Rice', '🍛', 60, 'Aling Nena''s'),
  ('Sinigang na Baboy', '🥣', 75, 'Rodic''s Diner'),
  ('Goto Arroz Caldo', '🍜', 55, 'Canteen B'),
  ('Pancit Bihon', '🍝', 50, 'SM Food Court'),
  ('Banana + Peanut Butter Toast', '🍞', 35, 'Co-op Store'),
  ('Turon + Sago', '🍡', 30, 'Street Stall'),
  ('Lechon Manok + Rice', '🍗', 85, 'Mang Inasal'),
  ('Tapsilog', '🥩', 65, 'Canteen A'),
  ('Champorado', '🍫', 40, 'Canteen B'),
  ('Lumpia Shanghai', '🥟', 35, 'Street Stall'),
  ('Chicken Inasal', '🍗', 80, 'Mang Inasal')
on conflict (name) do nothing;
