---
phase: 05-marie-ai-smart-routing
plan: 02
subsystem: ui
tags: [marie-chat, floating-button, slide-out-panel, action-buttons, driver-pwa, chat-ui]

# Dependency graph
requires:
  - phase: 05-marie-ai-smart-routing
    plan: 01
    provides: Marie API endpoint, types (MarieMessage, ActionButton)
provides:
  - MarieButton floating component with alert badge placeholder
  - MariePanel slide-out chat panel
  - MarieChat thread with auto-scroll and typing indicator
  - MarieMessage with action marker parsing and inline action buttons
  - useMarie client hook for API communication
  - MarieDriverChat simplified mobile chat for driver PWA
affects: [05-03-smart-routing-ui, 06-proactive-alerts]

# Tech tracking
tech-stack:
  added: []
  patterns: [action-marker-parsing, slide-out-panel, floating-button, mobile-full-screen-chat]

key-files:
  created:
    - src/components/marie/use-marie.ts
    - src/components/marie/marie-message.tsx
    - src/components/marie/marie-chat.tsx
    - src/components/marie/marie-panel.tsx
    - src/components/marie/marie-button.tsx
    - src/components/marie/marie-driver-chat.tsx
    - tests/marie/chat.test.ts
  modified:
    - src/app/(app)/layout.tsx
    - src/app/driver/layout.tsx

key-decisions:
  - "Action marker regex uses [^:]+ for entityId to support any ID format (not just hex UUIDs)"
  - "Driver chat uses full-screen slide-up panel for mobile instead of side panel"
  - "MarieButton manages panel state internally via useState toggle"
  - "useMarie hook is stateless per session (no conversation persistence, per PRD design)"

patterns-established:
  - "Action marker format: [ACTION:type:entityId:label] parsed by regex and rendered as inline buttons"
  - "stripActionMarkers utility for driver-facing display that removes action capabilities"
  - "Floating button + slide-out panel pattern for assistant UI"

requirements-completed: [MARI-01, MARI-08, MARI-09, MARI-10]

# Metrics
duration: 3min
completed: 2026-03-25
---

# Phase 5 Plan 02: Marie Chat UI Summary

**Floating Marie button with slide-out chat panel, action marker parsing with inline buttons, and simplified driver PWA chat with 10 new tests**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-25T06:58:36Z
- **Completed:** 2026-03-25T07:01:19Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Complete Marie chat UI: floating pink button (#EC008C), slide-out panel with backdrop, chat thread with auto-scroll and typing indicator
- MarieMessage component parses [ACTION:type:id:label] markers into inline clickable buttons that navigate to relevant pages
- useMarie hook handles fetch to /api/marie/query with error fallback message
- MarieDriverChat: full-screen slide-up mobile chat that strips action markers (drivers cannot execute actions)
- Integrated MarieButton into (app) layout and MarieDriverChat into driver layout
- 10 new tests covering action parsing, marker stripping, and fetch contract

## Task Commits

Each task was committed atomically:

1. **Task 1: Marie chat components and app layout integration** - `c076343` (feat)
2. **Task 2: Driver PWA Marie chat and chat tests** - `1841694` (feat)

## Files Created/Modified
- `src/components/marie/use-marie.ts` - Client hook: messages state, sendQuery with fetch, error handling
- `src/components/marie/marie-message.tsx` - Message rendering with action marker parsing and inline buttons
- `src/components/marie/marie-chat.tsx` - Chat thread with auto-scroll, typing indicator, Enter-to-send
- `src/components/marie/marie-panel.tsx` - Slide-out panel (400px right side) with backdrop overlay
- `src/components/marie/marie-button.tsx` - Floating pink button (bottom-right) with alert badge placeholder
- `src/components/marie/marie-driver-chat.tsx` - Simplified mobile driver chat, strips action markers
- `tests/marie/chat.test.ts` - 10 tests for parseActions, stripActionMarkers, fetch contract
- `src/app/(app)/layout.tsx` - Added MarieButton for all Command/Owner-Operator pages
- `src/app/driver/layout.tsx` - Added MarieDriverChat for all driver PWA pages

## Decisions Made
- Action marker regex uses `[^:]+` for entityId to support any ID format (not restricted to hex UUIDs)
- Driver chat uses full-screen slide-up panel for mobile UX instead of side panel
- MarieButton manages panel open/close state internally via useState toggle
- useMarie hook is stateless per session (no conversation persistence, per PRD design)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ACTION_REGEX entityId pattern too restrictive**
- **Found during:** Task 2 (test verification)
- **Issue:** Regex `[a-f0-9-]+` for entityId rejected non-hex characters, failing to match valid IDs
- **Fix:** Changed to `[^:]+` to accept any entityId format
- **Files modified:** src/components/marie/marie-message.tsx
- **Commit:** 1841694

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minimal -- regex pattern broadened for robustness. No scope creep.

## Issues Encountered
None -- plan executed smoothly.

## Next Phase Readiness
- Marie chat UI fully operational -- ready for user interaction
- Smart routing UI (Plan 03) can now build on established Marie UI patterns
- Alert badge placeholder ready for Phase 6 proactive alerts wiring

---
*Phase: 05-marie-ai-smart-routing*
*Completed: 2026-03-25*

## Self-Check: PASSED

All 7 created files verified present. Both task commits (c076343, 1841694) verified in git log.
