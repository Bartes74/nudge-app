-- =============================================================
-- Migration: add 'calm_guided' to tone_preset enum
-- -------------------------------------------------------------
-- Postgres forbids using a newly-added enum value in the same
-- transaction that adds it (SQLSTATE 55P04). The next migration
-- (20260425000000_beginner_zero_guided_path.sql) inserts prompts
-- that reference 'calm_guided' — so the enum value must be
-- committed in its own earlier migration.
-- =============================================================

ALTER TYPE tone_preset ADD VALUE IF NOT EXISTS 'calm_guided';

-- DOWN
-- Postgres cannot DROP a single enum value without recreating the
-- whole type. Intentional no-op — matches the removal note in
-- 20260425000000_beginner_zero_guided_path.sql.
