-- =============================================================
-- pgTAP RLS test: public.users isolation
-- Run with: supabase test db
-- =============================================================
begin;

select plan(6);

-- -------------------------
-- Setup: two test users
-- -------------------------
\set user_a_id '\'00000000-0000-0000-0000-000000000001\'::uuid'
\set user_b_id '\'00000000-0000-0000-0000-000000000002\'::uuid'

-- Insert directly as superuser (bypasses RLS)
insert into auth.users (id, email, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, encrypted_password, email_confirmed_at, aud, role)
values
  (:user_a_id, 'user-a@test.nudge', now(), now(), '{}', '{}', false, '', now(), 'authenticated', 'authenticated'),
  (:user_b_id, 'user-b@test.nudge', now(), now(), '{}', '{}', false, '', now(), 'authenticated', 'authenticated');

-- Trigger inserts into public.users automatically
select is(
  (select count(*)::int from public.users where id in (:user_a_id, :user_b_id)),
  2,
  'Trigger inserted both users into public.users'
);

-- -------------------------
-- Test as user A
-- -------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "00000000-0000-0000-0000-000000000001", "role": "authenticated"}';

select is(
  (select count(*)::int from public.users),
  1,
  'User A sees exactly 1 row (their own)'
);

select is(
  (select id from public.users limit 1),
  :user_a_id,
  'User A sees their own id'
);

-- User A cannot see user B
select is(
  (select count(*)::int from public.users where id = :user_b_id),
  0,
  'User A cannot see user B row'
);

-- -------------------------
-- Test as user B
-- -------------------------
set local "request.jwt.claims" to '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated"}';

select is(
  (select count(*)::int from public.users),
  1,
  'User B sees exactly 1 row (their own)'
);

select is(
  (select id from public.users limit 1),
  :user_b_id,
  'User B sees their own id'
);

select * from finish();

rollback;
