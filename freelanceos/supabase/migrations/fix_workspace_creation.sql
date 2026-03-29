-- Fix: workspace creation blocked by RLS chicken-and-egg problem.
-- The workspace_members INSERT policy requires being an owner/admin,
-- but the user isn't a member yet when creating a new workspace.
-- Solution: SECURITY DEFINER function that atomically creates both rows.

create or replace function public.create_workspace_for_user(ws_name text)
returns uuid as $$
declare
  ws_id uuid;
begin
  -- Create workspace
  insert into public.workspaces (name)
  values (ws_name)
  returning id into ws_id;

  -- Add caller as owner
  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, auth.uid(), 'owner');

  return ws_id;
end;
$$ language plpgsql security definer;
