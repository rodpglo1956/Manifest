# Phase 1: Auth & Organization - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

User accounts, organization setup, role-based access, RLS foundation, and invitation flow. Users can sign up (email/password or magic link), create an organization with carrier details, invite team members with role assignment, and be redirected to the correct mode (Command, Driver PWA, Owner-Operator) based on their role. All data access isolated by organization via RLS.

This phase establishes the auth patterns and RLS foundation that every subsequent phase depends on.

</domain>

<decisions>
## Implementation Decisions

### Auth Flow
- Supabase Auth handles all authentication — email/password primary, magic link secondary
- Database trigger creates `profiles` record linked to `auth.uid()` on signup
- Session management via Supabase's built-in session handling (access + refresh tokens)
- Login redirects to correct mode based on `profile.role`: admin/dispatcher → Command, driver → Driver PWA, viewer → Command (read-only)
- Owner-Operator mode auto-detected based on org tier and user count (single-user admin = owner-operator)

### Organization Setup
- On signup, user is prompted to create org OR join existing via invitation
- Org creation collects: company name, address, phone, email, DOT number (optional), MC number (optional), company_type ('dot_carrier', 'non_dot_carrier', 'both')
- `company_type` determines which compliance modules appear in later phases
- MC number field marked as legacy/optional (FMCSA eliminating MC numbers per research)

### Invitation Flow
- Admin generates invitation with target role assignment
- Invitation sent via email with a link to join the org
- Invited user creates account → automatically linked to org with assigned role
- `org_members` table tracks membership with role and join date

### Role Enforcement
- Four roles: admin, dispatcher, driver, viewer
- Role stored in `profiles.role` and enforced via RLS policies AND API middleware
- Admin: full Command mode access including settings, billing, team management
- Dispatcher: loads, dispatch, driver management, fleet view — no billing, no team management
- Driver: Driver PWA only — own loads, own vehicle, own compliance
- Viewer: read-only access to dashboard, loads, fleet, reports

### RLS Foundation
- Use `(select auth.uid())` pattern (not bare `auth.uid()`) for up to 95% RLS performance improvement per research
- Create `auth.org_id()` helper function to avoid inline subqueries in every policy
- Index `org_id` on every table for RLS performance
- RLS on organizations, profiles, org_members from day one
- Policy naming convention: descriptive names like `users_own_profile`, `org_profiles`, `org_members_access`

### Route Groups & Middleware
- Next.js App Router route groups: `(auth)` for login/signup, `(app)` for Command mode, `(driver)` for Driver PWA, `(marketing)` for public pages
- Middleware checks session validity and role on every request to protected routes
- Unauthenticated users → redirect to `/login`
- Wrong mode → redirect to correct mode based on role

### Database Schema
- Follow PRD-01 schema exactly for organizations, profiles, org_members tables
- All columns snake_case, uuid PKs with gen_random_uuid(), timestamptz for all timestamps
- Status columns use text type with documented enum values in comments

### Claude's Discretion
- Exact Supabase client configuration (SSR vs client-side patterns)
- Error message wording for auth flows
- Loading states during auth operations
- Form validation approach for signup/org creation
- Exact middleware implementation pattern for Next.js 15 App Router

</decisions>

<specifics>
## Specific Ideas

- Design system specifies: white default theme, #EC008C primary color, 15px Inter body font, 8px spacing grid
- JetBrains Mono for DOT numbers, MC numbers on org setup forms
- No gradients in app UI, shadows max 0 2px 8px rgba(0,0,0,0.06), border-radius max 12px (cards 10px, buttons 6px)
- Rod has 10+ years in logistics — the org setup form should collect the fields a carrier actually needs, not generic SaaS fields
- Product name always capitalized "Manifest" in UI. Company name "Glo Matrix LLC" — never "Abrey Enterprise LLC"

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, this is the first phase

### Established Patterns
- None yet — this phase ESTABLISHES the patterns all subsequent phases will follow:
  - Supabase client initialization (server vs client components)
  - RLS helper function pattern (`auth.org_id()`)
  - Route group structure
  - Middleware auth checking
  - Form handling conventions

### Integration Points
- Supabase project must be created and configured (or use existing if already set up)
- Environment variables needed: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- Vercel deployment configuration for Next.js 15

</code_context>

<deferred>
## Deferred Ideas

- OAuth providers (Google, GitHub) — v2 requirement (AUTH alternative)
- 2FA — v2 requirement
- Password reset flow — could be Phase 1 but not in current requirements; standard Supabase Auth feature
- User avatar upload — depends on Supabase Storage setup, handled when profile editing is needed

</deferred>

---

*Phase: 01-auth-organization*
*Context gathered: 2026-03-24*
