-- RLS policies for organizations, profiles, and org_members
-- All policies use (select public.org_id()) and (select auth.uid()) patterns
-- The (select ...) wrapper triggers PostgreSQL's initPlan optimization,
-- caching the result per-statement instead of evaluating per-row (95% improvement)

-- Define public.org_id() helper function first (policies depend on it)
-- Returns the org_id for the currently authenticated user
-- Helper function in public schema (auth schema is restricted in Supabase hosted)
create or replace function public.org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select org_id from public.profiles where id = auth.uid()
$$;

-- ============================================================
-- Organizations policies
-- ============================================================

-- Users can read/update their own organization
create policy "org_access" on organizations
  for all using (id = (select public.org_id()));

-- Allow creating a new organization (user has no org_id yet)
create policy "org_insert" on organizations
  for insert with check (true);

-- ============================================================
-- Profiles policies
-- ============================================================

-- Users can always see and update their own profile
create policy "users_own_profile" on profiles
  for all using (id = (select auth.uid()));

-- Users can see all profiles in their organization
create policy "org_profiles" on profiles
  for select using (org_id = (select public.org_id()));

-- ============================================================
-- Org members policies
-- ============================================================

-- Users can see all members in their organization
create policy "org_members_select" on org_members
  for select using (org_id = (select public.org_id()));

-- Only admins can insert, update, or delete org members
create policy "org_members_admin_manage" on org_members
  for all using (
    org_id = (select public.org_id())
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );
