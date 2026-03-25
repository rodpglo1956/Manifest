-- ============================================================
-- Migration 00029: Billing Cron Jobs
-- Phase 10: Usage Tracking & Trial Expiry
-- ============================================================

-- 1. Usage tracker function -- daily snapshot of org usage counts
-- Runs at midnight UTC, updates usage_records for each org's current billing period

CREATE OR REPLACE FUNCTION billing_usage_tracker() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acct RECORD;
  v_count INTEGER;
  d_count INTEGER;
  l_count INTEGER;
  u_count INTEGER;
  ai_count INTEGER;
BEGIN
  FOR acct IN
    SELECT org_id, current_period_start, current_period_end
    FROM billing_accounts
    WHERE status IN ('trialing', 'active', 'past_due')
      AND current_period_start IS NOT NULL
      AND current_period_end IS NOT NULL
  LOOP
    -- Count vehicles (not sold)
    SELECT COUNT(*) INTO v_count
    FROM vehicles
    WHERE org_id = acct.org_id AND status != 'sold';

    -- Count active drivers
    SELECT COUNT(*) INTO d_count
    FROM drivers
    WHERE org_id = acct.org_id AND status = 'active';

    -- Count org members (users)
    SELECT COUNT(*) INTO u_count
    FROM org_members
    WHERE org_id = acct.org_id;

    -- Count loads in current billing period
    SELECT COUNT(*) INTO l_count
    FROM loads
    WHERE org_id = acct.org_id
      AND created_at >= acct.current_period_start
      AND created_at < acct.current_period_end;

    -- Count AI queries in current billing period
    SELECT COUNT(*) INTO ai_count
    FROM marie_queries
    WHERE org_id = acct.org_id
      AND created_at >= acct.current_period_start
      AND created_at < acct.current_period_end;

    -- Upsert usage record for this org and period
    INSERT INTO usage_records (
      org_id, period_start, period_end,
      vehicles_count, drivers_count, loads_count, users_count, ai_queries_count,
      updated_at
    )
    VALUES (
      acct.org_id,
      acct.current_period_start::date,
      acct.current_period_end::date,
      v_count, d_count, l_count, u_count, ai_count,
      now()
    )
    ON CONFLICT (org_id, period_start) DO UPDATE SET
      vehicles_count = EXCLUDED.vehicles_count,
      drivers_count = EXCLUDED.drivers_count,
      loads_count = EXCLUDED.loads_count,
      users_count = EXCLUDED.users_count,
      ai_queries_count = EXCLUDED.ai_queries_count,
      period_end = EXCLUDED.period_end,
      updated_at = now();
  END LOOP;
END;
$$;

-- Schedule usage tracker: daily at midnight UTC
SELECT cron.schedule('billing-usage-tracker', '0 0 * * *', 'SELECT billing_usage_tracker()');


-- 2. Trial expiry function -- downgrades expired trials to free plan
-- Runs at 8 AM UTC daily

CREATE OR REPLACE FUNCTION billing_trial_expiry() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE billing_accounts
  SET
    plan = 'free',
    status = 'active',
    trial_ends_at = NULL,
    updated_at = now()
  WHERE status = 'trialing'
    AND trial_ends_at <= now();
END;
$$;

-- Schedule trial expiry: daily at 8 AM UTC
SELECT cron.schedule('billing-trial-expiry', '0 8 * * *', 'SELECT billing_trial_expiry()');
