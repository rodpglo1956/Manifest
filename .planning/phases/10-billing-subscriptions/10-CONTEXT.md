# Phase 10: Billing & Subscriptions - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Stripe Connect integration, subscription plans with feature limits, usage tracking, billing UI, and usage enforcement at API level. Glo Matrix is the Stripe platform, each carrier org is a Connected Account.

</domain>

<decisions>
## Implementation Decisions

### Stripe Integration
- Stripe Connect platform mode per PRD-04 Section 2
- billing_accounts table: stripe_customer_id, stripe_subscription_id, plan, billing_cycle, status, payment method
- plan_limits table: max vehicles/drivers/loads/users, module access flags, AI query limits
- usage_records table: period tracking of actual usage counts
- Stripe webhook at /api/billing/webhook handles subscription lifecycle events
- Checkout via Stripe hosted page, portal via Stripe Customer Portal

### Plans
- free: 3 vehicles, 3 drivers, 50 loads/month, 2 users, no AI/compliance/CRM
- starter: 10 vehicles, 15 drivers, 200 loads/month, 5 users, compliance + AI (100 queries)
- professional: 50 vehicles, 75 drivers, 1000 loads/month, 15 users, all modules
- enterprise: unlimited everything, white-label, priority support

### Usage Enforcement
- API-level checks before creating vehicles, drivers, loads, Marie queries
- Returns 402 with upgrade prompt when limit exceeded
- usage-tracker pg_cron daily at midnight counts current usage per org

### Trial
- 14-day Professional trial on signup
- trial-expiry pg_cron daily at 8 AM downgrades expired trials to free

### UI Pages
- Command: /settings/billing (plan, usage meters, payment, invoices)
- /settings/billing/plans (plan comparison grid)
- Owner-Operator: /oo/billing (simplified)

### Claude's Discretion
- Plan comparison card design
- Usage meter visualization
- Upgrade prompt UX when hitting limits

</decisions>

<code_context>
## Existing Code
- Settings layout from Phase 6 (notifications preferences page pattern)
- Server action patterns established
- pg_cron proven in Phases 4/6/7/8/9
- env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY needed

### Integration
- Settings sidebar: add billing link
- Marie: usage enforcement on /api/marie/query
- All CRUD actions: check plan limits before creation
</code_context>

<deferred>
- Stripe Connect payouts to carriers — v2
- Metered billing per AI query — v2
- Custom enterprise pricing — manual
</deferred>
