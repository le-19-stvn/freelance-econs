-- ============================================================
-- 11_notifications_and_payment_link.sql
-- Add payment_link to profiles + notifications table
-- ============================================================

-- Payment link for Stripe/PayPal on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS payment_link text;

-- Notifications table
DROP TABLE IF EXISTS notifications;

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "notifications_delete" ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications (user_id, is_read, created_at DESC);
