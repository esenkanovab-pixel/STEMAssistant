-- Run in Supabase SQL editor. Access is private to each authenticated owner.
create table if not exists public.lessons (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 payload jsonb not null,
 created_at timestamptz not null default now()
);
create table if not exists public.results (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 payload jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.lessons enable row level security;
alter table public.results enable row level security;
create policy "Own lessons" on public.lessons for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own results" on public.results for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create table if not exists public.quizzes (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 payload jsonb not null,
 created_at timestamptz not null default now()
);
create table if not exists public.terms (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 payload jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.quizzes enable row level security;
alter table public.terms enable row level security;
create policy "Own quizzes" on public.quizzes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own terms" on public.terms for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
