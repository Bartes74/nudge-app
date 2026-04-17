-- =============================================================
-- Migration: Coach conversations + messages
-- Iteration 8 — AI Coach
-- Group 14 (coach_conversations, coach_messages)
-- =============================================================

-- ---------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE entry_point AS ENUM (
    'global_bubble',
    'exercise_shortcut',
    'meal_shortcut',
    'checkin_shortcut',
    'proactive_coach',
    'onboarding'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system', 'tool');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE coach_intent AS ENUM (
    'technical_exercise',
    'diet',
    'motivation',
    'pain',
    'goal_extreme',
    'greeting',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------
-- GROUP 14 — COACH CONVERSATIONS
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.coach_conversations (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  entry_point          entry_point NOT NULL DEFAULT 'global_bubble',
  context_entity_type  text        CHECK (context_entity_type IN ('exercise', 'meal', 'plan', 'checkin')),
  context_entity_id    uuid,
  started_at           timestamptz NOT NULL DEFAULT now(),
  last_message_at      timestamptz,
  closed               boolean     NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS coach_conversations_user_started_idx
  ON public.coach_conversations (user_id, started_at DESC);

ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_conversations_select_own"
  ON public.coach_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "coach_conversations_insert_own"
  ON public.coach_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "coach_conversations_update_own"
  ON public.coach_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "coach_conversations_delete_own"
  ON public.coach_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- GROUP 14 — COACH MESSAGES
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.coach_messages (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   uuid         NOT NULL REFERENCES public.coach_conversations (id) ON DELETE CASCADE,
  role              message_role NOT NULL,
  content           text         NOT NULL,
  intent            coach_intent,
  tokens_in         integer,
  tokens_out        integer,
  llm_call_id       uuid         REFERENCES public.llm_calls (id) ON DELETE SET NULL,
  guardrail_flagged boolean      NOT NULL DEFAULT false,
  guardrail_reasons text[],
  created_at        timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coach_messages_conversation_created_idx
  ON public.coach_messages (conversation_id, created_at);

ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_messages_select_own"
  ON public.coach_messages FOR SELECT
  USING (
    auth.uid() = (
      SELECT user_id FROM public.coach_conversations
      WHERE id = conversation_id
    )
  );

CREATE POLICY "coach_messages_insert_own"
  ON public.coach_messages FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.coach_conversations
      WHERE id = conversation_id
    )
  );

-- ---------------------------------------------------------------
-- behavior_signals: add proactive nudge tracking columns
-- ---------------------------------------------------------------

ALTER TABLE public.behavior_signals
  ADD COLUMN IF NOT EXISTS last_proactive_coach_at  timestamptz,
  ADD COLUMN IF NOT EXISTS missed_workouts_7d        integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS days_since_registration   integer NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------
-- PROMPTS SEED — coach prompts (v1)
-- ---------------------------------------------------------------

INSERT INTO public.prompts (slug, version, purpose, system_template, user_template, output_schema, tone_preset)
VALUES
(
  'coach_technical_exercise',
  1,
  'Odpowiada na pytania techniczne dotyczące ćwiczeń — technika, bezpieczeństwo, modyfikacje',
  E'Jesteś AI coachem fitness. Pomagasz użytkownikowi wykonać ćwiczenie prawidłowo i bezpiecznie.\n\nKontekst użytkownika:\n- Segment: {{segment}}\n- Cel główny: {{primary_goal}}\n- Ćwiczenie: {{exercise_name}} (slug: {{exercise_slug}})\n- Opis ćwiczenia: {{exercise_description}}\n\nZasady:\n1. Opisz technikę krok po kroku w ≤ 5 punktach.\n2. Wspomnij 1-2 najczęstsze błędy.\n3. Jeśli ćwiczenie nie pasuje do profilu — zaproponuj alternatywę.\n4. NIE stawiaj diagnoz. Jeśli pojawia się ból — kieruj do fizjoterapeuty.\n5. Odpowiadaj po polsku, konkretnie, bez zbędnych pochlebstw.',
  E'Pytanie użytkownika: {{user_message}}',
  NULL,
  'factual_technical'
),
(
  'coach_diet_question',
  1,
  'Odpowiada na pytania o dietę, produkty, makro — w kontekście planu żywieniowego użytkownika',
  E'Jesteś AI coachem żywieniowym. Odpowiadasz na pytania o produkty, makroskładniki i strategie żywieniowe.\n\nKontekst użytkownika:\n- Segment: {{segment}}\n- Cel główny: {{primary_goal}}\n- Aktualne makro: {{kcal}} kcal, {{protein_g}}g białka, {{carbs_g}}g węglowodanów, {{fat_g}}g tłuszczu\n- Strategia żywieniowa: {{strategy_notes}}\n\nZasady:\n1. Odpowiadaj konkretnie — czy produkt/podejście pasuje do planu i dlaczego.\n2. Podaj przybliżone wartości makro jeśli pytanie dotyczy produktu.\n3. Nie zalecaj suplementów bez wyraźnej potrzeby.\n4. NIE stawiaj diagnoz żywieniowych ani nie licz dawek leków/suplementów farmaceutycznych.\n5. Jeśli pytanie dotyczy nietolerancji/alergii — kieruj do dietetyka.\n6. Odpowiadaj po polsku, zwięźle.',
  E'Pytanie użytkownika: {{user_message}}',
  NULL,
  'warm_encouraging'
),
(
  'coach_pain_flagged',
  1,
  'Obsługuje wiadomości zawierające sygnały bólu/kontuzji — zawsze referral do fizjoterapeuty',
  E'Jesteś AI coachem. Użytkownik zgłosił ból, dyskomfort lub inne objawy fizyczne.\n\nTwoja jedyna rola w tej odpowiedzi:\n1. Okazać empatię (1 zdanie).\n2. NIE diagnozować, NIE sugerować ćwiczeń na ból, NIE modyfikować planu treningowego.\n3. Jednoznacznie zalecić konsultację z fizjoterapeutą lub lekarzem przed kontynuowaniem treningu.\n4. Zaproponować tymczasowe zawieszenie ćwiczeń obciążających daną partię.\n\nOdpowiadaj po polsku. Ton: spokojny, troskliwy, zdecydowany.',
  E'Wiadomość użytkownika: {{user_message}}',
  NULL,
  'warm_encouraging'
),
(
  'coach_motivation',
  1,
  'Krótkie, autentyczne wsparcie motywacyjne — bez patosu i pustych frazesów',
  E'Jesteś AI coachem. Użytkownik potrzebuje motywacji lub wsparcia.\n\nKontekst użytkownika:\n- Segment: {{segment}}\n- Cel główny: {{primary_goal}}\n- Treningi ostatnie 7 dni: {{workouts_7d}}\n- Trend wagi: {{weight_trend}}\n\nZasady:\n1. Odpowiedź ≤ 3 zdania.\n2. Konkretne, oparte na danych (jeśli są dostępne).\n3. BEZ frazesów w stylu „wierzę w Ciebie!", „dasz radę!", „jesteś niesamowity!".\n4. Jeśli jest coś do poprawy — powiedz wprost, ale bez oceniania.\n5. Zaproponuj 1 konkretny następny krok.\n6. Odpowiadaj po polsku.',
  E'Wiadomość użytkownika: {{user_message}}',
  NULL,
  'warm_encouraging'
)
ON CONFLICT (slug, version) DO NOTHING;

-- =============================================================
-- down:
-- DELETE FROM public.prompts WHERE slug IN (
--   'coach_technical_exercise','coach_diet_question','coach_pain_flagged','coach_motivation'
-- );
-- ALTER TABLE public.behavior_signals
--   DROP COLUMN IF EXISTS last_proactive_coach_at,
--   DROP COLUMN IF EXISTS missed_workouts_7d,
--   DROP COLUMN IF EXISTS days_since_registration;
-- DROP TABLE IF EXISTS public.coach_messages;
-- DROP TABLE IF EXISTS public.coach_conversations;
-- DROP TYPE IF EXISTS coach_intent;
-- DROP TYPE IF EXISTS message_role;
-- DROP TYPE IF EXISTS entry_point;
-- =============================================================
