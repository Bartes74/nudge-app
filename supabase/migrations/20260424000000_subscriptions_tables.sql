-- =============================================================
-- Migration: subscriptions, user_ai_usage, notifications
-- Iteration 10 — Monetization + Retention
-- Groups: 1 (subscriptions), 15 (user_ai_usage), 17 (notifications)
-- =============================================================

-- ---------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'trial',
    'active',
    'paused',
    'past_due',
    'cancelled',
    'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_plan AS ENUM (
    'monthly',
    'yearly'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'workout_reminder',
    'meal_reminder',
    'checkin_due',
    'plan_ready',
    'coach_proactive_nudge',
    'milestone',
    'trial_reminder',
    're_engagement',
    'subscription_renewal'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------
-- GROUP 1 — SUBSCRIPTIONS
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                        uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status                    subscription_status NOT NULL DEFAULT 'trial',
  plan                      subscription_plan,
  provider                  text,
  provider_subscription_id  text,
  provider_customer_id      text,
  trial_started_at          timestamptz,
  trial_ends_at             timestamptz,
  current_period_start      timestamptz,
  current_period_end        timestamptz,
  paused_until              timestamptz,
  cancelled_at              timestamptz,
  price_amount              integer,
  price_currency            text          NOT NULL DEFAULT 'PLN',
  created_at                timestamptz   NOT NULL DEFAULT now(),
  updated_at                timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.subscriptions IS 'One row per user. Status drives access gating. Pause instead of cancel (ADR-004).';
COMMENT ON COLUMN public.subscriptions.provider IS 'stripe | revenuecat';
COMMENT ON COLUMN public.subscriptions.price_amount IS 'Amount in smallest currency unit (grosze). 4900 = 49.00 PLN.';

-- Only one active subscription per user
CREATE UNIQUE INDEX subscriptions_user_id_idx ON public.subscriptions (user_id);

CREATE INDEX subscriptions_status_idx ON public.subscriptions (status);
CREATE INDEX subscriptions_trial_ends_at_idx ON public.subscriptions (trial_ends_at)
  WHERE status = 'trial';

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users read their own subscription
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- No client-side insert/update — only service role (webhook handler) writes here
-- Reads are fine; writes go through service_role in Edge Function / API

-- ---------------------------------------------------------------
-- TRIGGER: auto-create trial subscription on new user
-- ---------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (
    user_id,
    status,
    trial_started_at,
    trial_ends_at
  ) VALUES (
    NEW.id,
    'trial',
    now(),
    now() + interval '7 days'
  );
  RETURN NEW;
END;
$$;

-- Fires after the users row is created (which itself fires after auth.users insert)
CREATE TRIGGER on_user_created_start_trial
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_subscription();

-- ---------------------------------------------------------------
-- TRIGGER: updated_at maintenance for subscriptions
-- ---------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ---------------------------------------------------------------
-- GROUP 15 (partial) — USER AI USAGE
-- Rate-limiting and cost tracking per user per month.
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_ai_usage (
  user_id             uuid          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month_key           text          NOT NULL,
  llm_calls_count     integer       NOT NULL DEFAULT 0,
  photo_analysis_count integer      NOT NULL DEFAULT 0,
  tokens_in_total     integer       NOT NULL DEFAULT 0,
  tokens_out_total    integer       NOT NULL DEFAULT 0,
  cost_usd_total      numeric(10,4) NOT NULL DEFAULT 0,
  over_limit          boolean       NOT NULL DEFAULT false,
  updated_at          timestamptz   NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, month_key)
);

COMMENT ON TABLE public.user_ai_usage IS 'Aggregated AI usage per user per calendar month (YYYY-MM). Used for cost monitoring and rate limiting.';
COMMENT ON COLUMN public.user_ai_usage.month_key IS 'Format: YYYY-MM, e.g. 2026-04.';

CREATE INDEX user_ai_usage_month_key_idx ON public.user_ai_usage (month_key);

ALTER TABLE public.user_ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_ai_usage_select_own"
  ON public.user_ai_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- GROUP 17 — NOTIFICATIONS
-- Scheduled and sent notifications (push, email, in-app).
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notifications (
  id              uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid              NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           text,
  body            text,
  cta_deep_link   text,
  scheduled_for   timestamptz,
  sent_at         timestamptz,
  read_at         timestamptz,
  dismissed_at    timestamptz,
  data            jsonb,
  created_at      timestamptz       NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notifications IS 'All outbound notifications. Worker picks up rows where scheduled_for <= now() AND sent_at IS NULL.';

CREATE INDEX notifications_user_scheduled_idx ON public.notifications (user_id, scheduled_for)
  WHERE sent_at IS NULL;

CREATE INDEX notifications_pending_idx ON public.notifications (scheduled_for)
  WHERE sent_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================
-- down:
-- DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
-- DROP TRIGGER IF EXISTS on_user_created_start_trial ON public.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user_subscription();
-- DROP FUNCTION IF EXISTS public.set_updated_at();
-- DROP TABLE IF EXISTS public.notifications;
-- DROP TABLE IF EXISTS public.user_ai_usage;
-- DROP TABLE IF EXISTS public.subscriptions;
-- DROP TYPE IF EXISTS notification_type;
-- DROP TYPE IF EXISTS subscription_plan;
-- DROP TYPE IF EXISTS subscription_status;
-- =============================================================
