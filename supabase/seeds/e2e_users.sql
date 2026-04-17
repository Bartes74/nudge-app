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
  pw            text;
BEGIN
  pw := crypt('TestPassword123!', gen_salt('bf'));

  -- ---------------------------------------------------------------
  -- 1. Auth users (email pre-confirmed, no verification needed)
  --    Triggers will auto-create public.users + user_profile rows.
  -- ---------------------------------------------------------------
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, is_sso_user, is_anonymous,
    created_at, updated_at
  )
  VALUES
    (nutrition_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'e2e-nutrition@nudge.test', pw, now(),
     '{"provider":"email","providers":["email"]}', '{}',
     false, false, false, now(), now()),

    (plan_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'e2e-plan@nudge.test', pw, now(),
     '{"provider":"email","providers":["email"]}', '{}',
     false, false, false, now(), now()),

    (coach_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'e2e-coach@nudge.test', pw, now(),
     '{"provider":"email","providers":["email"]}', '{}',
     false, false, false, now(), now()),

    (checkin_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'e2e-checkin@nudge.test', pw, now(),
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
    experience_level          = 'amateur',
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

END $$;
