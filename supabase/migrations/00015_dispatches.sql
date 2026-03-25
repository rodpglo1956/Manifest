-- Dispatches table per PRD-01 Section 5.2
-- Tracks assignment of drivers/vehicles to loads with full status lifecycle
create table dispatches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  load_id uuid not null references loads(id),
  driver_id uuid not null references drivers(id),
  vehicle_id uuid references vehicles(id),
  status text not null default 'assigned',
  assigned_at timestamptz default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  estimated_pickup_arrival timestamptz,
  estimated_delivery_arrival timestamptz,
  driver_notes text,
  dispatcher_notes text,
  assigned_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: org_id isolation using auth.org_id() helper
alter table dispatches enable row level security;
create policy "org_dispatches" on dispatches
  for all using (org_id = (select auth.org_id()));

-- Indexes for common query patterns
create index idx_dispatches_org_id on dispatches(org_id);
create index idx_dispatches_load_id on dispatches(load_id);
create index idx_dispatches_driver_id on dispatches(driver_id);
create index idx_dispatches_status on dispatches(status);

-- Prevent duplicate active dispatches for the same load
-- Only one non-terminal dispatch per load at a time
create unique index idx_dispatches_active_load
  on dispatches(load_id)
  where status not in ('completed', 'rejected');

-- Enable Realtime for dispatch changes
alter publication supabase_realtime add table dispatches;
