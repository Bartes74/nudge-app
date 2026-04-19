-- =============================================================
-- E2E Test Users seed
-- Creates pre-confirmed users for Playwright tests.
-- Password for all: TestPassword123!
-- Run automatically via: pnpm supabase:reset
-- =============================================================
-- Flow: INSERT auth.users
--       → trigger handle_new_user       → INSERT public.users
--       → trigger handle_new_user_profile → INSERT user_profile (empty)
-- We then UPDATE user_profile with actual test data.
-- =============================================================

DO $$
DECLARE
  nutrition_uid uuid := 'e2e00010-0000-0000-0000-000000000001';
  plan_uid      uuid := 'e2e00010-0000-0000-0000-000000000002';
  coach_uid     uuid := 'e2e00010-0000-0000-0000-000000000003';
  checkin_uid   uuid := 'e2e00010-0000-0000-0000-000000000004';
  plan_id       uuid := 'e2e00010-0000-0000-0000-000000000102';
  plan_version_id uuid := 'e2e00010-0000-0000-0000-000000000202';
  workout_id    uuid := 'e2e00010-0000-0000-0000-000000000302';
  bench_plan_exercise_id uuid := 'e2e00010-0000-0000-0000-000000000402';
  deadlift_plan_exercise_id uuid := 'e2e00010-0000-0000-0000-000000000403';
  today_day_label text;
  pw            text;
BEGIN
  pw := crypt('TestPassword123!', gen_salt('bf'));
  today_day_label := CASE EXTRACT(ISODOW FROM CURRENT_DATE)
    WHEN 1 THEN 'mon'
    WHEN 2 THEN 'tue'
    WHEN 3 THEN 'wed'
    WHEN 4 THEN 'thu'
    WHEN 5 THEN 'fri'
    WHEN 6 THEN 'sat'
    ELSE 'sun'
  END;

  -- ---------------------------------------------------------------
  -- 1. Auth users (email pre-confirmed, no verification needed)
  --    Triggers will auto-create public.users + user_profile rows.
  -- ---------------------------------------------------------------
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    email_change,
    reauthentication_token,
    phone_change_token,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, is_sso_user, is_anonymous,
    created_at, updated_at
  )
  VALUES
    (nutrition_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'e2e-nutrition@nudge.test', pw, now(),
     '', '', '', '', '', '', '',
     '{"provider":"email","providers":["email"]}', '{}',
     false, false, false, now(), now()),

    (plan_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'e2e-plan@nudge.test', pw, now(),
     '', '', '', '', '', '', '',
     '{"provider":"email","providers":["email"]}', '{}',
     false, false, false, now(), now()),

    (coach_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'e2e-coach@nudge.test', pw, now(),
     '', '', '', '', '', '', '',
     '{"provider":"email","providers":["email"]}', '{}',
     false, false, false, now(), now()),

    (checkin_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'e2e-checkin@nudge.test', pw, now(),
     '', '', '', '', '', '', '',
     '{"provider":"email","providers":["email"]}', '{}',
     false, false, false, now(), now())

  ON CONFLICT (id) DO NOTHING;

  -- ---------------------------------------------------------------
  -- 2. Update user_profile (auto-created by trigger, fill with data)
  -- ---------------------------------------------------------------
  UPDATE public.user_profile SET
    primary_goal              = 'general_health',
    gender                    = 'male',
    birth_date                = '1992-05-15',
    current_weight_kg         = 80,
    height_cm                 = 178,
    experience_level          = 'beginner',
    nutrition_mode            = 'ranges',
    onboarding_layer_1_done   = true,
    onboarding_layer_2_done   = false,
    updated_at                = now()
  WHERE user_id = nutrition_uid;

  UPDATE public.user_profile SET
    primary_goal              = 'muscle_building',
    gender                    = 'male',
    birth_date                = '1990-03-20',
    current_weight_kg         = 85,
    height_cm                 = 182,
    experience_level          = 'intermediate',
    nutrition_mode            = 'simple',
    onboarding_layer_1_done   = true,
    onboarding_layer_2_done   = true,
    updated_at                = now()
  WHERE user_id = plan_uid;

  UPDATE public.user_profile SET
    primary_goal              = 'general_health',
    gender                    = 'female',
    birth_date                = '1995-08-10',
    current_weight_kg         = 65,
    height_cm                 = 168,
    experience_level          = 'beginner',
    nutrition_mode            = 'simple',
    onboarding_layer_1_done   = true,
    onboarding_layer_2_done   = true,
    updated_at                = now()
  WHERE user_id = coach_uid;

  UPDATE public.user_profile SET
    primary_goal              = 'weight_loss',
    gender                    = 'female',
    birth_date                = '1988-11-30',
    current_weight_kg         = 72,
    height_cm                 = 165,
    experience_level          = 'beginner',
    nutrition_mode            = 'simple',
    onboarding_layer_1_done   = true,
    onboarding_layer_2_done   = true,
    updated_at                = now()
  WHERE user_id = checkin_uid;

  -- ---------------------------------------------------------------
  -- 3. behavior_signals (required by coach + proactive check logic)
  -- ---------------------------------------------------------------
  INSERT INTO public.behavior_signals (user_id)
  VALUES
    (nutrition_uid),
    (plan_uid),
    (coach_uid),
    (checkin_uid)
  ON CONFLICT (user_id) DO NOTHING;

  -- ---------------------------------------------------------------
  -- 4. Active training plan for workout / plan E2E scenarios
  -- ---------------------------------------------------------------
  INSERT INTO public.training_plans (
    id, user_id, name, current_version_id, started_at, is_active
  )
  VALUES (
    plan_id, plan_uid, 'E2E Plan Testowy', plan_version_id, now(), true
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.training_plan_versions (
    id,
    plan_id,
    version_number,
    change_reason,
    progression_rules,
    week_structure,
    additional_notes,
    guided_mode,
    view_mode,
    created_at
  )
  VALUES (
    plan_version_id,
    plan_id,
    1,
    'Seeded E2E training plan.',
    '{"method":"double_progression","add_weight_kg":2.5,"when":"Gdy domkniesz górny zakres powtórzeń we wszystkich seriach."}'::jsonb,
    jsonb_build_object(today_day_label, 'Siła bazowa A'),
    'Plan testowy do scenariuszy E2E.',
    false,
    'standard_training_view',
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.training_plans
  SET current_version_id = plan_version_id,
      is_active = true,
      ended_at = null
  WHERE id = plan_id;

  INSERT INTO public.plan_workouts (
    id,
    plan_version_id,
    day_label,
    order_in_week,
    name,
    duration_min_estimated,
    warmup_notes,
    cooldown_notes,
    confidence_goal
  )
  VALUES (
    workout_id,
    plan_version_id,
    today_day_label,
    1,
    'Siła bazowa A',
    45,
    '5 minut spokojnej rozgrzewki i 2 serie wprowadzające.',
    '3-5 minut lekkiego schłodzenia.',
    'Wykonaj ruchy czysto technicznie i bez pośpiechu.'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.plan_exercises (
    id,
    plan_workout_id,
    exercise_id,
    order_num,
    sets,
    reps_min,
    reps_max,
    rir_target,
    rest_seconds,
    technique_notes
  )
  VALUES
    (
      bench_plan_exercise_id,
      workout_id,
      (SELECT id FROM public.exercises WHERE slug = 'barbell_bench_press'),
      1,
      4,
      6,
      8,
      2.0,
      120,
      'Kontroluj tor ruchu i utrzymaj stabilne łopatki.'
    ),
    (
      deadlift_plan_exercise_id,
      workout_id,
      (SELECT id FROM public.exercises WHERE slug = 'deadlift'),
      2,
      3,
      5,
      6,
      2.0,
      150,
      'Napnij brzuch i trzymaj sztangę blisko ciała.'
    )
  ON CONFLICT (id) DO NOTHING;

END $$;
