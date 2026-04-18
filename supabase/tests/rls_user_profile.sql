-- =============================================================
-- pgTAP RLS test: public.user_profile isolation
-- Run with: supabase test db
-- =============================================================
begin;

select plan(5);

\set user_a_id '\'00000000-0000-0000-0000-000000000011\'::uuid'
\set user_b_id '\'00000000-0000-0000-0000-000000000012\'::uuid'

insert into auth.users (id, email, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, encrypted_password, email_confirmed_at, aud, role)
values
  (:user_a_id, 'profile-a@test.nudge', now(), now(), '{}', '{}', false, '', now(), 'authenticated', 'authenticated'),
  (:user_b_id, 'profile-b@test.nudge', now(), now(), '{}', '{}', false, '', now(), 'authenticated', 'authenticated');

-- Trigger handle_new_user_profile auto-creates user_profile rows
select is(
  (select count(*)::int from public.user_profile where user_id in (:user_a_id, :user_b_id)),
  2,
  'Trigger auto-created user_profile for both users'
);

-- Seed distinguishing data (as superuser, bypasses RLS)
update public.user_profile set display_name = 'Alice' where user_id = :user_a_id;
update public.user_profile set display_name = 'Bob'   where user_id = :user_b_id;

-- ---------- User A session ----------
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "00000000-0000-0000-0000-000000000011", "role": "authenticated"}';

select is(
  (select count(*)::int from public.user_profile),
  1,
  'User A sees exactly 1 user_profile row (their own)'
);

select is(
  (select display_name from public.user_profile limit 1),
  'Alice',
  'User A sees their own profile'
);

-- User A cannot update user B's profile (UPDATE policy filters rows by auth.uid())
update public.user_profile set display_name = 'pwned' where user_id = :user_b_id;
reset role;

select is(
  (select display_name from public.user_profile where user_id = :user_b_id),
  'Bob',
  'User A update attempt on user B profile was silently no-op'
);

-- ---------- User B session ----------
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "00000000-0000-0000-0000-000000000012", "role": "authenticated"}';

select is(
  (select count(*)::int from public.user_profile where user_id = :user_a_id),
  0,
  'User B cannot see user A profile'
);

select * from finish();

rollback;
