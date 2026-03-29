-- ============================================================
-- Fix infinite recursion in workspace_members RLS policies
-- The recursion happens because entity policies query workspace_members,
-- and workspace_members policies also query workspace_members.
-- Fix: use a SECURITY DEFINER function to bypass RLS when checking membership.
-- ============================================================

-- 1. Create a SECURITY DEFINER function that bypasses RLS
--    This is the key fix: it checks membership without triggering RLS on workspace_members
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_workspace_ids(uid uuid)
RETURNS SETOF uuid AS $$
  SELECT workspace_id FROM public.workspace_members WHERE user_id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Drop ALL existing policies on workspace_members
-- ============================================================

DROP POLICY IF EXISTS "members see memberships" ON workspace_members;
DROP POLICY IF EXISTS "admins insert members" ON workspace_members;
DROP POLICY IF EXISTS "owners delete members" ON workspace_members;

-- 3. Recreate workspace_members policies (simple, no self-reference)
-- ============================================================

CREATE POLICY "wm_select" ON workspace_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "wm_insert" ON workspace_members FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
  );

CREATE POLICY "wm_delete" ON workspace_members FOR DELETE
  USING (
    workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
  );

-- 4. Drop ALL existing entity policies
-- ============================================================

DROP POLICY IF EXISTS "clients_access" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;
DROP POLICY IF EXISTS "clients_update" ON clients;
DROP POLICY IF EXISTS "clients_delete" ON clients;
DROP POLICY IF EXISTS "clients select" ON clients;
DROP POLICY IF EXISTS "clients insert" ON clients;
DROP POLICY IF EXISTS "clients update" ON clients;
DROP POLICY IF EXISTS "clients delete" ON clients;

DROP POLICY IF EXISTS "projects_access" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "projects_delete" ON projects;
DROP POLICY IF EXISTS "projects select" ON projects;
DROP POLICY IF EXISTS "projects insert" ON projects;
DROP POLICY IF EXISTS "projects update" ON projects;
DROP POLICY IF EXISTS "projects delete" ON projects;

DROP POLICY IF EXISTS "invoices_access" ON invoices;
DROP POLICY IF EXISTS "invoices_insert" ON invoices;
DROP POLICY IF EXISTS "invoices_update" ON invoices;
DROP POLICY IF EXISTS "invoices_delete" ON invoices;
DROP POLICY IF EXISTS "invoices select" ON invoices;
DROP POLICY IF EXISTS "invoices insert" ON invoices;
DROP POLICY IF EXISTS "invoices update" ON invoices;
DROP POLICY IF EXISTS "invoices delete" ON invoices;

DROP POLICY IF EXISTS "invoice_items_access" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items access" ON invoice_items;
DROP POLICY IF EXISTS "workspace invoice_items" ON invoice_items;

-- 5. Recreate HYBRID entity policies using the SECURITY DEFINER function
-- ============================================================

-- Clients
CREATE POLICY "clients_select" ON clients FOR SELECT
  USING (user_id = auth.uid() OR workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));

CREATE POLICY "clients_insert" ON clients FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "clients_update" ON clients FOR UPDATE
  USING (user_id = auth.uid() OR workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));

CREATE POLICY "clients_delete" ON clients FOR DELETE
  USING (user_id = auth.uid() OR workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));

-- Projects
CREATE POLICY "projects_select" ON projects FOR SELECT
  USING (user_id = auth.uid() OR workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));

CREATE POLICY "projects_insert" ON projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "projects_update" ON projects FOR UPDATE
  USING (user_id = auth.uid() OR workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));

CREATE POLICY "projects_delete" ON projects FOR DELETE
  USING (user_id = auth.uid() OR workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));

-- Invoices
CREATE POLICY "invoices_select" ON invoices FOR SELECT
  USING (user_id = auth.uid() OR workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));

CREATE POLICY "invoices_insert" ON invoices FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "invoices_update" ON invoices FOR UPDATE
  USING (user_id = auth.uid() OR workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));

CREATE POLICY "invoices_delete" ON invoices FOR DELETE
  USING (user_id = auth.uid() OR workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));

-- Invoice items (via parent invoice)
CREATE POLICY "invoice_items_all" ON invoice_items FOR ALL
  USING (invoice_id IN (
    SELECT id FROM invoices
    WHERE user_id = auth.uid() OR workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
  ));

-- 6. Drop and recreate workspace policies using the function too
-- ============================================================

DROP POLICY IF EXISTS "members see workspaces" ON workspaces;
DROP POLICY IF EXISTS "owners update workspaces" ON workspaces;
DROP POLICY IF EXISTS "create workspaces" ON workspaces;

CREATE POLICY "ws_select" ON workspaces FOR SELECT
  USING (id IN (SELECT public.get_user_workspace_ids(auth.uid())));

CREATE POLICY "ws_insert" ON workspaces FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ws_update" ON workspaces FOR UPDATE
  USING (id IN (SELECT public.get_user_workspace_ids(auth.uid())));
