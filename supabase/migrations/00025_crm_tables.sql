-- ============================================================
-- Migration 00025: CRM Tables
-- Phase 09: CRM & Cross-Module Integration
-- ============================================================

-- 1. crm_companies
CREATE TABLE public.crm_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_type TEXT NOT NULL DEFAULT 'prospect' CHECK (company_type IN ('customer', 'broker', 'vendor', 'partner', 'prospect')),
  mc_number TEXT,
  dot_number TEXT,
  credit_score INTEGER,
  days_to_pay INTEGER,
  payment_terms TEXT,
  factoring_company TEXT,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  website TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('active', 'inactive', 'blacklisted', 'prospect')),
  tags TEXT[] DEFAULT '{}',
  total_revenue NUMERIC(14,2) DEFAULT 0,
  total_loads INTEGER DEFAULT 0,
  avg_rate_per_mile NUMERIC(8,4),
  last_load_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. crm_contacts
CREATE TABLE public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. crm_lanes
CREATE TABLE public.crm_lanes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  origin_city TEXT NOT NULL,
  origin_state TEXT NOT NULL,
  origin_zip TEXT,
  destination_city TEXT NOT NULL,
  destination_state TEXT NOT NULL,
  destination_zip TEXT,
  distance_miles INTEGER,
  avg_rate_per_mile NUMERIC(8,4),
  last_rate NUMERIC(10,2),
  last_run_date DATE,
  total_runs INTEGER DEFAULT 0,
  preferred_equipment TEXT[],
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'seasonal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. crm_lane_companies (junction table)
CREATE TABLE public.crm_lane_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lane_id UUID NOT NULL REFERENCES public.crm_lanes(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL CHECK (relationship IN ('shipper', 'broker', 'receiver')),
  contracted_rate NUMERIC(10,2),
  contract_start DATE,
  contract_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lane_id, company_id, relationship)
);

-- 5. crm_rate_agreements
CREATE TABLE public.crm_rate_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  lane_id UUID REFERENCES public.crm_lanes(id) ON DELETE SET NULL,
  rate_type TEXT NOT NULL CHECK (rate_type IN ('per_mile', 'flat_rate', 'percentage', 'hourly')),
  rate_amount NUMERIC(10,4) NOT NULL,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  min_volume INTEGER,
  equipment_type TEXT,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'expired', 'pending', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. crm_activities
CREATE TABLE public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'note', 'meeting', 'rate_negotiation', 'load_booked', 'issue', 'follow_up', 'system')),
  company_id UUID REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  lane_id UUID REFERENCES public.crm_lanes(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  subject TEXT,
  body TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  outcome TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_lanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_lane_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_rate_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON public.crm_companies
  FOR ALL USING (org_id = (SELECT auth.org_id()));

CREATE POLICY "org_isolation" ON public.crm_contacts
  FOR ALL USING (org_id = (SELECT auth.org_id()));

CREATE POLICY "org_isolation" ON public.crm_lanes
  FOR ALL USING (org_id = (SELECT auth.org_id()));

-- crm_lane_companies: no org_id column, isolate via lane's org_id
CREATE POLICY "org_isolation" ON public.crm_lane_companies
  FOR ALL USING (
    lane_id IN (SELECT id FROM public.crm_lanes WHERE org_id = (SELECT auth.org_id()))
  );

CREATE POLICY "org_isolation" ON public.crm_rate_agreements
  FOR ALL USING (org_id = (SELECT auth.org_id()));

CREATE POLICY "org_isolation" ON public.crm_activities
  FOR ALL USING (org_id = (SELECT auth.org_id()));

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_crm_companies_org_type ON public.crm_companies(org_id, company_type);
CREATE INDEX idx_crm_contacts_org_company ON public.crm_contacts(org_id, company_id);
CREATE INDEX idx_crm_lanes_org ON public.crm_lanes(org_id);
CREATE INDEX idx_crm_rate_agreements_org_company_status ON public.crm_rate_agreements(org_id, company_id, status);
CREATE INDEX idx_crm_activities_org_company_followup ON public.crm_activities(org_id, company_id, follow_up_date);

-- ============================================================
-- Updated_at Triggers (reuse existing trigger function)
-- ============================================================

CREATE TRIGGER trigger_set_updated_at
  BEFORE UPDATE ON public.crm_companies
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER trigger_set_updated_at
  BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER trigger_set_updated_at
  BEFORE UPDATE ON public.crm_lanes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
