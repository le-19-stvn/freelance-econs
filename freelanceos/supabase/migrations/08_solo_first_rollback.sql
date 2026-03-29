-- ============================================================
-- SOLO FIRST ROLLBACK — Pure user_id ownership, no workspace in RLS
-- ============================================================

-- 1. Nuke every policy on every table
-- ============================================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 2. Ensure RLS is enabled
-- ============================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- 3. Ensure workspace_id is nullable
-- ============================================================
ALTER TABLE clients  ALTER COLUMN workspace_id DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN workspace_id DROP NOT NULL;
ALTER TABLE invoices ALTER COLUMN workspace_id DROP NOT NULL;

-- 4. Simple solo policies: user_id = auth.uid()
-- ============================================================
CREATE POLICY "solo" ON clients FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "solo" ON projects FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "solo" ON invoices FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "solo" ON invoice_items FOR ALL
  USING (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()));

CREATE POLICY "solo" ON profiles FOR ALL
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 5. Workspace tables — keep working but simple
-- ============================================================
CREATE POLICY "access" ON workspaces FOR ALL
  USING (true) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "access" ON workspace_members FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (true);
