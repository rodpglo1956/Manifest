---
phase: 12-onboarding-pwa-security-polish
plan: 05
subsystem: pwa
tags: [service-worker, indexeddb, offline-first, idb-keyval, pwa, background-sync]

requires:
  - phase: 07-compliance-safety
    provides: DVIR form and submitDVIR action for offline queuing
  - phase: 08-fleet-management
    provides: Fuel transaction form and createFuelTransaction action

provides:
  - IndexedDB offline queue for DVIR and fuel log mutations
  - Sync manager with background sync replay on reconnect
  - Online status hook with auto-sync
  - Enhanced service worker with app shell caching and fetch strategies
  - Offline indicator banner for driver PWA
  - PWA install prompt for mobile users
  - Performance-optimized next.config.ts with cache headers

affects: []

tech-stack:
  added: [idb-keyval]
  patterns: [offline-first-queue, network-first-caching, background-sync, beforeinstallprompt]

key-files:
  created:
    - src/lib/pwa/offline-store.ts
    - src/lib/pwa/sync-manager.ts
    - src/lib/pwa/use-online-status.ts
    - src/components/pwa/offline-indicator.tsx
    - src/components/pwa/install-prompt.tsx
  modified:
    - public/sw.js
    - src/app/driver/layout.tsx
    - src/components/compliance/dvir-form.tsx
    - src/components/fleet/driver-fuel-form.tsx
    - next.config.ts

key-decisions:
  - "Offline queue uses idb-keyval for simple IndexedDB key-value storage"
  - "Sync manager replays per-action with individual error handling (failed actions kept in queue)"
  - "Service worker uses network-first for navigation/Supabase, cache-first for static assets, network-only for API"
  - "BeforeInstallPromptEvent interface declared locally (not in standard TS lib)"
  - "Offline DVIR/fuel forms use async queueOfflineAction without startTransition (no server action needed)"

patterns-established:
  - "Offline form pattern: check isOnline, queue via queueOfflineAction if offline, show offline success message"
  - "PWA install detection: beforeinstallprompt for Android, UA sniffing for iOS manual instructions"
  - "Offline indicator: fixed-position z-50 banner with yellow/blue/green states for offline/syncing/synced"

requirements-completed: [PWA-01, PWA-02, PWA-03, PWA-04, PWA-05]

duration: 3min
completed: 2026-03-26
---

# Phase 12 Plan 05: PWA Offline & Performance Summary

**Service worker with app shell caching, IndexedDB offline queue for DVIR/fuel forms, and PWA install prompt with performance-optimized config**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-26T01:02:42Z
- **Completed:** 2026-03-26T01:05:45Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- IndexedDB offline queue stores DVIR inspections and fuel logs for sync on reconnect
- Sync manager replays queued actions individually with error isolation
- Enhanced service worker caches app shell, uses strategy-based fetch handling
- Offline indicator shows connectivity state with pending count and sync progress
- PWA install prompt detects iOS and Android with platform-appropriate guidance
- DVIR and fuel log forms seamlessly queue data when offline
- next.config.ts optimized with Supabase image patterns and cache-control headers

## Task Commits

Each task was committed atomically:

1. **Task 1: Offline storage, sync manager, and enhanced service worker** - `fe4ac60` (feat)
2. **Task 2: Offline UI components and performance optimization** - `8aca608` (feat)

## Files Created/Modified
- `src/lib/pwa/offline-store.ts` - IndexedDB queue with idb-keyval for offline mutations
- `src/lib/pwa/sync-manager.ts` - Replays queued actions to server on reconnect
- `src/lib/pwa/use-online-status.ts` - React hook tracking connectivity with auto-sync
- `src/components/pwa/offline-indicator.tsx` - Yellow/blue/green banner for offline/syncing/synced states
- `src/components/pwa/install-prompt.tsx` - PWA install detection for iOS and Android
- `public/sw.js` - Enhanced service worker with app shell caching and fetch strategies
- `src/app/driver/layout.tsx` - Added OfflineIndicator and InstallPrompt to driver layout
- `src/components/compliance/dvir-form.tsx` - Offline queuing for DVIR inspections
- `src/components/fleet/driver-fuel-form.tsx` - Offline queuing for fuel transactions
- `next.config.ts` - Cache headers, Supabase image patterns, optimization TODOs

## Decisions Made
- Used idb-keyval for simple IndexedDB key-value storage (already a dependency)
- Sync manager replays actions individually -- failed actions remain in queue for retry
- Service worker uses network-first for navigation and Supabase data, cache-first for static assets
- BeforeInstallPromptEvent interface declared locally since it is not in standard TypeScript lib
- Offline form submissions bypass startTransition since no server action is involved
- optimizeCss left as TODO comment (experimental, not yet stable)
- Dynamic imports for heavy routes (map, charts) documented as TODOs for future optimization

## Deviations from Plan

None - plan executed exactly as written. Task 1 files (offline-store, sync-manager, use-online-status, sw.js) were already present from a prior partial execution and were committed as-is after verification.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PWA offline infrastructure complete
- All driver-facing forms support offline operation
- Service worker ready for production deployment

---
*Phase: 12-onboarding-pwa-security-polish*
*Completed: 2026-03-26*
