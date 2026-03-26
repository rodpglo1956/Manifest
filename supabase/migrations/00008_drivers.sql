-- Drivers table
-- Per PRD-01 Section 3.2 schema
-- Driver status: 'active', 'inactive', 'terminated'
-- License class: 'A', 'B', 'C', 'standard'

create table drivers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  license_number text,
  license_state text,
  license_class text, -- 'A', 'B', 'C', 'standard'
  license_expiration date,
  hire_date date,
  status text not null default 'active', -- 'active', 'inactive', 'terminated'
  current_vehicle_id uuid references vehicles(id) on delete set null,
  home_terminal text,
  notes text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table drivers enable row level security;

create index idx_drivers_org_id on drivers(org_id);

-- RLS: org_id isolation
create policy "drivers_org_access" on drivers
  for all using (org_id = (select public.org_id()));
