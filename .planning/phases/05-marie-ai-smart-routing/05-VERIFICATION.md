---
phase: 05-marie-ai-smart-routing
verified: 2026-03-25T03:05:00Z
status: gaps_found
score: 4/5 success criteria verified
gaps:
  - truth: "Marie summarizes unacknowledged alerts on open (MARI-09)"
    status: failed
    reason: "No open-triggered alert query exists in MariePanel, MarieChat, or MarieDriverChat. The proactive_alerts table exists but nothing reads from it when the panel opens. The phase context file explicitly defers this behavior to Phase 6. Plan 02 claims MARI-09 complete but the code contradicts it."
    artifacts:
      - path: "src/components/marie/marie-panel.tsx"
        issue: "No useEffect triggered by isOpen state change that queries proactive_alerts or sends an alert summary query to Marie"
      - path: "src/components/marie/marie-driver-chat.tsx"
        issue: "No open-triggered alert summary logic"
    missing:
      - "useEffect in MariePanel (or useMarie hook) that fires when isOpen transitions to true"
      - "Query to supabase proactive_alerts for unacknowledged alerts scoped to org"
      - "Automatic sendQuery call summarizing any unacknowledged alerts found"
human_verification:
  - test: "Open Marie panel with unacknowledged proactive_alerts in DB"
    expected: "Marie automatically sends an alert summary message as the first message in the chat thread"
    why_human: "Requires live DB with proactive_alerts rows and ANTHROPIC_API_KEY configured"
  - test: "Verify action buttons in Marie response navigate correctly"
    expected: "view_load navigates to /loads/[id], dispatch_driver to /dispatch, generate_invoice to /invoices?generate=[id]"
    why_human: "Requires live app with authenticated session"
  - test: "Verify driver Marie strips all action buttons from responses"
    expected: "Driver sees plain text responses with no clickable action buttons"
    why_human: "Requires live app with driver role session"
---

# Phase 5: Marie AI & Smart Routing — Verification Report

**Phase Goal:** Users can interact with an AI operations assistant that answers questions about their operations and executes actions, and dispatchers get ranked driver suggestions when assigning loads
**Verified:** 2026-03-25T03:05:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Marie chat opens as slide-out panel in Command and Owner-Operator modes, answering questions about loads, drivers, invoices, and dispatch | VERIFIED | `MarieButton` in `src/app/(app)/layout.tsx` renders `MariePanel` (400px right slide-out). API route `/api/marie/query` fetches org context including loads, drivers, invoices, dispatches via `buildOrgContext`. |
| 2 | Marie can execute actions (create load, dispatch driver, generate invoice) with role-based restrictions and inline action buttons | VERIFIED | `getMarieTools` returns empty array for driver/viewer, 3 tools for admin/dispatcher. `executeTool` dispatches to `createLoadForMarie`, `createDispatchForMarie`, `createInvoiceForMarie`. `MarieMessage` parses `[ACTION:type:id:label]` into clickable buttons. |
| 3 | Marie is stateless per request, org-scoped via RLS, and logs all queries with tokens and latency | VERIFIED | System prompt is rebuilt from DB each request (no session state). RLS enforced via user's supabase client in context builder. `marie_queries` insert logs `tokens_used`, `latency_ms`, `model`, `success`. Both success and error paths log. |
| 4 | Driver PWA has simplified Marie chat for driver-scoped questions and Marie summarizes unacknowledged alerts on open | FAILED | `MarieDriverChat` exists in driver layout, strips action markers, uses `useMarie` hook — driver chat is VERIFIED. Alert summarization on open is NOT implemented. `MariePanel` has no `useEffect` triggered by open state, `proactive_alerts` table is never queried from any Marie UI component. |
| 5 | Smart routing returns ranked driver suggestions (proximity, availability, equipment, performance, lane familiarity) with one-click assign in dispatch UI | VERIFIED | `/api/dispatch/suggest` returns `DriverSuggestion[]` scored by 5 weighted factors. `DriverSuggestions` component renders ranked cards with factor breakdown bars. `DispatchAssignmentForm` has Suggested (default) and Manual tabs. Assign button calls `createDispatch`. 61 tests pass. |

**Score:** 4/5 success criteria verified (MARI-09 gap blocks full goal achievement)

---

## Required Artifacts

| Artifact | Status | Evidence |
|----------|--------|----------|
| `supabase/migrations/00017_marie_queries.sql` | VERIFIED | Creates `marie_queries` + `proactive_alerts` tables with RLS policies on org_id, indexes on both tables |
| `src/app/api/marie/query/route.ts` | VERIFIED | Full tool_use loop, max 5 iterations, role-filtered tools, query logging to `marie_queries` |
| `src/lib/marie/tools.ts` | VERIFIED | Exports `marieTools` (3 tools), `getMarieTools` (role filter), `executeTool` (dispatcher) |
| `src/lib/marie/system-prompt.ts` | VERIFIED | Exports `buildSystemPrompt`, includes org context, user role, action button format instructions |
| `src/lib/marie/actions.ts` | VERIFIED | Exports `createLoadForMarie`, `createDispatchForMarie`, `createInvoiceForMarie` — plain objects, no FormData/redirect |
| `src/app/api/dispatch/suggest/route.ts` | VERIFIED | Authenticates, fetches load, calls `scoreDriversForLoad`, returns `{ suggestions }` |
| `src/lib/routing/scoring.ts` | VERIFIED | Exports `WEIGHTS`, `calculateScore`, `scoreDriversForLoad` — sorts descending, returns top 10 |
| `src/types/marie.ts` | VERIFIED | `MarieMessage`, `MarieQueryRequest`, `MarieQueryResponse`, `ActionButton`, `DriverSuggestion`, `ScoringFactors` |
| `src/components/marie/marie-button.tsx` | VERIFIED | Fixed bottom-right, `#EC008C` pink, `Sparkles` icon, alert badge, toggles `MariePanel` |
| `src/components/marie/marie-panel.tsx` | VERIFIED (partial) | Slide-out 400px right, backdrop, X close — but no open-triggered alert summary |
| `src/components/marie/marie-chat.tsx` | VERIFIED | Auto-scroll, typing indicator, Enter-to-send |
| `src/components/marie/marie-message.tsx` | VERIFIED | Parses `[ACTION:type:id:label]` regex, renders inline action buttons, user/assistant alignment |
| `src/components/marie/use-marie.ts` | VERIFIED | `sendQuery` POSTs to `/api/marie/query`, error fallback message |
| `src/components/marie/marie-driver-chat.tsx` | VERIFIED | Full-screen slide-up, strips action markers, uses `useMarie` hook |
| `src/components/dispatch/driver-suggestions.tsx` | VERIFIED | Fetches `/api/dispatch/suggest`, renders ranked cards, score color coding, 5-factor breakdown bars, one-click assign |
| `src/components/dispatch/dispatch-assignment-form.tsx` | VERIFIED | Suggested (default) + Manual tabs, `DriverSuggestions` in suggested tab, existing form in manual tab |

---

## Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|----------|
| `src/app/api/marie/query/route.ts` | `src/lib/marie/tools.ts` | `executeTool(` call | WIRED | Line 83: `const result = await executeTool(block.name, block.input...)` |
| `src/lib/marie/tools.ts` | `src/lib/marie/actions.ts` | utility action imports | WIRED | Lines 7-10: imports `createLoadForMarie`, `createDispatchForMarie`, `createInvoiceForMarie`; dispatched in `executeTool` switch |
| `src/app/api/dispatch/suggest/route.ts` | `src/lib/routing/scoring.ts` | `scoreDriversForLoad` | WIRED | Line 6: `import { scoreDriversForLoad }`, line 43: `await scoreDriversForLoad(supabase, load)` |
| `src/components/marie/use-marie.ts` | `/api/marie/query` | `fetch` POST | WIRED | Line 16: `fetch('/api/marie/query', { method: 'POST', ... })` |
| `src/app/(app)/layout.tsx` | `src/components/marie/marie-button.tsx` | component import | WIRED | Line 6: `import { MarieButton }`, line 31: `<MarieButton />` |
| `src/app/driver/layout.tsx` | `src/components/marie/marie-driver-chat.tsx` | component import | WIRED | Line 7: `import { MarieDriverChat }`, line 26: `<MarieDriverChat />` |
| `src/components/dispatch/driver-suggestions.tsx` | `/api/dispatch/suggest` | `fetch` POST | WIRED | Line 48: `fetch('/api/dispatch/suggest', { method: 'POST', ... })` |
| `src/components/dispatch/driver-suggestions.tsx` | `src/app/(app)/dispatch/actions.ts` | `createDispatch` | WIRED | Line 5: `import { createDispatch }`, line 87: `await createDispatch(formData)` |
| `MariePanel` | `proactive_alerts` (MARI-09) | open-triggered query | NOT WIRED | No `useEffect` on `isOpen`, no query to `proactive_alerts`, no automatic alert summary on open |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| MARI-01 | 05-02 | Marie chat panel opens as slide-out from any page in Command and Owner-Operator modes | SATISFIED | `MarieButton` in `(app)/layout.tsx` renders slide-out `MariePanel` on all Command/Owner-Op pages |
| MARI-02 | 05-01 | Marie answers natural language questions about loads, drivers, invoices, and dispatch | SATISFIED | `buildOrgContext` fetches all 4 data types; Claude responds with org context in system prompt |
| MARI-03 | 05-01 | Marie can execute actions: create load, dispatch driver, generate invoice | SATISFIED | 3 tool definitions, `executeTool` dispatcher, utility action wrappers all verified |
| MARI-04 | 05-01 | Marie queries are stateless — context rebuilt from database per request | SATISFIED | No session state; `buildSystemPrompt` called fresh on every POST |
| MARI-05 | 05-01 | Marie is scoped to requesting user's org via RLS | SATISFIED | Supabase client with user auth used for all context queries; RLS policies on `marie_queries` |
| MARI-06 | 05-01 | Marie respects user roles (driver cannot execute admin actions) | SATISFIED | `getMarieTools` returns `[]` for driver/viewer; system prompt includes role restriction text |
| MARI-07 | 05-01 | Marie queries logged to marie_queries table with tokens, latency, model | SATISFIED | Both success and error paths insert to `marie_queries` with `tokens_used`, `latency_ms`, `model` |
| MARI-08 | 05-02 | Driver PWA has simplified Marie chat for driver-scoped questions | SATISFIED | `MarieDriverChat` in `driver/layout.tsx`, full-screen mobile chat, strips action markers |
| MARI-09 | 05-02 | Marie summarizes unacknowledged proactive alerts when chat opens | BLOCKED | No open-triggered alert query. `proactive_alerts` table exists but UI never reads it. Phase context explicitly defers this to Phase 6. Plan 02 claims this requirement but no implementation exists. |
| MARI-10 | 05-02 | Marie responses include inline action buttons (dispatch, view load, generate invoice) | SATISFIED | `MarieMessage` parses `[ACTION:type:id:label]` regex, renders clickable buttons, navigates via `useRouter` |
| ROUT-01 | 05-01 | API endpoint returns ranked driver suggestions for a load | SATISFIED | `/api/dispatch/suggest` POST returns `{ suggestions: DriverSuggestion[] }` sorted by score |
| ROUT-02 | 05-01 | Ranking considers proximity (30%), availability (25%), equipment match (20%), on-time performance (15%), lane familiarity (10%) | SATISFIED | `WEIGHTS` constant matches exactly; all 5 factor calculators verified; 29 passing tests |
| ROUT-03 | 05-03 | Dispatch UI shows "Suggested" tab with ranked recommendations and score breakdown | SATISFIED | `DispatchAssignmentForm` has Suggested tab (default) rendering `DriverSuggestions` with score + 5 factor bars |
| ROUT-04 | 05-03 | One-click assign from suggestion list | SATISFIED | `handleAssign` in `DriverSuggestions` constructs FormData and calls `createDispatch`, calls `onClose` on success |
| ROUT-05 | 05-03 | Override button for manual driver selection | SATISFIED | Manual tab in `DispatchAssignmentForm` is the override path — switches to existing driver dropdown form |

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/app/(app)/layout.tsx` | `userDisplayName=""` hardcoded empty string | Info | Display name not shown in header, cosmetic only |
| `src/lib/routing/scoring.ts` | Comment: "For now, these remain null which gives 0.1 proximity" (home_terminal fallback not implemented) | Warning | Drivers without last delivery always score 0.1 proximity regardless of home terminal location. Noted as known limitation. |

No blocker anti-patterns found. No stub implementations. No TODO/placeholder code in critical paths.

---

## Test Results

All 61 automated tests pass:

- `tests/marie/tools.test.ts` — 9 tests (tool definitions, executor dispatch, role filtering)
- `tests/marie/context.test.ts` — 3 tests (org context builder shape)
- `tests/marie/chat.test.ts` — 10 tests (action parsing, marker stripping, fetch contract)
- `tests/routing/scoring.test.ts` — 29 tests (all 5 factor calculators, weights sum, adjacency map)
- `tests/routing/suggestions.test.ts` — 10 tests (score color coding, boundary values)

---

## Human Verification Required

### 1. Marie Chat End-to-End

**Test:** Open Marie panel (click pink button bottom-right), type "What loads are active right now?"
**Expected:** Marie responds with a natural language summary of active loads drawn from org data
**Why human:** Requires live app with ANTHROPIC_API_KEY configured and database with data

### 2. Marie Action Execution

**Test:** As dispatcher, ask Marie "Create a load from Dallas, TX to Chicago, IL for $2500"
**Expected:** Marie uses the `create_load` tool and confirms with the new load number
**Why human:** Requires live app with authenticated dispatcher session and working Claude API

### 3. Action Buttons Navigate Correctly

**Test:** Receive a Marie response containing `[ACTION:view_load:UUID:View Load #1234]`
**Expected:** Button labeled "View Load #1234" appears inline; clicking it navigates to `/loads/[UUID]`
**Why human:** Navigation behavior requires browser rendering

### 4. Driver Role Cannot Execute Actions

**Test:** As driver, ask Marie "Create a load from Houston to Dallas for $1500"
**Expected:** Marie declines to create the load, explains driver role restrictions
**Why human:** Requires live app with driver role session

### 5. Smart Routing Suggestions Display

**Test:** Open dispatch assignment form for a booked load; observe Suggested tab (default)
**Expected:** Ranked driver cards appear with color-coded scores and 5 factor bars; clicking "Assign" creates dispatch
**Why human:** Requires live database with active drivers and a booked load

---

## Gaps Summary

**1 gap blocking full goal achievement:**

**MARI-09 — Alert Summarization on Open** is the only unimplemented requirement. The `proactive_alerts` table was created (correctly) as a Phase 6 scaffold. However, MARI-09 requires that when the Marie chat panel opens, it automatically queries unacknowledged alerts and sends a summary. This behavior does not exist anywhere in the codebase.

The phase context file (`05-CONTEXT.md`) explicitly notes: *"Marie alert digest when chat opens — Phase 6 (needs proactive_alerts table)"*. This contradicts Plan 02 claiming MARI-09 complete. The requirement is deferred, not implemented.

**Root cause:** Plan 02 claimed MARI-09 but the phase context scoped it to Phase 6. The `proactive_alerts` table was intended as a Phase 5 scaffold for Phase 6 population — the read-on-open UI was not the Phase 5 deliverable.

**Fix required:** Add a `useEffect` in `MariePanel` (or `useMarie` hook) that triggers when `isOpen` becomes `true`, queries `proactive_alerts` for unacknowledged items, and calls `sendQuery` with a summary prompt if any are found.

---

*Verified: 2026-03-25T03:05:00Z*
*Verifier: Claude (gsd-verifier)*
