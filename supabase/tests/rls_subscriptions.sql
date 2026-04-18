-- =============================================================
-- pgTAP RLS test: public.subscriptions isolation (read-only for users,
-- writes go through service role / handle_new_user_subscription trigger)
-- Run with: supabase test db
-- =============================================================
begin;

select plan(5);

\set user_a_id '\'00000000-0000-0000-0000-000000000041\'::uuid'
\set user_b_id '\'00000000-0000-0000-0000-000000000042\'::uuid'

insert into auth.users (id, email, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, encrypted_password, email_confirmed_at, aud, role)
values
  (:user_a_id, 'sub-a@test.nudge', now(), now(), '{}', '{}', false, '', now(), 'authenticated', 'authenticated'),
  (:user_b_id, 'sub-b@test.nudge', now(), now(), '{}', '{}', false, '', now(), 'authenticated', 'authenticated');

-- Trigger handle_new_user_subscription auto-creates trial subscriptions
select is(
  (select count(*)::int from public.subscriptions where user_id in (:user_a_id, :user_b_id)),
  2,
  'Trigger auto-created trial subscriptions for both users'
);

select is(
  (select status::text from public.subscriptions where user_id = :user_a_id),
  'trial',
  'Auto-created subscription has status=trial'
);

-- ---------- User A session ----------
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "00000000-0000-0000-0000-000000000041", "role": "authenticated"}';

select is(
  (select count(*)::int from public.subscriptions),
  1,
  'User A sees exactly 1 subscription (their own)'
);

-- User A cannot INSERT a fake subscription (no insert policy for authenticated)
select throws_ok(
  $$insert into public.subscriptions (user_id, status, plan)
    values ('00000000-0000-0000-0000-000000000041'::uuid, 'active', 'yearly')$$,
  NULL,
  'User A cannot insert subscription directly (service role only)'
);

-- ---------- User B session ----------
set local "request.jwt.claims" to '{"sub": "00000000-0000-0000-0000-000000000042", "role": "authenticated"}';

select is(
  (select count(*)::int from public.subscriptions where user_id = :user_a_id),
  0,
  'User B cannot see user A subscription'
);

select * from finish();

rollback;
