# Phase 5: Marie AI & Smart Routing - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Marie AI operations assistant and smart routing driver suggestions. Marie is a slide-out chat panel that answers questions about operations, executes actions (create load, dispatch driver, generate invoice), and summarizes proactive alerts. Smart routing provides ranked driver suggestions when dispatching. No predictive alerts (Phase 6), no push notifications (Phase 6), no enhanced dispatch board (Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Marie AI Architecture
- Marie runs on Railway as a standalone service via Claude API — NOT embedded in the Next.js app
- However, for Phase 5 MVP, the Marie API route can live inside the Next.js app at /api/marie/query as a proxy to Claude API
- Marie is stateless — no conversation history table. Context rebuilt from database per request
- Marie queries logged to marie_queries table with tokens_used, latency_ms, model, success, error_message
- Marie scoped to requesting user's org via RLS — she never sees cross-org data
- Marie respects user roles — driver cannot execute admin actions
- Marie's Claude API calls include org context and user role in the system prompt

### Marie Capabilities
- **Questions:** "How many loads delivered this week?", "Average revenue per mile this month?", "Which driver has the most loads?"
- **Actions:** "Create a load from Dallas to Houston, dry van, $2,800 flat rate", "Dispatch driver Johnson to load #4530", "Generate invoice for load #4521"
- **Alert summary:** When chat opens, Marie summarizes unacknowledged proactive alerts (wired in Phase 6)
- Actions implemented as Claude tool_use — Marie calls tools that map to existing server actions (createLoad, createDispatch, createInvoiceFromLoad)

### Marie UI
- Slide-out panel on right side, triggered by floating Marie button (bottom-right)
- Text input at bottom, conversation thread above
- Marie responses include inline action buttons when relevant ("View this load", "Dispatch this driver")
- Alert badge on Marie button shows unacknowledged alert count (placeholder — wired in Phase 6)
- Available in Command and Owner-Operator modes
- Driver PWA: simplified Marie chat for driver-scoped questions only (no action execution)

### Marie Queries Schema
- marie_queries table per PRD-02 Section 2.3: id, org_id, user_id, query_text, response_text, query_type, tokens_used, latency_ms, model, success, error_message, created_at
- RLS: org_id isolation

### Smart Routing
- API endpoint POST /api/dispatch/suggest with body { load_id }
- Returns ranked array of { driver_id, score, factors: { proximity, availability, equipment, performance, lane } }
- 5 ranking factors: proximity to pickup (30%), availability (25%), equipment match (20%), on-time performance (15%), lane familiarity (10%)
- Proximity: compare driver's last delivery location vs load pickup (approximation using city/state, not GPS)
- Availability: driver status = active AND no current non-terminal dispatch
- Equipment: driver's current_vehicle.vehicle_type matches load.equipment_type
- Performance: historical on-time delivery % from load_status_history
- Lane familiarity: count of previous loads on same origin-destination city pair
- Dispatch UI shows "Suggested" tab with ranked recommendations and score breakdown
- One-click assign from suggestion list
- Override button for manual selection (already exists from Phase 3)

### Design Patterns (carried forward)
- Server actions for mutations, API routes for complex logic (Marie query, smart routing)
- Zod schemas for validation
- Supabase server client for data access
- All existing UI patterns from Phases 1-4

### Claude's Discretion
- Exact Marie system prompt construction and tool definitions
- Chat panel animation and styling
- How to display inline action buttons in Marie responses
- Score visualization in smart routing suggestions
- Error handling for Claude API failures/timeouts
- Rate limiting approach for Marie queries

</decisions>

<specifics>
## Specific Ideas

- Marie should feel like talking to a dispatcher who knows your whole operation — not a generic chatbot
- "Operator voice" per cursorrules — write like you're talking to someone who runs trucks, not TechCrunch
- Marie responses should be concise and actionable, not verbose
- Smart routing suggestions should show WHY a driver ranked where they did — the breakdown matters for dispatchers to trust the system
- The floating Marie button should use the #EC008C brand pink

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/(app)/loads/actions.ts` — createLoad action that Marie can call as a tool
- `src/app/(app)/dispatch/actions.ts` — createDispatch action for Marie tool_use
- `src/app/(app)/invoices/actions.ts` — createInvoiceFromLoad for Marie tool_use
- `src/lib/supabase/server.ts` — Server client for Marie's database queries
- `src/lib/supabase/admin.ts` — Admin client if Marie needs cross-table queries
- `src/types/database.ts` — All entity types Marie needs to query
- `src/components/dispatch/dispatch-assignment-form.tsx` — Integrate smart routing suggestions here
- `src/app/(app)/dispatch/dispatch-board.tsx` — Add "Suggested" tab to dispatch board

### Established Patterns
- API route pattern: `src/app/api/invoices/[id]/pdf/route.ts` — Pattern for Marie API route
- Server action pattern for all mutations
- Supabase queries with RLS for data access

### Integration Points
- Marie button added to (app) layout and driver layout
- Smart routing integrated into dispatch board's assignment flow
- Marie tools map directly to existing server actions
- ANTHROPIC_API_KEY env variable needed

</code_context>

<deferred>
## Deferred Ideas

- Proactive alerts generated by edge functions — Phase 6
- Marie alert digest when chat opens — Phase 6 (needs proactive_alerts table)
- Push notifications for Marie alerts — Phase 6
- Voice-enabled Marie via Vapi — Future (post-Phase 12)
- Marie conversation history — explicitly out of scope per PRD (stateless by design)
- Railway deployment of Marie service — use Next.js API route for now, extract later

</deferred>

---

*Phase: 05-marie-ai-smart-routing*
*Context gathered: 2026-03-25*
