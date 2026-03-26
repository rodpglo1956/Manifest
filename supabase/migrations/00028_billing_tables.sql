-- ============================================================
-- Migration 00028: Billing Tables
-- Phase 10: Billing & Subscriptions
-- ============================================================

-- 1. billing_accounts -- one per org
CREATE TABLE public.billing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  monthly_rate NUMERIC(10,2),
  annual_rate NUMERIC(10,2),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'paused', 'unpaid')),
  payment_method_last4 TEXT,
  payment_method_brand TEXT,
  cancellation_reason TEXT,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. plan_limits -- reference table (public read)
CREATE TABLE public.plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan TEXT NOT NULL UNIQUE,
  max_vehicles INTEGER NOT NULL,
  max_drivers INTEGER NOT NULL,
  max_loads_per_month INTEGER NOT NULL,
  max_users INTEGER NOT NULL,
  compliance_module BOOLEAN NOT NULL DEFAULT false,
  ifta_module BOOLEAN NOT NULL DEFAULT false,
  crm_module BOOLEAN NOT NULL DEFAULT false,
  ai_assistant BOOLEAN NOT NULL DEFAULT false,
  ai_queries_per_month INTEGER NOT NULL DEFAULT 0,
  voice_minutes_per_month INTEGER NOT NULL DEFAULT 0,
  api_access BOOLEAN NOT NULL DEFAULT false,
  white_label BOOLEAN NOT NULL DEFAULT false,
  priority_support BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. usage_records -- per org per period
CREATE TABLE public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  vehicles_count INTEGER NOT NULL DEFAULT 0,
  drivers_count INTEGER NOT NULL DEFAULT 0,
  loads_count INTEGER NOT NULL DEFAULT 0,
  users_count INTEGER NOT NULL DEFAULT 0,
  ai_queries_count INTEGER NOT NULL DEFAULT 0,
  voice_minutes_used NUMERIC(8,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, period_start)
);

-- 4. billing_invoices -- cached from Stripe (named to avoid conflict with existing invoices table)
CREATE TABLE public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. RLS Policies
-- ============================================================

ALTER TABLE public.billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;

-- billing_accounts: org-scoped
CREATE POLICY billing_accounts_select ON public.billing_accounts
  FOR SELECT USING (org_id = (SELECT public.org_id()));
CREATE POLICY billing_accounts_insert ON public.billing_accounts
  FOR INSERT WITH CHECK (org_id = (SELECT public.org_id()));
CREATE POLICY billing_accounts_update ON public.billing_accounts
  FOR UPDATE USING (org_id = (SELECT public.org_id()));

-- usage_records: org-scoped
CREATE POLICY usage_records_select ON public.usage_records
  FOR SELECT USING (org_id = (SELECT public.org_id()));
CREATE POLICY usage_records_insert ON public.usage_records
  FOR INSERT WITH CHECK (org_id = (SELECT public.org_id()));
CREATE POLICY usage_records_update ON public.usage_records
  FOR UPDATE USING (org_id = (SELECT public.org_id()));

-- billing_invoices: org-scoped
CREATE POLICY billing_invoices_select ON public.billing_invoices
  FOR SELECT USING (org_id = (SELECT public.org_id()));
CREATE POLICY billing_invoices_insert ON public.billing_invoices
  FOR INSERT WITH CHECK (org_id = (SELECT public.org_id()));

-- plan_limits: public read for authenticated users (no RLS needed, grant select)
GRANT SELECT ON public.plan_limits TO authenticated;

-- ============================================================
-- 6. Seed plan_limits
-- ============================================================

INSERT INTO public.plan_limits (plan, max_vehicles, max_drivers, max_loads_per_month, max_users, compliance_module, ifta_module, crm_module, ai_assistant, ai_queries_per_month, voice_minutes_per_month, api_access, white_label, priority_support) VALUES
  ('free',         3,  3,   50,  2, false, false, false, false,   0,   0, false, false, false),
  ('starter',     10, 15,  200,  5, true,  false, false, true,  100,  30, false, false, false),
  ('professional',50, 75, 1000, 15, true,  true,  true,  true,  500, 120, true,  false, false),
  ('enterprise',  -1, -1,   -1, -1, true,  true,  true,  true,   -1,  -1, true,  true,  true);

-- ============================================================
-- 7. Auto-create billing_accounts on organization insert
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_create_billing_account()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.billing_accounts (org_id, plan, status, trial_ends_at)
  VALUES (NEW.id, 'free', 'trialing', now() + interval '14 days');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_create_billing_account
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_billing_account();

-- ============================================================
-- 8. updated_at triggers (reuse existing trigger function)
-- ============================================================

CREATE TRIGGER trigger_set_updated_at
  BEFORE UPDATE ON public.billing_accounts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER trigger_set_updated_at
  BEFORE UPDATE ON public.usage_records
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_billing_accounts_org_id ON public.billing_accounts(org_id);
CREATE INDEX idx_billing_accounts_stripe_customer ON public.billing_accounts(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_usage_records_org_period ON public.usage_records(org_id, period_start);
CREATE INDEX idx_billing_invoices_org_id ON public.billing_invoices(org_id);
CREATE INDEX idx_billing_invoices_status ON public.billing_invoices(status);
