-- ============================================================
-- Fix: Re-run RLS policies + data migration (safe to run multiple times)
-- ============================================================

-- Enable RLS (idempotent)
alter table workspaces enable row level security;
alter table workspace_members enable row level security;

-- Drop all workspace/member policies first to avoid conflicts
drop policy if exists "members see workspaces" on workspaces;
drop policy if exists "owners update workspaces" on workspaces;
drop policy if exists "create workspaces" on workspaces;
drop policy if exists "members see memberships" on workspace_members;
drop policy if exists "admins insert members" on workspace_members;
drop policy if exists "owners delete members" on workspace_members;

-- Workspace policies
create policy "members see workspaces"
  on workspaces for select
  using (id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "owners update workspaces"
  on workspaces for update
  using (id in (select workspace_id from workspace_members where user_id = auth.uid() and role = 'owner'));

create policy "create workspaces"
  on workspaces for insert
  with check (auth.uid() is not null);

-- Workspace members policies
create policy "members see memberships"
  on workspace_members for select
  using (user_id = auth.uid() or workspace_id in (
    select workspace_id from workspace_members where user_id = auth.uid()
  ));

create policy "admins insert members"
  on workspace_members for insert
  with check (workspace_id in (
    select workspace_id from workspace_members
    where user_id = auth.uid() and role in ('owner', 'admin')
  ));

create policy "owners delete members"
  on workspace_members for delete
  using (workspace_id in (
    select workspace_id from workspace_members
    where user_id = auth.uid() and role = 'owner'
  ));

-- Drop old entity policies
drop policy if exists "own clients" on clients;
drop policy if exists "own projects" on projects;
drop policy if exists "own invoices" on invoices;
drop policy if exists "own invoice_items" on invoice_items;

-- Drop workspace-based policies if they already exist
drop policy if exists "workspace clients select" on clients;
drop policy if exists "workspace clients insert" on clients;
drop policy if exists "workspace clients update" on clients;
drop policy if exists "workspace clients delete" on clients;
drop policy if exists "workspace projects select" on projects;
drop policy if exists "workspace projects insert" on projects;
drop policy if exists "workspace projects update" on projects;
drop policy if exists "workspace projects delete" on projects;
drop policy if exists "workspace invoices select" on invoices;
drop policy if exists "workspace invoices insert" on invoices;
drop policy if exists "workspace invoices update" on invoices;
drop policy if exists "workspace invoices delete" on invoices;
drop policy if exists "workspace invoice_items" on invoice_items;

-- Clients
create policy "workspace clients select"
  on clients for select
  using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "workspace clients insert"
  on clients for insert
  with check (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "workspace clients update"
  on clients for update
  using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "workspace clients delete"
  on clients for delete
  using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

-- Projects
create policy "workspace projects select"
  on projects for select
  using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "workspace projects insert"
  on projects for insert
  with check (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "workspace projects update"
  on projects for update
  using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "workspace projects delete"
  on projects for delete
  using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

-- Invoices
create policy "workspace invoices select"
  on invoices for select
  using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "workspace invoices insert"
  on invoices for insert
  with check (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "workspace invoices update"
  on invoices for update
  using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

create policy "workspace invoices delete"
  on invoices for delete
  using (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()));

-- Invoice items
create policy "workspace invoice_items"
  on invoice_items for all
  using (invoice_id in (
    select id from invoices
    where workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
  ));

-- Data migration: create default workspace for users who don't have one yet
do $$
declare
  u record;
  ws_id uuid;
begin
  for u in
    select id from profiles
    where id not in (select user_id from workspace_members)
  loop
    insert into workspaces (id, name)
    values (uuid_generate_v4(), 'Mon Espace')
    returning id into ws_id;

    insert into workspace_members (workspace_id, user_id, role)
    values (ws_id, u.id, 'owner');

    update clients   set workspace_id = ws_id where user_id = u.id and workspace_id is null;
    update projects  set workspace_id = ws_id where user_id = u.id and workspace_id is null;
    update invoices  set workspace_id = ws_id where user_id = u.id and workspace_id is null;
  end loop;
end $$;

-- Signup trigger: auto-create workspace for new users
create or replace function handle_new_user()
returns trigger as $$
declare
  ws_id uuid;
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  insert into public.workspaces (name)
  values ('Mon Espace')
  returning id into ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;

-- RPC function for client-side workspace creation (bypasses RLS)
create or replace function public.create_workspace_for_user(ws_name text)
returns uuid as $$
declare
  ws_id uuid;
begin
  insert into public.workspaces (name)
  values (ws_name)
  returning id into ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, auth.uid(), 'owner');

  return ws_id;
end;
$$ language plpgsql security definer;
