-- ============================================================
-- 15_security_hardening.sql
-- Option C — Full security fix (post Phase 6)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- C1 · Tighten invoice_reminders RLS
-- The previous "Service role can manage reminders" policy used
-- FOR ALL USING (true) WITH CHECK (true), which allowed ANY
-- authenticated user to read/write ANY row. Drop it and add
-- user-scoped policies. Service role still bypasses RLS so the
-- send-reminders Edge Function keeps working.
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Service role can manage reminders" ON invoice_reminders;

-- (SELECT policy from migration 14 already scoped to user_id = auth.uid())

CREATE POLICY "Users can insert own reminders (pro only)"
  ON invoice_reminders FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND plan_type = 'pro'
    )
  );

CREATE POLICY "Users can update own reminders"
  ON invoice_reminders FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reminders"
  ON invoice_reminders FOR DELETE
  USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- C2 + I1 · Enforce Pro plan + hex color format for branding
-- Previously the client-side ProGate was the only protection.
-- A free-tier user could still hit supabase.from('profiles')
-- .update({ invoice_logo_url, invoice_primary_color }) directly.
-- This trigger enforces the rule at the database level.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION enforce_pro_branding()
RETURNS TRIGGER AS $$
BEGIN
  -- Block branding field mutations when current plan is not pro
  IF (NEW.invoice_logo_url IS DISTINCT FROM OLD.invoice_logo_url
      OR NEW.invoice_primary_color IS DISTINCT FROM OLD.invoice_primary_color)
     AND COALESCE(OLD.plan_type, 'free') <> 'pro' THEN
    RAISE EXCEPTION 'Pro plan required to customize invoice branding'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Validate hex color format (#RRGGBB)
  IF NEW.invoice_primary_color IS NOT NULL
     AND NEW.invoice_primary_color !~ '^#[0-9A-Fa-f]{6}$' THEN
    RAISE EXCEPTION 'Invalid hex color format (expected #RRGGBB)'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_pro_branding_trigger ON profiles;

CREATE TRIGGER enforce_pro_branding_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION enforce_pro_branding();
