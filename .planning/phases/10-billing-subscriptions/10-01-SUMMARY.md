---
phase: 10-billing-subscriptions
plan: 01
subsystem: database
tags: [billing, stripe, subscriptions, rls, postgres, plans]

requires:
  - phase: 01-auth-organization
    provides: organizations table, auth.org_id() RLS pattern
provides:
  - billing_accounts, plan_limits, usage_records, billing_invoices tables with RLS
  - BillingAccount, PlanLimits, UsageRecord, BillingInvoice TypeScript types
  - PLAN_CONFIG constant with pricing, limits, and feature flags for 4 tiers
  - getPlanLimits, isFeatureEnabled, formatLimit helper functions
affects: [10-02, 10-03, 10-04, 10-05, checkout, enforcement, billing-ui]

tech-stack:
  added: []
  patterns: [auto-create trigger for billing_accounts on org insert, plan_limits as public reference table]

key-files:
  created:
    - supabase/migrations/00028_billing_tables.sql
    - src/lib/billing/plans.ts
  modified:
    - src/types/database.ts

key-decisions:
  - "billing_invoices table named to avoid conflict with existing invoices table"
  - "plan_limits is public reference table with GRANT SELECT (no RLS needed)"
  - "Auto-create billing_account with 14-day trial on organization insert"
  - "Stripe price IDs read from env vars with empty string defaults"
  - "Enterprise pricing uses -1 for contact-us model"

patterns-established:
  - "Billing auto-create: trigger on organizations insert creates billing_accounts row"
  - "Plan config: static PLAN_CONFIG constant for UI consumption with pricing and features"

requirements-completed: [BILL-01, BILL-02, BILL-06, BILL-08]

duration: 3min
completed: 2026-03-25
---

# Phase 10 Plan 01: Billing Schema & Plan Config Summary

**Billing database schema with 4 tables (accounts, limits, usage, invoices), RLS isolation, plan tier seeding, and TypeScript plan config with pricing**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-25T22:36:40Z
- **Completed:** 2026-03-25T22:40:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created billing_accounts, plan_limits, usage_records, billing_invoices tables with RLS
- Seeded 4 plan tiers (free, starter, professional, enterprise) with exact limits
- Auto-create billing_account trigger on organization insert with 14-day trial
- TypeScript types and PLAN_CONFIG constant with pricing, limits, and feature flags

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration for billing tables** - `58d28c0` (feat)
2. **Task 2: TypeScript types and billing plan config** - `ce712c7` (feat)

## Files Created/Modified
- `supabase/migrations/00028_billing_tables.sql` - 4 billing tables with RLS, seed data, triggers
- `src/types/database.ts` - BillingAccount, PlanLimits, UsageRecord, BillingInvoice types + Database entries
- `src/lib/billing/plans.ts` - PLAN_CONFIG, PLANS, getPlanLimits, isFeatureEnabled, formatLimit

## Decisions Made
- Named table billing_invoices to avoid conflict with existing invoices table
- plan_limits uses GRANT SELECT instead of RLS (public reference data)
- Auto-create trigger on organizations gives every org a free trial automatically
- Stripe price IDs configurable via env vars (empty defaults until Stripe products created)
- Enterprise uses -1 for "contact us" pricing model

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Database table entries placement in types**
- **Found during:** Task 2
- **Issue:** Billing table entries were inserted after the Tables closing brace
- **Fix:** Moved entries inside the Tables block before the closing brace
- **Files modified:** src/types/database.ts
- **Verification:** tsc --noEmit passes for billing types
- **Committed in:** ce712c7

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor insertion point fix. No scope creep.

## Issues Encountered
- Docker not running so supabase db reset could not verify migration (pre-existing environment constraint)
- Pre-existing Buffer type error in invoices PDF route (unrelated to billing changes)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Billing schema ready for checkout flow (10-02)
- Plan config importable from @/lib/billing/plans for pricing UI
- Stripe env vars need to be set when products are created

---
*Phase: 10-billing-subscriptions*
*Completed: 2026-03-25*
