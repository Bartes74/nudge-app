-- =============================================================
-- Iteration 2 — Onboarding tables
-- Groups: 2 (user_profile, user_profile_facts),
--         4 layer-1 (user_equipment, user_health, user_safety_flags),
--         5 (user_goals, user_segment_snapshots),
--         13 (question_library, user_question_asks),
--         16 (field_explanations),
--         18 (product_events)
-- =============================================================

-- ---------------------------------------------------------------
-- ENUMS (idempotent: only create if they don't exist)
-- ---------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE gender AS ENUM ('female','male','other','prefer_not_to_say');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE age_bucket AS ENUM ('under_25','age_25_40','age_40_55','age_55_plus');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE experience_level AS ENUM ('zero','beginner','amateur','advanced');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE primary_goal AS ENUM (
    'weight_loss','muscle_building','strength_performance','general_health'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tone_preset AS ENUM ('warm_encouraging','partnering','factual_technical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE nutrition_mode AS ENUM ('simple','ranges','exact');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fact_source AS ENUM (
    'onboarding','user_input','user_correction','ai_inferred',
    'behavioral_signal','measurement_device','photo_analysis','checkin','coach_chat'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE location_type AS ENUM ('home','gym','mixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE activity_level AS ENUM (
    'sedentary','light','moderate','active','very_active'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE safety_flag AS ENUM (
    'underage','pregnancy','postpartum','ed_risk','low_calorie_intake',
    'rapid_weight_loss','injury_reported','acute_pain','medical_condition',
    'medication_interaction','overtraining_signs'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE flag_status AS ENUM (
    'active','monitoring','resolved','dismissed_by_user'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE severity_level AS ENUM ('info','warning','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE question_layer AS ENUM (
    'layer_1_minimum','layer_2_segment','layer_3_behavioral','layer_4_advanced'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE answer_type AS ENUM (
    'text_short','text_long','numeric','single_select','multi_select',
    'boolean','scale','measurement','photo'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ---------------------------------------------------------------
-- GROUP 2: user_profile
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_profile (
  user_id                   uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  display_name              text,
  birth_date                date,
  age_bucket                age_bucket,
  gender                    gender,
  height_cm                 numeric(5,2),
  current_weight_kg         numeric(5,2),
  experience_level          experience_level,
  primary_goal              primary_goal,
  dietary_constraints       text[],
  life_context              text[],
  onboarding_completed_at   timestamptz,
  onboarding_layer_1_done   boolean DEFAULT false,
  onboarding_layer_2_done   boolean DEFAULT false,
  last_plan_generated_at    timestamptz,
  tone_preset               tone_preset,
  nutrition_mode            nutrition_mode,
  updated_at                timestamptz
);

ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profile_select_own ON user_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_profile_insert_own ON user_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_profile_update_own ON user_profile
  FOR UPDATE USING (auth.uid() = user_id);


-- ---------------------------------------------------------------
-- GROUP 2: user_profile_facts
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_profile_facts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  field_key       text NOT NULL,
  value_text      text,
  value_numeric   numeric,
  value_bool      boolean,
  value_json      jsonb,
  unit            text,
  source          fact_source NOT NULL,
  confidence      numeric(3,2),
  inferred_from   text,
  supersedes_id   uuid REFERENCES user_profile_facts(id),
  observed_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_profile_facts_user_field_time
  ON user_profile_facts (user_id, field_key, observed_at);

ALTER TABLE user_profile_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profile_facts_select_own ON user_profile_facts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_profile_facts_insert_own ON user_profile_facts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- No UPDATE/DELETE — append-only by design


-- ---------------------------------------------------------------
-- GROUP 4 (layer 1): user_equipment
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_equipment (
  user_id           uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  location_type     location_type,
  has_barbell       boolean DEFAULT false,
  has_dumbbells     boolean DEFAULT false,
  has_kettlebells   boolean DEFAULT false,
  has_machines      boolean DEFAULT false,
  has_cables        boolean DEFAULT false,
  has_cardio        boolean DEFAULT false,
  has_pullup_bar    boolean DEFAULT false,
  has_bench         boolean DEFAULT false,
  dumbbell_max_kg   numeric(5,2),
  other_equipment   text[],
  updated_at        timestamptz
);

ALTER TABLE user_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_equipment_select_own ON user_equipment
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_equipment_insert_own ON user_equipment
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_equipment_update_own ON user_equipment
  FOR UPDATE USING (auth.uid() = user_id);


-- ---------------------------------------------------------------
-- GROUP 4 (layer 1): user_health (essential fields only)
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_health (
  user_id             uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  injuries            text[],
  chronic_pain        text[],
  medical_conditions  text[],
  activity_level      activity_level,
  notes               text,
  updated_at          timestamptz
);

ALTER TABLE user_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_health_select_own ON user_health
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_health_insert_own ON user_health
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_health_update_own ON user_health
  FOR UPDATE USING (auth.uid() = user_id);


-- ---------------------------------------------------------------
-- GROUP 4: user_safety_flags
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_safety_flags (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  flag                  safety_flag NOT NULL,
  status                flag_status NOT NULL DEFAULT 'active',
  source                text,
  severity              severity_level NOT NULL,
  detected_at           timestamptz DEFAULT now(),
  resolved_at           timestamptz,
  notes                 text,
  restrictions_applied  jsonb
);

CREATE INDEX IF NOT EXISTS user_safety_flags_user_flag_status
  ON user_safety_flags (user_id, flag, status);

ALTER TABLE user_safety_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_safety_flags_select_own ON user_safety_flags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_safety_flags_insert_own ON user_safety_flags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_safety_flags_update_own ON user_safety_flags
  FOR UPDATE USING (auth.uid() = user_id);


-- ---------------------------------------------------------------
-- GROUP 5: user_goals
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_goals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_type       primary_goal NOT NULL,
  target_value    numeric,
  target_unit     text,
  secondary_goal  text,
  horizon_weeks   integer,
  rationale       text,
  started_at      timestamptz DEFAULT now(),
  ended_at        timestamptz,
  is_current      boolean DEFAULT true
);

CREATE INDEX IF NOT EXISTS user_goals_user_current
  ON user_goals (user_id, is_current);

ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_goals_select_own ON user_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_goals_insert_own ON user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_goals_update_own ON user_goals
  FOR UPDATE USING (auth.uid() = user_id);


-- ---------------------------------------------------------------
-- GROUP 5: user_segment_snapshots
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_segment_snapshots (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  experience_level  experience_level,
  primary_goal      primary_goal,
  gender            gender,
  age_bucket        age_bucket,
  life_context      text[],
  segment_key       text,
  computed_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_segment_snapshots_user_time
  ON user_segment_snapshots (user_id, computed_at);

ALTER TABLE user_segment_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_segment_snapshots_select_own ON user_segment_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_segment_snapshots_insert_own ON user_segment_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ---------------------------------------------------------------
-- GROUP 13: question_library (catalog — no RLS, read-only for all)
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS question_library (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key             text NOT NULL,
  layer                 question_layer NOT NULL,
  applicable_segments   text[],
  applicable_goals      primary_goal[],
  priority_base         integer,
  why_we_ask            text NOT NULL,
  how_to_measure        text,
  phrasing_options      jsonb,
  answer_type           answer_type NOT NULL,
  answer_options        jsonb,
  blocks_if_unanswered  boolean DEFAULT false,
  expected_time_seconds integer,
  prerequisites         jsonb,
  is_active             boolean DEFAULT true
);

ALTER TABLE question_library ENABLE ROW LEVEL SECURITY;

-- Catalog: all authenticated users can read
CREATE POLICY question_library_select_authenticated ON question_library
  FOR SELECT USING (auth.role() = 'authenticated');


-- ---------------------------------------------------------------
-- GROUP 13: user_question_asks
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_question_asks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id     uuid NOT NULL REFERENCES question_library(id),
  asked_at        timestamptz DEFAULT now(),
  answered_at     timestamptz,
  skipped_at      timestamptz,
  answer_text     text,
  answer_numeric  numeric,
  answer_json     jsonb,
  context         text,
  priority_score  numeric(5,2)
);

CREATE INDEX IF NOT EXISTS user_question_asks_user_time
  ON user_question_asks (user_id, asked_at);

ALTER TABLE user_question_asks ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_question_asks_select_own ON user_question_asks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_question_asks_insert_own ON user_question_asks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_question_asks_update_own ON user_question_asks
  FOR UPDATE USING (auth.uid() = user_id);


-- ---------------------------------------------------------------
-- GROUP 16: field_explanations (catalog — no RLS, read-only)
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS field_explanations (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key               text NOT NULL,
  locale                  text NOT NULL DEFAULT 'pl-PL',
  why_we_ask              text NOT NULL,
  how_to_measure          text,
  example                 text,
  estimated_time_seconds  integer,
  show_in_contexts        text[],
  updated_at              timestamptz,
  UNIQUE (field_key, locale)
);

ALTER TABLE field_explanations ENABLE ROW LEVEL SECURITY;

CREATE POLICY field_explanations_select_authenticated ON field_explanations
  FOR SELECT USING (auth.role() = 'authenticated');


-- ---------------------------------------------------------------
-- GROUP 18: product_events
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS product_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  event_name  text NOT NULL,
  properties  jsonb,
  session_id  text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_events_user_time
  ON product_events (user_id, occurred_at);

CREATE INDEX IF NOT EXISTS product_events_name_time
  ON product_events (event_name, occurred_at);

ALTER TABLE product_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_events_select_own ON product_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY product_events_insert_own ON product_events
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);


-- ---------------------------------------------------------------
-- Auto-create user_profile row when public.users is inserted
-- (user_profile is 1-1 with users)
-- ---------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_profile (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_public_user_created ON public.users;

CREATE TRIGGER on_public_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_profile();


-- ---------------------------------------------------------------
-- DOWN (rollback notes — run manually if needed)
-- ---------------------------------------------------------------
-- DROP TRIGGER IF EXISTS on_public_user_created ON public.users;
-- DROP FUNCTION IF EXISTS handle_new_user_profile();
-- DROP TABLE IF EXISTS product_events;
-- DROP TABLE IF EXISTS field_explanations;
-- DROP TABLE IF EXISTS user_question_asks;
-- DROP TABLE IF EXISTS question_library;
-- DROP TABLE IF EXISTS user_segment_snapshots;
-- DROP TABLE IF EXISTS user_goals;
-- DROP TABLE IF EXISTS user_safety_flags;
-- DROP TABLE IF EXISTS user_health;
-- DROP TABLE IF EXISTS user_equipment;
-- DROP TABLE IF EXISTS user_profile_facts;
-- DROP TABLE IF EXISTS user_profile;
-- DROP TYPE IF EXISTS answer_type;
-- DROP TYPE IF EXISTS question_layer;
-- DROP TYPE IF EXISTS severity_level;
-- DROP TYPE IF EXISTS flag_status;
-- DROP TYPE IF EXISTS safety_flag;
-- DROP TYPE IF EXISTS activity_level;
-- DROP TYPE IF EXISTS location_type;
-- DROP TYPE IF EXISTS fact_source;
-- DROP TYPE IF EXISTS nutrition_mode;
-- DROP TYPE IF EXISTS tone_preset;
-- DROP TYPE IF EXISTS primary_goal;
-- DROP TYPE IF EXISTS experience_level;
-- DROP TYPE IF EXISTS age_bucket;
-- DROP TYPE IF EXISTS gender;
