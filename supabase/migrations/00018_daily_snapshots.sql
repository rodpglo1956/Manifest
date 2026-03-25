-- Daily snapshots table for analytics
-- Phase 6: Alerts, Analytics & Enhanced Dispatch per PRD-02 Section 5.2

create table daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  snapshot_date date not null,
  loads_booked integer not null default 0,
  loads_delivered integer not null default 0,
  loads_canceled integer not null default 0,
  revenue numeric(12,2) not null default 0,
  total_miles numeric(10,1) not null default 0,
  revenue_per_mile numeric(8,2) not null default 0,
  on_time_deliveries integer not null default 0,
  total_deliveries integer not null default 0,
  on_time_percentage numeric(5,2) not null default 0,
  active_drivers integer not null default 0,
  invoices_generated integer not null default 0,
  invoices_paid numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(org_id, snapshot_date)
);

alter table daily_snapshots enable row level security;

create policy "org_daily_snapshots_select" on daily_snapshots
  for select using (org_id = (select org_id from profiles where id = auth.uid()));

create index idx_daily_snapshots_org_date on daily_snapshots(org_id, snapshot_date desc);

-- Generate daily snapshot for all orgs (previous day aggregation)
-- Runs via pg_cron at 1 AM UTC daily
create or replace function generate_daily_snapshot()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  _org record;
  _snapshot_date date := (current_date - interval '1 day')::date;
  _loads_booked integer;
  _loads_delivered integer;
  _loads_canceled integer;
  _revenue numeric;
  _total_miles numeric;
  _on_time integer;
  _total_del integer;
  _active_drivers integer;
  _inv_generated integer;
  _inv_paid numeric;
begin
  for _org in select id from public.organizations
  loop
    -- Loads booked on snapshot_date
    select count(*) into _loads_booked
    from public.loads
    where org_id = _org.id
      and created_at::date = _snapshot_date;

    -- Loads delivered on snapshot_date
    select count(*) into _loads_delivered
    from public.loads
    where org_id = _org.id
      and status in ('delivered', 'invoiced', 'paid')
      and exists (
        select 1 from public.load_status_history lsh
        where lsh.load_id = public.loads.id
          and lsh.new_status = 'delivered'
          and lsh.created_at::date = _snapshot_date
      );

    -- Loads canceled on snapshot_date
    select count(*) into _loads_canceled
    from public.loads
    where org_id = _org.id
      and status = 'canceled'
      and exists (
        select 1 from public.load_status_history lsh
        where lsh.load_id = public.loads.id
          and lsh.new_status = 'canceled'
          and lsh.created_at::date = _snapshot_date
      );

    -- Revenue from loads delivered on snapshot_date
    select coalesce(sum(total_charges), 0) into _revenue
    from public.loads
    where org_id = _org.id
      and exists (
        select 1 from public.load_status_history lsh
        where lsh.load_id = public.loads.id
          and lsh.new_status = 'delivered'
          and lsh.created_at::date = _snapshot_date
      );

    -- Total miles from delivered loads
    select coalesce(sum(miles), 0) into _total_miles
    from public.loads
    where org_id = _org.id
      and exists (
        select 1 from public.load_status_history lsh
        where lsh.load_id = public.loads.id
          and lsh.new_status = 'delivered'
          and lsh.created_at::date = _snapshot_date
      );

    -- On-time deliveries: delivered on or before delivery_date
    select count(*) into _on_time
    from public.loads l
    where l.org_id = _org.id
      and exists (
        select 1 from public.load_status_history lsh
        where lsh.load_id = l.id
          and lsh.new_status = 'delivered'
          and lsh.created_at::date = _snapshot_date
          and lsh.created_at::date <= l.delivery_date::date
      );

    -- Total deliveries on snapshot_date
    _total_del := _loads_delivered;

    -- Active drivers
    select count(*) into _active_drivers
    from public.drivers
    where org_id = _org.id
      and status = 'active';

    -- Invoices generated on snapshot_date
    select count(*) into _inv_generated
    from public.invoices
    where org_id = _org.id
      and created_at::date = _snapshot_date;

    -- Invoices paid on snapshot_date
    select coalesce(sum(paid_amount), 0) into _inv_paid
    from public.invoices
    where org_id = _org.id
      and paid_date = _snapshot_date;

    -- Upsert snapshot
    insert into public.daily_snapshots (
      org_id, snapshot_date,
      loads_booked, loads_delivered, loads_canceled,
      revenue, total_miles, revenue_per_mile,
      on_time_deliveries, total_deliveries, on_time_percentage,
      active_drivers, invoices_generated, invoices_paid
    ) values (
      _org.id, _snapshot_date,
      _loads_booked, _loads_delivered, _loads_canceled,
      _revenue, _total_miles,
      case when _total_miles > 0 then round(_revenue / _total_miles, 2) else 0 end,
      _on_time, _total_del,
      case when _total_del > 0 then round((_on_time::numeric / _total_del) * 100, 2) else 0 end,
      _active_drivers, _inv_generated, _inv_paid
    )
    on conflict (org_id, snapshot_date)
    do update set
      loads_booked = excluded.loads_booked,
      loads_delivered = excluded.loads_delivered,
      loads_canceled = excluded.loads_canceled,
      revenue = excluded.revenue,
      total_miles = excluded.total_miles,
      revenue_per_mile = excluded.revenue_per_mile,
      on_time_deliveries = excluded.on_time_deliveries,
      total_deliveries = excluded.total_deliveries,
      on_time_percentage = excluded.on_time_percentage,
      active_drivers = excluded.active_drivers,
      invoices_generated = excluded.invoices_generated,
      invoices_paid = excluded.invoices_paid;
  end loop;
end;
$$;

-- pg_cron: generate daily snapshots at 1 AM UTC
select cron.schedule(
  'daily-snapshot-generator',
  '0 1 * * *',
  $$SELECT generate_daily_snapshot();$$
);
