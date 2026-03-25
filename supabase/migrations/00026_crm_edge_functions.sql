-- ============================================================
-- Migration 00026: CRM Edge Functions (pg_cron + trigger)
-- Phase 09: CRM & Cross-Module Integration
-- ============================================================
-- 1. crm_stats_updater: nightly recalculation of company/lane aggregates
-- 2. follow_up_reminder: daily follow-up alerts via proactive_alerts
-- 3. on_load_delivered: trigger to update CRM stats on load delivery

-- ============================================================
-- 1. CRM Stats Updater (daily at 2 AM UTC)
-- ============================================================

CREATE OR REPLACE FUNCTION crm_stats_updater()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _company RECORD;
  _lane RECORD;
  _total_rev NUMERIC(14,2);
  _total_lds INTEGER;
  _total_miles NUMERIC;
  _avg_rpm NUMERIC(8,4);
  _last_date DATE;
  _lane_count INTEGER;
  _lane_total_charges NUMERIC;
  _lane_miles NUMERIC;
  _lane_last_rate NUMERIC(10,2);
  _lane_last_date DATE;
BEGIN
  -- Recalculate company aggregates
  FOR _company IN
    SELECT id, org_id, name FROM public.crm_companies
  LOOP
    SELECT
      COALESCE(SUM(l.total_charges), 0),
      COUNT(*),
      COALESCE(SUM(l.miles), 0),
      MAX(COALESCE(l.delivery_date::date, l.updated_at::date))
    INTO _total_rev, _total_lds, _total_miles, _last_date
    FROM public.loads l
    WHERE l.org_id = _company.org_id
      AND l.status IN ('delivered', 'invoiced', 'paid')
      AND (
        l.broker_name ILIKE _company.name
        OR l.pickup_company ILIKE _company.name
        OR l.delivery_company ILIKE _company.name
      );

    IF _total_miles > 0 THEN
      _avg_rpm := _total_rev / _total_miles;
    ELSE
      _avg_rpm := NULL;
    END IF;

    UPDATE public.crm_companies
    SET
      total_revenue = _total_rev,
      total_loads = _total_lds,
      avg_rate_per_mile = _avg_rpm,
      last_load_date = _last_date,
      updated_at = now()
    WHERE id = _company.id;
  END LOOP;

  -- Recalculate lane aggregates
  FOR _lane IN
    SELECT id, org_id, origin_city, origin_state, destination_city, destination_state
    FROM public.crm_lanes
  LOOP
    SELECT
      COUNT(*),
      COALESCE(SUM(l.total_charges), 0),
      COALESCE(SUM(l.miles), 0),
      MAX(COALESCE(l.delivery_date::date, l.updated_at::date))
    INTO _lane_count, _lane_total_charges, _lane_miles, _lane_last_date
    FROM public.loads l
    WHERE l.org_id = _lane.org_id
      AND l.status IN ('delivered', 'invoiced', 'paid')
      AND LOWER(l.pickup_city) = LOWER(_lane.origin_city)
      AND LOWER(l.pickup_state) = LOWER(_lane.origin_state)
      AND LOWER(l.delivery_city) = LOWER(_lane.destination_city)
      AND LOWER(l.delivery_state) = LOWER(_lane.destination_state);

    IF _lane_miles > 0 THEN
      _avg_rpm := _lane_total_charges / _lane_miles;
    ELSE
      _avg_rpm := NULL;
    END IF;

    -- Get last rate from most recent matching load
    SELECT l.total_charges INTO _lane_last_rate
    FROM public.loads l
    WHERE l.org_id = _lane.org_id
      AND l.status IN ('delivered', 'invoiced', 'paid')
      AND LOWER(l.pickup_city) = LOWER(_lane.origin_city)
      AND LOWER(l.pickup_state) = LOWER(_lane.origin_state)
      AND LOWER(l.delivery_city) = LOWER(_lane.destination_city)
      AND LOWER(l.delivery_state) = LOWER(_lane.destination_state)
    ORDER BY COALESCE(l.delivery_date::date, l.updated_at::date) DESC
    LIMIT 1;

    UPDATE public.crm_lanes
    SET
      total_runs = _lane_count,
      avg_rate_per_mile = _avg_rpm,
      last_run_date = _lane_last_date,
      last_rate = _lane_last_rate,
      updated_at = now()
    WHERE id = _lane.id;
  END LOOP;

  -- Expire rate agreements past expiry date
  UPDATE public.crm_rate_agreements
  SET status = 'expired'
  WHERE expiry_date < CURRENT_DATE
    AND status = 'active';

END;
$$;

-- Schedule: daily at 2 AM UTC
SELECT cron.schedule('crm-stats-updater', '0 2 * * *', 'SELECT crm_stats_updater()');


-- ============================================================
-- 2. Follow-Up Reminder (daily at 7 AM UTC)
-- ============================================================

CREATE OR REPLACE FUNCTION follow_up_reminder()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _activity RECORD;
  _company_name TEXT;
BEGIN
  FOR _activity IN
    SELECT
      a.id,
      a.org_id,
      a.subject,
      a.company_id,
      a.follow_up_date
    FROM public.crm_activities a
    WHERE a.follow_up_date <= CURRENT_DATE
      AND a.completed_at IS NULL
  LOOP
    -- Get company name if linked
    _company_name := NULL;
    IF _activity.company_id IS NOT NULL THEN
      SELECT name INTO _company_name
      FROM public.crm_companies
      WHERE id = _activity.company_id;
    END IF;

    -- De-duplicate: no alert for same activity in last 24 hours
    IF NOT EXISTS (
      SELECT 1 FROM public.proactive_alerts pa
      WHERE pa.related_entity_type = 'crm_activity'
        AND pa.related_entity_id = _activity.id::text
        AND pa.alert_type = 'follow_up_due'
        AND pa.created_at > now() - interval '24 hours'
    ) THEN
      INSERT INTO public.proactive_alerts (
        org_id, alert_type, severity, title, message,
        related_entity_type, related_entity_id
      ) VALUES (
        _activity.org_id,
        'follow_up_due',
        'info',
        'Follow-up reminder',
        'Follow-up due: ' || COALESCE(_activity.subject, 'Untitled')
          || CASE WHEN _company_name IS NOT NULL THEN ' (' || _company_name || ')' ELSE '' END,
        'crm_activity',
        _activity.id::text
      );
    END IF;
  END LOOP;
END;
$$;

-- Schedule: daily at 7 AM UTC
SELECT cron.schedule('follow-up-reminder', '0 7 * * *', 'SELECT follow_up_reminder()');


-- ============================================================
-- 3. Load Delivery CRM Trigger
-- ============================================================

CREATE OR REPLACE FUNCTION on_load_delivered()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _matched_company_id UUID;
  _matched_lane_id UUID;
BEGIN
  -- Only fire when status changes to 'delivered'
  IF NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered' THEN

    -- Match load to crm_companies by broker_name (case-insensitive)
    IF NEW.broker_name IS NOT NULL AND NEW.broker_name != '' THEN
      SELECT id INTO _matched_company_id
      FROM public.crm_companies
      WHERE org_id = NEW.org_id
        AND LOWER(name) = LOWER(NEW.broker_name)
      LIMIT 1;

      IF _matched_company_id IS NOT NULL THEN
        UPDATE public.crm_companies
        SET
          total_loads = total_loads + 1,
          total_revenue = total_revenue + COALESCE(NEW.total_charges, 0),
          last_load_date = CURRENT_DATE,
          updated_at = now()
        WHERE id = _matched_company_id;
      END IF;
    END IF;

    -- Match load to crm_lanes by pickup/delivery city+state
    IF NEW.pickup_city IS NOT NULL AND NEW.delivery_city IS NOT NULL THEN
      SELECT id INTO _matched_lane_id
      FROM public.crm_lanes
      WHERE org_id = NEW.org_id
        AND LOWER(origin_city) = LOWER(NEW.pickup_city)
        AND LOWER(origin_state) = LOWER(NEW.pickup_state)
        AND LOWER(destination_city) = LOWER(NEW.delivery_city)
        AND LOWER(destination_state) = LOWER(NEW.delivery_state)
      LIMIT 1;

      IF _matched_lane_id IS NOT NULL THEN
        UPDATE public.crm_lanes
        SET
          total_runs = total_runs + 1,
          last_run_date = CURRENT_DATE,
          last_rate = NEW.total_charges,
          updated_at = now()
        WHERE id = _matched_lane_id;
      END IF;
    END IF;

    -- Log system activity for CRM
    IF _matched_company_id IS NOT NULL THEN
      INSERT INTO public.crm_activities (
        org_id, activity_type, company_id, subject, body, user_id, completed_at
      ) VALUES (
        NEW.org_id,
        'system',
        _matched_company_id,
        'Load delivered',
        'Load ' || COALESCE(NEW.load_number, NEW.id::text) || ' delivered',
        NEW.created_by,
        now()
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER load_delivered_crm_trigger
  AFTER UPDATE ON public.loads
  FOR EACH ROW
  WHEN (NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered')
  EXECUTE FUNCTION on_load_delivered();
