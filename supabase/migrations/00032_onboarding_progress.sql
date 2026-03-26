-- ============================================================
-- Migration 00032: Onboarding Progress
-- Phase 12: Onboarding, PWA, Security & Polish
-- ============================================================

-- 1. onboarding_progress -- tracks wizard completion per org
CREATE TABLE public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  step_completed INTEGER NOT NULL DEFAULT 0,
  business_profile_done BOOLEAN NOT NULL DEFAULT false,
  first_vehicle_done BOOLEAN NOT NULL DEFAULT false,
  first_driver_done BOOLEAN NOT NULL DEFAULT false,
  integrations_done BOOLEAN NOT NULL DEFAULT false,
  plan_selected BOOLEAN NOT NULL DEFAULT false,
  checklist_dismissed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. RLS Policies
-- ============================================================

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY onboarding_progress_select ON public.onboarding_progress
  FOR SELECT USING (org_id = (SELECT auth.org_id()));
CREATE POLICY onboarding_progress_insert ON public.onboarding_progress
  FOR INSERT WITH CHECK (org_id = (SELECT auth.org_id()));
CREATE POLICY onboarding_progress_update ON public.onboarding_progress
  FOR UPDATE USING (org_id = (SELECT auth.org_id()));

-- ============================================================
-- 3. Auto-create onboarding_progress row on organization insert
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_org_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.onboarding_progress (org_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_organization_created_onboarding
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_org_onboarding();
