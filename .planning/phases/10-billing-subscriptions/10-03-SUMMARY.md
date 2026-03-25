---
phase: 10-billing-subscriptions
plan: 03
subsystem: api
tags: [billing, enforcement, usage-limits, pg_cron, trial-management, 402]

requires:
  - phase: 10-billing-subscriptions
    provides: billing_accounts, plan_limits, usage_records tables, PLAN_CONFIG, BillingPlan types
provides:
  - checkUsageLimit middleware that throws UsageLimitError(402) when plan limit exceeded
  - getUsageSummary returning all resource counts vs limits for billing UI meters
  - checkModuleAccess for gating module visibility by plan
  - pg_cron billing_usage_tracker daily usage snapshots
  - pg_cron billing_trial_expiry auto-downgrade expired trials to free
  - Enforcement wired into createLoad, createVehicle, createDriver, Marie query
affects: [10-04, billing-ui, plan-upgrade-prompts]

tech-stack:
  added: []
  patterns: [checkUsageLimit before insert pattern, UsageLimitError with 402 statusCode, pg_cron security definer with explicit search_path]

key-files:
  created:
    - src/lib/billing/enforce.ts
    - supabase/migrations/00029_billing_cron.sql
  modified:
    - src/app/(app)/loads/actions.ts
    - src/app/(app)/fleet/actions.ts
    - src/app/(app)/drivers/actions.ts
    - src/app/api/marie/query/route.ts

key-decisions:
  - "checkUsageLimit uses supabaseAdmin for server-side enforcement (bypasses RLS)"
  - "No billing account means operation allowed (graceful fallback for unconfigured orgs)"
  - "Usage counts queried live at enforcement time rather than from cached usage_records"
  - "UsageLimitError caught specifically in each action; other errors rethrown"

patterns-established:
  - "Billing enforcement: checkUsageLimit(orgId, resource) before insert, catch UsageLimitError for user-friendly message"
  - "pg_cron billing functions: SECURITY DEFINER with explicit search_path = public"

requirements-completed: [BILL-06, BILL-07, BILL-08]

duration: 3min
completed: 2026-03-25
---

# Phase 10 Plan 03: Usage Enforcement & Trial Management Summary

**Plan limit enforcement via checkUsageLimit middleware on load/vehicle/driver/AI creation, with pg_cron daily usage tracking and trial auto-downgrade**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-25T22:41:06Z
- **Completed:** 2026-03-25T22:43:40Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- checkUsageLimit throws UsageLimitError(402) for vehicles, drivers, loads, users, ai_queries
- getUsageSummary returns current/limit/percentage for all resources (billing UI meters)
- checkModuleAccess gates compliance/ifta/crm/ai module visibility by plan
- pg_cron billing_usage_tracker snapshots usage daily at midnight UTC
- pg_cron billing_trial_expiry downgrades expired trials to free plan at 8 AM UTC
- Enforcement wired into createLoad, createVehicle, createDriver, and Marie query POST

## Task Commits

Each task was committed atomically:

1. **Task 1: Usage enforcement middleware and pg_cron functions** - `9e63976` (feat)
2. **Task 2: Wire enforcement into existing CRUD actions** - `0586ffb` (feat)

## Files Created/Modified
- `src/lib/billing/enforce.ts` - checkUsageLimit, getUsageSummary, checkModuleAccess, UsageLimitError
- `supabase/migrations/00029_billing_cron.sql` - billing_usage_tracker and billing_trial_expiry pg_cron jobs
- `src/app/(app)/loads/actions.ts` - checkUsageLimit('loads') before insert in createLoad
- `src/app/(app)/fleet/actions.ts` - checkUsageLimit('vehicles') before insert in createVehicle
- `src/app/(app)/drivers/actions.ts` - checkUsageLimit('drivers') before insert in createDriver
- `src/app/api/marie/query/route.ts` - checkUsageLimit('ai_queries') before Claude call, returns 402 JSON

## Decisions Made
- checkUsageLimit uses supabaseAdmin for server-side enforcement (bypasses user RLS)
- No billing account treated as "allow" to avoid blocking orgs during setup
- Live count queries at enforcement time rather than reading cached usage_records
- UsageLimitError caught specifically; other errors rethrown to preserve existing error handling

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Enforcement middleware ready for billing status UI (10-04) to show usage meters
- checkModuleAccess available for gating premium modules in navigation
- pg_cron jobs ready to run when cron extension is enabled in production

---
*Phase: 10-billing-subscriptions*
*Completed: 2026-03-25*
