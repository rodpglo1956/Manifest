---
phase: 05-marie-ai-smart-routing
plan: 01
subsystem: api
tags: [claude-api, anthropic-sdk, tool-use, smart-routing, scoring-algorithm, ai-assistant]

# Dependency graph
requires:
  - phase: 03-dispatch
    provides: dispatch actions, dispatch table, load status transitions
  - phase: 04-invoicing-dashboard
    provides: invoice actions, invoice table
provides:
  - Marie AI query API endpoint with Claude tool_use loop
  - Marie utility actions (createLoadForMarie, createDispatchForMarie, createInvoiceForMarie)
  - Smart routing scoring algorithm with 5 weighted factors
  - Smart routing API endpoint for driver suggestions
  - marie_queries and proactive_alerts database tables with RLS
  - Marie type definitions (MarieQuery, ProactiveAlert, ScoringFactors, DriverSuggestion)
affects: [05-02-marie-chat-ui, 05-03-smart-routing-ui, 06-proactive-alerts]

# Tech tracking
tech-stack:
  added: ["@anthropic-ai/sdk ^0.80.0"]
  patterns: [claude-tool-use-loop, utility-action-wrappers, weighted-scoring, state-adjacency-map]

key-files:
  created:
    - supabase/migrations/00017_marie_queries.sql
    - src/types/marie.ts
    - src/lib/marie/context-builder.ts
    - src/lib/marie/system-prompt.ts
    - src/lib/marie/tools.ts
    - src/lib/marie/actions.ts
    - src/app/api/marie/query/route.ts
    - src/lib/routing/adjacency.ts
    - src/lib/routing/factors.ts
    - src/lib/routing/scoring.ts
    - src/app/api/dispatch/suggest/route.ts
    - tests/marie/tools.test.ts
    - tests/marie/context.test.ts
    - tests/routing/scoring.test.ts
  modified:
    - src/types/database.ts
    - package.json

key-decisions:
  - "Used @anthropic-ai/sdk directly instead of Vercel AI SDK (project has no AI SDK dependency, direct SDK gives full tool_use control)"
  - "Marie utility actions are plain async functions, not server actions (no FormData, no redirect, no revalidatePath)"
  - "Proximity scoring uses city/state text matching with 50-state adjacency map (no geocoding API needed)"
  - "On-time performance uses completed deliveries as proxy (no reliable late detection yet)"
  - "Model configurable via MARIE_MODEL env var, defaults to claude-sonnet-4-20250514"

patterns-established:
  - "Utility action wrapper pattern: plain object input wrappers around server action logic for API route consumption"
  - "Claude tool_use loop pattern: max 5 iterations with role-filtered tool availability"
  - "Weighted factor scoring: individual factor calculators (0-1) combined with configurable weights"
  - "State adjacency map: static Record<string, string[]> for proximity approximation without external APIs"

requirements-completed: [MARI-02, MARI-03, MARI-04, MARI-05, MARI-06, MARI-07, ROUT-01, ROUT-02]

# Metrics
duration: 8min
completed: 2026-03-25
---

# Phase 5 Plan 01: Marie AI Backend & Smart Routing Summary

**Claude API integration with tool_use loop for Marie AI assistant, 5-factor weighted scoring algorithm for smart routing, and two API endpoints with 41 passing tests**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-25T06:47:23Z
- **Completed:** 2026-03-25T06:55:34Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Complete Marie AI backend: API route with Claude tool_use loop, system prompt with org context, role-filtered tools, query logging
- Three utility action wrappers that accept plain objects (not FormData) for Marie tool execution
- Smart routing scoring algorithm with 5 weighted factors and all 50 US states adjacency map
- 41 tests passing across tools, context builder, and scoring algorithm

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration, types, Marie backend** - `df329ff` (feat)
2. **Task 2: Smart routing scoring algorithm, factors, and API endpoint** - `ad6feb7` (feat)

## Files Created/Modified
- `supabase/migrations/00017_marie_queries.sql` - marie_queries + proactive_alerts tables with RLS
- `src/types/database.ts` - Added MarieQuery, ProactiveAlert types and Database table entries
- `src/types/marie.ts` - Marie and routing TypeScript types
- `src/lib/marie/context-builder.ts` - Fetches org data for system prompt (loads, drivers, invoices, dispatches)
- `src/lib/marie/system-prompt.ts` - Builds role-aware system prompt with org data
- `src/lib/marie/tools.ts` - Claude tool definitions and role-filtered tool getter
- `src/lib/marie/actions.ts` - Utility wrappers for createLoad, createDispatch, createInvoice
- `src/app/api/marie/query/route.ts` - Marie API endpoint with tool_use loop and query logging
- `src/lib/routing/adjacency.ts` - US state adjacency map (50 states)
- `src/lib/routing/factors.ts` - 5 factor calculators (proximity, availability, equipment, performance, lane)
- `src/lib/routing/scoring.ts` - Weighted scoring algorithm and scoreDriversForLoad
- `src/app/api/dispatch/suggest/route.ts` - Smart routing suggestion endpoint
- `tests/marie/tools.test.ts` - 9 tests for tool definitions and executor
- `tests/marie/context.test.ts` - 3 tests for org context builder
- `tests/routing/scoring.test.ts` - 29 tests for factors, scoring, adjacency

## Decisions Made
- Used @anthropic-ai/sdk directly (not Vercel AI SDK) -- project has no AI SDK dependency, direct SDK gives full control over tool_use loop
- Marie utility actions are plain async functions (not server actions) to avoid FormData/redirect incompatibility in API routes
- Proximity scoring uses city/state text matching with static adjacency map -- no geocoding API dependency
- On-time performance currently treats all completed deliveries as on-time (no reliable late detection available yet)
- Model string configurable via MARIE_MODEL environment variable, defaults to claude-sonnet-4-20250514

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type errors in Marie actions and database types**
- **Found during:** Task 2 (type checking)
- **Issue:** Load Insert type requires all nullable fields explicitly; Dispatch Insert missing nullable fields; MarieQuery Insert type had required fields that should be optional
- **Fix:** Added all nullable fields to load insert in createLoadForMarie, added missing dispatch fields, restructured MarieQuery Insert type to properly omit optional fields
- **Files modified:** src/lib/marie/actions.ts, src/types/database.ts
- **Verification:** `npx tsc --noEmit` passes for all new files
- **Committed in:** ad6feb7 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Type corrections required for compilation. No scope creep.

## Issues Encountered
None -- plan executed smoothly.

## User Setup Required

**External services require manual configuration:**
- **ANTHROPIC_API_KEY** - Required for Marie AI. Obtain from Anthropic Console -> API Keys -> Create key. Add to `.env.local`.
- **MARIE_MODEL** (optional) - Override default model. Defaults to `claude-sonnet-4-20250514`.

## Next Phase Readiness
- Marie API backend fully operational -- ready for chat UI (Plan 02)
- Smart routing backend ready for suggestion UI integration (Plan 03)
- proactive_alerts table created (empty) -- ready for Phase 6 alert population

---
*Phase: 05-marie-ai-smart-routing*
*Completed: 2026-03-25*

## Self-Check: PASSED

All 15 files verified present. Both task commits (df329ff, ad6feb7) verified in git log.
