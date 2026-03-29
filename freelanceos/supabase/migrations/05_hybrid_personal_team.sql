-- ============================================================
-- HYBRID MODEL: Personal First, Team Optional
-- Run this in Supabase SQL Editor
-- Safe to run multiple times (idempotent)
-- ============================================================

-- 1. Ensure workspace_id is NULLABLE on all tables
-- ============================================================
ALTER TABLE clients  ALTER COLUMN workspace_id DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN workspace_id DROP NOT NULL;
ALTER TABLE invoices ALTER COLUMN workspace_id DROP NOT NULL;

-- 2. Drop ALL existing entity RLS policies (clean slate)
-- ============================================================
DROP POLICY IF EXISTS "own clients" ON clients;
DROP POLICY IF EXISTS "workspace clients select" ON clients;
DROP POLICY IF EXISTS "workspace clients insert" ON clients;
DROP POLICY IF EXISTS "workspace clients update" ON clients;
DROP POLICY IF EXISTS "workspace clients delete" ON clients;
DROP POLICY IF EXISTS "clients select" ON clients;
DROP POLICY IF EXISTS "clients insert" ON clients;
DROP POLICY IF EXISTS "clients update" ON clients;
DROP POLICY IF EXISTS "clients delete" ON clients;

DROP POLICY IF EXISTS "own projects" ON projects;
DROP POLICY IF EXISTS "workspace projects select" ON projects;
DROP POLICY IF EXISTS "workspace projects insert" ON projects;
DROP POLICY IF EXISTS "workspace projects update" ON projects;
DROP POLICY IF EXISTS "workspace projects delete" ON projects;
DROP POLICY IF EXISTS "projects select" ON projects;
DROP POLICY IF EXISTS "projects insert" ON projects;
DROP POLICY IF EXISTS "projects update" ON projects;
DROP POLICY IF EXISTS "projects delete" ON projects;

DROP POLICY IF EXISTS "own invoices" ON invoices;
DROP POLICY IF EXISTS "workspace invoices select" ON invoices;
DROP POLICY IF EXISTS "workspace invoices insert" ON invoices;
DROP POLICY IF EXISTS "workspace invoices update" ON invoices;
DROP POLICY IF EXISTS "workspace invoices delete" ON invoices;
DROP POLICY IF EXISTS "invoices select" ON invoices;
DROP POLICY IF EXISTS "invoices insert" ON invoices;
DROP POLICY IF EXISTS "invoices update" ON invoices;
DROP POLICY IF EXISTS "invoices delete" ON invoices;

DROP POLICY IF EXISTS "own invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "workspace invoice_items" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items access" ON invoice_items;

-- 3. Create HYBRID RLS policies
--    Access granted if: user owns the row OR is member of the row's workspace
-- ============================================================

-- Clients
CREATE POLICY "clients_access" ON clients FOR SELECT
  USING (
    user_id = auth.uid()
    OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "clients_insert" ON clients FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "clients_update" ON clients FOR UPDATE
  USING (
    user_id = auth.uid()
    OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "clients_delete" ON clients FOR DELETE
  USING (
    user_id = auth.uid()
    OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Projects
CREATE POLICY "projects_access" ON projects FOR SELECT
  USING (
    user_id = auth.uid()
    OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "projects_insert" ON projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "projects_update" ON projects FOR UPDATE
  USING (
    user_id = auth.uid()
    OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "projects_delete" ON projects FOR DELETE
  USING (
    user_id = auth.uid()
    OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Invoices
CREATE POLICY "invoices_access" ON invoices FOR SELECT
  USING (
    user_id = auth.uid()
    OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "invoices_insert" ON invoices FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "invoices_update" ON invoices FOR UPDATE
  USING (
    user_id = auth.uid()
    OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "invoices_delete" ON invoices FOR DELETE
  USING (
    user_id = auth.uid()
    OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Invoice items (via parent invoice)
CREATE POLICY "invoice_items_access" ON invoice_items FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE user_id = auth.uid()
        OR workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    )
  );

-- 4. Ensure RPC for team workspace creation exists
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_workspace_for_user(ws_name text)
RETURNS uuid AS $$
DECLARE
  ws_id uuid;
BEGIN
  INSERT INTO public.workspaces (name)
  VALUES (ws_name)
  RETURNING id INTO ws_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (ws_id, auth.uid(), 'owner');

  RETURN ws_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
