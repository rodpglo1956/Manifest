-- User profiles (extends Supabase auth.users)
-- Schema per PRD-01 Section 2.3
-- PK references auth.users(id) on delete cascade
-- role values: 'admin', 'dispatcher', 'driver', 'viewer'

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references organizations(id),
  full_name text,
  role text not null default 'viewer', -- 'admin', 'dispatcher', 'driver', 'viewer'
  phone text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index on org_id for RLS performance
create index idx_profiles_org_id on profiles(org_id);

alter table profiles enable row level security;
