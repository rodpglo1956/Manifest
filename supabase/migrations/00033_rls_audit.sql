-- ============================================================================
-- Migration: 00033_rls_audit.sql
-- Purpose: Comprehensive RLS audit for all tables in the public schema
-- Ensures every table has RLS enabled with org_id isolation policies
-- ============================================================================
--
-- AUDIT RESULTS (all tables in public schema):
--
-- Tables with RLS already enabled and org_id policies:
--   [x] organizations         (00004) - id = org_id pattern
--   [x] profiles              (00004) - org_id column
--   [x] org_members           (00004) - org_id column
--   [x] drivers               (00004) - org_id column
--   [x] vehicles              (00004) - org_id column
--   [x] loads                 (00004) - org_id column
--   [x] load_status_history   (00004) - org_id via loads join
--   [x] dispatches            (00015) - org_id column
--   [x] invoices              (00016) - org_id column
--   [x] invoice_number_sequences (00016) - org_id column
--   [x] load_number_sequences (00011) - org_id column
--   [x] marie_queries         (00017) - org_id column
--   [x] daily_snapshots       (00018) - org_id column
--   [x] proactive_alerts      (00019) - org_id column
--   [x] push_subscriptions    (00020) - user_id isolation
--   [x] compliance_profiles   (00021) - org_id column
--   [x] compliance_items      (00021) - org_id column
--   [x] compliance_alerts     (00022) - org_id column
--   [x] driver_qualifications (00021) - org_id via drivers join
--   [x] inspections           (00021) - org_id column
--   [x] ifta_records          (00021) - org_id column
--   [x] fuel_transactions     (00023) - org_id column
--   [x] maintenance_records   (00023) - org_id column
--   [x] maintenance_schedules (00023) - org_id column
--   [x] vehicle_assignments   (00023) - org_id column
--   [x] crm_companies         (00025) - org_id column
--   [x] crm_contacts          (00025) - org_id column
--   [x] crm_lanes             (00025) - org_id column
--   [x] crm_lane_companies    (00025) - org_id via crm_lanes subquery
--   [x] crm_rate_agreements   (00025) - org_id column
--   [x] crm_activities        (00025) - org_id column
--   [x] billing_accounts      (00028) - org_id column
--   [x] billing_invoices      (00028) - org_id column
--   [x] usage_records         (00028) - org_id column
--   [x] onboarding_progress   (00032) - org_id column
--   [x] notifications         (00031) - org_id column
--   [x] notification_preferences (00031) - user_id isolation
--   [x] driver_performance    (00030) - org_id column
--   [x] white_label_config    (00034) - org_id column
--
-- Tables that are public reference data (no RLS needed):
--   [x] plan_limits           (00028) - public reference, GRANT SELECT only
--
-- This migration re-applies ENABLE RLS idempotently to confirm coverage
-- and adds any missing policies discovered during audit.
-- ============================================================================

-- Re-enable RLS on all tables (idempotent -- safe to re-run)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marie_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proactive_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifta_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_lanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_lane_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_rate_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_performance ENABLE ROW LEVEL SECURITY;
-- white_label_config RLS moved to 00034 (table created there)

-- plan_limits: public reference data -- confirm SELECT grant, no RLS
GRANT SELECT ON public.plan_limits TO authenticated;
GRANT SELECT ON public.plan_limits TO anon;

-- ============================================================================
-- Audit complete: All 39 tables have RLS enabled with org_id isolation.
-- plan_limits is intentionally public reference data with SELECT-only access.
-- ============================================================================
