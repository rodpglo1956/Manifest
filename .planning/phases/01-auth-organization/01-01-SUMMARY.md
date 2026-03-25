---
phase: 01-auth-organization
plan: 01
subsystem: infra, database, auth
tags: [nextjs, supabase, tailwind-v4, rls, vitest, typescript, ssr]

# Dependency graph
requires:
  - phase: none
    provides: "Greenfield project - first phase"
provides:
  - "Next.js 15 app with Tailwind v4 design system tokens"
  - "Supabase client utilities for browser, server, middleware, and admin contexts"
  - "Database schema for organizations, profiles, org_members with RLS"
  - "auth.org_id() helper function with initPlan caching pattern"
  - "Profile creation trigger for signup and invitation flows"
  - "Vitest test infrastructure with 35 test stubs"
affects: [01-02-PLAN, 01-03-PLAN, all-future-phases]

# Tech tracking
tech-stack:
  added: ["next@15.5.14", "react@19.1.0", "@supabase/supabase-js@2.100.0", "@supabase/ssr@0.9.0", "tailwindcss@4", "zod@4.3.6", "react-hook-form@7.72.0", "@hookform/resolvers@5.2.2", "lucide-react@1.6.0", "date-fns@4.1.0", "vitest@4.1.1", "@testing-library/react@16.3.2", "@testing-library/jest-dom@6.9.1"]
  patterns: ["Supabase SSR browser/server/middleware/admin client pattern", "(select auth.org_id()) initPlan caching for RLS", "Tailwind v4 @theme directive for design tokens", "security definer + search_path = '' for triggers"]

key-files:
  created:
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/middleware.ts
    - src/lib/supabase/admin.ts
    - src/types/database.ts
    - src/app/globals.css
    - src/app/layout.tsx
    - supabase/migrations/00001_organizations.sql
    - supabase/migrations/00002_profiles.sql
    - supabase/migrations/00003_org_members.sql
    - supabase/migrations/00004_rls_policies.sql
    - supabase/migrations/00005_auth_trigger.sql
    - supabase/migrations/00006_auth_helpers.sql
    - supabase/seed.sql
    - vitest.config.ts
    - tests/setup.ts
  modified: []

key-decisions:
  - "Combined auth.org_id() function into 00004_rls_policies.sql (also kept 00006 as reference) to handle alphabetical migration ordering"
  - "Used getClaims() destructure with null coalesce to handle nullable data type from Supabase SDK"

patterns-established:
  - "Supabase browser client: createBrowserClient from @supabase/ssr"
  - "Supabase server client: createServerClient with async cookies() from next/headers"
  - "Middleware session refresh: getClaims() for local JWT validation (not getUser())"
  - "Admin client: createClient from @supabase/supabase-js with service role key"
  - "RLS policy pattern: (select auth.org_id()) and (select auth.uid()) for initPlan caching"
  - "Trigger pattern: security definer + set search_path = '' for auth triggers"
  - "Design tokens via Tailwind v4 @theme inline directive in globals.css"

requirements-completed: [AUTH-04, AUTH-10]

# Metrics
duration: 5min
completed: 2026-03-25
---

# Phase 01 Plan 01: Project Scaffold Summary

**Next.js 15 app with Supabase SSR clients, Tailwind v4 design system (#EC008C primary), 3-table auth schema with org-isolated RLS policies, and Vitest test infrastructure with 35 stubs**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-25T03:24:49Z
- **Completed:** 2026-03-25T03:30:35Z
- **Tasks:** 2
- **Files modified:** 37

## Accomplishments
- Next.js 15 project scaffolded with Tailwind v4 design system tokens (primary #EC008C, Inter/JetBrains Mono fonts, 4px spacing grid, constrained shadows/radii)
- Four Supabase client utilities established following official @supabase/ssr patterns (browser, server, middleware with getClaims, admin with service role)
- Database schema for organizations, profiles, org_members matching PRD-01 exactly with RLS enabled and auth.org_id() helper using (select ...) initPlan caching
- Profile creation trigger handles both direct signup and invitation metadata (org_id, role auto-linking)
- Vitest test framework configured with 35 test stubs across 6 files covering AUTH-01 through AUTH-09

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 15 project with Supabase clients and design system** - `0b3e107` (feat)
2. **Task 2: Create database migrations, RLS policies, auth trigger, and test infrastructure** - `755dbf4` (feat)

## Files Created/Modified
- `src/app/globals.css` - Tailwind v4 theme with design system tokens
- `src/app/layout.tsx` - Root layout with Inter + JetBrains Mono fonts, Manifest metadata
- `src/app/page.tsx` - Minimal landing page
- `src/lib/supabase/client.ts` - Browser Supabase client using createBrowserClient
- `src/lib/supabase/server.ts` - Server Supabase client with cookie handlers
- `src/lib/supabase/middleware.ts` - Session refresh using getClaims() (not getUser())
- `src/lib/supabase/admin.ts` - Admin client with service role key (server-only)
- `src/types/database.ts` - TypeScript types for organizations, profiles, org_members
- `supabase/migrations/00001_organizations.sql` - Organizations table
- `supabase/migrations/00002_profiles.sql` - Profiles table with org_id index
- `supabase/migrations/00003_org_members.sql` - Org members table with unique constraint
- `supabase/migrations/00004_rls_policies.sql` - RLS policies + auth.org_id() helper
- `supabase/migrations/00005_auth_trigger.sql` - Profile creation trigger
- `supabase/migrations/00006_auth_helpers.sql` - auth.org_id() reference copy
- `supabase/seed.sql` - Two-org test data for RLS verification
- `vitest.config.ts` - Vitest config with jsdom and path aliases
- `tests/setup.ts` - Test setup with Supabase mocks
- `tests/auth/signup.test.ts` - AUTH-01 stubs (5 todos)
- `tests/auth/session.test.ts` - AUTH-02 stubs (4 todos)
- `tests/auth/magic-link.test.ts` - AUTH-03 stubs (4 todos)
- `tests/org/create.test.ts` - AUTH-05 stubs (7 todos)
- `tests/auth/invite.test.ts` - AUTH-06/07 stubs (8 todos)
- `tests/middleware/routing.test.ts` - AUTH-09 stubs (7 todos)
- `.env.local.example` - Required environment variables documented

## Decisions Made
- Combined auth.org_id() function definition into 00004_rls_policies.sql (before the policies that reference it) since Supabase migrations run alphabetically. Kept 00006_auth_helpers.sql as a reference copy using CREATE OR REPLACE.
- Used `data?.claims ?? null` pattern for getClaims() destructuring to handle the SDK's nullable return type safely.
- Kept separate 00006_auth_helpers.sql file (with CREATE OR REPLACE) rather than removing it, so the migration ordering intent is documented and the function can be referenced independently.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed getClaims() type destructuring**
- **Found during:** Task 1 (Supabase middleware client)
- **Issue:** TypeScript error: Property 'claims' does not exist on nullable type from getClaims()
- **Fix:** Changed destructuring from `{ data: { claims } }` to `{ data, error }` then `data?.claims ?? null`
- **Files modified:** src/lib/supabase/middleware.ts
- **Verification:** `npm run build` passes
- **Committed in:** 0b3e107 (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed ESLint empty object type error**
- **Found during:** Task 1 (database types)
- **Issue:** ESLint rule @typescript-eslint/no-empty-object-type rejected `{}` type for Views
- **Fix:** Changed to `Record<string, never>` for both Views and Functions types
- **Files modified:** src/types/database.ts
- **Verification:** `npm run build` passes
- **Committed in:** 0b3e107 (Task 1 commit)

**3. [Rule 3 - Blocking] Fixed .gitignore excluding .env.local.example**
- **Found during:** Task 1 (env example file)
- **Issue:** `.env*` glob in .gitignore blocked committing .env.local.example
- **Fix:** Added `!.env.local.example` exception to .gitignore
- **Files modified:** .gitignore
- **Verification:** `git add .env.local.example` succeeds
- **Committed in:** 0b3e107 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking issues)
**Impact on plan:** All fixes necessary for build/commit success. No scope creep.

## Issues Encountered
- create-next-app rejected directory name "Manifest" (capital letter violates npm naming). Scaffolded in /tmp/manifest-scaffold then copied files back.

## User Setup Required

None for this plan. Supabase project creation and environment variable configuration will be needed before running the app against a real database. See `.env.local.example` for required variables.

## Next Phase Readiness
- Foundation ready for Plan 01-02: Auth UI (signup, login, magic link), session management, organization creation flow
- All Supabase client utilities established and importable
- Database schema ready for deployment to Supabase project
- Test infrastructure ready for implementing real tests in future plans

---
*Phase: 01-auth-organization*
*Completed: 2026-03-25*

## Self-Check: PASSED

- All 23 created files verified present on disk
- Commits 0b3e107 and 755dbf4 verified in git log
- `npm run build` passes
- `npx vitest run` shows 35 todos, 0 failures
