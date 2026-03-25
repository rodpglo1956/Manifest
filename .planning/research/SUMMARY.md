# Project Research Summary

**Project:** Manifest - All-in-One Logistics Operations Platform
**Domain:** Carrier-side TMS, fleet management, dispatch, compliance, AI operations assistant
**Researched:** 2026-03-24
**Confidence:** HIGH

## Executive Summary

Manifest is a carrier-side logistics operations platform targeting small-to-mid fleets (owner-operators to 200+ vehicles) across both DOT-regulated trucking and non-DOT medical transport. The expert approach for this class of product is a route-group-partitioned monolith: a single Next.js 15 application serving three user experiences (Command desktop, Driver PWA, Owner-Operator simplified) through App Router route groups, backed by Supabase as the unified data platform (PostgreSQL, Auth, Realtime, Edge Functions, Storage), with Stripe Connect for billing and a stateless AI assistant (Marie) running on Railway. This architecture is well-validated for multi-tenant SaaS in 2026 and avoids the operational complexity of microservices while maintaining clear component boundaries.

The recommended approach is a four-phase build that front-loads the core dispatch-to-invoice workflow (Phase 1), layers AI intelligence and smart routing on top of operational data (Phase 2), adds compliance/fleet/CRM depth that locks in customers (Phase 3), and finishes with billing, offline PWA hardening, and polish (Phase 4). The stack is mature and well-documented -- Next.js 15, Supabase, TanStack Query, react-hook-form with Zod, MapLibre for maps, Serwist for PWA, and dnd-kit for dispatch board interactions. There are no experimental or risky technology choices. The key version decision is to stay on Next.js 15.x rather than jumping to 16, which renamed middleware patterns and has unverified Supabase SSR compatibility.

The top risks are: RLS policy performance degradation from unoptimized subqueries (solvable with a cached helper function but must be correct from the first migration), cross-tenant data leakage from missing RLS on new tables (requires automated verification in CI), Marie AI hallucinating operational data or executing unintended actions (requires strict tool boundaries and confirmation flows), and Stripe webhook race conditions corrupting billing state (requires idempotent processing). None of these are novel problems -- all have documented prevention strategies -- but each one is severe enough to be company-ending if ignored.

## Key Findings

### Recommended Stack

The stack is fully specified with high confidence. Every library has been validated against alternatives with clear rationale. No gaps exist in library selection.

**Core technologies:**
- **Next.js 15.x + React 19:** Full-stack framework with App Router, Server Components, route groups for multi-mode UI. Stay on 15.x; defer 16 migration until Supabase SSR compatibility is confirmed.
- **Supabase (PostgreSQL + Auth + Realtime + Edge Functions + Storage + pg_cron):** Single backend platform. RLS for multi-tenant isolation. Realtime for live dispatch updates. Edge Functions for scheduled automation. Eliminates need for separate auth, websocket, cron, and file storage services.
- **Stripe Connect (Platform mode):** SaaS billing with Connected Accounts for carrier orgs. Subscriptions + usage billing.
- **Claude API on Railway:** Stateless AI assistant with per-request context rebuild from database. Railway chosen over Edge Functions for longer timeouts and higher memory limits.
- **TanStack Query + Supabase Realtime:** Server state management with stale-while-revalidate caching. Realtime events trigger cache invalidation for live updates.
- **MapLibre + react-map-gl:** Free, open-source map rendering. Avoids Mapbox/Google Maps per-request pricing that would spike with dispatch board usage.
- **Serwist:** PWA service worker toolkit, successor to abandoned next-pwa. Handles precaching, runtime caching, Background Sync.
- **react-hook-form + Zod 4:** Form state management with TypeScript-first validation. Shared schemas across client and server.
- **@react-pdf/renderer:** JSX-based PDF generation for invoices and reports. Superior DX over imperative alternatives.
- **dnd-kit:** Dispatch board drag-and-drop for driver-to-load assignment. Replaces deprecated react-beautiful-dnd.

**Critical version constraints:** Next.js pinned to ^15, Supabase JS to ^2, Zod to ^4, Serwist to ^9. Do not adopt Next.js 16 until after Phase 1 stabilizes.

### Expected Features

**Must have (table stakes -- Phase 1):**
- Load management with full 10-status lifecycle (booked through paid)
- Dispatch board with manual driver assignment
- Driver roster and vehicle registry
- Invoice generation from delivered loads
- Dashboard with operational KPIs (stat cards)
- Document management (BOL, POD) with camera upload
- Role-based access control (admin, dispatcher, driver, viewer)
- Real-time load status updates via Supabase Realtime
- Driver PWA with status updates and mobile access

**Should have (differentiators -- Phases 2-3):**
- Marie AI operations assistant (the headline differentiator; no competitor in this segment has it)
- DOT + non-DOT unified platform (unique market position spanning medical vans to Class 8 semis)
- Smart routing with 5-factor driver scoring (proximity, availability, equipment, performance, lane familiarity)
- Predictive operational alerts (late pickup risk, driver silent, ETA risk)
- Integrated logistics CRM with lane-based rate tracking
- Cross-module intelligence (load completion auto-updates CRM, fuel feeds IFTA, inspections auto-complete compliance)

**Defer (v2+):**
- Load board / freight sourcing (marketplace dynamics, not an operator tool)
- ELD/GPS hardware (capital-intensive, existing market leaders)
- Full accounting system (integrate with QuickBooks/Xero instead)
- HOS logging (pull from ELD integrations, do not be system of record)
- NEMT-specific Medicaid billing (specialized domain, defer unless NEMT adoption is strong)
- Multi-stop loads (single pickup/delivery covers 80%+ of small carrier loads)
- Driver settlements (consider post-launch based on demand)

### Architecture Approach

The architecture is a route-group-partitioned monolith deployed on Vercel, with Supabase as the unified data layer and Marie AI as the only external compute service (Railway). All mutations flow through Next.js API routes (business logic boundary), while reads use the Supabase client directly (RLS handles authorization). Seven key patterns govern the build: route group isolation per mode, RLS-first data access with a cached `auth.org_id()` helper function, Realtime channels scoped by organization, Edge Functions as scheduled job runners via pg_cron, stateless AI with per-request context rebuild, offline-first PWA with sync queue for the Driver app, and API routes as the single business logic boundary.

**Major components:**
1. **(app) route group** -- Command mode: dashboard, loads, dispatch, fleet, compliance, CRM, reports, settings
2. **(driver) route group** -- Driver PWA: current load, status updates, inspections, fuel, compliance (mobile-first, offline-capable)
3. **(auth) route group** -- Login, signup, invitation acceptance, onboarding wizard
4. **(marketing) route group** -- Public pages: landing, pricing, terms
5. **API routes (/api/*)** -- Business logic: CRUD, status transitions, validation, authorization, side effects
6. **Supabase** -- PostgreSQL with RLS, Realtime, Auth, Edge Functions, pg_cron, Storage
7. **Marie AI (Railway)** -- Stateless Claude API service with per-request database context assembly
8. **Stripe Connect** -- Subscription billing, plan enforcement, usage metering

### Critical Pitfalls

1. **RLS subquery performance degradation** -- Wrap `auth.uid()` in a SELECT for per-statement caching, create a `SECURITY DEFINER` helper function `auth.org_id()`, index `org_id` on every table. Must be correct from the first migration; retrofitting is painful.
2. **Missing RLS on new tables** -- Default for new Supabase tables is RLS disabled. Create a migration lint script that fails if any CREATE TABLE lacks ENABLE ROW LEVEL SECURITY. Add cross-tenant isolation integration tests. This must be enforced in every phase (Phase 3 alone adds 12 tables).
3. **Marie AI hallucination and scope creep** -- Define explicit tool boundaries and a "refuse" list. All actions require user confirmation before execution. Log every query/response. Mirror the user's role permissions in Marie's access. Set per-org daily token limits.
4. **Stripe webhook race conditions** -- Use a `webhook_events` table with unique constraint on `stripe_event_id` for database-level idempotency. Fetch latest state from Stripe API inside handlers. Add daily reconciliation edge function.
5. **Cross-module trigger chains creating invisible dependencies** -- Design the event architecture in Phase 1 even though downstream consumers do not exist yet. Use async events (pg_notify + Edge Functions), not synchronous triggers. Build reconciliation functions that recompute from source data.

## Implications for Roadmap

### Phase 1: Foundation -- Core Dispatch-to-Invoice Workflow
**Rationale:** Every subsequent feature depends on loads, drivers, vehicles, and dispatch existing. The architecture research confirms a strict dependency chain: auth -> drivers/vehicles -> loads -> dispatch -> invoicing -> dashboard. The Driver PWA shell must also ship here because mobile access is table stakes.
**Delivers:** Functional carrier operations platform covering the daily dispatch-to-invoice loop. Stat-card dashboard. Driver PWA with status updates.
**Addresses:** All 14 table-stakes features from FEATURES.md except IFTA, maintenance, and DOT compliance (Phase 3).
**Avoids:** RLS performance degradation (Pitfall 1), missing RLS on tables (Pitfall 2), invoice naming collision (Pitfall 10), client/server boundary confusion (Pitfall 8), Realtime subscription leaks (Pitfall 6).
**Stack focus:** Next.js 15, Supabase (schema + RLS + Auth + Realtime + Storage), react-hook-form + Zod, TanStack Query, dnd-kit, react-dropzone, date-fns.

### Phase 2: Intelligence -- AI, Smart Routing, and Predictive Alerts
**Rationale:** Marie AI is the headline differentiator. It requires all Phase 1 data (loads, drivers, dispatch) to have meaningful context. Smart routing and predictive alerts build on the same operational data. Analytics foundation (daily snapshots) enables dashboard charts.
**Delivers:** Marie AI chat with query + action capabilities. Smart dispatch suggestions with 5-factor scoring. Six proactive alert types. Push notifications. Analytics dashboard with charts.
**Addresses:** All 6 differentiator features from Phase 2 of FEATURES.md.
**Avoids:** Marie hallucination (Pitfall 7), notification fatigue (Pitfall 14), Edge Function cold starts (Pitfall 11).
**Stack focus:** Claude API + Anthropic SDK on Railway, Recharts, Web Push API, Serwist (service worker for push).

### Phase 3: Operational Depth -- Compliance, Fleet, and CRM
**Rationale:** Compliance and fleet management are table stakes that lock in customers (switching costs increase). CRM adds relationship management that no competitor in this segment offers. Cross-module integrations make the "all-in-one" promise real. These modules are relatively independent of each other and can be built in parallel, but all require Phase 1 data and benefit from Phase 2 intelligence (Marie context expansion, alert integration).
**Delivers:** DOT compliance tracking with DQ files and automated scanning. Fleet management with maintenance and fuel tracking. IFTA calculations. Logistics CRM with lane-based rate tracking. Cross-module integrations (5 documented integration points).
**Addresses:** Compliance, fleet, CRM, and cross-module intelligence differentiators.
**Avoids:** DOT compliance data accuracy drift (Pitfall 3), IFTA inaccuracy without ELD (Pitfall 13), cross-module trigger chain fragility (Pitfall 9).
**Stack focus:** Supabase Edge Functions (compliance scanner, maintenance monitor, IFTA aggregator, CRM stats updater), pg_cron schedules.

### Phase 4: Scale and Polish -- Billing, Offline PWA, Launch Readiness
**Rationale:** Billing is not needed until there are paying customers. Offline PWA hardening is ambitious and should not block the core product. White-label, onboarding wizard, and security hardening are polish items. This phase converts Manifest from "working product" to "launchable product."
**Delivers:** Stripe Connect billing with subscription management. Full offline Driver PWA with Background Sync. Onboarding wizard. PDF report generation. White-label infrastructure. Security hardening. Accessibility audit.
**Addresses:** Deferred features from FEATURES.md (billing, white-label, PDF reports, onboarding).
**Avoids:** Stripe webhook race conditions (Pitfall 4), offline sync data loss (Pitfall 5), Safari Background Sync incompatibility (Pitfall 5).
**Stack focus:** Stripe SDK, Serwist + idb-keyval (full offline), @react-pdf/renderer, isomorphic-dompurify.

### Phase Ordering Rationale

- **Phase 1 before 2:** Marie AI and smart routing are meaningless without loads, drivers, and dispatch data to query and act on. The intelligence layer has a hard dependency on the operational data layer.
- **Phase 2 before 3:** Marie needs to exist before Phase 3 so it can be extended with compliance, fleet, and CRM context. Proactive alerts also extend naturally to compliance deadlines and maintenance schedules.
- **Phase 3 before 4:** Billing should not gate features before the product has users. Cross-module integrations must exist before offline caching can determine what data to cache. Onboarding wizard needs all Phase 1-3 tables to populate.
- **Within Phase 1:** Auth -> Drivers/Vehicles -> Loads -> Dispatch -> Invoicing -> Dashboard -> Driver PWA shell. Each step depends on the previous.
- **Within Phase 3:** Compliance and Fleet can be built in parallel. CRM depends on load data for company revenue stats. Cross-module integrations come last because they connect all three modules.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Marie AI):** Claude API tool-use patterns for structured function calling, prompt engineering for logistics domain, token budget management, and action confirmation UX. The architecture is defined but implementation details need phase-specific research.
- **Phase 3 (Compliance):** FMCSA regulatory requirements for DQ file items, IFTA calculation rules, state-by-state filing requirements. Domain-specific regulatory knowledge that goes beyond software architecture.
- **Phase 3 (CRM):** Lane-based rate agreement data modeling, auto-updating revenue stats from load completions. Less documented than standard CRM patterns.
- **Phase 4 (Offline PWA):** Safari-specific PWA limitations (Background Sync unavailable, push notification quirks), IndexedDB storage patterns for sync queue, conflict resolution edge cases.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Next.js App Router, Supabase RLS, CRUD APIs, Realtime subscriptions, react-hook-form -- all extremely well-documented with established patterns. The research already covers everything needed.
- **Phase 4 (Stripe Connect):** Stripe documentation is comprehensive. Webhook idempotency patterns are well-established. The research already identifies the specific pitfalls and prevention strategies.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Every library validated against alternatives with version-specific rationale. Official docs and 2026 community sources confirm choices. No experimental dependencies. |
| Features | HIGH | Table stakes verified across 9+ competitor platforms. Differentiators validated against public feature sets. Anti-features aligned with PRD scope and market realities. |
| Architecture | HIGH | Route-group monolith, RLS multi-tenancy, Realtime channels, and stateless AI patterns all documented by official sources (Next.js, Supabase, Claude API). |
| Pitfalls | HIGH | Critical pitfalls verified through official documentation, GitHub discussions, and production postmortems. Prevention strategies are concrete and actionable. |

**Overall confidence:** HIGH

### Gaps to Address

- **ELD/telematics integration specifics:** PRD-03 references fuel card sync and IFTA GPS data but provides no integration specs. Motive and Samsara both have public APIs. Needs research when Phase 3 planning begins.
- **Vapi voice integration:** Listed in stack but implementation details are minimal. Need to research Vapi's Next.js integration, per-minute pricing implications, and how voice commands map to Marie's tool-use architecture.
- **Edge Function timeout limits at scale:** The compliance scanner and IFTA aggregator scan across all orgs using the service role key. At 500+ orgs, these may hit the 150-second timeout. Batching strategy defined but not validated.
- **Safari PWA limitations:** Background Sync API unavailable in Safari as of early 2026. Push notifications only available since iOS 16.4. Need to validate fallback strategies on real iOS devices during Phase 4.
- **QuickBooks/Xero integration:** Frequently requested by competitors' users. Not in any PRD phase. Should be evaluated for Phase 4 or post-launch based on early user feedback.
- **Multi-stop loads:** Single pickup/delivery covers most small carrier use cases, but LTL and multi-drop operations need this. Not in any PRD phase. Monitor customer demand.

## Sources

### Primary (HIGH confidence)
- [Next.js 15 vs 16 comparison](https://www.descope.com/blog/post/nextjs15-vs-nextjs16) -- version decision
- [Supabase RLS official docs](https://supabase.com/docs/guides/database/postgres/row-level-security) -- performance patterns
- [Supabase Realtime Architecture](https://supabase.com/docs/guides/realtime/architecture) -- channel design
- [Supabase Multi-Tenant RLS](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/) -- org isolation
- [Next.js Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) -- multi-mode architecture
- [Stripe Webhook Documentation](https://docs.stripe.com/webhooks) -- idempotency patterns
- [MDN: PWA Background Sync](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation) -- offline patterns
- [FMCSA MC Number Elimination](https://fastforwardtms.com/blogs/fmcsa-eliminates-mc-numbers/) -- compliance regulatory change
- [Vercel: Common App Router Mistakes](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them) -- client/server boundary

### Secondary (MEDIUM confidence)
- [TanStack Query + Supabase integration](https://makerkit.dev/blog/saas/supabase-react-query) -- caching + realtime pattern
- [Serwist PWA with Next.js](https://javascript.plainenglish.io/building-a-progressive-web-app-pwa-in-next-js-with-serwist-next-pwa-successor-94e05cb418d7) -- PWA setup
- [Stripe Webhook Race Conditions](https://dev.to/belazy/the-race-condition-youre-probably-shipping-right-now-with-stripe-webhooks-mj4) -- billing pitfall
- [TMS Implementation Lessons 2025](http://logisticsviewpoints.com/2025/12/29/the-state-of-transportation-systems-tms-lessons-from-2025/) -- domain patterns
- [LLM Engineering for Production](https://huyenchip.com/2023/04/11/llm-engineering.html) -- AI guardrails

### Tertiary (LOW confidence)
- Vapi voice integration -- limited documentation for Next.js integration patterns
- Edge Function timeout behavior at 500+ orgs -- theoretical, not validated

---
*Research completed: 2026-03-24*
*Ready for roadmap: yes*
