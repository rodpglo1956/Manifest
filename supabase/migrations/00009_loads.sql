-- Loads table
-- Per PRD-01 Section 4.2 schema
-- Comprehensive: pickup, delivery, freight, rate, broker, documents, assignment
-- Load status: 'booked', 'dispatched', 'in_transit', 'at_pickup', 'loaded',
--              'at_delivery', 'delivered', 'invoiced', 'paid', 'canceled'
-- Rate type: 'flat', 'per_mile', 'hourly', 'per_stop'
-- Weight unit: 'lbs', 'kg'

create table loads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  load_number text unique,

  -- Status
  status text not null default 'booked', -- see status values above

  -- Pickup
  pickup_address text,
  pickup_city text,
  pickup_state text,
  pickup_zip text,
  pickup_date date,
  pickup_time time,
  pickup_contact_name text,
  pickup_contact_phone text,
  pickup_notes text,

  -- Delivery
  delivery_address text,
  delivery_city text,
  delivery_state text,
  delivery_zip text,
  delivery_date date,
  delivery_time time,
  delivery_contact_name text,
  delivery_contact_phone text,
  delivery_notes text,

  -- Freight
  commodity text,
  weight numeric,
  weight_unit text default 'lbs', -- 'lbs', 'kg'
  pieces integer,
  equipment_type text, -- 'dry_van', 'reefer', 'flatbed', 'sprinter', 'box_truck', 'other'
  temperature_min numeric,
  temperature_max numeric,
  hazmat boolean default false,

  -- Rate
  rate_amount numeric,
  rate_type text default 'flat', -- 'flat', 'per_mile', 'hourly', 'per_stop'
  miles numeric,
  fuel_surcharge numeric,
  accessorial_charges numeric,
  total_charges numeric,

  -- Assignment
  driver_id uuid references drivers(id) on delete set null,
  vehicle_id uuid references vehicles(id) on delete set null,

  -- Broker
  broker_name text,
  broker_contact text,
  broker_phone text,
  broker_email text,
  broker_mc_number text,
  broker_reference text,

  -- Documents (Supabase Storage URLs)
  bol_url text,
  rate_confirmation_url text,
  pod_url text,

  -- Meta
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table loads enable row level security;

create index idx_loads_org_id on loads(org_id);
create index idx_loads_status on loads(status);
create index idx_loads_driver_id on loads(driver_id);

-- RLS: org_id isolation
create policy "loads_org_access" on loads
  for all using (org_id = (select public.org_id()));
