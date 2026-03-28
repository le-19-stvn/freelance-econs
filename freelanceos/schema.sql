-- FreelanceOS / eCons Freelance — Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  company_name text,
  email text,
  address text,
  siret text,
  tva_number text,
  tva_rate numeric default 20,
  logo_url text,
  created_at timestamptz default now()
);

-- Clients
create table clients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  email text,
  phone text,
  fiscal_id text,
  address text,
  created_at timestamptz default now()
);

-- Projects
create table projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  client_id uuid references clients on delete set null,
  name text not null,
  description text,
  status text default 'ongoing' check (status in ('ongoing', 'done')),
  deadline date,
  budget numeric default 0,
  invoice_generated boolean default false,
  created_at timestamptz default now()
);

-- Invoices
create table invoices (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  client_id uuid references clients on delete set null,
  project_id uuid references projects on delete set null,
  invoice_number text not null,
  status text default 'draft' check (status in ('draft', 'sent', 'paid', 'late')),
  issue_date date default current_date,
  due_date date,
  tva_rate numeric default 20,
  notes text,
  pdf_url text,
  created_at timestamptz default now()
);

-- Invoice items
create table invoice_items (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references invoices on delete cascade not null,
  description text not null,
  quantity numeric default 1,
  unit_type text default 'h' check (unit_type in ('h', 'forfait', 'jour')),
  unit_price numeric not null default 0,
  created_at timestamptz default now()
);

-- RLS: enable on all tables
alter table profiles enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;

-- RLS policies: users see only their own data
create policy "own profiles" on profiles for all using (auth.uid() = id);
create policy "own clients" on clients for all using (auth.uid() = user_id);
create policy "own projects" on projects for all using (auth.uid() = user_id);
create policy "own invoices" on invoices for all using (auth.uid() = user_id);
create policy "own invoice_items" on invoice_items for all
  using (invoice_id in (select id from invoices where user_id = auth.uid()));

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
