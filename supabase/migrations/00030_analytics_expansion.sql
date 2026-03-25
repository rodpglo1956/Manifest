-- Analytics expansion: extended snapshot columns + driver_performance table + analytics-builder cron
-- Phase 11: Reporting & Notifications per PRD-04 Section 3.2

-- ============================================================
-- 1. Expand daily_snapshots with financial, fleet, compliance, CRM columns
-- ============================================================

-- Add period column for daily/weekly/monthly aggregation
ALTER TABLE daily_snapshots
  ADD COLUMN IF NOT EXISTS period text NOT NULL DEFAULT 'daily'
    CHECK (period IN ('daily', 'weekly', 'monthly'));

-- Financial metrics
ALTER TABLE daily_snapshots
  ADD COLUMN IF NOT EXISTS total_expenses numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_profit numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_per_mile numeric(8,4),
  ADD COLUMN IF NOT EXISTS profit_per_mile numeric(8,4);

-- Deadhead / efficiency
ALTER TABLE daily_snapshots
  ADD COLUMN IF NOT EXISTS deadhead_miles integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deadhead_percentage numeric(5,2);

-- Fleet utilization
ALTER TABLE daily_snapshots
  ADD COLUMN IF NOT EXISTS fleet_utilization_pct numeric(5,2),
  ADD COLUMN IF NOT EXISTS avg_mpg numeric(5,2),
  ADD COLUMN IF NOT EXISTS total_fuel_cost numeric(10,2),
  ADD COLUMN IF NOT EXISTS total_maintenance_cost numeric(10,2),
  ADD COLUMN IF NOT EXISTS vehicles_in_shop integer DEFAULT 0;

-- Compliance
ALTER TABLE daily_snapshots
  ADD COLUMN IF NOT EXISTS compliance_score integer,
  ADD COLUMN IF NOT EXISTS overdue_compliance_items integer DEFAULT 0;

-- CRM / customer metrics
ALTER TABLE daily_snapshots
  ADD COLUMN IF NOT EXISTS active_customers integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS new_customers integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_days_to_pay numeric(5,1);

-- Update unique constraint to include period
ALTER TABLE daily_snapshots DROP CONSTRAINT IF EXISTS daily_snapshots_org_id_snapshot_date_key;
ALTER TABLE daily_snapshots ADD CONSTRAINT daily_snapshots_org_period_unique UNIQUE(org_id, snapshot_date, period);

-- Update index to include period
DROP INDEX IF EXISTS idx_daily_snapshots_org_date;
CREATE INDEX idx_daily_snapshots_org_date_period ON daily_snapshots(org_id, snapshot_date DESC, period);

-- ============================================================
-- 2. Driver performance table
-- ============================================================

CREATE TABLE driver_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  loads_completed integer DEFAULT 0,
  miles_driven integer DEFAULT 0,
  revenue_generated numeric(12,2) DEFAULT 0,
  on_time_pct numeric(5,2),
  fuel_efficiency numeric(5,2),
  safety_incidents integer DEFAULT 0,
  compliance_score integer,
  customer_complaints integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, driver_id, period_start)
);

ALTER TABLE driver_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_driver_performance_select" ON driver_performance
  FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX idx_driver_performance_org ON driver_performance(org_id, period_start DESC);
CREATE INDEX idx_driver_performance_driver ON driver_performance(driver_id, period_start DESC);

-- ============================================================
-- 3. Analytics-builder cron function
-- ============================================================

CREATE OR REPLACE FUNCTION build_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _org record;
  _driver record;
  _snapshot_date date := (current_date - interval '1 day')::date;
  -- Basic load metrics
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
  -- Extended metrics
  _fuel_cost numeric;
  _maint_cost numeric;
  _total_expenses numeric;
  _net_profit numeric;
  _cost_per_mile numeric;
  _profit_per_mile numeric;
  _deadhead_miles integer;
  _deadhead_pct numeric;
  _fleet_util_pct numeric;
  _avg_mpg numeric;
  _vehicles_in_shop integer;
  _compliance_score integer;
  _overdue_items integer;
  _active_customers integer;
  _new_customers integer;
  _avg_days_to_pay numeric;
  _total_vehicles integer;
  _vehicles_with_loads integer;
  _total_gallons numeric;
  _total_fuel_miles numeric;
  -- Driver perf vars
  _d_loads integer;
  _d_miles integer;
  _d_revenue numeric;
  _d_on_time integer;
  _d_total_del integer;
  _d_fuel_eff numeric;
  _d_safety integer;
  _d_compliance integer;
  _d_complaints integer;
  _d_gallons numeric;
  _d_fuel_miles numeric;
BEGIN
  FOR _org IN SELECT id FROM public.organizations
  LOOP
    -- === Basic load metrics (same as generate_daily_snapshot) ===

    SELECT count(*) INTO _loads_booked
    FROM public.loads
    WHERE org_id = _org.id AND created_at::date = _snapshot_date;

    SELECT count(*) INTO _loads_delivered
    FROM public.loads
    WHERE org_id = _org.id
      AND status IN ('delivered', 'invoiced', 'paid')
      AND EXISTS (
        SELECT 1 FROM public.load_status_history lsh
        WHERE lsh.load_id = public.loads.id
          AND lsh.new_status = 'delivered'
          AND lsh.created_at::date = _snapshot_date
      );

    SELECT count(*) INTO _loads_canceled
    FROM public.loads
    WHERE org_id = _org.id
      AND status = 'canceled'
      AND EXISTS (
        SELECT 1 FROM public.load_status_history lsh
        WHERE lsh.load_id = public.loads.id
          AND lsh.new_status = 'canceled'
          AND lsh.created_at::date = _snapshot_date
      );

    SELECT coalesce(sum(total_charges), 0) INTO _revenue
    FROM public.loads
    WHERE org_id = _org.id
      AND EXISTS (
        SELECT 1 FROM public.load_status_history lsh
        WHERE lsh.load_id = public.loads.id
          AND lsh.new_status = 'delivered'
          AND lsh.created_at::date = _snapshot_date
      );

    SELECT coalesce(sum(miles), 0) INTO _total_miles
    FROM public.loads
    WHERE org_id = _org.id
      AND EXISTS (
        SELECT 1 FROM public.load_status_history lsh
        WHERE lsh.load_id = public.loads.id
          AND lsh.new_status = 'delivered'
          AND lsh.created_at::date = _snapshot_date
      );

    SELECT count(*) INTO _on_time
    FROM public.loads l
    WHERE l.org_id = _org.id
      AND EXISTS (
        SELECT 1 FROM public.load_status_history lsh
        WHERE lsh.load_id = l.id
          AND lsh.new_status = 'delivered'
          AND lsh.created_at::date = _snapshot_date
          AND lsh.created_at::date <= l.delivery_date::date
      );

    _total_del := _loads_delivered;

    SELECT count(*) INTO _active_drivers
    FROM public.drivers
    WHERE org_id = _org.id AND status = 'active';

    SELECT count(*) INTO _inv_generated
    FROM public.invoices
    WHERE org_id = _org.id AND created_at::date = _snapshot_date;

    SELECT coalesce(sum(paid_amount), 0) INTO _inv_paid
    FROM public.invoices
    WHERE org_id = _org.id AND paid_date = _snapshot_date;

    -- === Extended financial metrics ===

    -- Fuel cost for snapshot_date
    SELECT coalesce(sum(total_cost), 0) INTO _fuel_cost
    FROM public.fuel_transactions
    WHERE org_id = _org.id AND transaction_date::date = _snapshot_date;

    -- Maintenance cost for snapshot_date
    SELECT coalesce(sum(cost_total), 0) INTO _maint_cost
    FROM public.maintenance_records
    WHERE org_id = _org.id AND date_in::date = _snapshot_date;

    _total_expenses := _fuel_cost + _maint_cost;
    _net_profit := _revenue - _total_expenses;
    _cost_per_mile := CASE WHEN _total_miles > 0 THEN round(_total_expenses / _total_miles, 4) ELSE NULL END;
    _profit_per_mile := CASE WHEN _total_miles > 0 THEN round(_net_profit / _total_miles, 4) ELSE NULL END;

    -- Deadhead: loads without miles data treated as 0 deadhead
    _deadhead_miles := 0; -- Requires ELD integration; placeholder
    _deadhead_pct := 0;

    -- === Fleet metrics ===

    SELECT count(*) INTO _total_vehicles
    FROM public.vehicles
    WHERE org_id = _org.id AND status = 'active';

    -- Vehicles with active dispatches on snapshot_date
    SELECT count(DISTINCT d.vehicle_id) INTO _vehicles_with_loads
    FROM public.dispatches d
    JOIN public.loads l ON l.id = d.load_id
    WHERE d.org_id = _org.id
      AND d.vehicle_id IS NOT NULL
      AND d.status NOT IN ('completed', 'rejected')
      AND l.pickup_date::date <= _snapshot_date
      AND (l.delivery_date IS NULL OR l.delivery_date::date >= _snapshot_date);

    _fleet_util_pct := CASE WHEN _total_vehicles > 0
      THEN round((_vehicles_with_loads::numeric / _total_vehicles) * 100, 2) ELSE NULL END;

    -- Average MPG from fuel transactions on snapshot_date
    SELECT coalesce(sum(ft.gallons), 0), coalesce(sum(
      CASE WHEN ft.odometer_reading IS NOT NULL THEN ft.gallons ELSE 0 END
    ), 0) INTO _total_gallons, _total_fuel_miles
    FROM public.fuel_transactions ft
    WHERE ft.org_id = _org.id AND ft.transaction_date::date = _snapshot_date;

    -- Use fleet avg_mpg from vehicles as fallback
    SELECT coalesce(avg(avg_mpg), 0) INTO _avg_mpg
    FROM public.vehicles
    WHERE org_id = _org.id AND status = 'active' AND avg_mpg IS NOT NULL;

    -- Vehicles in shop
    SELECT count(*) INTO _vehicles_in_shop
    FROM public.vehicles
    WHERE org_id = _org.id AND status = 'in_shop';

    -- === Compliance metrics ===

    -- Compliance score: % of non-overdue items
    SELECT
      CASE WHEN count(*) > 0
        THEN round((count(*) FILTER (WHERE status NOT IN ('overdue'))::numeric / count(*)) * 100)
        ELSE 100
      END,
      count(*) FILTER (WHERE status = 'overdue')
    INTO _compliance_score, _overdue_items
    FROM public.compliance_items ci
    JOIN public.compliance_profiles cp ON cp.id = ci.compliance_profile_id
    WHERE cp.org_id = _org.id
      AND ci.status NOT IN ('completed', 'waived', 'not_applicable');

    -- === CRM metrics ===

    SELECT count(*) INTO _active_customers
    FROM public.crm_companies
    WHERE org_id = _org.id AND status = 'active';

    SELECT count(*) INTO _new_customers
    FROM public.crm_companies
    WHERE org_id = _org.id AND created_at::date = _snapshot_date;

    SELECT coalesce(avg(days_to_pay), 0) INTO _avg_days_to_pay
    FROM public.crm_companies
    WHERE org_id = _org.id AND status = 'active' AND days_to_pay IS NOT NULL;

    -- === UPSERT daily snapshot ===

    INSERT INTO public.daily_snapshots (
      org_id, snapshot_date, period,
      loads_booked, loads_delivered, loads_canceled,
      revenue, total_miles, revenue_per_mile,
      on_time_deliveries, total_deliveries, on_time_percentage,
      active_drivers, invoices_generated, invoices_paid,
      total_expenses, net_profit, cost_per_mile, profit_per_mile,
      deadhead_miles, deadhead_percentage,
      fleet_utilization_pct, avg_mpg, total_fuel_cost, total_maintenance_cost, vehicles_in_shop,
      compliance_score, overdue_compliance_items,
      active_customers, new_customers, avg_days_to_pay
    ) VALUES (
      _org.id, _snapshot_date, 'daily',
      _loads_booked, _loads_delivered, _loads_canceled,
      _revenue, _total_miles,
      CASE WHEN _total_miles > 0 THEN round(_revenue / _total_miles, 2) ELSE 0 END,
      _on_time, _total_del,
      CASE WHEN _total_del > 0 THEN round((_on_time::numeric / _total_del) * 100, 2) ELSE 0 END,
      _active_drivers, _inv_generated, _inv_paid,
      _total_expenses, _net_profit, _cost_per_mile, _profit_per_mile,
      _deadhead_miles, _deadhead_pct,
      _fleet_util_pct, _avg_mpg, _fuel_cost, _maint_cost, _vehicles_in_shop,
      _compliance_score, _overdue_items,
      _active_customers, _new_customers, _avg_days_to_pay
    )
    ON CONFLICT (org_id, snapshot_date, period)
    DO UPDATE SET
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
      invoices_paid = excluded.invoices_paid,
      total_expenses = excluded.total_expenses,
      net_profit = excluded.net_profit,
      cost_per_mile = excluded.cost_per_mile,
      profit_per_mile = excluded.profit_per_mile,
      deadhead_miles = excluded.deadhead_miles,
      deadhead_percentage = excluded.deadhead_percentage,
      fleet_utilization_pct = excluded.fleet_utilization_pct,
      avg_mpg = excluded.avg_mpg,
      total_fuel_cost = excluded.total_fuel_cost,
      total_maintenance_cost = excluded.total_maintenance_cost,
      vehicles_in_shop = excluded.vehicles_in_shop,
      compliance_score = excluded.compliance_score,
      overdue_compliance_items = excluded.overdue_compliance_items,
      active_customers = excluded.active_customers,
      new_customers = excluded.new_customers,
      avg_days_to_pay = excluded.avg_days_to_pay;

    -- === Weekly snapshot (on first day of week = Monday) ===

    IF extract(dow from _snapshot_date) = 1 THEN
      INSERT INTO public.daily_snapshots (
        org_id, snapshot_date, period,
        loads_booked, loads_delivered, loads_canceled,
        revenue, total_miles, revenue_per_mile,
        on_time_deliveries, total_deliveries, on_time_percentage,
        active_drivers, invoices_generated, invoices_paid,
        total_expenses, net_profit, cost_per_mile, profit_per_mile,
        deadhead_miles, deadhead_percentage,
        fleet_utilization_pct, avg_mpg, total_fuel_cost, total_maintenance_cost, vehicles_in_shop,
        compliance_score, overdue_compliance_items,
        active_customers, new_customers, avg_days_to_pay
      )
      SELECT
        _org.id, _snapshot_date, 'weekly',
        coalesce(sum(loads_booked), 0),
        coalesce(sum(loads_delivered), 0),
        coalesce(sum(loads_canceled), 0),
        coalesce(sum(revenue), 0),
        coalesce(sum(total_miles), 0),
        CASE WHEN coalesce(sum(total_miles), 0) > 0
          THEN round(coalesce(sum(revenue), 0) / sum(total_miles), 2) ELSE 0 END,
        coalesce(sum(on_time_deliveries), 0),
        coalesce(sum(total_deliveries), 0),
        CASE WHEN coalesce(sum(total_deliveries), 0) > 0
          THEN round((sum(on_time_deliveries)::numeric / sum(total_deliveries)) * 100, 2) ELSE 0 END,
        max(active_drivers),
        coalesce(sum(invoices_generated), 0),
        coalesce(sum(invoices_paid), 0),
        coalesce(sum(total_expenses), 0),
        coalesce(sum(net_profit), 0),
        CASE WHEN coalesce(sum(total_miles), 0) > 0
          THEN round(coalesce(sum(total_expenses), 0) / sum(total_miles), 4) ELSE NULL END,
        CASE WHEN coalesce(sum(total_miles), 0) > 0
          THEN round(coalesce(sum(net_profit), 0) / sum(total_miles), 4) ELSE NULL END,
        coalesce(sum(deadhead_miles), 0),
        NULL, -- deadhead_percentage recalculated
        avg(fleet_utilization_pct),
        avg(avg_mpg),
        coalesce(sum(total_fuel_cost), 0),
        coalesce(sum(total_maintenance_cost), 0),
        max(vehicles_in_shop),
        avg(compliance_score)::integer,
        max(overdue_compliance_items),
        max(active_customers),
        coalesce(sum(new_customers), 0),
        avg(avg_days_to_pay)
      FROM public.daily_snapshots
      WHERE org_id = _org.id
        AND period = 'daily'
        AND snapshot_date BETWEEN (_snapshot_date - interval '6 days')::date AND _snapshot_date
      ON CONFLICT (org_id, snapshot_date, period)
      DO UPDATE SET
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
        invoices_paid = excluded.invoices_paid,
        total_expenses = excluded.total_expenses,
        net_profit = excluded.net_profit,
        cost_per_mile = excluded.cost_per_mile,
        profit_per_mile = excluded.profit_per_mile,
        fleet_utilization_pct = excluded.fleet_utilization_pct,
        avg_mpg = excluded.avg_mpg,
        total_fuel_cost = excluded.total_fuel_cost,
        total_maintenance_cost = excluded.total_maintenance_cost,
        vehicles_in_shop = excluded.vehicles_in_shop,
        compliance_score = excluded.compliance_score,
        overdue_compliance_items = excluded.overdue_compliance_items,
        active_customers = excluded.active_customers,
        new_customers = excluded.new_customers,
        avg_days_to_pay = excluded.avg_days_to_pay;
    END IF;

    -- === Monthly snapshot (on 1st of month) ===

    IF extract(day from _snapshot_date) = 1 THEN
      INSERT INTO public.daily_snapshots (
        org_id, snapshot_date, period,
        loads_booked, loads_delivered, loads_canceled,
        revenue, total_miles, revenue_per_mile,
        on_time_deliveries, total_deliveries, on_time_percentage,
        active_drivers, invoices_generated, invoices_paid,
        total_expenses, net_profit, cost_per_mile, profit_per_mile,
        deadhead_miles, deadhead_percentage,
        fleet_utilization_pct, avg_mpg, total_fuel_cost, total_maintenance_cost, vehicles_in_shop,
        compliance_score, overdue_compliance_items,
        active_customers, new_customers, avg_days_to_pay
      )
      SELECT
        _org.id, _snapshot_date, 'monthly',
        coalesce(sum(loads_booked), 0),
        coalesce(sum(loads_delivered), 0),
        coalesce(sum(loads_canceled), 0),
        coalesce(sum(revenue), 0),
        coalesce(sum(total_miles), 0),
        CASE WHEN coalesce(sum(total_miles), 0) > 0
          THEN round(coalesce(sum(revenue), 0) / sum(total_miles), 2) ELSE 0 END,
        coalesce(sum(on_time_deliveries), 0),
        coalesce(sum(total_deliveries), 0),
        CASE WHEN coalesce(sum(total_deliveries), 0) > 0
          THEN round((sum(on_time_deliveries)::numeric / sum(total_deliveries)) * 100, 2) ELSE 0 END,
        max(active_drivers),
        coalesce(sum(invoices_generated), 0),
        coalesce(sum(invoices_paid), 0),
        coalesce(sum(total_expenses), 0),
        coalesce(sum(net_profit), 0),
        CASE WHEN coalesce(sum(total_miles), 0) > 0
          THEN round(coalesce(sum(total_expenses), 0) / sum(total_miles), 4) ELSE NULL END,
        CASE WHEN coalesce(sum(total_miles), 0) > 0
          THEN round(coalesce(sum(net_profit), 0) / sum(total_miles), 4) ELSE NULL END,
        coalesce(sum(deadhead_miles), 0),
        NULL,
        avg(fleet_utilization_pct),
        avg(avg_mpg),
        coalesce(sum(total_fuel_cost), 0),
        coalesce(sum(total_maintenance_cost), 0),
        max(vehicles_in_shop),
        avg(compliance_score)::integer,
        max(overdue_compliance_items),
        max(active_customers),
        coalesce(sum(new_customers), 0),
        avg(avg_days_to_pay)
      FROM public.daily_snapshots
      WHERE org_id = _org.id
        AND period = 'daily'
        AND snapshot_date >= (date_trunc('month', _snapshot_date) - interval '1 month')::date
        AND snapshot_date < date_trunc('month', _snapshot_date)::date
      ON CONFLICT (org_id, snapshot_date, period)
      DO UPDATE SET
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
        invoices_paid = excluded.invoices_paid,
        total_expenses = excluded.total_expenses,
        net_profit = excluded.net_profit,
        cost_per_mile = excluded.cost_per_mile,
        profit_per_mile = excluded.profit_per_mile,
        fleet_utilization_pct = excluded.fleet_utilization_pct,
        avg_mpg = excluded.avg_mpg,
        total_fuel_cost = excluded.total_fuel_cost,
        total_maintenance_cost = excluded.total_maintenance_cost,
        vehicles_in_shop = excluded.vehicles_in_shop,
        compliance_score = excluded.compliance_score,
        overdue_compliance_items = excluded.overdue_compliance_items,
        active_customers = excluded.active_customers,
        new_customers = excluded.new_customers,
        avg_days_to_pay = excluded.avg_days_to_pay;
    END IF;

    -- === Driver performance (nightly, per active driver) ===

    FOR _driver IN SELECT id FROM public.drivers WHERE org_id = _org.id AND status = 'active'
    LOOP
      -- Loads completed by this driver on snapshot_date
      SELECT count(*) INTO _d_loads
      FROM public.dispatches d
      JOIN public.load_status_history lsh ON lsh.load_id = d.load_id
      WHERE d.driver_id = _driver.id
        AND d.org_id = _org.id
        AND lsh.new_status = 'delivered'
        AND lsh.created_at::date = _snapshot_date;

      -- Miles driven
      SELECT coalesce(sum(l.miles), 0) INTO _d_miles
      FROM public.dispatches d
      JOIN public.loads l ON l.id = d.load_id
      JOIN public.load_status_history lsh ON lsh.load_id = d.load_id
      WHERE d.driver_id = _driver.id
        AND d.org_id = _org.id
        AND lsh.new_status = 'delivered'
        AND lsh.created_at::date = _snapshot_date;

      -- Revenue generated
      SELECT coalesce(sum(l.total_charges), 0) INTO _d_revenue
      FROM public.dispatches d
      JOIN public.loads l ON l.id = d.load_id
      JOIN public.load_status_history lsh ON lsh.load_id = d.load_id
      WHERE d.driver_id = _driver.id
        AND d.org_id = _org.id
        AND lsh.new_status = 'delivered'
        AND lsh.created_at::date = _snapshot_date;

      -- On-time deliveries
      SELECT count(*) INTO _d_on_time
      FROM public.dispatches d
      JOIN public.loads l ON l.id = d.load_id
      JOIN public.load_status_history lsh ON lsh.load_id = d.load_id
      WHERE d.driver_id = _driver.id
        AND d.org_id = _org.id
        AND lsh.new_status = 'delivered'
        AND lsh.created_at::date = _snapshot_date
        AND lsh.created_at::date <= l.delivery_date::date;

      _d_total_del := _d_loads;

      -- Fuel efficiency from fuel_transactions
      SELECT coalesce(sum(gallons), 0), coalesce(sum(
        CASE WHEN odometer_reading IS NOT NULL THEN gallons ELSE 0 END
      ), 0) INTO _d_gallons, _d_fuel_miles
      FROM public.fuel_transactions
      WHERE driver_id = _driver.id
        AND org_id = _org.id
        AND transaction_date::date = _snapshot_date;

      -- Use vehicle avg_mpg as fallback
      SELECT coalesce(v.avg_mpg, 0) INTO _d_fuel_eff
      FROM public.drivers dr
      LEFT JOIN public.vehicles v ON v.id = dr.current_vehicle_id
      WHERE dr.id = _driver.id;

      -- Safety incidents: count maintenance records flagged as unscheduled_repair
      SELECT count(*) INTO _d_safety
      FROM public.maintenance_records mr
      JOIN public.vehicles v ON v.id = mr.vehicle_id
      WHERE v.current_driver_id = _driver.id
        AND mr.org_id = _org.id
        AND mr.date_in::date = _snapshot_date
        AND mr.maintenance_type = 'unscheduled_repair';

      -- Compliance score from driver's compliance items
      SELECT CASE WHEN count(*) > 0
        THEN round((count(*) FILTER (WHERE ci.status NOT IN ('overdue'))::numeric / count(*)) * 100)
        ELSE 100
      END INTO _d_compliance
      FROM public.compliance_items ci
      JOIN public.compliance_profiles cp ON cp.id = ci.compliance_profile_id
      WHERE cp.org_id = _org.id
        AND ci.driver_id = _driver.id
        AND ci.status NOT IN ('completed', 'waived', 'not_applicable');

      _d_complaints := 0; -- Requires dedicated complaints system; placeholder

      INSERT INTO public.driver_performance (
        org_id, driver_id, period_start, period_end,
        loads_completed, miles_driven, revenue_generated,
        on_time_pct, fuel_efficiency, safety_incidents,
        compliance_score, customer_complaints
      ) VALUES (
        _org.id, _driver.id, _snapshot_date, _snapshot_date,
        _d_loads, _d_miles, _d_revenue,
        CASE WHEN _d_total_del > 0 THEN round((_d_on_time::numeric / _d_total_del) * 100, 2) ELSE NULL END,
        _d_fuel_eff, _d_safety, _d_compliance, _d_complaints
      )
      ON CONFLICT (org_id, driver_id, period_start)
      DO UPDATE SET
        period_end = excluded.period_end,
        loads_completed = excluded.loads_completed,
        miles_driven = excluded.miles_driven,
        revenue_generated = excluded.revenue_generated,
        on_time_pct = excluded.on_time_pct,
        fuel_efficiency = excluded.fuel_efficiency,
        safety_incidents = excluded.safety_incidents,
        compliance_score = excluded.compliance_score,
        customer_complaints = excluded.customer_complaints;
    END LOOP;

  END LOOP;
END;
$$;

-- Schedule analytics builder at 1:15 AM UTC daily (after daily snapshot at 1:00)
SELECT cron.schedule(
  'analytics-builder',
  '15 1 * * *',
  $$SELECT build_analytics();$$
);
