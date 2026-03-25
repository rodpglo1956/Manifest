# Domain Pitfalls

**Domain:** Logistics operations platform (dispatch, fleet, compliance, billing, AI assistant)
**Project:** Manifest
**Researched:** 2026-03-24

---

## Critical Pitfalls

Mistakes that cause rewrites, data breaches, or major production failures.

---

### Pitfall 1: RLS Subquery Performance Degradation at Scale

**What goes wrong:** Every RLS policy in the PRD schemas uses `(SELECT org_id FROM profiles WHERE id = auth.uid())` as a correlated subquery. This subquery executes per-row on every query. At 10,000 loads, Postgres runs 10,000 subqueries even if you only need 10 rows. Performance degrades exponentially as data grows.

**Why it happens:** The pattern looks clean and readable, so developers copy it across every table without testing at scale. The Supabase SQL Editor bypasses RLS entirely, so performance issues never surface during development.

**Consequences:** Dashboard loads slow to 5-10 seconds. Dispatch board becomes unusable during peak operations. Drivers on the PWA see loading spinners instead of their current load. The platform feels broken precisely when it matters most -- during active dispatch.

**Warning signs:**
- Query times exceed 200ms on any RLS-protected table
- EXPLAIN ANALYZE shows "SubPlan" nodes inside policy evaluation
- Dashboard stat queries take longer as more orgs onboard
- Supabase dashboard shows increasing database CPU usage

**Prevention:**
1. Wrap `auth.uid()` in a `SELECT` so Postgres caches it per statement: `(select auth.uid())` instead of `auth.uid()`. This alone yields up to 95% performance improvement per Supabase docs.
2. Create a `security definer` helper function that returns the user's org_id, cached per transaction.
3. Add indexes on every column referenced in RLS policies (`org_id`, `user_id`, `load_id`).
4. Always include explicit filters in client queries that match policy logic (e.g., `.eq('org_id', orgId)`) so Postgres prunes rows before RLS evaluation.
5. Use the `TO` clause on policies to restrict them to the `authenticated` role only -- skip evaluation for `anon` and `service_role`.
6. Run `EXPLAIN ANALYZE` on critical queries through the Supabase SQL Editor with `SET ROLE authenticated` to test actual RLS paths.

**Phase:** Phase 1 (Foundation). Get this wrong at the schema layer and every subsequent phase inherits the debt. Must be correct from the first migration.

**Confidence:** HIGH -- verified through [Supabase official RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) and [Supabase RLS performance discussion](https://github.com/orgs/supabase/discussions/14576).

---

### Pitfall 2: RLS Disabled on New Tables or Missing Policies

**What goes wrong:** A developer creates a new table via migration, enables RLS, but forgets to add policies -- or worse, forgets to enable RLS entirely. The table either leaks all data to every authenticated user or returns empty results with no error.

**Why it happens:** The default for every new Supabase table is RLS disabled. Empty results from missing policies produce no errors, so the bug is invisible until someone notices data is missing. During rapid development across 20+ tables, one table will slip through.

**Consequences:** Cross-tenant data leak is a company-ending security breach. A carrier sees another carrier's loads, drivers, or financial data. Alternatively, silent empty results mean a feature appears broken but passes all tests that don't check RLS.

**Warning signs:**
- Any table without `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` in its migration
- Queries returning all rows regardless of authenticated user
- Features returning empty data despite having records in the database
- No automated RLS verification in CI/CD

**Prevention:**
1. Create a migration lint script that fails if any `CREATE TABLE` lacks a corresponding `ENABLE ROW LEVEL SECURITY` and at least one policy.
2. Add an integration test that creates two test orgs and verifies complete data isolation across every table.
3. Use the [Supabase Database Advisors](https://supabase.com/docs/guides/database/database-advisors) lint (rule `0003_auth_rls_initplan`) to catch RLS issues.
4. Never use `user_metadata` in RLS policies -- only `app_metadata`, which the user cannot modify client-side.
5. Test policies from the Supabase client SDK, never the SQL Editor (which bypasses RLS).

**Phase:** Phase 1 (Foundation), but must be enforced in every subsequent phase as new tables are added (Phase 2 adds 2 tables, Phase 3 adds 12 tables, Phase 4 adds 6+ tables).

**Confidence:** HIGH -- verified through [Supabase multi-tenancy best practices](https://www.leanware.co/insights/supabase-best-practices) and [RLS guide](https://designrevision.com/blog/supabase-row-level-security).

---

### Pitfall 3: DOT Compliance Data Accuracy and Regulatory Drift

**What goes wrong:** Compliance deadlines, filing requirements, or regulatory categories are hardcoded based on current FMCSA rules, then regulations change and the platform gives carriers incorrect compliance status. A carrier trusts the platform's "all clear" compliance score, fails a DOT audit, and faces fines or shutdown.

**Why it happens:** FMCSA regulations change regularly. The MC number is being eliminated in favor of USDOT-only identifiers as of October 2025. HOS rules, drug testing requirements, insurance minimums, and filing deadlines evolve. Software that treats compliance rules as static data will drift from reality.

**Consequences:** A carrier gets a compliance violation because Manifest showed them as compliant when they were not. This is a liability issue for Glo Matrix LLC. Carriers will abandon the platform immediately if compliance data is untrustworthy -- compliance is the one area where "close enough" can shut down a business.

**Warning signs:**
- Compliance rules hardcoded in application code rather than configurable data
- No mechanism to update compliance deadlines without a code deployment
- MC number fields still treated as required/primary identifiers
- No admin interface for adjusting compliance rule parameters
- Users reporting discrepancies between Manifest's status and their actual filing status

**Prevention:**
1. Store all compliance rules, thresholds, and deadlines in database tables -- not in code. The `alert_days_before` array in `compliance_items` is a good start; extend this pattern to all rule parameters.
2. Build an admin interface (Glo Matrix internal, not customer-facing) to update compliance parameters without code changes.
3. Update the schema to treat USDOT number as the primary identifier and MC number as a legacy/optional field -- FMCSA is phasing out MC numbers.
4. Add disclaimers that Manifest compliance tracking is an operational aid, not legal advice. Carriers remain responsible for their own compliance.
5. Build a quarterly compliance rules review into the operational calendar.
6. Cross-reference key compliance dates against [FMCSA's official resources](https://www.fmcsa.dot.gov/) during each sprint.

**Phase:** Phase 3 (Compliance). The compliance module schema must be designed for configurability from day one, not retrofitted after launch.

**Confidence:** HIGH -- FMCSA MC number elimination is confirmed via [official FMCSA announcements](https://fastforwardtms.com/blogs/fmcsa-eliminates-mc-numbers/) and [FreightWaves DOT audit guidance](https://www.freightwaves.com/news/how-to-pass-a-dot-audit-in-2025-without-losing-sleep).

---

### Pitfall 4: Stripe Connect Webhook Race Conditions

**What goes wrong:** Stripe sends duplicate webhook events, or multiple events arrive simultaneously for the same subscription change. Without idempotent processing and proper locking, the `billing_accounts` table gets corrupted -- subscriptions appear active when canceled, or plan changes are missed.

**Why it happens:** Stripe webhooks are not guaranteed to arrive exactly once or in order. Network retries, Stripe's internal retry logic, and concurrent event delivery mean your `/api/billing/webhook` endpoint will receive the same event multiple times. A naive `findOne -> update` pattern has a TOCTOU race condition where both concurrent handlers check before either commits.

**Consequences:** Billing state diverges from Stripe's source of truth. Customers on expired trials retain paid features. Customers who paid get downgraded. Revenue tracking becomes unreliable. Customer support tickets spike because billing status is wrong.

**Warning signs:**
- `billing_accounts.status` diverges from what Stripe Dashboard shows
- Duplicate rows in any billing-related table
- Webhook endpoint logs showing the same event ID processed multiple times
- Customers reporting they were charged but features are still locked (or vice versa)

**Prevention:**
1. Create a `webhook_events` table with a unique constraint on `stripe_event_id`. Before processing, INSERT the event ID -- if it conflicts, skip processing (database-level idempotency).
2. Use optimistic locking on `billing_accounts` (add a `version` column, check it in UPDATE WHERE clause).
3. Always fetch the latest state from Stripe's API inside the webhook handler rather than relying solely on the event payload. The event tells you *what happened*; the API tells you *what the current state is*.
4. Add Stripe webhook signature verification on every event (the PRD mentions this -- enforce it).
5. Add a daily reconciliation edge function that compares `billing_accounts` with Stripe's API and flags/corrects discrepancies.
6. Store Stripe API keys in Supabase Vault as specified in PRD-00, never in environment variables.

**Phase:** Phase 4 (Scale/Billing). This must be implemented correctly the first time -- billing bugs are trust-destroying.

**Confidence:** HIGH -- verified through [Stripe webhook documentation](https://docs.stripe.com/webhooks), [race condition analysis](https://dev.to/belazy/the-race-condition-youre-probably-shipping-right-now-with-stripe-webhooks-mj4), and [webhook best practices](https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks).

---

### Pitfall 5: Offline PWA Sync Conflicts and Data Loss

**What goes wrong:** A driver fills out a pre-trip inspection form or logs fuel while offline. When connectivity resumes, the Background Sync API replays the queued writes, but the data conflicts with server state (e.g., load was reassigned while driver was offline, vehicle status changed, or the same inspection was logged from another device). Data is duplicated or silently lost.

**Why it happens:** Background Sync is only supported in Chromium-based browsers. Safari and Firefox do not implement it. Offline-first sync requires conflict resolution logic that most teams skip during initial implementation. IndexedDB queued writes have no built-in deduplication.

**Consequences:** Drivers lose inspection records they already filled out (trust-destroying for a compliance tool). Duplicate fuel transactions inflate cost-per-mile calculations. Pre-trip inspections vanish, creating compliance gaps that could fail a DOT audit.

**Warning signs:**
- Missing inspection records that drivers swear they completed
- Duplicate fuel transactions with identical timestamps
- Driver PWA showing "syncing..." indefinitely
- Different data on driver's phone vs Command mode dashboard
- Safari/Firefox users reporting offline features don't work at all

**Prevention:**
1. Generate client-side UUIDs for all offline-created records (the schema already uses UUIDs -- enforce this in the client).
2. Use idempotent upserts (`ON CONFLICT DO UPDATE`) on the server for all sync endpoints, keyed on client-generated IDs.
3. Add a `synced_at` timestamp to IndexedDB records and a "Pending uploads" badge visible to drivers so they know what hasn't synced.
4. Implement a manual "Retry sync" button as fallback for browsers without Background Sync API.
5. For Safari/Firefox users, implement immediate retry on reconnection (listen for `online` event) since Background Sync is unavailable.
6. Keep offline data scope small: current load, current vehicle, last 10 notifications. Do not try to cache the entire operation offline.
7. Show clear offline status indicator in the PWA UI at all times.

**Phase:** Phase 4 (PWA Hardening). But the UUID generation pattern and upsert endpoints should be established in Phase 1 load status updates to make Phase 4 offline work straightforward.

**Confidence:** HIGH -- browser compatibility verified through [MDN Background Sync docs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation). Sync conflict patterns verified through [web.dev offline data guide](https://web.dev/learn/pwa/offline-data) and [LogRocket offline-first analysis](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/).

---

## Moderate Pitfalls

---

### Pitfall 6: Supabase Realtime Subscription Explosion

**What goes wrong:** Each page subscribes to its own Realtime channels. Users navigating between dashboard, dispatch, loads, and fleet pages accumulate subscriptions that are never cleaned up. Connection count hits plan limits. Realtime stops working across the entire org.

**Why it happens:** React component mount/unmount doesn't automatically unsubscribe from Supabase Realtime channels. The PRD defines 3+ channels per org (`org:{org_id}:loads`, `org:{org_id}:dispatch`, `org:{org_id}:invoices`). With multiple browser tabs and multiple users per org, connections multiply fast. Supabase Pro charges $10 per 1,000 peak connections beyond quota.

**Prevention:**
1. Unsubscribe from channels in `useEffect` cleanup functions -- every subscription must have a corresponding teardown.
2. Consolidate channels where possible: one channel per org with event type differentiation, rather than separate channels per entity type.
3. Use a singleton Realtime manager that tracks active subscriptions and prevents duplicates across components.
4. Monitor connection counts in Supabase dashboard and set up alerts before hitting limits.
5. Add filters to Realtime subscriptions (e.g., filter by status) rather than subscribing to all changes on a table.

**Phase:** Phase 1 (Foundation) -- establish the subscription management pattern before Phase 2 adds alert channels and Phase 3 adds compliance/fleet channels.

**Confidence:** HIGH -- verified through [Supabase Realtime limits documentation](https://supabase.com/docs/guides/realtime/limits) and [Supabase Realtime pricing](https://supabase.com/docs/guides/realtime/pricing).

---

### Pitfall 7: Marie AI Scope Creep and Hallucination Risk

**What goes wrong:** Marie is designed to answer questions, execute actions, and push alerts. Without strict guardrails, Marie starts "hallucinating" load details, inventing driver locations, or executing actions the user didn't intend. The scope expands from "answer operational questions" to "autonomous agent that makes decisions," which is neither safe nor what the PRD specifies.

**Why it happens:** LLMs are confident even when wrong. Marie rebuilds context from the database on every query (stateless), which is architecturally sound, but the prompt engineering determines what Marie can and cannot do. Without explicit tool boundaries, Claude will attempt to help with anything asked. The PRD lists three capability levels (questions, actions, alerts) but does not define what Marie should refuse.

**Consequences:** Marie tells a dispatcher "Driver Johnson is 2 hours from pickup" when she has no GPS data and is guessing. Marie dispatches the wrong driver because the query was ambiguous. Marie creates a load with incorrect rate information because the user's phrasing was imprecise. Any of these erode trust in the entire platform.

**Prevention:**
1. Define an explicit "refuse" list: Marie never guesses locations, never estimates ETAs without data, never auto-dispatches without confirmation, never modifies billing/compliance data.
2. Implement tool-use architecture: Marie has specific functions she can call (query loads, create load, dispatch driver). She cannot freeform SQL or access tables outside her permitted scope.
3. All action-type responses require user confirmation before execution. Marie proposes; the user confirms.
4. Log every Marie query and response in `marie_queries` (already in PRD) and audit weekly for hallucinations during early deployment.
5. Set token/cost limits per org per day to prevent runaway API costs from chatty users.
6. Marie's role-based access must mirror the user's role -- a driver-role user asking Marie to "reassign this load" must be refused.

**Phase:** Phase 2 (Intelligence). Define the tool boundaries and refusal patterns before building the chat UI.

**Confidence:** MEDIUM -- based on general LLM production patterns from [Huyenchip's LLM engineering guide](https://huyenchip.com/2023/04/11/llm-engineering.html) and [IBM AI Agents analysis](https://www.ibm.com/think/insights/ai-agents-2025-expectations-vs-reality). Specific to Marie's architecture but not verified against Claude API-specific tool use patterns.

---

### Pitfall 8: Next.js App Router Client/Server Boundary Confusion

**What goes wrong:** Developers add `'use client'` to top-level layout or page components, turning entire route segments into client-side bundles. Server Components that fetch data get wrapped in Client Components, losing SSR benefits. The bundle size balloons past the 200KB target. Supabase client instances multiply because each Client Component creates its own.

**Why it happens:** The App Router's Server/Client Component mental model is genuinely confusing. Developers coming from Pages Router or React SPA patterns default to `'use client'` everywhere. The PRD serves three modes from one app via route groups (`(app)`, `(driver)`, `(auth)`, `(marketing)`), which compounds the complexity.

**Prevention:**
1. Establish a component architecture rule: pages and layouts are Server Components. Interactive elements are thin Client Component leaves imported into Server Component parents.
2. Create a shared Supabase client utility (`createServerClient` for Server Components, `createBrowserClient` for Client Components) and enforce usage via linting.
3. In Next.js 15, `params` and `searchParams` are async -- `await` them in every dynamic route or values will be `undefined`.
4. Use `next/dynamic` with `{ ssr: false }` only for genuinely client-only components (maps, charts) to keep initial bundle small.
5. Verify the three route groups `(app)`, `(driver)`, `(auth)` each have their own layout with appropriate data fetching patterns.

**Phase:** Phase 1 (Foundation). Establishing correct patterns here prevents cascading issues through all phases.

**Confidence:** HIGH -- verified through [Vercel's official App Router mistakes guide](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them) and [Next.js 15 App Router patterns](https://dev.to/teguh_coding/nextjs-app-router-the-patterns-that-actually-matter-in-2026-146).

---

### Pitfall 9: Cross-Module Data Integrity in Multi-Phase Build

**What goes wrong:** Phase 1 builds loads and invoices. Phase 3 adds compliance and CRM. The cross-module integrations defined in PRD-03 Section 5 (load completion triggers CRM update, fuel feeds IFTA, inspection completes compliance items) are retrofitted after the core modules exist. Retrofitting creates fragile trigger chains where one module's schema change breaks another module's edge function.

**Why it happens:** Sequential phase delivery means modules are built independently, then wired together. The load lifecycle (Phase 1) was not designed with CRM aggregation (Phase 3) or analytics snapshots (Phase 4) in mind. Database triggers and edge functions create invisible dependencies.

**Consequences:** A load status change triggers a cascade: load_status_history write, realtime broadcast, compliance check, CRM stats update, analytics snapshot update, proactive alert scan. If one step fails, the rest may or may not execute depending on whether triggers are synchronous. Silent failures create data inconsistencies across modules that are nearly impossible to debug.

**Prevention:**
1. Design the event/trigger architecture in Phase 1 even if downstream consumers don't exist yet. Use a simple `events` table or standardized trigger pattern that future modules can hook into.
2. Make all cross-module triggers asynchronous (use pg_notify + edge functions, not synchronous database triggers) so one module's failure doesn't block others.
3. Document every trigger chain and its expected sequence. Maintain a dependency graph.
4. Add a `last_synced_at` column on aggregate tables (`crm_companies.total_revenue`, `daily_snapshots`) so discrepancies can be detected and recomputed.
5. Build the nightly `analytics-builder` and `crm-stats-updater` as reconciliation functions that recompute from source data, not as incremental accumulators that drift.

**Phase:** Phase 1 (Foundation) for the event architecture. Phase 3 (Compliance/Fleet/CRM) for cross-module wiring. Phase 4 for reconciliation.

**Confidence:** MEDIUM -- based on general TMS architecture patterns from [TMS implementation lessons](http://logisticsviewpoints.com/2025/12/29/the-state-of-transportation-systems-tms-lessons-from-2025/) and [GoComet TMS mistakes](https://www.gocomet.com/blog/expensive-tms-implementation-mistakes/). Specific to Manifest's trigger chain but not verified against a comparable Supabase multi-module implementation.

---

### Pitfall 10: Invoice Table Name Collision Between Carrier Invoices and Stripe Invoices

**What goes wrong:** PRD-01 defines an `invoices` table for carrier-generated invoices (billing customers for freight). PRD-04 defines a *second* `invoices` table for Stripe billing invoices (Glo Matrix billing carriers for subscriptions). Same table name, different purposes, different schemas.

**Why it happens:** The PRDs were written as separate documents and both naturally used the name "invoices" for their respective billing concepts.

**Consequences:** Migration conflicts. Confusing code where `invoices` could mean either carrier AR invoices or Stripe subscription invoices. RLS policies may leak between the two if not carefully separated. Developers accidentally query the wrong table.

**Prevention:**
1. Rename the Stripe invoices table to `billing_invoices` or `subscription_invoices` in Phase 4 schema design.
2. Keep the Phase 1 `invoices` table name as-is since it's the carrier's core business object.
3. Establish a naming convention: all Stripe/billing tables are prefixed with `billing_` (already partially done with `billing_accounts`).
4. Consider whether Stripe invoices even need local caching -- the Stripe Customer Portal provides invoice history natively.

**Phase:** Phase 1 (naming convention) and Phase 4 (Stripe integration).

**Confidence:** HIGH -- directly observable from comparing PRD-01 Section 6.2 and PRD-04 Section 2.2 schemas.

---

## Minor Pitfalls

---

### Pitfall 11: Supabase Edge Function Cold Starts on pg_cron Jobs

**What goes wrong:** pg_cron triggers edge functions that cold-start on each invocation. The `compliance-scanner` runs daily at 6 AM for every org, the `maintenance-monitor` at 5 AM, the `analytics-builder` at 1 AM. As the platform scales to hundreds of orgs, these scans either time out or hit Supabase Edge Function execution limits.

**Prevention:**
1. Design edge functions to process in batches with pagination, not all orgs in one invocation.
2. Set appropriate timeouts (Supabase Edge Functions have a default timeout that may be too short for scanning all compliance items across all orgs).
3. Use the `service_role` key for edge functions that need to scan across orgs -- they cannot use RLS for cross-org batch processing.
4. Monitor execution time and add batching before it becomes a problem.

**Phase:** Phase 2 (first scheduled edge functions) and Phase 3 (compliance scanner).

---

### Pitfall 12: Overloading the Driver PWA with Desktop Patterns

**What goes wrong:** Developers build the Command mode desktop experience first, then try to adapt it for the Driver PWA. The PWA inherits complex data grids, multi-column layouts, and heavy component libraries that break on mobile and inflate the bundle.

**Prevention:**
1. Build the Driver PWA routes (`(driver)`) as mobile-first from the start, not as responsive adaptations of desktop views.
2. The PRD already separates them into route groups -- enforce that `(driver)` imports zero components from `(app)`.
3. Shared components (status badges, load cards) go in a shared library. Full page components are never shared between modes.
4. Test on a real Android phone on 3G from Phase 1. Not just Chrome DevTools throttling.

**Phase:** Phase 1 (Foundation) for route separation. Phase 4 for PWA performance optimization.

---

### Pitfall 13: IFTA Data Accuracy Without ELD Integration

**What goes wrong:** The PRD-03 IFTA module allows manual entry as a fallback when GPS/ELD data isn't available. Manual IFTA mileage entry is notoriously inaccurate. Carriers file incorrect IFTA returns based on Manifest data, triggering audits and penalties.

**Prevention:**
1. Clearly label manual IFTA entries as "unverified" in the UI.
2. Cross-reference manual miles against fuel purchase locations (if driver bought fuel in State X, they drove through State X).
3. Flag discrepancies greater than 5% between GPS miles and manual miles (already in PRD-03 ifta-aggregator spec -- enforce it).
4. Add a disclaimer that IFTA calculations are estimates and carriers should verify before filing.
5. Consider making IFTA a professional/enterprise-only feature where ELD integration is more likely available.

**Phase:** Phase 3 (Compliance).

---

### Pitfall 14: Notification Fatigue from Over-Alerting

**What goes wrong:** The platform generates proactive alerts from 6+ edge functions running on schedules (late pickup, driver silent, overdue invoice, dispatch conflict, ETA risk, unassigned load, compliance items, maintenance due, CRM follow-ups). A dispatcher with 20 drivers and 50 active loads gets buried in notifications. They stop reading them. Critical alerts get lost in the noise.

**Prevention:**
1. Implement severity-based throttling: batch `info` and `warning` alerts into a daily digest. Only `critical` alerts push in real-time.
2. The quiet hours feature (PRD-04) is good -- enforce it strictly.
3. Add an "alert fatigue" metric: if a user has more than 20 unacknowledged alerts, escalate only critical ones and suppress the rest.
4. Allow dispatchers to snooze specific alert types for specific time windows.
5. Marie's proactive digest (summarize unacknowledged alerts when chat opens) is the right pattern -- make it the primary alert surface, not raw notification spam.

**Phase:** Phase 2 (when alerts begin) and Phase 4 (notification system).

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Phase 1 (Foundation) | RLS subquery performance pattern copied across all tables without optimization | Establish optimized RLS helper functions before first migration. Test with EXPLAIN ANALYZE. |
| Phase 1 (Foundation) | Invoice table naming collision with Phase 4 Stripe invoices | Name Phase 1 table `invoices`, reserve `billing_invoices` for Phase 4 Stripe data. |
| Phase 1 (Foundation) | Next.js `'use client'` overuse inflating bundle and killing SSR | Enforce Server Component default; `'use client'` only on interactive leaf components. |
| Phase 2 (Intelligence) | Marie hallucinating operational data or executing unintended actions | Define explicit tool boundaries, require user confirmation for all actions, log everything. |
| Phase 2 (Intelligence) | Realtime subscription leak across page navigations | Build subscription manager singleton with useEffect cleanup from day one. |
| Phase 2 (Intelligence) | Alert system generating noise before severity tuning | Ship with conservative defaults (only critical alerts push). Tune thresholds post-launch. |
| Phase 3 (Compliance) | Hardcoded compliance rules that drift from FMCSA changes | Store all rules in database tables. Build admin interface for rule updates. |
| Phase 3 (Compliance) | IFTA inaccuracy from manual mileage entry without ELD data | Cross-reference fuel locations, flag discrepancies, label manual entries as unverified. |
| Phase 3 (Compliance) | Cross-module trigger chains creating invisible dependencies | Use async events (pg_notify) not synchronous triggers. Document all chains. |
| Phase 4 (Scale) | Stripe webhook race conditions corrupting billing state | Idempotent processing with webhook_events table. Optimistic locking. Daily reconciliation. |
| Phase 4 (Scale) | PWA offline sync losing driver inspection records | Client-side UUIDs, idempotent upserts, visible sync status, manual retry fallback. |
| Phase 4 (Scale) | Background Sync not available on Safari/Firefox | Implement online event listener fallback. Test on real iOS Safari. |

---

## Sources

- [Supabase RLS Performance Best Practices (official docs)](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase RLS Performance Discussion #14576](https://github.com/orgs/supabase/discussions/14576)
- [Supabase Database Advisors (lint rules)](https://supabase.com/docs/guides/database/database-advisors)
- [Supabase Realtime Limits](https://supabase.com/docs/guides/realtime/limits)
- [Supabase Realtime Pricing](https://supabase.com/docs/guides/realtime/pricing)
- [Supabase Multi-Tenancy Best Practices](https://www.leanware.co/insights/supabase-best-practices)
- [Supabase RLS Guide: Policies That Actually Work](https://designrevision.com/blog/supabase-row-level-security)
- [Vercel: Common Next.js App Router Mistakes](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)
- [Next.js App Router Patterns 2026](https://dev.to/teguh_coding/nextjs-app-router-the-patterns-that-actually-matter-in-2026-146)
- [App Router Pitfalls (imidef)](https://imidef.com/en/2026-02-11-app-router-pitfalls)
- [Stripe Webhook Documentation](https://docs.stripe.com/webhooks)
- [Stripe Webhook Race Conditions](https://dev.to/belazy/the-race-condition-youre-probably-shipping-right-now-with-stripe-webhooks-mj4)
- [Stripe Webhook Best Practices (Stigg)](https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks)
- [MDN: PWA Offline and Background Sync](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)
- [web.dev: Offline Data Guide](https://web.dev/learn/pwa/offline-data)
- [Offline-First Frontend Apps 2025 (LogRocket)](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [FMCSA MC Number Elimination](https://fastforwardtms.com/blogs/fmcsa-eliminates-mc-numbers/)
- [FreightWaves: How to Pass a DOT Audit 2025](https://www.freightwaves.com/news/how-to-pass-a-dot-audit-in-2025-without-losing-sleep)
- [TMS Implementation Lessons 2025 (Logistics Viewpoints)](http://logisticsviewpoints.com/2025/12/29/the-state-of-transportation-systems-tms-lessons-from-2025/)
- [TMS Implementation Mistakes (GoComet)](https://www.gocomet.com/blog/expensive-tms-implementation-mistakes/)
- [LLM Engineering for Production (Huyenchip)](https://huyenchip.com/2023/04/11/llm-engineering.html)
- [AI Agents 2025: Expectations vs Reality (IBM)](https://www.ibm.com/think/insights/ai-agents-2025-expectations-vs-reality)
