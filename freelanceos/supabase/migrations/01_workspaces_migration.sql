-- ============================================================
-- FreelanceOS — Multi-Tenant (Workspace) Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. CREATE TABLES
-- ============================================================

-- Workspaces
create table if not exists workspaces (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamptz default now()
);

-- Workspace members (join table)
create table if not exists workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz default now(),
  primary key (workspace_id, user_id)
);

-- 2. ALTER EXISTING TABLES — add workspace_id
-- ============================================================

alter table clients
  add column if not exists workspace_id uuid references workspaces(id) on delete cascade;

alter table projects
  add column if not exists workspace_id uuid references workspaces(id) on delete cascade;

alter table invoices
  add column if not exists workspace_id uuid references workspaces(id) on delete cascade;

-- 3. DATA MIGRATION — create default workspace per existing user
-- ============================================================

do $$
declare
  u record;
  ws_id uuid;
begin
  -- Loop through every user who has data (profiles table)
  for u in select id from profiles loop
    -- Create a default workspace for this user
    insert into workspaces (id, name)
    values (uuid_generate_v4(), 'Mon Espace')
    returning id into ws_id;

    -- Add user as owner
    insert into workspace_members (workspace_id, user_id, role)
    values (ws_id, u.id, 'owner');

    -- Backfill workspace_id on all their existing data
    update clients   set workspace_id = ws_id where user_id = u.id and workspace_id is null;
    update projects  set workspace_id = ws_id where user_id = u.id and workspace_id is null;
    update invoices  set workspace_id = ws_id where user_id = u.id and workspace_id is null;
  end loop;
end $$;

-- 4. ENABLE RLS on new tables
-- ============================================================

alter table workspaces enable row level security;
alter table workspace_members enable row level security;

-- Workspace members can see their own workspaces
create policy "members see workspaces"
  on workspaces for select
  using (id in (select workspace_id from workspace_members where user_id = auth.uid()));

-- Owners can update their workspace
create policy "owners update workspaces"
  on workspaces for update
  using (id in (select workspace_id from workspace_members where user_id = auth.uid() and role = 'owner'));

-- Authenticated users can create workspaces
create policy "create workspaces"
  on workspaces for insert
  with check (auth.uid() is not null);

-- Members see their memberships
create policy "members see memberships"
  on workspace_members for select
  using (user_id = auth.uid() or workspace_id in (
    select workspace_id from workspace_members where user_id = auth.uid()
  ));

-- Owners/admins can insert members
create policy "admins insert members"
  on workspace_members for insert
  with check (workspace_id in (
    select workspace_id from workspace_members
    where user_id = auth.uid() and role in ('owner', 'admin')
  ));

-- Owners can delete members
create policy "owners delete members"
  on workspace_members for delete
  using (workspace_id in (
    select workspace_id from workspace_members
    where user_id = auth.uid() and role = 'owner'
  ));

-- 5. DROP OLD RLS POLICIES & CREATE NEW WORKSPACE-BASED ONES
-- ============================================================

-- Clients
drop policy if exists "own clients" on clients;

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
drop policy if exists "own projects" on projects;

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
drop policy if exists "own invoices" on invoices;

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

-- Invoice items: access based on parent invoice's workspace
drop policy if exists "own invoice_items" on invoice_items;

create policy "workspace invoice_items"
  on invoice_items for all
  using (invoice_id in (
    select id from invoices
    where workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
  ));

-- 6. UPDATE SIGNUP TRIGGER — auto-create workspace for new users
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
declare
  ws_id uuid;
begin
  -- Create profile
  insert into public.profiles (id, email)
  values (new.id, new.email);

  -- Create default workspace
  insert into public.workspaces (name)
  values ('Mon Espace')
  returning id into ws_id;

  -- Add user as owner
  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;

-- The trigger already exists, so the function replacement takes effect automatically.
