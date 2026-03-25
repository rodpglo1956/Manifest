-- Phase 11 Plan 02: Notifications system
-- Creates notifications and notification_preferences tables

-- =============================================================================
-- NOTIFICATIONS TABLE
-- =============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  category TEXT NOT NULL CHECK (category IN ('compliance', 'maintenance', 'load', 'billing', 'crm', 'driver', 'system', 'marie')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  channels_sent TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for bell queries: unread notifications for a user, newest first
CREATE INDEX idx_notifications_user_read_created
  ON notifications (user_id, read, created_at DESC);

-- Index for org-level queries
CREATE INDEX idx_notifications_org_id ON notifications (org_id);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

-- Insert policy for server-side dispatch (service role or same org)
CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- =============================================================================
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  compliance_channels TEXT[] DEFAULT '{in_app,push}',
  maintenance_channels TEXT[] DEFAULT '{in_app,push}',
  load_channels TEXT[] DEFAULT '{in_app,push}',
  billing_channels TEXT[] DEFAULT '{in_app,email}',
  crm_channels TEXT[] DEFAULT '{in_app}',
  driver_channels TEXT[] DEFAULT '{in_app,push}',
  system_channels TEXT[] DEFAULT '{in_app}',
  marie_channels TEXT[] DEFAULT '{in_app,push}',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Service role insert for trigger
CREATE POLICY "Service can insert preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- AUTO-CREATE PREFERENCES ON PROFILE INSERT
-- =============================================================================
CREATE OR REPLACE FUNCTION auto_create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_auto_create_notification_preferences
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_notification_preferences();

-- Updated_at trigger for notification_preferences
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();
