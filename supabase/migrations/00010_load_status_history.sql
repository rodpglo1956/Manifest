-- Load status history table
-- Logs every status transition with timestamp, user, location, notes
-- Used for audit trail and status timeline visualization

create table load_status_history (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references loads(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references auth.users(id),
  location_lat numeric,
  location_lng numeric,
  notes text,
  created_at timestamptz default now()
);

alter table load_status_history enable row level security;

create index idx_load_status_history_load_id on load_status_history(load_id);

-- RLS: select for org members via subquery through loads table
create policy "load_status_history_org_select" on load_status_history
  for select using (
    exists (
      select 1 from loads
      where loads.id = load_status_history.load_id
        and loads.org_id = (select auth.org_id())
    )
  );

-- RLS: insert for org members (status changes come through triggers/app logic)
create policy "load_status_history_org_insert" on load_status_history
  for insert with check (
    exists (
      select 1 from loads
      where loads.id = load_status_history.load_id
        and loads.org_id = (select auth.org_id())
    )
  );
