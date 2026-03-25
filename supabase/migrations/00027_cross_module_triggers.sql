-- Phase 9 Plan 05: Cross-module integration triggers
-- 1. DOT inspection -> compliance auto-complete (XMOD-02)
-- 2. CDL expiry cross-module flagging (XMOD-03)
-- 3. Fuel -> IFTA data flow documentation (XMOD-04)
-- 4. Marie CRM/compliance check RPC functions (XMOD-05)

-- ============================================================
-- 1. DOT Inspection -> Compliance Auto-Complete (XMOD-02)
-- ============================================================
-- When an annual_dot inspection is inserted with pass/conditional result,
-- auto-complete the matching compliance_item and schedule next annual.

create or replace function on_inspection_completed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _existing_item record;
  _profile_id uuid;
begin
  -- Only process annual_dot inspections that passed or were conditional
  if NEW.inspection_type != 'annual_dot' then
    return NEW;
  end if;
  if NEW.result not in ('pass', 'conditional') then
    return NEW;
  end if;

  -- Find existing compliance item for this vehicle's annual inspection
  select ci.id, ci.compliance_profile_id, ci.org_id
  into _existing_item
  from public.compliance_items ci
  where ci.vehicle_id = NEW.vehicle_id
    and ci.category = 'annual_inspection'
    and ci.status in ('upcoming', 'due_soon', 'overdue')
  order by ci.due_date desc
  limit 1;

  if _existing_item.id is not null then
    -- Mark existing item as completed
    update public.compliance_items
    set status = 'completed',
        completed_date = NEW.inspection_date,
        updated_at = now()
    where id = _existing_item.id;

    _profile_id := _existing_item.compliance_profile_id;
  else
    -- No existing item; look up compliance profile by org
    select cp.id into _profile_id
    from public.compliance_profiles cp
    where cp.org_id = NEW.org_id
    limit 1;
  end if;

  -- Schedule next annual inspection (1 year from this inspection)
  if _profile_id is not null then
    insert into public.compliance_items (
      org_id,
      compliance_profile_id,
      category,
      title,
      due_date,
      status,
      vehicle_id,
      recurrence_rule
    ) values (
      NEW.org_id,
      _profile_id,
      'annual_inspection',
      'Annual DOT Inspection',
      NEW.inspection_date + interval '1 year',
      'upcoming',
      NEW.vehicle_id,
      'annual'
    );
  end if;

  return NEW;
end;
$$;

-- Trigger: fire after inserting an annual_dot inspection
create trigger inspection_completed_compliance
  after insert on public.inspections
  for each row
  when (NEW.inspection_type = 'annual_dot')
  execute function on_inspection_completed();


-- ============================================================
-- 2. CDL Expiry Cross-Module Flagging (XMOD-03)
-- ============================================================
-- Daily cron function that checks for expiring/expired CDLs,
-- creates proactive alerts, and flags drivers with active dispatches.

create or replace function check_cdl_expiry()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  _rec record;
  _days_remaining integer;
  _severity text;
  _driver_name text;
  _active_loads text;
begin
  -- Find drivers with CDLs expiring within 30 days or expired within 1 day
  for _rec in
    select
      dq.id,
      dq.org_id,
      dq.driver_id,
      dq.cdl_expiry,
      dq.cdl_number,
      d.first_name,
      d.last_name
    from public.driver_qualifications dq
    join public.drivers d on d.id = dq.driver_id
    where dq.cdl_expiry is not null
      and dq.cdl_expiry <= current_date + interval '30 days'
      and dq.cdl_expiry > current_date - interval '1 day'
  loop
    _days_remaining := _rec.cdl_expiry - current_date;
    _driver_name := _rec.first_name || ' ' || _rec.last_name;

    -- Determine severity based on days remaining
    if _days_remaining <= 0 then
      _severity := 'critical';
    elsif _days_remaining <= 7 then
      _severity := 'high';
    elsif _days_remaining <= 14 then
      _severity := 'medium';
    else
      _severity := 'low';
    end if;

    -- Insert CDL expiry alert (de-duplicate: same driver, same type, within 24 hours)
    insert into public.proactive_alerts (
      org_id,
      alert_type,
      severity,
      title,
      message,
      related_entity_type,
      related_entity_id
    )
    select
      _rec.org_id,
      'compliance_due_soon',
      _severity,
      'CDL Expiring - ' || _driver_name,
      case
        when _days_remaining <= 0 then
          _driver_name || '''s CDL (# ' || coalesce(_rec.cdl_number, 'N/A') || ') has expired!'
        else
          _driver_name || '''s CDL (# ' || coalesce(_rec.cdl_number, 'N/A') || ') expires in ' || _days_remaining || ' days (' || _rec.cdl_expiry || ')'
      end,
      'driver',
      _rec.driver_id
    where not exists (
      select 1 from public.proactive_alerts pa
      where pa.alert_type = 'compliance_due_soon'
        and pa.related_entity_id = _rec.driver_id
        and pa.related_entity_type = 'driver'
        and pa.created_at > now() - interval '24 hours'
    );

    -- Check for active dispatches for this driver
    select string_agg(l.reference_number, ', ')
    into _active_loads
    from public.dispatch_members dm
    join public.dispatches disp on disp.id = dm.dispatch_id
    join public.loads l on l.id = disp.load_id
    where dm.driver_id = _rec.driver_id
      and disp.status not in ('completed', 'rejected');

    -- If active dispatches exist, create additional critical alert
    if _active_loads is not null and _active_loads != '' then
      insert into public.proactive_alerts (
        org_id,
        alert_type,
        severity,
        title,
        message,
        related_entity_type,
        related_entity_id
      )
      select
        _rec.org_id,
        'compliance_due_soon',
        'critical',
        'CDL Expiring - Active Loads - ' || _driver_name,
        _driver_name || '''s CDL expires ' ||
        case when _days_remaining <= 0 then 'EXPIRED' else 'in ' || _days_remaining || ' days' end ||
        '. Active loads: ' || _active_loads,
        'driver',
        _rec.driver_id
      where not exists (
        select 1 from public.proactive_alerts pa
        where pa.alert_type = 'compliance_due_soon'
          and pa.related_entity_id = _rec.driver_id
          and pa.related_entity_type = 'driver'
          and pa.title like 'CDL Expiring - Active Loads%'
          and pa.created_at > now() - interval '24 hours'
      );
    end if;
  end loop;
end;
$$;

-- Schedule CDL expiry check daily at 7 AM UTC
select cron.schedule(
  'cdl-expiry-checker',
  '0 7 * * *',
  'SELECT check_cdl_expiry()'
);


-- ============================================================
-- 3. Fuel -> IFTA Data Flow (XMOD-04)
-- ============================================================
-- The fuel_transactions -> IFTA data flow is already established:
-- - fuel_transactions table stores per-transaction fuel data (Phase 8)
-- - IFTA entry flow in the compliance module aggregates fuel_transactions
--   by jurisdiction and quarter for IFTA reporting (Phase 7)
-- - calculateIFTA() in src/lib/compliance/calculations.ts uses
--   fleet MPG formula: totalMiles/totalGallons per jurisdiction
-- No additional trigger needed. This comment documents the cross-module
-- data flow for reference.


-- ============================================================
-- 4. Marie CRM/Compliance Check RPC Functions (XMOD-05)
-- ============================================================
-- These functions are callable via supabase.rpc() from Marie's tool system.

-- 4a. Company payment history lookup for Marie
create or replace function get_company_payment_history(
  p_org_id uuid,
  p_company_name text
)
returns table (
  company_name text,
  days_to_pay integer,
  credit_score text,
  total_revenue numeric,
  total_loads integer,
  payment_terms text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select
    c.name::text as company_name,
    c.days_to_pay::integer,
    c.credit_score::text,
    c.total_revenue::numeric,
    c.total_loads::integer,
    c.payment_terms::text
  from public.crm_companies c
  where c.org_id = p_org_id
    and c.name ilike '%' || p_company_name || '%'
  order by c.total_revenue desc
  limit 10;
end;
$$;

-- 4b. Driver compliance status lookup for Marie
create or replace function get_driver_compliance_status(
  p_org_id uuid,
  p_driver_id uuid
)
returns table (
  driver_name text,
  cdl_expiry date,
  medical_card_expiry date,
  dq_file_complete boolean,
  overdue_items integer,
  active_alerts integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select
    (d.first_name || ' ' || d.last_name)::text as driver_name,
    dq.cdl_expiry,
    dq.medical_card_expiry,
    coalesce(dq.dq_file_complete, false) as dq_file_complete,
    (
      select count(*)::integer
      from public.compliance_items ci
      where ci.org_id = p_org_id
        and ci.driver_id = p_driver_id
        and ci.status = 'overdue'
    ) as overdue_items,
    (
      select count(*)::integer
      from public.proactive_alerts pa
      where pa.org_id = p_org_id
        and pa.related_entity_id = p_driver_id
        and pa.related_entity_type = 'driver'
        and pa.resolved_at is null
    ) as active_alerts
  from public.drivers d
  left join public.driver_qualifications dq on dq.driver_id = d.id
  where d.id = p_driver_id
    and d.org_id = p_org_id
  limit 1;
end;
$$;
