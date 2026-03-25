-- Phase 7: Compliance scanner pg_cron function
-- Runs daily at 6 AM to update compliance item statuses, generate alerts,
-- and auto-create next recurrence for completed recurring items.
-- Follows pattern from 00019_alert_generators.sql

-- 1. check_compliance_items: scan items, update statuses, generate alerts
create or replace function check_compliance_items()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  _rec record;
  _days_until_due integer;
  _alert_type text;
  _severity text;
  _message text;
  _next_rec record;
  _next_due date;
begin
  -- Scan all active compliance items with due dates
  for _rec in
    select
      ci.id,
      ci.org_id,
      ci.title,
      ci.category,
      ci.due_date,
      ci.status,
      ci.alert_days_before,
      ci.vehicle_id,
      ci.driver_id,
      cp.is_dot_regulated
    from public.compliance_items ci
    join public.compliance_profiles cp on cp.id = ci.compliance_profile_id
    where ci.status not in ('completed', 'waived', 'not_applicable')
      and ci.due_date is not null
  loop
    _days_until_due := _rec.due_date - current_date;

    -- Update item status based on days until due
    if _days_until_due < 0 and _rec.status != 'overdue' then
      update public.compliance_items
        set status = 'overdue', updated_at = now()
        where id = _rec.id;
    elsif _days_until_due >= 0 and _days_until_due <= 30 and _rec.status not in ('due_soon', 'overdue') then
      update public.compliance_items
        set status = 'due_soon', updated_at = now()
        where id = _rec.id;
    end if;

    -- Generate alerts at threshold days (check against alert_days_before array)
    if _days_until_due = any(_rec.alert_days_before) or _days_until_due < 0 then
      -- Determine alert type and severity
      if _days_until_due < 0 then
        _alert_type := 'overdue';
        _severity := 'critical';
      elsif _days_until_due <= 7 then
        _alert_type := 'due_soon';
        _severity := 'warning';
      else
        _alert_type := 'approaching';
        _severity := 'info';
      end if;

      -- Build message
      if _days_until_due < 0 then
        _message := _rec.title || ' is ' || abs(_days_until_due) || ' days overdue.';
      elsif _days_until_due = 0 then
        _message := _rec.title || ' is due today.';
      else
        _message := _rec.title || ' is due in ' || _days_until_due || ' days.';
      end if;

      -- De-duplicate: no alert for same item + type in last 24 hours
      if not exists (
        select 1 from public.compliance_alerts ca
        where ca.compliance_item_id = _rec.id
          and ca.alert_type = _alert_type
          and ca.created_at > now() - interval '24 hours'
      ) then
        -- Insert into compliance_alerts
        insert into public.compliance_alerts (
          org_id, compliance_item_id, alert_type, days_until_due, message
        ) values (
          _rec.org_id,
          _rec.id,
          _alert_type,
          _days_until_due,
          _message
        );

        -- Also insert into proactive_alerts for Marie visibility
        insert into public.proactive_alerts (
          org_id, alert_type, severity, title, message,
          related_entity_type, related_entity_id
        ) values (
          _rec.org_id,
          'compliance_' || _alert_type,
          _severity,
          case
            when _alert_type = 'overdue' then 'Overdue: ' || _rec.title
            when _alert_type = 'due_soon' then 'Due Soon: ' || _rec.title
            else 'Upcoming: ' || _rec.title
          end,
          _message,
          'compliance_item',
          _rec.id
        );
      end if;
    end if;
  end loop;

  -- Auto-generate next occurrence for completed recurring items
  for _next_rec in
    select
      ci.id,
      ci.org_id,
      ci.compliance_profile_id,
      ci.category,
      ci.title,
      ci.description,
      ci.due_date,
      ci.completed_date,
      ci.assigned_to,
      ci.vehicle_id,
      ci.driver_id,
      ci.notes,
      ci.recurrence_rule,
      ci.recurrence_months,
      ci.alert_days_before
    from public.compliance_items ci
    where ci.status = 'completed'
      and ci.recurrence_rule is not null
      -- Avoid duplicates: no existing item with same category + vehicle/driver + due_date > completed item
      and not exists (
        select 1 from public.compliance_items ci2
        where ci2.compliance_profile_id = ci.compliance_profile_id
          and ci2.category = ci.category
          and coalesce(ci2.vehicle_id::text, '') = coalesce(ci.vehicle_id::text, '')
          and coalesce(ci2.driver_id::text, '') = coalesce(ci.driver_id::text, '')
          and ci2.due_date > coalesce(ci.due_date, ci.completed_date)
      )
  loop
    -- Calculate next due date using PostgreSQL interval arithmetic
    _next_due := case _next_rec.recurrence_rule
      when 'annual' then coalesce(_next_rec.due_date, _next_rec.completed_date) + interval '1 year'
      when 'biennial' then coalesce(_next_rec.due_date, _next_rec.completed_date) + interval '2 years'
      when 'quarterly' then coalesce(_next_rec.due_date, _next_rec.completed_date) + interval '3 months'
      when 'monthly' then coalesce(_next_rec.due_date, _next_rec.completed_date) + interval '1 month'
      when 'custom' then coalesce(_next_rec.due_date, _next_rec.completed_date) + (coalesce(_next_rec.recurrence_months, 1) || ' months')::interval
      else coalesce(_next_rec.due_date, _next_rec.completed_date) + interval '1 year'
    end;

    insert into public.compliance_items (
      org_id, compliance_profile_id, category, title, description,
      due_date, status, assigned_to, vehicle_id, driver_id, notes,
      recurrence_rule, recurrence_months, alert_days_before
    ) values (
      _next_rec.org_id,
      _next_rec.compliance_profile_id,
      _next_rec.category,
      _next_rec.title,
      _next_rec.description,
      _next_due,
      'upcoming',
      _next_rec.assigned_to,
      _next_rec.vehicle_id,
      _next_rec.driver_id,
      _next_rec.notes,
      _next_rec.recurrence_rule,
      _next_rec.recurrence_months,
      _next_rec.alert_days_before
    );
  end loop;
end;
$$;

-- Schedule: daily at 6 AM
select cron.schedule(
  'check-compliance-items',
  '0 6 * * *',
  $$SELECT check_compliance_items();$$
);
