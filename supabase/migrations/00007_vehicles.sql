-- Vehicles table
-- Basic vehicle registry for fleet tracking
-- Vehicle types: 'dry_van', 'reefer', 'flatbed', 'sprinter', 'box_truck', 'other'
-- Status: 'active', 'inactive'

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  unit_number text not null,
  vin text,
  year integer,
  make text,
  model text,
  vehicle_type text not null default 'dry_van', -- 'dry_van', 'reefer', 'flatbed', 'sprinter', 'box_truck', 'other'
  status text not null default 'active', -- 'active', 'inactive'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table vehicles enable row level security;

create index idx_vehicles_org_id on vehicles(org_id);

-- RLS: org_id isolation
create policy "vehicles_org_access" on vehicles
  for all using (org_id = (select auth.org_id()));
