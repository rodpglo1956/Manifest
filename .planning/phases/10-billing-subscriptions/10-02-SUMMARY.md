---
phase: 10-billing-subscriptions
plan: 02
subsystem: api
tags: [stripe, billing, webhooks, checkout, subscriptions, nextjs-api]

requires:
  - phase: 10-billing-subscriptions
    provides: billing_accounts, plan_limits, usage_records, billing_invoices tables; BillingPlan/BillingCycle types; PLAN_CONFIG with stripePriceId
provides:
  - Stripe client singleton with getOrCreateStripeCustomer helper
  - Checkout session creation API route for plan subscriptions
  - Customer portal API route for payment method management
  - Billing status API route returning account, limits, and usage
  - Webhook handler for 6 Stripe event types keeping billing_accounts in sync
affects: [10-03, 10-04, billing-ui, subscription-enforcement]

tech-stack:
  added: [stripe]
  patterns: [Stripe webhook signature verification, subscription metadata for org resolution, parent.subscription_details for invoice-to-subscription mapping]

key-files:
  created:
    - src/lib/billing/stripe.ts
    - src/app/api/billing/create-checkout/route.ts
    - src/app/api/billing/portal/route.ts
    - src/app/api/billing/status/route.ts
    - src/app/api/billing/webhook/route.ts
  modified: []

key-decisions:
  - "Stripe API version 2024-12-18.acacia uses items.data[0].current_period_start/end instead of subscription-level"
  - "Invoice subscription reference via parent.subscription_details (newer Stripe API structure)"
  - "Tax calculated from invoice.total_taxes array sum instead of deprecated top-level tax field"
  - "Checkout validates plan is starter or professional only (free has no Stripe, enterprise is contact-sales)"
  - "Portal returns 402 when no stripe_customer_id exists (no subscription yet)"
  - "BillingAccount type assertion used for select('*') queries due to Supabase Relationships: [] inference"

patterns-established:
  - "Stripe webhook: extract org_id from subscription.metadata, not customer metadata"
  - "Stripe period dates: use subscription.items.data[0] for current_period_start/end"
  - "Billing status query: type assertion from select('*') for tables with empty Relationships"

requirements-completed: [BILL-01, BILL-03, BILL-04, BILL-05]

duration: 4min
completed: 2026-03-25
---

# Phase 10 Plan 02: Stripe API Routes Summary

**Stripe checkout, portal, webhook, and status API routes with signature verification and 6 event handlers for subscription lifecycle sync**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T22:41:09Z
- **Completed:** 2026-03-25T22:45:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Stripe client singleton with customer creation/lookup helper
- Checkout session creation with plan/cycle validation and org metadata
- Customer portal session for self-service payment method management
- Billing status endpoint returning account, limits, and current period usage
- Webhook handler processing subscription.created/updated/deleted, invoice.paid/payment_failed, trial_will_end

## Task Commits

Each task was committed atomically:

1. **Task 1: Stripe client and checkout/portal/status API routes** - `4a9071f` (feat)
2. **Task 2: Stripe webhook handler** - `22c256a` (feat)
3. **Stripe SDK dependency** - `3de3591` (chore)

## Files Created/Modified
- `src/lib/billing/stripe.ts` - Stripe client singleton, getOrCreateStripeCustomer, createCheckoutSession, createPortalSession
- `src/app/api/billing/create-checkout/route.ts` - POST handler creating Stripe checkout session with plan validation
- `src/app/api/billing/portal/route.ts` - POST handler creating Stripe customer portal session
- `src/app/api/billing/status/route.ts` - GET handler returning billing account, plan limits, and usage
- `src/app/api/billing/webhook/route.ts` - POST handler verifying Stripe signature and processing 6 event types

## Decisions Made
- Used Stripe API version 2024-12-18.acacia which moves period dates to subscription items
- Invoice subscription reference accessed via parent.subscription_details (not top-level subscription field)
- Tax calculated from total_taxes array instead of deprecated direct tax field
- Checkout restricted to starter/professional plans (free has no Stripe pricing, enterprise requires sales contact)
- Portal returns 402 Payment Required when org has no stripe_customer_id
- Used type assertions for billing_accounts select('*') due to Supabase empty Relationships inference

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing stripe SDK dependency**
- **Found during:** Task 1
- **Issue:** stripe package not in package.json
- **Fix:** Ran npm install stripe
- **Files modified:** package.json, package-lock.json
- **Verification:** Import succeeds, tsc passes
- **Committed in:** 3de3591

**2. [Rule 1 - Bug] Fixed Stripe API property access for 2024-12-18 API version**
- **Found during:** Task 2
- **Issue:** Stripe 2024-12-18.acacia moved current_period_start/end to subscription items and subscription to invoice.parent.subscription_details
- **Fix:** Created getSubscriptionPeriod() using items.data[0] and getSubscriptionIdFromInvoice() using parent.subscription_details
- **Files modified:** src/app/api/billing/webhook/route.ts
- **Verification:** tsc --noEmit passes (no billing-related errors)
- **Committed in:** 22c256a

**3. [Rule 1 - Bug] Fixed period_start copy-paste in getSubscriptionPeriod**
- **Found during:** Task 2
- **Issue:** Both periodStart and periodEnd used current_period_end
- **Fix:** Changed periodStart to use current_period_start
- **Files modified:** src/app/api/billing/webhook/route.ts
- **Verification:** tsc --noEmit passes
- **Committed in:** 22c256a

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs)
**Impact on plan:** All fixes necessary for Stripe API compatibility and correctness. No scope creep.

## Issues Encountered
- Pre-existing Buffer type error in invoices PDF route (unrelated to billing changes)
- Supabase select('*') returns {} type for tables with Relationships: [] -- used type assertions

## User Setup Required
None - Stripe env vars (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) already documented in Phase 10 Plan 01.

## Next Phase Readiness
- All Stripe API routes ready for billing UI (10-03)
- Webhook handler ready for end-to-end subscription testing
- Checkout flow ready for plan upgrade integration

---
*Phase: 10-billing-subscriptions*
*Completed: 2026-03-25*
