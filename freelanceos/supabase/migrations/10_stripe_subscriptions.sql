-- ============================================================
-- 10_stripe_subscriptions.sql
-- Add Stripe billing columns to profiles
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS plan_status text NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS plan_type text NOT NULL DEFAULT 'free';

-- Index for fast lookup by stripe customer ID (used in webhooks)
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
