create extension if not exists "pgcrypto";

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  genre text not null,
  status text not null check (status in ('read', 'currently_reading', 'want_to_read')),
  rating int check (rating between 1 and 5),
  notes text,
  review text,
  cover_image_url text,
  started_at date,
  finished_at date,
  created_at timestamptz not null default now()
);

alter table public.books enable row level security;

drop policy if exists "Allow read for all" on public.books;
create policy "Allow read for all" on public.books
for select using (true);

drop policy if exists "Allow write for all" on public.books;
create policy "Allow write for all" on public.books
for insert with check (true);
