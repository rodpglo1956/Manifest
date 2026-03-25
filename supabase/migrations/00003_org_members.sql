-- Org membership (for invitation flow)
-- Schema per PRD-01 Section 2.3
-- Tracks which users belong to which organizations with their role

create table org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  user_id uuid not null references auth.users(id),
  role text not null, -- 'admin', 'dispatcher', 'driver', 'viewer'
  joined_at timestamptz default now(),
  unique(org_id, user_id)
);

-- Index on org_id for RLS performance
create index idx_org_members_org_id on org_members(org_id);

alter table org_members enable row level security;
