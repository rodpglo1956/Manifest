-- Organizations table
-- Schema per PRD-01 Section 2.3
-- company_type determines which compliance modules appear in later phases
-- Values: 'dot_carrier', 'non_dot_carrier', 'both'

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  dot_number text,
  mc_number text,
  address_line1 text,
  address_city text,
  address_state text,
  address_zip text,
  phone text,
  email text,
  company_type text not null default 'dot_carrier', -- 'dot_carrier', 'non_dot_carrier', 'both'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table organizations enable row level security;
