# Architecture Patterns

**Domain:** Logistics operations platform (multi-mode SaaS)
**Researched:** 2026-03-24

## Recommended Architecture

Manifest is a single Next.js 15 application serving three distinct user experiences (Command, Driver PWA, Owner-Operator) through App Router route groups, backed by Supabase as the unified data platform, with an external AI service on Railway. The architecture is a **route-group-partitioned monolith** -- one deployment, multiple UIs, shared data layer.

```
                    +------------------+
                    |     Vercel       |
                    |  Next.js 15 App  |
                    |                  |
          +---------+---------+--------+---------+
          |         |         |        |         |
      (marketing) (auth)   (app)   (driver)   API Routes
          |         |         |        |         |
       Public    Login/   Command   Driver    /api/*
       Pages     Signup   Mode      PWA       endpoints
                           |        |
                    +------+--------+------+
                    |                       |
                    |     Supabase          |
                    | +------------------+ |
                    | | PostgreSQL + RLS | |
                    | | Realtime         | |
                    | | Auth             | |
                    | | Edge Functions   | |
                    | | pg_cron          | |
                    | | Storage          | |
                    | +------------------+ |
                    +-----------+----------+
                                |
                    +-----------+----------+
                    |       Railway        |
                    |   Marie AI Service   |
                    |   (Claude API)       |
                    +----------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **(marketing) route group** | Public-facing pages: landing, pricing, about, terms, privacy | None (static, no auth required) |
| **(auth) route group** | Login, signup, invitation acceptance, onboarding wizard | Supabase Auth, profiles table |
| **(app) route group** | Full Command mode UI: dashboard, loads, dispatch, fleet, compliance, CRM, reports, settings | API routes, Supabase Realtime channels |
| **(driver) route group** | Driver PWA: current load, status updates, inspections, fuel, compliance | API routes, Supabase Realtime, Service Worker, IndexedDB |
| **API routes (/api/*)** | Business logic layer: CRUD, status transitions, validation, authorization | Supabase (via service role or user JWT), Marie service |
| **Supabase PostgreSQL** | All persistent data, RLS enforcement, data integrity | Edge Functions, pg_cron, Realtime |
| **Supabase Realtime** | Live push of load status, dispatch, alerts to connected clients | PostgreSQL (WAL-based change detection) |
| **Supabase Edge Functions** | Scheduled automation: compliance scans, maintenance monitoring, IFTA, snapshot generation, alert detection | PostgreSQL (service role key, bypasses RLS for cross-org scans) |
| **pg_cron** | Trigger Edge Functions on schedule (daily, hourly, every 30 min) | Edge Functions |
| **Supabase Storage** | File storage for BOLs, PODs, rate confirmations, inspection photos, compliance docs | RLS-scoped buckets by org_id |
| **Marie AI (Railway)** | Natural language ops assistant: queries, actions, proactive alerts | Claude API (LLM), Supabase (data reads via user-scoped JWT) |
| **Stripe Connect** | Subscription billing, plan enforcement, usage metering | API routes (webhooks), organizations table |

### Data Flow

**Primary flows in the system:**

**1. Load Lifecycle (the core loop)**
```
Dispatcher creates load (Command UI)
  -> POST /api/loads
  -> INSERT into loads table (RLS: org_id check)
  -> load-number-generator trigger fires
  -> Supabase Realtime broadcasts on org:{org_id}:loads channel
  -> All connected Command clients see new load
  -> Dispatcher assigns driver
  -> POST /api/dispatch
  -> INSERT into dispatches table
  -> Realtime broadcasts on org:{org_id}:dispatch
  -> Driver PWA receives push notification + realtime update
  -> Driver accepts, updates status through PWA
  -> POST /api/loads/{id}/status
  -> UPDATE loads, INSERT load_status_history
  -> Realtime broadcasts status change
  -> Command dashboard updates in real-time
```

**2. Marie AI Query Flow**
```
User types question in Marie chat panel
  -> POST /api/marie/query (Next.js API route)
  -> API route forwards to Railway Marie service with user JWT + org context
  -> Marie service reads from Supabase using user's JWT (RLS-scoped)
  -> Marie builds context from relevant tables (loads, drivers, dispatch, etc.)
  -> Marie calls Claude API with system prompt + context + user query
  -> Claude returns response
  -> Marie logs to marie_queries table
  -> Response returned to client
  -> If action requested: Marie calls back to Supabase to execute (create load, dispatch, etc.)
```

**3. Proactive Alert Pipeline**
```
pg_cron triggers Edge Function on schedule (e.g., every 30 min)
  -> Edge Function queries across all orgs (service role key, no RLS)
  -> Detects conditions: late pickup risk, driver silent, ETA risk, etc.
  -> INSERTs into proactive_alerts table (per-org)
  -> Realtime broadcasts to relevant org channels
  -> Push notification sent via Web Push API
  -> Marie digest includes unacknowledged alerts when user opens chat
```

**4. Driver PWA Offline Flow**
```
Driver goes offline (tunnel, rural area, etc.)
  -> Service Worker intercepts failed network requests
  -> Status updates queued in IndexedDB sync queue
  -> UI shows optimistic update with "pending sync" indicator
  -> When connectivity returns:
  -> Background Sync API triggers replay
  -> Queued mutations sent to API in order
  -> Server reconciles (last-write-wins by timestamp)
  -> IndexedDB cache updated with server response
  -> Pending indicators cleared
```

**5. Cross-Module Integration Flow (Phase 3)**
```
Load delivered (status -> 'delivered')
  -> load-status-broadcaster Edge Function fires
  -> CRM: crm_companies.total_revenue updated, system activity logged
  -> CRM: crm_lanes.total_runs incremented, avg_rate recalculated
  -> Compliance: driver hours checked against qualification status

Fuel transaction logged
  -> INSERT into fuel_transactions
  -> Fleet: vehicle odometer updated, MPG recalculated
  -> IFTA: ifta_records updated for jurisdiction + quarter
  -> Fleet: cost-per-mile recalculated

Inspection completed
  -> INSERT into inspections
  -> Compliance: compliance_items auto-completed (annual_inspection)
  -> Compliance: next inspection scheduled based on recurrence_rule
  -> Fleet: vehicle status updated if inspection failed
```

## Patterns to Follow

### Pattern 1: Route Group Isolation with Shared Layouts

**What:** Each mode gets its own route group with its own root layout, navigation, and responsive behavior. Shared UI components live in `src/components/ui/`. Mode-specific components live in `src/components/{module}/`.

**When:** Always. This is the foundational structural pattern.

**Why:** Navigating between route groups with different root layouts triggers a full page reload in Next.js App Router. This is acceptable because users do not switch between Command and Driver modes -- they live in one mode. The full reload boundary actually helps by preventing state leakage between modes.

**Example:**
```
app/
  (marketing)/
    layout.tsx          # Marketing layout: no sidebar, public nav
    page.tsx            # Landing page
    pricing/page.tsx
  (auth)/
    layout.tsx          # Auth layout: centered card, no nav
    login/page.tsx
    signup/page.tsx
  (app)/
    layout.tsx          # Command layout: sidebar nav, header, Marie button
    dashboard/page.tsx
    loads/page.tsx
    loads/[id]/page.tsx
    dispatch/page.tsx
    fleet/
      page.tsx
      vehicles/[id]/page.tsx
      maintenance/page.tsx
    compliance/
      page.tsx
      items/page.tsx
      drivers/page.tsx
      ifta/page.tsx
    crm/
      page.tsx
      companies/[id]/page.tsx
      lanes/page.tsx
  (driver)/
    layout.tsx          # Driver layout: bottom tab nav, mobile-first
    dashboard/page.tsx
    loads/page.tsx
    dispatch/page.tsx
    inspections/page.tsx
    fuel/page.tsx
```

**Confidence:** HIGH (official Next.js docs confirm route group behavior)

### Pattern 2: RLS-First Data Access with Helper Function

**What:** Every table has `org_id`. Every RLS policy resolves the current user's org via a subquery on `profiles`. Use a reusable helper function in PostgreSQL rather than inline subqueries.

**When:** Every table, every policy. No exceptions.

**Why:** Inline subqueries like `(SELECT org_id FROM profiles WHERE id = auth.uid())` in every policy create repetition and risk inconsistency. A PostgreSQL function is cleaner and can be indexed.

**Example:**
```sql
-- Create a helper function (runs once, cached per transaction)
CREATE OR REPLACE FUNCTION auth.org_id()
RETURNS uuid AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Use in all RLS policies
CREATE POLICY "org_isolation" ON loads
  USING (org_id = auth.org_id());

CREATE POLICY "org_isolation" ON dispatches
  USING (org_id = auth.org_id());

-- Index org_id on every table for RLS performance
CREATE INDEX idx_loads_org_id ON loads(org_id);
CREATE INDEX idx_dispatches_org_id ON dispatches(org_id);
```

**Confidence:** HIGH (well-documented Supabase multi-tenant pattern, confirmed by multiple sources)

### Pattern 3: Realtime Channel Scoping by Organization

**What:** All Supabase Realtime channels are scoped by `org_id` in the channel name. Clients subscribe to `org:{org_id}:loads`, `org:{org_id}:dispatch`, etc.

**When:** Any data that needs live updates across connected clients.

**Why:** Prevents cross-org data leakage at the channel level. RLS also protects the underlying data, but channel scoping means clients never even receive events from other orgs.

**Example:**
```typescript
// Client-side subscription (in a React hook)
const channel = supabase
  .channel(`org:${orgId}:loads`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'loads',
      filter: `org_id=eq.${orgId}`,
    },
    (payload) => {
      // Update local state with new load data
      updateLoadInCache(payload.new);
    }
  )
  .subscribe();
```

**Confidence:** HIGH (Supabase Realtime docs confirm filter-based subscriptions on postgres_changes)

### Pattern 4: Edge Function as Scheduled Job Runner

**What:** Supabase Edge Functions invoked by pg_cron handle all background automation. They run with the service role key (bypassing RLS) to scan across all orgs, but write results scoped to each org.

**When:** Compliance scanning, alert generation, snapshot aggregation, maintenance monitoring, CRM stats rollup.

**Why:** No external workflow engine (no n8n). Edge Functions are Deno-based, cold-start in <500ms, and pg_cron is included with Supabase Pro. This covers all scheduled automation needs without additional infrastructure.

**Caution:** Edge Functions have a 150-second timeout (Supabase Pro) and 256MB memory limit. For cross-org batch scans, process orgs in chunks if the fleet grows large.

**Example:**
```sql
-- pg_cron schedule
SELECT cron.schedule(
  'compliance-scanner',
  '0 6 * * *',  -- daily at 6 AM UTC
  $$SELECT net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/compliance-scanner',
    headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
  )$$
);
```

**Confidence:** MEDIUM (pg_cron + Edge Functions is documented, but timeout limits need validation at scale)

### Pattern 5: Stateless AI with Per-Request Context Rebuild

**What:** Marie has no conversation memory. Each query rebuilds context by reading relevant database tables scoped to the user's org, constructing a system prompt with current operational state, and sending it to Claude API.

**When:** Every Marie interaction.

**Why:** Stateless design avoids stale context problems (logistics data changes constantly -- loads move, drivers update status, invoices get paid). Rebuilding from the database guarantees Marie always has current information. It also simplifies RLS compliance -- Marie reads through the user's JWT, so she only sees what the user can see.

**Context assembly strategy:**
```
1. Receive user query + user JWT + org_id
2. Classify query intent (question / action / alert-response)
3. Based on intent, fetch relevant context:
   - Load questions: recent loads, active dispatches, driver assignments
   - Financial questions: invoices, daily_snapshots, rate data
   - Compliance questions: compliance_items, alerts, driver_qualifications
   - Fleet questions: vehicles, maintenance_records, fuel_transactions
   - CRM questions: crm_companies, crm_lanes, rate_agreements
4. Assemble system prompt with org profile + fetched context
5. Send to Claude API
6. Parse response, execute any actions, return to client
```

**Confidence:** HIGH (PRD explicitly mandates this pattern; aligns with Claude API stateless design)

### Pattern 6: Offline-First PWA with Sync Queue

**What:** The Driver PWA uses a service worker + IndexedDB for offline capability. Critical read data (current load, dispatch info, vehicle details) is cached in IndexedDB. Write operations (status updates, fuel logs, inspection entries) go to a sync queue when offline.

**When:** Driver PWA only. Command mode is online-only.

**Architecture:**
```
[Driver UI] <-> [Service Worker] <-> [Network / API]
     |                |
     v                v
  [React State]   [IndexedDB]
                    |-- load_cache (current + recent loads)
                    |-- dispatch_cache (active dispatch)
                    |-- vehicle_cache (assigned vehicle)
                    |-- sync_queue (pending mutations)
```

**Key decisions:**
- **Cache strategy:** Stale-while-revalidate for load data. Cache-first for static assets.
- **Sync queue:** FIFO replay when online. Each entry has a timestamp, entity type, and operation payload.
- **Conflict resolution:** Last-write-wins by server timestamp. Drivers typically do not edit the same records simultaneously -- status updates are sequential by nature (at_pickup -> loaded -> at_delivery -> delivered).
- **Background Sync API:** Use where available (Chromium browsers). Fallback to periodic sync check on app focus for Safari/Firefox.
- **Storage limit:** IndexedDB has effectively unlimited storage on most mobile browsers, but keep cache lean -- only current load, active dispatch, assigned vehicle, and last 30 days of history.

**Confidence:** MEDIUM (Background Sync API has limited browser support in Safari as of 2025; fallback strategies needed)

### Pattern 7: API Route Layer as Business Logic Boundary

**What:** All mutations go through Next.js API routes (`/api/*`), never direct Supabase client writes from the frontend. API routes handle validation, authorization beyond RLS, status transition rules, side effects (Realtime broadcasts, cross-table updates), and audit logging.

**When:** All write operations. Read operations can use the Supabase client directly (RLS handles authorization).

**Why:** Some business rules cannot be expressed in RLS alone. Load status transitions must follow a valid state machine (you cannot go from `booked` to `delivered`). Dispatch creation must check for conflicts. Invoice creation must verify the load is in `delivered` status. API routes are the right place for this logic.

**Example:**
```typescript
// /api/loads/[id]/status/route.ts
export async function POST(req: Request, { params }) {
  const { newStatus } = await req.json();
  const load = await getLoad(params.id); // RLS-scoped read

  // Business rule: valid transitions
  const validTransitions: Record<string, string[]> = {
    booked: ['dispatched', 'canceled'],
    dispatched: ['in_transit', 'canceled'],
    in_transit: ['at_pickup', 'canceled'],
    at_pickup: ['loaded', 'canceled'],
    loaded: ['at_delivery', 'canceled'],
    at_delivery: ['delivered', 'canceled'],
    delivered: ['invoiced'],
    invoiced: ['paid'],
  };

  if (!validTransitions[load.status]?.includes(newStatus)) {
    return Response.json({ error: 'Invalid status transition' }, { status: 400 });
  }

  // Execute transition + side effects
  await updateLoadStatus(load.id, newStatus, userId);
  // load_status_history INSERT happens via DB trigger
  // Realtime broadcast happens via postgres_changes
}
```

**Confidence:** HIGH (standard pattern for Next.js + Supabase applications)

## Anti-Patterns to Avoid

### Anti-Pattern 1: Direct Supabase Writes from Client for Mutations

**What:** Using `supabase.from('loads').update(...)` directly in React components for state-changing operations.

**Why bad:** Bypasses business logic validation. Cannot enforce status transition rules. Cannot trigger coordinated side effects (updating CRM stats when a load delivers). Makes it impossible to add audit logging consistently.

**Instead:** All mutations go through `/api/*` routes. Client reads can use Supabase client directly (RLS handles it).

### Anti-Pattern 2: Storing Session/Conversation History for Marie

**What:** Adding a `marie_conversations` table to maintain chat history across sessions.

**Why bad:** Logistics data changes constantly. A conversation from 2 hours ago about "active loads" would reference stale data. Maintaining conversation context also creates RLS complexity and storage growth. The PRD explicitly prohibits this.

**Instead:** Stateless per-request with context rebuilt from live database state.

### Anti-Pattern 3: Shared Root Layout Across All Route Groups

**What:** Using a single `app/layout.tsx` with conditional rendering based on route or role.

**Why bad:** Creates a massive layout component that handles sidebar for Command, bottom tabs for Driver, no nav for Marketing, and centered cards for Auth. Becomes unmaintainable. Breaks code-splitting because all layout code ships to all users.

**Instead:** Each route group gets its own layout. Accept the full-page reload between groups (users do not switch between modes during a session).

### Anti-Pattern 4: Using RLS Alone for Role-Based Access

**What:** Trying to enforce dispatcher-cannot-access-billing or driver-can-only-see-own-loads entirely through RLS policies.

**Why bad:** RLS works well for org isolation (org_id check). It becomes complex and fragile for fine-grained role checks that involve multiple conditions. Policies that join profiles to check role for every row access create performance issues.

**Instead:** RLS handles org isolation. Role-based access is enforced in middleware and API routes. The `(driver)` route group only exposes driver-appropriate pages. API routes check `profile.role` before executing privileged operations.

### Anti-Pattern 5: Polling for Real-Time Updates

**What:** Using `setInterval` to fetch load status or dispatch updates every N seconds.

**Why bad:** Wastes bandwidth, increases server load, creates visible lag (up to N seconds stale). Supabase Realtime exists specifically to solve this.

**Instead:** Subscribe to Supabase Realtime channels for live updates. Use `postgres_changes` events filtered by `org_id`.

## Scalability Considerations

| Concern | At 10 orgs (launch) | At 500 orgs | At 5,000 orgs |
|---------|---------------------|-------------|---------------|
| **Database** | Supabase Pro handles easily | Add read replicas for analytics queries, partition large tables (loads, load_status_history) by date | Consider dedicated Supabase instance or self-hosted PostgreSQL |
| **RLS Performance** | Negligible overhead | Index org_id on all tables, use `auth.org_id()` helper function (cached per transaction) | Monitor query plans for RLS policy evaluation cost |
| **Realtime Connections** | ~50-100 concurrent WebSocket connections | ~5,000 connections, within Supabase Pro limits | May need Supabase Enterprise or custom Realtime infrastructure |
| **Edge Functions** | Light load, well within limits | Batch cross-org scans by org chunks to stay within 150s timeout | Consider moving heavy batch jobs to Railway or a dedicated worker |
| **Marie (Railway)** | Single instance sufficient | Horizontal scale Railway service, implement request queuing | Rate limit per org, cache common query patterns, consider Claude prompt caching |
| **Storage** | Minimal (BOLs, PODs, photos) | Monitor storage costs, implement lifecycle policies for old documents | CDN layer for frequently accessed documents |
| **Offline Sync** | Simple last-write-wins | Still fine -- drivers operate on their own loads | No change needed; offline sync is inherently per-driver scoped |

## Suggested Build Order (Dependencies)

The architecture reveals a clear dependency chain that maps to the PRD phases but with more granular sub-steps:

### Phase 1: Foundation (must be first)

**Build order within Phase 1:**
1. **Supabase setup + schema** -- Organizations, profiles, org_members tables with RLS. The `auth.org_id()` helper function. This is the foundation everything depends on.
2. **Auth flow** -- Signup, login, org creation, role assignment. Without auth, nothing else works.
3. **Drivers + Vehicles tables** -- Basic registry (vehicles table needed even in Phase 1 as loads reference vehicle_id).
4. **Loads + Load Status History** -- Core domain entity. Status state machine in API routes. Realtime channel setup.
5. **Dispatch** -- Depends on loads, drivers, vehicles all existing.
6. **Invoicing** -- Depends on loads being in "delivered" status.
7. **Dashboard** -- Depends on loads, dispatch, invoices for stat cards.
8. **Driver PWA shell** -- Route group, mobile layout, basic load view. Offline capability deferred to Phase 4.

**Why this order:** Each step depends on the previous. You cannot dispatch without loads, cannot invoice without delivered loads, cannot show a dashboard without data to display.

### Phase 2: Intelligence (requires all of Phase 1)

**Build order within Phase 2:**
1. **Proactive alerts schema + edge functions** -- These are database triggers and scheduled functions. No UI dependency.
2. **Push notifications** -- Service worker registration, Web Push API setup. Needed by alerts.
3. **Analytics foundation** -- daily_snapshots table, daily-snapshot-generator edge function.
4. **Dashboard charts** -- Recharts integration using daily_snapshots data.
5. **Marie AI service on Railway** -- Standalone service, can be developed in parallel with items 1-4. Needs loads/dispatch/drivers data to query.
6. **Marie UI** -- Chat panel, alert badge, action buttons. Depends on Marie service being functional.
7. **Smart routing** -- API endpoint using driver location, performance history, equipment. Depends on having load + driver data.
8. **Enhanced dispatch board** -- Map view, timeline view, conflict detection. Depends on smart routing + Realtime.

**Why this order:** Backend services (alerts, snapshots, Marie) can be built before their UI surfaces. Marie needs operational data to query, so Phase 1 must be complete.

### Phase 3: Compliance + Fleet + CRM (requires Phase 2 for Marie integration)

**Build order within Phase 3:**
1. **Compliance schema + scanner edge function** -- Tables, RLS, automated scanning. Foundation for the module.
2. **Compliance UI** -- Dashboard, items list, DQ file tracker. Depends on schema.
3. **Fleet/Vehicles expansion** -- Expanded vehicles table, maintenance, fuel transactions. Some vehicle data exists from Phase 1.
4. **Fleet UI** -- Vehicle detail, maintenance center, fuel dashboard.
5. **CRM schema + stats updater** -- Companies, contacts, lanes, rate agreements, activities.
6. **CRM UI** -- Company list, lane board, activity feed.
7. **Cross-module integrations** -- Load completion -> CRM update, fuel -> IFTA, inspection -> compliance. Depends on all three modules existing.
8. **Marie context expansion** -- Add compliance, fleet, and CRM context to Marie's query handler.

**Why this order:** Compliance and Fleet can be built in parallel since they are relatively independent. CRM builds on top (needs load data for company revenue). Cross-module integrations come last because they connect everything.

### Phase 4: Scale + Polish (requires Phase 3)

**Build order within Phase 4:**
1. **Stripe Connect integration** -- Billing plans, subscription management, usage tracking.
2. **Onboarding wizard** -- Guided setup for new orgs: business profile, first vehicle, first driver.
3. **Driver PWA offline capability** -- Service worker, IndexedDB caching, sync queue, Background Sync.
4. **Reporting + PDF export** -- PDF generation for invoices, compliance reports, analytics reports.
5. **White-label infrastructure** -- CSS custom properties, configurable branding per org.
6. **Security hardening** -- CSRF, rate limiting, input sanitization, CSP headers.
7. **Accessibility audit** -- WCAG 2.1 AA compliance across all modes.

**Why this order:** Billing must exist before launch. Onboarding makes the first-run experience smooth. Offline PWA, reports, and polish are launch-readiness features.

## Key Architectural Decisions and Rationale

| Decision | Rationale | Risk |
|----------|-----------|------|
| Single Next.js app with route groups | One deployment, shared components, simpler CI/CD. Route groups provide mode isolation without separate repos. | Full page reload between groups (acceptable -- users stay in one mode) |
| Supabase as unified backend | DB + auth + realtime + edge functions + storage + cron in one service. Minimizes infrastructure ops for a small team. | Vendor lock-in. Supabase Pro plan limits become relevant at scale. |
| Marie on Railway (not Edge Functions) | AI agent needs >150s timeout for complex queries and >256MB memory for context assembly. Railway allows long-running processes. | Adds a second hosting provider. Must manage Railway separately. |
| API routes for mutations, Supabase client for reads | Business logic centralized in API layer. Reads leverage RLS directly for simplicity. | Reads bypass API validation -- fine because RLS handles authorization, and reads have no side effects. |
| Last-write-wins for offline sync | Drivers update their own loads sequentially. Conflicts are rare and low-severity (a delayed status update is not catastrophic). | If two dispatchers edit the same load simultaneously, one overwrites the other. Mitigated by Realtime showing live updates. |
| No conversation history for Marie | Stale context in logistics is dangerous. Always-fresh database queries ensure accuracy. | Marie cannot reference "what we discussed earlier." Users must re-state context if related follow-up. |

## Sources

- [Next.js Route Groups docs](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Supabase Realtime Architecture](https://supabase.com/docs/guides/realtime/architecture)
- [Supabase RLS Best Practices (MakerKit)](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices)
- [Multi-Tenant Applications with RLS on Supabase (AntStack)](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/)
- [Offline-first frontend apps in 2025 (LogRocket)](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [Advanced PWA: Offline, Push & Background Sync](https://rishikc.com/articles/advanced-pwa-features-offline-push-background-sync/)
- [Offline and background operation (MDN)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)
- [Supabase RLS Guide (Design Revision)](https://designrevision.com/blog/supabase-row-level-security)
- [Stateful vs Stateless AI Agents (Tacnode)](https://tacnode.io/post/stateful-vs-stateless-ai-agents-practical-architecture-guide-for-developers)
