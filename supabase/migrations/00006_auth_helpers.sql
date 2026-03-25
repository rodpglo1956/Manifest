-- auth.org_id() helper function
-- NOTE: This function is defined in 00004_rls_policies.sql where it is first needed.
-- This file exists as a reference for the auth.org_id() pattern.
-- The function is created with CREATE OR REPLACE so this is safe to run.
--
-- The auth.org_id() function returns the org_id for the currently authenticated user.
-- Wrap in (select auth.org_id()) in RLS policies for initPlan caching.

-- Re-create to ensure it exists even if run independently
create or replace function auth.org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select org_id from public.profiles where id = auth.uid()
$$;
