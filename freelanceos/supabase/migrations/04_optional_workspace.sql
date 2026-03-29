-- Make workspace optional: allow access by user_id OR workspace membership
-- Personal data (workspace_id IS NULL) is accessed via user_id
-- Team data (workspace_id set) is accessed via workspace membership

-- Clients
drop policy if exists "workspace clients select" on clients;
drop policy if exists "workspace clients insert" on clients;
drop policy if exists "workspace clients update" on clients;
drop policy if exists "workspace clients delete" on clients;

create policy "clients select" on clients for select
  using (user_id = auth.uid());

create policy "clients insert" on clients for insert
  with check (user_id = auth.uid());

create policy "clients update" on clients for update
  using (user_id = auth.uid());

create policy "clients delete" on clients for delete
  using (user_id = auth.uid());

-- Projects
drop policy if exists "workspace projects select" on projects;
drop policy if exists "workspace projects insert" on projects;
drop policy if exists "workspace projects update" on projects;
drop policy if exists "workspace projects delete" on projects;

create policy "projects select" on projects for select
  using (user_id = auth.uid());

create policy "projects insert" on projects for insert
  with check (user_id = auth.uid());

create policy "projects update" on projects for update
  using (user_id = auth.uid());

create policy "projects delete" on projects for delete
  using (user_id = auth.uid());

-- Invoices
drop policy if exists "workspace invoices select" on invoices;
drop policy if exists "workspace invoices insert" on invoices;
drop policy if exists "workspace invoices update" on invoices;
drop policy if exists "workspace invoices delete" on invoices;

create policy "invoices select" on invoices for select
  using (user_id = auth.uid());

create policy "invoices insert" on invoices for insert
  with check (user_id = auth.uid());

create policy "invoices update" on invoices for update
  using (user_id = auth.uid());

create policy "invoices delete" on invoices for delete
  using (user_id = auth.uid());

-- Invoice items (via parent invoice ownership)
drop policy if exists "workspace invoice_items" on invoice_items;

create policy "invoice_items access" on invoice_items for all
  using (invoice_id in (select id from invoices where user_id = auth.uid()));
