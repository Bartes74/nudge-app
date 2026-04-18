-- =============================================================
-- pgTAP RLS test: public.workout_logs isolation
-- Also covers workout_log_exercises (policy uses EXISTS on parent)
-- Run with: supabase test db
-- =============================================================
begin;

select plan(5);

\set user_a_id '\'00000000-0000-0000-0000-000000000031\'::uuid'
\set user_b_id '\'00000000-0000-0000-0000-000000000032\'::uuid'

insert into auth.users (id, email, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, encrypted_password, email_confirmed_at, aud, role)
values
  (:user_a_id, 'workout-a@test.nudge', now(), now(), '{}', '{}', false, '', now(), 'authenticated', 'authenticated'),
  (:user_b_id, 'workout-b@test.nudge', now(), now(), '{}', '{}', false, '', now(), 'authenticated', 'authenticated');

-- ---------- User A creates workout_log + exercise ----------
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "00000000-0000-0000-0000-000000000031", "role": "authenticated"}';

insert into public.workout_logs (user_id, started_at, overall_rating)
values (:user_a_id, now(), 4);

insert into public.workout_log_exercises (workout_log_id, order_num)
select id, 1 from public.workout_logs where user_id = :user_a_id limit 1;

select is(
  (select count(*)::int from public.workout_logs),
  1,
  'User A sees their own workout_log'
);

select is(
  (select count(*)::int from public.workout_log_exercises),
  1,
  'User A sees their own workout_log_exercise (parent-scoped policy)'
);

-- ---------- User B session ----------
set local "request.jwt.claims" to '{"sub": "00000000-0000-0000-0000-000000000032", "role": "authenticated"}';

select is(
  (select count(*)::int from public.workout_logs),
  0,
  'User B does not see user A workout_logs'
);

select is(
  (select count(*)::int from public.workout_log_exercises),
  0,
  'User B does not see user A workout_log_exercises (parent RLS cascade)'
);

-- User B cannot insert an exercise into user A's workout_log
select throws_ok(
  $$insert into public.workout_log_exercises (workout_log_id, order_num)
    select id, 99 from public.workout_logs where user_id = '00000000-0000-0000-0000-000000000031'::uuid limit 1$$,
  NULL,
  'User B cannot insert workout_log_exercise into user A session (WITH CHECK via EXISTS)'
);

select * from finish();

rollback;
