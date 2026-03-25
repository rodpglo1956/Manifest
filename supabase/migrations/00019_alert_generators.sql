-- Alert generator SQL functions for proactive alerts
-- Phase 6: 5 pg_cron alert generators + dispatch conflict handled in app code
-- All functions are SECURITY DEFINER with de-duplication via NOT EXISTS

-- 1. Late pickup risk: driver far from pickup with < 3 hours until window
-- Uses state adjacency as proximity heuristic (same state = ok, adjacent = warning, non-adjacent = critical)
create or replace function check_late_pickup()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  _rec record;
  _severity text;
begin
  for _rec in
    select
      l.id as load_id,
      l.org_id,
      l.load_number,
      l.pickup_city,
      l.pickup_state,
      l.pickup_date,
      d.id as driver_id,
      dr.first_name || ' ' || dr.last_name as driver_name,
      dr.license_state as driver_state
    from public.loads l
    join public.dispatches d on d.load_id = l.id
    join public.drivers dr on dr.id = d.driver_id
    where l.status in ('dispatched', 'in_transit')
      and d.status in ('assigned', 'accepted', 'en_route_pickup')
      and l.pickup_date is not null
      and l.pickup_date::timestamp - now() < interval '3 hours'
      and l.pickup_date::timestamp > now()
      -- De-duplicate: no alert for same load + type in last 30 min
      and not exists (
        select 1 from public.proactive_alerts pa
        where pa.related_entity_id = l.id
          and pa.alert_type = 'late_pickup'
          and pa.created_at > now() - interval '30 minutes'
      )
  loop
    -- Severity based on state proximity heuristic
    if _rec.driver_state = _rec.pickup_state then
      _severity := 'warning';
    else
      _severity := 'critical';
    end if;

    insert into public.proactive_alerts (
      org_id, alert_type, severity, title, message,
      related_entity_type, related_entity_id
    ) values (
      _rec.org_id,
      'late_pickup',
      _severity,
      'Late Pickup Risk: ' || coalesce(_rec.load_number, _rec.load_id::text),
      'Driver ' || _rec.driver_name || ' may not reach pickup in ' ||
        coalesce(_rec.pickup_city, '') || ', ' || coalesce(_rec.pickup_state, '') ||
        ' before scheduled time.',
      'load',
      _rec.load_id
    );
  end loop;
end;
$$;

-- Schedule: every 30 minutes
select cron.schedule(
  'check-late-pickup',
  '*/30 * * * *',
  $$SELECT check_late_pickup();$$
);

-- 2. Driver gone silent: no status update in > 4 hours while active
create or replace function check_driver_silent()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  _rec record;
  _severity text;
  _last_update timestamptz;
  _hours_silent numeric;
begin
  for _rec in
    select
      l.id as load_id,
      l.org_id,
      l.load_number,
      d.driver_id,
      dr.first_name || ' ' || dr.last_name as driver_name
    from public.loads l
    join public.dispatches d on d.load_id = l.id
    join public.drivers dr on dr.id = d.driver_id
    where l.status in ('in_transit', 'at_pickup', 'loaded', 'at_delivery')
      and d.status not in ('completed', 'rejected')
  loop
    -- Get last status update time
    select max(created_at) into _last_update
    from public.load_status_history
    where load_id = _rec.load_id;

    -- Skip if recent update
    if _last_update is null or _last_update > now() - interval '4 hours' then
      continue;
    end if;

    _hours_silent := extract(epoch from (now() - _last_update)) / 3600;

    -- Severity: warning at 4h, critical at 8h
    if _hours_silent >= 8 then
      _severity := 'critical';
    else
      _severity := 'warning';
    end if;

    -- De-duplicate: 1 hour window
    if not exists (
      select 1 from public.proactive_alerts pa
      where pa.related_entity_id = _rec.load_id
        and pa.alert_type = 'driver_silent'
        and pa.created_at > now() - interval '1 hour'
    ) then
      insert into public.proactive_alerts (
        org_id, alert_type, severity, title, message,
        related_entity_type, related_entity_id
      ) values (
        _rec.org_id,
        'driver_silent',
        _severity,
        'Driver Silent: ' || _rec.driver_name,
        'No status update from ' || _rec.driver_name || ' for ' ||
          round(_hours_silent) || ' hours on load ' ||
          coalesce(_rec.load_number, _rec.load_id::text) || '.',
        'load',
        _rec.load_id
      );
    end if;
  end loop;
end;
$$;

-- Schedule: every hour
select cron.schedule(
  'check-driver-silent',
  '0 * * * *',
  $$SELECT check_driver_silent();$$
);

-- 3. Overdue invoices alerts: supplements existing Phase 4 overdue scanner
-- Writes proactive_alerts for overdue invoices (the existing scanner transitions status)
create or replace function check_overdue_invoices_alerts()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  _rec record;
  _severity text;
  _days_overdue integer;
begin
  for _rec in
    select
      i.id as invoice_id,
      i.org_id,
      i.invoice_number,
      i.due_date,
      i.total
    from public.invoices i
    where i.status in ('sent', 'overdue')
      and i.due_date < current_date
      -- De-duplicate: daily
      and not exists (
        select 1 from public.proactive_alerts pa
        where pa.related_entity_id = i.id
          and pa.alert_type = 'overdue_invoice'
          and pa.created_at > now() - interval '24 hours'
      )
  loop
    _days_overdue := current_date - _rec.due_date;

    -- Severity: warning 1-7 days, critical 7+
    if _days_overdue > 7 then
      _severity := 'critical';
    else
      _severity := 'warning';
    end if;

    insert into public.proactive_alerts (
      org_id, alert_type, severity, title, message,
      related_entity_type, related_entity_id
    ) values (
      _rec.org_id,
      'overdue_invoice',
      _severity,
      'Overdue Invoice: ' || _rec.invoice_number,
      'Invoice ' || _rec.invoice_number || ' ($' || _rec.total || ') is ' ||
        _days_overdue || ' days past due.',
      'invoice',
      _rec.invoice_id
    );
  end loop;
end;
$$;

-- Schedule: daily at 8:05 AM (5 min after existing overdue scanner)
select cron.schedule(
  'check-overdue-invoices-alerts',
  '5 8 * * *',
  $$SELECT check_overdue_invoices_alerts();$$
);

-- 4. ETA risk: estimated delivery exceeds window based on distance/speed
create or replace function check_eta_risk()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  _rec record;
  _estimated_hours numeric;
  _remaining_hours numeric;
begin
  for _rec in
    select
      l.id as load_id,
      l.org_id,
      l.load_number,
      l.miles,
      l.delivery_date,
      l.delivery_city,
      l.delivery_state,
      d.driver_id,
      dr.first_name || ' ' || dr.last_name as driver_name
    from public.loads l
    join public.dispatches d on d.load_id = l.id
    join public.drivers dr on dr.id = d.driver_id
    where l.status = 'in_transit'
      and d.status not in ('completed', 'rejected')
      and l.miles is not null
      and l.delivery_date is not null
      -- De-duplicate: 1 hour
      and not exists (
        select 1 from public.proactive_alerts pa
        where pa.related_entity_id = l.id
          and pa.alert_type = 'eta_risk'
          and pa.created_at > now() - interval '1 hour'
      )
  loop
    -- Estimate: average 50 mph
    _estimated_hours := _rec.miles / 50.0;
    _remaining_hours := extract(epoch from (_rec.delivery_date::timestamp - now())) / 3600;

    -- Only alert if estimated exceeds remaining time
    if _estimated_hours > _remaining_hours and _remaining_hours > 0 then
      insert into public.proactive_alerts (
        org_id, alert_type, severity, title, message,
        related_entity_type, related_entity_id
      ) values (
        _rec.org_id,
        'eta_risk',
        'warning',
        'ETA Risk: ' || coalesce(_rec.load_number, _rec.load_id::text),
        'Load ' || coalesce(_rec.load_number, _rec.load_id::text) ||
          ' (' || _rec.miles || ' mi) may not reach ' ||
          coalesce(_rec.delivery_city, '') || ', ' || coalesce(_rec.delivery_state, '') ||
          ' by scheduled delivery. Est. ' || round(_estimated_hours, 1) ||
          'h needed, ' || round(_remaining_hours, 1) || 'h remaining.',
        'load',
        _rec.load_id
      );
    end if;
  end loop;
end;
$$;

-- Schedule: every hour
select cron.schedule(
  'check-eta-risk',
  '30 * * * *',
  $$SELECT check_eta_risk();$$
);

-- 5. Unassigned loads: booked loads with pickup < 24h and no active dispatch
create or replace function check_unassigned_loads()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  _rec record;
  _severity text;
  _hours_until_pickup numeric;
begin
  for _rec in
    select
      l.id as load_id,
      l.org_id,
      l.load_number,
      l.pickup_date,
      l.pickup_city,
      l.pickup_state
    from public.loads l
    where l.status = 'booked'
      and l.pickup_date is not null
      and l.pickup_date::timestamp < now() + interval '24 hours'
      and l.pickup_date::timestamp > now()
      -- No active dispatch
      and not exists (
        select 1 from public.dispatches d
        where d.load_id = l.id
          and d.status not in ('completed', 'rejected')
      )
      -- De-duplicate: 2 hours
      and not exists (
        select 1 from public.proactive_alerts pa
        where pa.related_entity_id = l.id
          and pa.alert_type = 'unassigned_load'
          and pa.created_at > now() - interval '2 hours'
      )
  loop
    _hours_until_pickup := extract(epoch from (_rec.pickup_date::timestamp - now())) / 3600;

    -- Severity: critical at < 12h, warning at < 24h
    if _hours_until_pickup < 12 then
      _severity := 'critical';
    else
      _severity := 'warning';
    end if;

    insert into public.proactive_alerts (
      org_id, alert_type, severity, title, message,
      related_entity_type, related_entity_id
    ) values (
      _rec.org_id,
      'unassigned_load',
      _severity,
      'Unassigned Load: ' || coalesce(_rec.load_number, _rec.load_id::text),
      'Load ' || coalesce(_rec.load_number, _rec.load_id::text) ||
        ' picking up in ' || coalesce(_rec.pickup_city, '') ||
        ', ' || coalesce(_rec.pickup_state, '') ||
        ' in ' || round(_hours_until_pickup, 1) ||
        ' hours has no driver assigned.',
      'load',
      _rec.load_id
    );
  end loop;
end;
$$;

-- Schedule: every 2 hours
select cron.schedule(
  'check-unassigned-loads',
  '0 */2 * * *',
  $$SELECT check_unassigned_loads();$$
);
