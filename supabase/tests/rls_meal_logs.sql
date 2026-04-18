-- =============================================================
-- pgTAP RLS test: public.meal_logs (+ meal_log_items) isolation
-- Run with: supabase test db
-- =============================================================
begin;

select plan(7);

\set user_a_id '\'00000000-0000-0000-0000-000000000021\'::uuid'
\set user_b_id '\'00000000-0000-0000-0000-000000000022\'::uuid'

insert into auth.users (id, email, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, encrypted_password, email_confirmed_at, aud, role)
values
  (:user_a_id, 'meal-a@test.nudge', now(), now(), '{}', '{}', false, '', now(), 'authenticated', 'authenticated'),
  (:user_b_id, 'meal-b@test.nudge', now(), now(), '{}', '{}', false, '', now(), 'authenticated', 'authenticated');

-- ---------- User A inserts a meal_log ----------
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "00000000-0000-0000-0000-000000000021", "role": "authenticated"}';

insert into public.meal_logs (user_id, logged_at, source, status)
values (:user_a_id, current_date, 'manual', 'manual');

select is(
  (select count(*)::int from public.meal_logs),
  1,
  'User A sees their own meal_log'
);

-- User A can add an item to their meal_log
insert into public.meal_log_items (meal_log_id, user_id, label, kcal_estimate)
select id, :user_a_id, 'jajecznica', 350 from public.meal_logs where user_id = :user_a_id limit 1;

select is(
  (select count(*)::int from public.meal_log_items),
  1,
  'User A sees their own meal_log_item'
);

-- User A cannot spoof user_id = user B on insert (WITH CHECK (auth.uid() = user_id))
select throws_ok(
  $$insert into public.meal_logs (user_id, logged_at, source, status)
    values ('00000000-0000-0000-0000-000000000022'::uuid, current_date, 'manual', 'manual')$$,
  NULL,  -- any error message
  'User A cannot insert meal_log as user B'
);

-- ---------- User B session ----------
set local "request.jwt.claims" to '{"sub": "00000000-0000-0000-0000-000000000022", "role": "authenticated"}';

select is(
  (select count(*)::int from public.meal_logs),
  0,
  'User B does not see user A meal_logs'
);

select is(
  (select count(*)::int from public.meal_log_items),
  0,
  'User B does not see user A meal_log_items'
);

-- User B cannot delete user A's meal_log
delete from public.meal_logs where user_id = :user_a_id;

-- Switch back to superuser to verify nothing deleted
reset role;
select is(
  (select count(*)::int from public.meal_logs where user_id = :user_a_id),
  1,
  'User B delete attempt on user A meal_log was silently no-op'
);

-- meal_log_items row must also still exist
select is(
  (select count(*)::int from public.meal_log_items where user_id = :user_a_id),
  1,
  'User A meal_log_items survived user B delete attempt'
);

select * from finish();

rollback;
