-- Phase 8: Maintenance monitor pg_cron function
-- Runs daily at 5 AM to check maintenance schedules against actual records,
-- creates compliance_items and proactive_alerts when service is due/overdue.
-- Follows pattern from 00022_compliance_scanner.sql

create or replace function check_maintenance_due()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  _vehicle record;
  _schedule record;
  _last_service record;
  _next_due_date date;
  _next_due_odometer integer;
  _is_date_due boolean;
  _is_odometer_due boolean;
  _is_date_overdue boolean;
  _is_odometer_overdue boolean;
  _status text;
  _severity text;
  _title text;
  _message text;
begin
  -- For each active vehicle
  for _vehicle in
    select v.id, v.org_id, v.unit_number, v.vehicle_class, v.current_odometer
    from public.vehicles v
    where v.status = 'active'
  loop
    -- Check all matching schedules (vehicle-specific + class-matching where vehicle_id IS NULL)
    for _schedule in
      select ms.*
      from public.maintenance_schedules ms
      where ms.active = true
        and ms.org_id = _vehicle.org_id
        and (
          ms.vehicle_id = _vehicle.id
          or (ms.vehicle_id is null and ms.vehicle_class = _vehicle.vehicle_class)
        )
    loop
      -- Find most recent maintenance record of this type for this vehicle
      select mr.date_in, mr.odometer_at_service
      into _last_service
      from public.maintenance_records mr
      where mr.vehicle_id = _vehicle.id
        and mr.maintenance_type = _schedule.maintenance_type
      order by mr.date_in desc
      limit 1;

      _is_date_due := false;
      _is_odometer_due := false;
      _is_date_overdue := false;
      _is_odometer_overdue := false;

      -- Calculate date-based next due
      if _schedule.interval_days is not null and _last_service.date_in is not null then
        _next_due_date := (_last_service.date_in::date + (_schedule.interval_days || ' days')::interval)::date;

        if _next_due_date < current_date then
          _is_date_overdue := true;
        elsif _next_due_date <= current_date + interval '30 days' then
          _is_date_due := true;
        end if;
      elsif _schedule.interval_days is not null and _last_service.date_in is null then
        -- No prior service record: treat as overdue (never serviced)
        _is_date_overdue := true;
      end if;

      -- Calculate odometer-based next due
      if _schedule.interval_miles is not null
        and _last_service.odometer_at_service is not null
        and _vehicle.current_odometer is not null
      then
        _next_due_odometer := _last_service.odometer_at_service + _schedule.interval_miles;

        if _vehicle.current_odometer >= _next_due_odometer then
          _is_odometer_overdue := true;
        elsif _next_due_odometer - _vehicle.current_odometer <= 3000 then
          _is_odometer_due := true;
        end if;
      end if;

      -- Determine status
      if _is_date_overdue or _is_odometer_overdue then
        _status := 'overdue';
        _severity := case _schedule.priority
          when 'critical' then 'critical'
          when 'high' then 'critical'
          when 'normal' then 'warning'
          else 'info'
        end;
      elsif _is_date_due or _is_odometer_due then
        _status := 'due_soon';
        _severity := case _schedule.priority
          when 'critical' then 'warning'
          when 'high' then 'warning'
          else 'info'
        end;
      else
        -- Not due yet, skip
        continue;
      end if;

      _title := _schedule.maintenance_type || ' due for ' || _vehicle.unit_number;
      _message := _schedule.maintenance_type || ' is ' || _status || ' for vehicle ' || _vehicle.unit_number;

      if _next_due_date is not null then
        _message := _message || ' (due date: ' || _next_due_date::text || ')';
      end if;

      -- Insert into compliance_items with NOT EXISTS de-duplication
      if not exists (
        select 1 from public.compliance_items ci
        where ci.vehicle_id = _vehicle.id
          and ci.category = 'scheduled_service'
          and ci.title = _title
          and ci.status not in ('completed', 'waived', 'not_applicable')
      ) then
        insert into public.compliance_items (
          org_id, compliance_profile_id, category, title, description,
          due_date, status, vehicle_id, alert_days_before
        )
        select
          _vehicle.org_id,
          cp.id,
          'scheduled_service',
          _title,
          _message,
          _next_due_date,
          _status,
          _vehicle.id,
          array[30, 14, 7, 1]
        from public.compliance_profiles cp
        where cp.org_id = _vehicle.org_id
        limit 1;
      end if;

      -- Insert into proactive_alerts with NOT EXISTS 24h de-duplication
      if not exists (
        select 1 from public.proactive_alerts pa
        where pa.related_entity_type = 'vehicle'
          and pa.related_entity_id = _vehicle.id
          and pa.alert_type = 'maintenance_due'
          and pa.title = _title
          and pa.created_at > now() - interval '24 hours'
      ) then
        insert into public.proactive_alerts (
          org_id, alert_type, severity, title, message,
          related_entity_type, related_entity_id
        ) values (
          _vehicle.org_id,
          'maintenance_due',
          _severity,
          case _status
            when 'overdue' then 'Overdue: ' || _title
            else 'Due Soon: ' || _title
          end,
          _message,
          'vehicle',
          _vehicle.id
        );
      end if;

    end loop;
  end loop;
end;
$$;

-- Schedule: daily at 5 AM
select cron.schedule(
  'maintenance-monitor',
  '0 5 * * *',
  $$SELECT check_maintenance_due();$$
);
