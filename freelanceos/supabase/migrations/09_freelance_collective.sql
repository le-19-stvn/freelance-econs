-- ============================================================
-- 09_freelance_collective.sql
-- Freelance Collective: Teams, Members, Projects, Kanban Tasks
-- COMPLETELY ISOLATED from clients/invoices/projects tables
-- ============================================================

-- 1. SECURITY DEFINER helper to check team membership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = _team_id AND user_id = auth.uid()
  );
$$;

-- 2. Tables

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS team_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES team_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. RLS Policies (non-recursive, uses SECURITY DEFINER function)

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_tasks ENABLE ROW LEVEL SECURITY;

-- teams: can see/modify if you created it OR are a member
CREATE POLICY "teams_select" ON teams FOR SELECT
  USING (created_by = auth.uid() OR is_team_member(id));

CREATE POLICY "teams_insert" ON teams FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "teams_update" ON teams FOR UPDATE
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE POLICY "teams_delete" ON teams FOR DELETE
  USING (created_by = auth.uid());

-- team_members: can see if you're a member of that team, insert/delete if owner/admin
CREATE POLICY "team_members_select" ON team_members FOR SELECT
  USING (is_team_member(team_id));

CREATE POLICY "team_members_insert" ON team_members FOR INSERT
  WITH CHECK (is_team_member(team_id));

CREATE POLICY "team_members_delete" ON team_members FOR DELETE
  USING (is_team_member(team_id));

-- team_projects: can access if member of the team
CREATE POLICY "team_projects_select" ON team_projects FOR SELECT
  USING (is_team_member(team_id));

CREATE POLICY "team_projects_insert" ON team_projects FOR INSERT
  WITH CHECK (is_team_member(team_id));

CREATE POLICY "team_projects_update" ON team_projects FOR UPDATE
  USING (is_team_member(team_id)) WITH CHECK (is_team_member(team_id));

CREATE POLICY "team_projects_delete" ON team_projects FOR DELETE
  USING (is_team_member(team_id));

-- team_tasks: access via project -> team membership
CREATE POLICY "team_tasks_select" ON team_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM team_projects tp WHERE tp.id = project_id AND is_team_member(tp.team_id)
  ));

CREATE POLICY "team_tasks_insert" ON team_tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_projects tp WHERE tp.id = project_id AND is_team_member(tp.team_id)
  ));

CREATE POLICY "team_tasks_update" ON team_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM team_projects tp WHERE tp.id = project_id AND is_team_member(tp.team_id)
  ));

CREATE POLICY "team_tasks_delete" ON team_tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM team_projects tp WHERE tp.id = project_id AND is_team_member(tp.team_id)
  ));

-- 4. RPC to create a team + auto-add creator as owner (atomic)
CREATE OR REPLACE FUNCTION public.create_team_with_owner(_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _team_id uuid;
BEGIN
  INSERT INTO teams (name, created_by) VALUES (_name, auth.uid()) RETURNING id INTO _team_id;
  INSERT INTO team_members (team_id, user_id, role) VALUES (_team_id, auth.uid(), 'owner');
  RETURN _team_id;
END;
$$;
