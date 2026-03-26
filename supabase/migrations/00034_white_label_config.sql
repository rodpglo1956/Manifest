-- Migration: White-label configuration
-- Stores brand customization per organization (enterprise tier only)

CREATE TABLE IF NOT EXISTS white_label_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  brand_name TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#EC008C',
  secondary_color TEXT,
  custom_domain TEXT,
  support_email TEXT,
  support_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE white_label_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "white_label_config_select" ON white_label_config
  FOR SELECT USING (org_id = (SELECT public.org_id()));

CREATE POLICY "white_label_config_insert" ON white_label_config
  FOR INSERT WITH CHECK (org_id = (SELECT public.org_id()));

CREATE POLICY "white_label_config_update" ON white_label_config
  FOR UPDATE USING (org_id = (SELECT public.org_id()));

-- Updated-at trigger
CREATE TRIGGER set_white_label_config_updated_at
  BEFORE UPDATE ON white_label_config
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();
