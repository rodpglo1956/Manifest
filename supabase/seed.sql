-- Seed data for manual RLS verification
-- Creates two separate organizations with admin profiles
-- Use this to verify org_id isolation:
--   1. Sign in as user from Org A
--   2. Attempt to SELECT data from Org B
--   3. Should return empty results (RLS blocks cross-org access)

-- NOTE: These seed records reference auth.users IDs that must exist.
-- For local development, create test users via Supabase Auth first,
-- then update these UUIDs to match.

-- Example org data (UUIDs are placeholders -- replace with real auth.users IDs)

-- Organization A: DOT carrier
insert into organizations (id, name, dot_number, mc_number, address_line1, address_city, address_state, address_zip, phone, email, company_type)
values (
  '11111111-1111-1111-1111-111111111111',
  'Alpha Trucking LLC',
  '1234567',
  'MC-123456',
  '123 Main St',
  'Dallas',
  'TX',
  '75201',
  '214-555-0100',
  'dispatch@alphatrucking.com',
  'dot_carrier'
);

-- Organization B: Non-DOT carrier
insert into organizations (id, name, address_line1, address_city, address_state, address_zip, phone, email, company_type)
values (
  '22222222-2222-2222-2222-222222222222',
  'Beta Medical Transport',
  '456 Oak Ave',
  'Houston',
  'TX',
  '77001',
  '713-555-0200',
  'ops@betatransport.com',
  'non_dot_carrier'
);

-- NOTE: Profile and org_members records require matching auth.users entries.
-- When testing locally:
-- 1. Create users via Supabase Auth dashboard or signUp()
-- 2. The handle_new_user() trigger will auto-create profiles
-- 3. Manually update profiles.org_id and insert org_members records
-- 4. Then test RLS isolation by querying as each user
