-- Marie AI query logging and proactive alerts tables
-- Phase 5: Marie AI & Smart Routing

-- Marie queries table - logs all AI interactions
create table marie_queries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  query_text text not null,
  response_text text,
  query_type text default 'question',
  tokens_used integer default 0,
  latency_ms integer default 0,
  model text default 'claude-sonnet-4-20250514',
  success boolean default true,
  error_message text,
  created_at timestamptz default now()
);

-- Proactive alerts table - placeholder for Phase 6
create table proactive_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  alert_type text not null,
  severity text not null default 'info',
  title text not null,
  message text not null,
  related_entity_type text,
  related_entity_id uuid,
  acknowledged boolean default false,
  acknowledged_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Indexes
create index idx_marie_queries_org_created on marie_queries(org_id, created_at desc);
create index idx_proactive_alerts_org_ack on proactive_alerts(org_id, acknowledged);

-- RLS policies
alter table marie_queries enable row level security;
alter table proactive_alerts enable row level security;

create policy "Users can view own org marie queries"
  on marie_queries for select
  using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can insert own org marie queries"
  on marie_queries for insert
  with check (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can view own org proactive alerts"
  on proactive_alerts for select
  using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can update own org proactive alerts"
  on proactive_alerts for update
  using (org_id = (select org_id from profiles where id = auth.uid()));
