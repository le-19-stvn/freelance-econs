-- ────────────────────────────────────────────────────────────────────────────
-- Migration 17 — Annual revenue goal
-- ────────────────────────────────────────────────────────────────────────────
-- Adds a personal yearly CA target to the profile. Displayed as a progress
-- bar in the dashboard hero so the user sees "X € / goal €" immediately on
-- landing. NULL means "no goal set yet" — the hero shows a discreet CTA
-- instead of the bar.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS annual_goal numeric(12, 2) CHECK (annual_goal IS NULL OR annual_goal > 0);

COMMENT ON COLUMN public.profiles.annual_goal IS
  'Personal yearly revenue target in the user''s base currency (EUR). NULL = not set.';
