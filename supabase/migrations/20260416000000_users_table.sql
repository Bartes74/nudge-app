-- =============================================================
-- Migration: users table (public mirror of auth.users)
-- Iteration 1 — Auth + Shell
-- =============================================================

-- -------------------------
-- Table
-- -------------------------
create table public.users (
  id          uuid        primary key references auth.users (id) on delete cascade,
  email       text        not null unique,
  created_at  timestamptz not null default now(),
  last_active_at timestamptz,
  deleted_at  timestamptz,
  timezone    text        not null default 'Europe/Warsaw',
  locale      text        not null default 'pl-PL'
);

comment on table public.users is 'Public mirror/extension of auth.users. Passwords are never stored here.';

-- -------------------------
-- Row Level Security
-- -------------------------
alter table public.users enable row level security;

-- Users can only read their own row
create policy "users_select_own"
  on public.users
  for select
  using (auth.uid() = id);

-- Users can update their own row (but not id/email/created_at)
create policy "users_update_own"
  on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insert is handled only by the trigger below (no direct insert from client)
create policy "users_insert_own"
  on public.users
  for insert
  with check (auth.uid() = id);

-- -------------------------
-- Trigger: auto-insert on new auth signup
-- -------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -------------------------
-- Index
-- -------------------------
create index users_deleted_at_idx on public.users (deleted_at)
  where deleted_at is null;

-- =============================================================
-- down:
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop function if exists public.handle_new_user();
-- drop table if exists public.users;
-- =============================================================
