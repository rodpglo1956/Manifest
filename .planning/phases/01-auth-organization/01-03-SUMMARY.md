---
phase: 01-auth-organization
plan: 03
subsystem: auth, middleware, ui
tags: [nextjs-middleware, role-routing, supabase-admin, team-invitation, zod, react-hook-form]

# Dependency graph
requires:
  - phase: 01-auth-organization
    provides: "Supabase client utilities, database schema, RLS policies, auth UI, org creation flow"
provides:
  - "Role-based middleware routing (driver -> Driver PWA, admin/dispatcher/viewer -> Command mode)"
  - "Team invitation flow via Supabase admin inviteUserByEmail with org/role metadata"
  - "Command mode layout with sidebar navigation and header"
  - "Driver PWA layout with mobile-first bottom navigation"
  - "Team management page with member table and role badges (admin-only)"
  - "Pure determineRoute() function for testable routing logic"
affects: [all-future-phases]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Pure routing logic extracted for testability (determineRoute)", "Lazy admin client via Proxy to avoid build-time env var errors", "Driver routes use /driver prefix (not route group) to avoid Next.js parallel route conflicts"]

key-files:
  created:
    - src/middleware.ts
    - src/lib/middleware/routing.ts
    - src/components/layout/app-header.tsx
    - src/components/layout/app-sidebar.tsx
    - src/components/layout/driver-header.tsx
    - src/app/(app)/layout.tsx
    - src/app/(app)/dashboard/page.tsx
    - src/app/driver/layout.tsx
    - src/app/driver/dashboard/page.tsx
    - src/app/(app)/settings/team/page.tsx
    - src/app/(app)/settings/team/actions.ts
    - src/components/auth/invite-form.tsx
    - src/schemas/invite.ts
  modified:
    - src/lib/supabase/admin.ts
    - tests/middleware/routing.test.ts
    - tests/auth/invite.test.ts

key-decisions:
  - "Used /driver prefix instead of (driver) route group to avoid Next.js parallel page resolution conflict"
  - "Extracted determineRoute() as pure function for testability -- middleware calls it after fetching profile"
  - "Made supabaseAdmin lazy via Proxy pattern to avoid build-time initialization with missing env vars"
  - "Used Zod 4 error parameter (not errorMap) for enum validation error messages"

patterns-established:
  - "Middleware routing: updateSession for JWT -> profile query for role -> determineRoute() for decision -> redirect or pass through"
  - "Command mode layout: AppHeader + AppSidebar with responsive collapse"
  - "Driver PWA layout: DriverHeader + bottom nav, no sidebar"
  - "Team invitation: admin server action -> supabaseAdmin.auth.admin.inviteUserByEmail with org_id/role metadata"
  - "Admin-only pages: server component checks profile.role, renders permission error for non-admins"

requirements-completed: [AUTH-06, AUTH-07, AUTH-08, AUTH-09]

# Metrics
duration: 5min
completed: 2026-03-25
---

# Phase 01 Plan 03: Middleware Routing & Team Invitation Summary

**Role-based middleware routing (driver/admin/dispatcher/viewer), team invitation via Supabase admin API, Command mode sidebar layout, and Driver PWA mobile-first layout**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-25T03:51:23Z
- **Completed:** 2026-03-25T03:56:32Z
- **Tasks:** 3 (2 auto + 1 auto-approved checkpoint)
- **Files modified:** 16

## Accomplishments
- Role-based middleware routing with 20 unit tests: drivers redirected to /driver/dashboard, admins/dispatchers/viewers to /dashboard, unauthenticated to /login, no-org to /onboarding
- Team management page with member table (role badges), admin-only invite form using Supabase inviteUserByEmail with org_id and role metadata
- Command mode layout with responsive sidebar (Dashboard, Settings active; Loads, Dispatch, Invoices grayed as "coming soon") and branded header with sign-out
- Driver PWA mobile-first layout with bottom navigation bar and centered "Manifest" header

## Task Commits

Each task was committed atomically:

1. **Task 1: Role-based middleware routing and route group layouts** - `e57fe36` (feat)
2. **Task 2: Team invitation flow -- admin invites users with role assignment** - `2bbd548` (feat)
3. **Task 3: Verify complete auth and organization flow end-to-end** - Auto-approved (checkpoint)

## Files Created/Modified
- `src/middleware.ts` - Auth session check + role-based routing middleware
- `src/lib/middleware/routing.ts` - Pure routing decision logic (determineRoute) for testability
- `src/components/layout/app-header.tsx` - Command mode top bar with Manifest branding and sign out
- `src/components/layout/app-sidebar.tsx` - Command mode sidebar with nav items and active states
- `src/components/layout/driver-header.tsx` - Driver PWA mobile-first header
- `src/app/(app)/layout.tsx` - Command mode layout wrapping sidebar + header + content
- `src/app/(app)/dashboard/page.tsx` - Placeholder Command dashboard with stat cards
- `src/app/driver/layout.tsx` - Driver PWA layout with bottom navigation
- `src/app/driver/dashboard/page.tsx` - Placeholder Driver dashboard with empty state
- `src/app/(app)/settings/team/page.tsx` - Team management with member table and invite form
- `src/app/(app)/settings/team/actions.ts` - Server action for inviteUserByEmail with admin check
- `src/components/auth/invite-form.tsx` - Client component for invitation with role selection
- `src/schemas/invite.ts` - Zod schema for email + role enum validation
- `src/lib/supabase/admin.ts` - Made admin client lazy via Proxy to avoid build-time errors
- `tests/middleware/routing.test.ts` - 20 tests for routing logic
- `tests/auth/invite.test.ts` - 8 tests for invite schema validation

## Decisions Made
- Used explicit `/driver` path prefix instead of `(driver)` route group because Next.js reported "You cannot have two parallel pages that resolve to the same path" conflict between `/(app)/dashboard` and `/(driver)`. This is functionally equivalent -- middleware routing still directs users correctly.
- Extracted `determineRoute()` as a pure function in `src/lib/middleware/routing.ts` rather than testing the full middleware. This enables fast, reliable unit tests without mocking Next.js internals.
- Made `supabaseAdmin` a lazy Proxy instead of an eagerly-initialized constant because the build-time static generation of the team page triggered the admin client import, which fails without environment variables.
- Used Zod 4's `{ error: 'message' }` parameter instead of `{ errorMap: fn }` because Zod 4 removed the errorMap option in favor of a simpler error string.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Changed (driver) route group to /driver path prefix**
- **Found during:** Task 1 (build verification)
- **Issue:** Next.js Turbopack build failed: "You cannot have two parallel pages that resolve to the same path" for /(app)/dashboard and /(driver)
- **Fix:** Changed from `src/app/(driver)/` route group to `src/app/driver/` explicit path prefix
- **Files modified:** src/app/driver/layout.tsx, src/app/driver/dashboard/page.tsx
- **Verification:** `npm run build` succeeds
- **Committed in:** e57fe36

**2. [Rule 3 - Blocking] Fixed Zod 4 enum error customization API**
- **Found during:** Task 2 (build verification)
- **Issue:** Zod 4 does not support `errorMap` parameter on `z.enum()` -- TypeScript error
- **Fix:** Changed `{ errorMap: () => ({ message: '...' }) }` to `{ error: '...' }`
- **Files modified:** src/schemas/invite.ts
- **Verification:** `npm run build` succeeds, all 8 invite tests pass
- **Committed in:** 2bbd548

**3. [Rule 3 - Blocking] Made supabaseAdmin lazy to avoid build-time crash**
- **Found during:** Task 2 (build verification)
- **Issue:** Team page server action imports supabaseAdmin which initializes eagerly, crashing at build time without SUPABASE_SERVICE_ROLE_KEY
- **Fix:** Changed supabaseAdmin to lazy Proxy pattern -- only initializes on first property access at runtime
- **Files modified:** src/lib/supabase/admin.ts
- **Verification:** `npm run build` succeeds
- **Committed in:** 2bbd548

---

**Total deviations:** 3 auto-fixed (3 blocking issues)
**Impact on plan:** All fixes necessary for successful build. No scope creep.

## Issues Encountered
None beyond the auto-fixed blocking issues documented above.

## User Setup Required
None for this plan. Supabase project with configured environment variables needed before running the app against a real database.

## Next Phase Readiness
- Phase 01 (Auth & Organization) is now complete
- Full auth flow: signup, login (password + magic link), org creation, team invitation, role-based routing
- All subsequent phases can build on: middleware routing, Supabase clients, database schema, auth UI
- Command mode layout ready for feature pages in Phase 2+
- Driver PWA layout ready for driver-specific features in Phase 2+

---
*Phase: 01-auth-organization*
*Completed: 2026-03-25*

## Self-Check: PASSED

- All 13 created files verified present on disk
- Commits e57fe36 and 2bbd548 verified in git log
- `npm run build` passes
- `npx vitest run` shows 46 passed, 4 todos
