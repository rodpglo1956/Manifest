-- Add is_onboarded flag to drivers table for driver onboarding flow
-- Defaults to true for existing drivers (they don't need onboarding)
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_onboarded boolean NOT NULL DEFAULT true;

-- Set existing drivers as onboarded
UPDATE drivers SET is_onboarded = true WHERE is_onboarded = false;

-- New drivers created via invite will be set to false by the invite flow
