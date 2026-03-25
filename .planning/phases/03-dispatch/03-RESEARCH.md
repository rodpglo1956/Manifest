# Phase 3: Dispatch - Research

**Researched:** 2026-03-25
**Domain:** Dispatch assignment workflow, driver availability, Realtime sync, Driver PWA dispatch interaction
**Confidence:** HIGH

## Summary

Phase 3 adds the dispatch module to Manifest: a dispatches table with its own status lifecycle, a two-column dispatch board in Command mode, driver availability tracking, and a driver-facing dispatch card with accept/reject in the Driver PWA. The implementation follows established patterns from Phase 2 (server actions, Zod validation, Realtime hooks, StatusBadge extension) with the key new complexity being the bidirectional status synchronization between dispatches and loads.

The dispatch module is architecturally straightforward because it mirrors the load management patterns already built. The dispatches table follows the same RLS pattern (org_id isolation via auth.org_id()), the Realtime hook clones useRealtimeLoads, server actions follow the same validate-mutate-revalidate pattern, and StatusBadge already supports a variant-based color system that extends naturally. The primary risks are around the dispatch-load status sync (creating a dispatch must also update load status, rejection must revert it) and ensuring driver availability queries are correct (filtering out drivers with active non-terminal dispatches).

**Primary recommendation:** Build the migration and dispatch-status utility first, then the server actions with dispatch-load sync logic, then the dispatch board UI, and finally the Driver PWA dispatch integration. This order ensures the data layer is solid before UI work begins.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Dispatches table per PRD-01 Section 5.2: id, org_id, load_id, driver_id, vehicle_id, status, assigned_at, accepted_at, completed_at, estimated_pickup_arrival, estimated_delivery_arrival, driver_notes, dispatcher_notes, assigned_by
- Dispatch statuses: 'assigned', 'accepted', 'en_route_pickup', 'at_pickup', 'en_route_delivery', 'at_delivery', 'completed', 'rejected'
- RLS policy: org_id isolation using auth.org_id() helper
- Dispatch creation also updates load status to 'dispatched'
- Two-column layout: unassigned loads on the left, available drivers on the right
- Dropdown select for driver/vehicle assignment (NOT drag-and-drop -- that's Phase 6)
- Active dispatches list below showing ETA and current status
- Driver availability view: who is free (no active dispatch), who is on a load, who is off (inactive/terminated filtered out)
- Dispatch status changes broadcast via Supabase Realtime on channel org:{org_id}:dispatch
- Driver PWA: current dispatch card with load summary, accept/reject buttons, status update flow, notes to dispatcher
- Server actions for all mutations (createDispatch, acceptDispatch, rejectDispatch, updateDispatchStatus)
- Zod schema for dispatch validation
- react-hook-form for dispatch assignment form
- StatusBadge component extended for dispatch statuses
- Assignment flow: dispatcher selects load -> picks driver -> optionally picks vehicle (defaults to driver's current_vehicle_id) -> creates dispatch + updates load -> driver accepts/rejects via Realtime
- On accept: dispatch status -> 'accepted', load remains 'dispatched'
- On reject: dispatch status -> 'rejected', load reverts to 'booked'
- Reuse useRealtimeLoads pattern for useRealtimeDispatches hook

### Claude's Discretion
- Exact layout proportions for the dispatch board two-column view
- How to display driver availability (cards vs table rows)
- Whether to show ETA as time or countdown
- Loading states and empty states for dispatch board
- How to handle driver notes UI (inline vs modal)

### Deferred Ideas (OUT OF SCOPE)
- Smart routing / driver suggestions -- Phase 5 (Marie AI & Smart Routing)
- Drag-and-drop assignment -- Phase 6 (Enhanced Dispatch)
- Map view with driver/load pins -- Phase 6
- Timeline/Gantt view of driver schedules -- Phase 6
- Conflict detection for overlapping loads -- Phase 6
- Push notifications for new dispatch -- Phase 6 (Push Notifications)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISP-01 | Dispatcher can assign a driver and vehicle to a load (creates dispatch record) | Migration for dispatches table, createDispatch server action with Zod validation, dispatch assignment form with driver/vehicle dropdowns |
| DISP-02 | Dispatch board shows unassigned loads and available drivers | Two-column layout page at /dispatch, queries for loads with status='booked' and drivers with no active dispatch |
| DISP-03 | Active dispatches list shows ETA and current status | Active dispatches query (status not in completed/rejected), dispatch list component with ETA display |
| DISP-04 | Driver availability view shows who is free, on a load, or off | Driver availability query using LEFT JOIN on dispatches, categorized display (free/busy/off) |
| DISP-05 | Driver PWA shows current dispatch card with load summary | Driver dispatch page/component with load details, clones DriverActiveLoad pattern |
| DISP-06 | Driver can accept or reject dispatch assignments in PWA | acceptDispatch/rejectDispatch server actions with dispatch-load status sync |
| DISP-07 | Driver can send notes to dispatcher from PWA | updateDispatchNotes server action, inline text input on dispatch card |
| DISP-08 | Dispatch status changes broadcast via Supabase Realtime | useRealtimeDispatches hook cloned from useRealtimeLoads, dispatch board subscribes to both channels |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15 (App Router) | Framework | Already in use, server components + server actions |
| Supabase JS | v2 | Database + Auth + Realtime | Already in use, RLS + Realtime channels |
| Zod | 3.x | Schema validation | Already used for all form schemas |
| react-hook-form | 7.x | Form state management | Already used with zodResolver pattern |
| Tailwind CSS | 4.x | Styling | Already in use project-wide |
| lucide-react | latest | Icons | Already in use project-wide |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @hookform/resolvers | latest | Zod integration with RHF | Dispatch assignment form |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dropdown select | Drag-and-drop (dnd-kit) | Deferred to Phase 6 per user decision |
| Inline notes | Modal dialog | Inline is simpler, fewer clicks for drivers |

**Installation:** No new packages needed. All dependencies are already installed from Phase 1-2.

## Architecture Patterns

### Recommended Project Structure
```
supabase/migrations/
  00015_dispatches.sql              # dispatches table + RLS + indexes

src/types/database.ts               # Add DispatchStatus, Dispatch types + Database table entry
src/lib/dispatch-status.ts          # Status transitions, labels, colors (mirrors load-status.ts)
src/schemas/dispatch.ts             # Zod schemas for dispatch forms
src/hooks/use-realtime-dispatches.ts # Realtime hook (clones use-realtime-loads.ts)

src/app/(app)/dispatch/
  page.tsx                          # Server component: dispatch board data fetching
  dispatch-board.tsx                # Client component: two-column layout + Realtime
  actions.ts                        # Server actions: createDispatch, updateDispatchStatus

src/components/dispatch/
  unassigned-loads-panel.tsx         # Left column: loads with status='booked'
  available-drivers-panel.tsx        # Right column: drivers with availability status
  dispatch-assignment-form.tsx       # Dropdown form: pick driver + vehicle for a load
  active-dispatches-list.tsx         # Below: active dispatches with status + ETA

src/app/driver/dispatch/
  page.tsx                          # Server component: driver's current dispatch
  client.tsx                        # Client component: Realtime wrapper
  actions.ts                        # Server actions: acceptDispatch, rejectDispatch, updateDriverNotes

src/components/drivers/
  driver-dispatch-card.tsx           # Driver PWA dispatch card (extends driver-active-load pattern)
```

### Pattern 1: Dispatch Status Transitions (mirrors load-status.ts)
**What:** Typed status transition map for dispatch statuses, mirroring the established load-status.ts pattern.
**When to use:** Every dispatch status update must validate against this map.
**Example:**
```typescript
// src/lib/dispatch-status.ts
import type { DispatchStatus } from '@/types/database'

export const DISPATCH_STATUSES: DispatchStatus[] = [
  'assigned', 'accepted', 'en_route_pickup', 'at_pickup',
  'en_route_delivery', 'at_delivery', 'completed', 'rejected',
]

export const VALID_DISPATCH_TRANSITIONS: Record<DispatchStatus, DispatchStatus[]> = {
  assigned: ['accepted', 'rejected'],
  accepted: ['en_route_pickup'],
  en_route_pickup: ['at_pickup'],
  at_pickup: ['en_route_delivery'],
  en_route_delivery: ['at_delivery'],
  at_delivery: ['completed'],
  completed: [],
  rejected: [],
}

export function canDispatchTransition(from: DispatchStatus, to: DispatchStatus): boolean {
  return VALID_DISPATCH_TRANSITIONS[from]?.includes(to) ?? false
}
```

### Pattern 2: Dispatch-Load Status Sync
**What:** When a dispatch is created, the load status must move to 'dispatched'. When rejected, the load must revert to 'booked'. This is a transactional concern.
**When to use:** In createDispatch and rejectDispatch server actions.
**Example:**
```typescript
// In createDispatch server action
export async function createDispatch(data: DispatchInput): Promise<{ error?: string }> {
  const supabase = await createClient()

  // 1. Validate the load is in 'booked' status
  const { data: load } = await supabase
    .from('loads')
    .select('id, status')
    .eq('id', data.load_id)
    .single()

  if (!load || load.status !== 'booked') {
    return { error: 'Load must be in booked status to dispatch' }
  }

  // 2. Create dispatch record
  const { error: dispatchError } = await supabase
    .from('dispatches')
    .insert({ ...data, status: 'assigned' })

  if (dispatchError) return { error: dispatchError.message }

  // 3. Update load status to 'dispatched' and set driver/vehicle
  const { error: loadError } = await supabase
    .from('loads')
    .update({
      status: 'dispatched',
      driver_id: data.driver_id,
      vehicle_id: data.vehicle_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.load_id)

  if (loadError) return { error: loadError.message }

  revalidatePath('/dispatch')
  revalidatePath('/loads')
  return {}
}
```

### Pattern 3: Driver Availability Query
**What:** Determining which drivers are available for dispatch by checking they have no active (non-terminal) dispatch.
**When to use:** Dispatch board right column, driver selection dropdown.
**Example:**
```typescript
// Fetch active drivers, then partition by availability
const { data: drivers } = await supabase
  .from('drivers')
  .select('id, first_name, last_name, status, current_vehicle_id, phone')
  .eq('status', 'active')
  .order('last_name')

// Get all non-terminal dispatches to find busy drivers
const { data: activeDispatches } = await supabase
  .from('dispatches')
  .select('driver_id, status, load_id')
  .not('status', 'in', '("completed","rejected")')

const busyDriverIds = new Set(activeDispatches?.map(d => d.driver_id) ?? [])

const availableDrivers = drivers?.filter(d => !busyDriverIds.has(d.id)) ?? []
const busyDrivers = drivers?.filter(d => busyDriverIds.has(d.id)) ?? []
```

### Pattern 4: Realtime Hook Clone
**What:** useRealtimeDispatches hook, identical structure to useRealtimeLoads but subscribing to the dispatches table.
**When to use:** Dispatch board and Driver PWA dispatch page.
**Example:**
```typescript
// src/hooks/use-realtime-dispatches.ts
'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeDispatches(orgId: string | null) {
  const router = useRouter()
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    if (!orgId) return
    const supabase = supabaseRef.current
    const channel: RealtimeChannel = supabase
      .channel(`org:${orgId}:dispatch`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'dispatches',
        filter: `org_id=eq.${orgId}`,
      }, () => { router.refresh() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId, router])
}
```

### Pattern 5: Server Component Page -> Client Wrapper (established pattern)
**What:** Server component fetches data, passes to client component that handles interactivity and Realtime.
**When to use:** Dispatch board page and Driver PWA dispatch page.

### Anti-Patterns to Avoid
- **Putting dispatch-load sync in a database trigger:** Keep the sync in server actions where error handling is clear. Database triggers are harder to debug and the load status trigger already exists for history logging.
- **Querying availability with a JOIN in the main drivers query:** Two separate queries (drivers + active dispatches) are cleaner and easier to maintain than a complex LEFT JOIN with IS NULL filter on a subquery.
- **Subscribing to both loads and dispatches in a single channel:** Use two separate Realtime subscriptions (one for loads, one for dispatches) as the existing pattern shows. Supabase postgres_changes filters work per-table.
- **Using the load status update path for dispatch status changes:** Dispatch has its own status lifecycle. Do not reuse updateLoadStatus for dispatch status updates -- create dedicated dispatch status actions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation | Zod schema + zodResolver | Established pattern, type-safe |
| Status badge colors | New color system | Extend StatusBadge with 'dispatch' variant | Already supports variants |
| Realtime sync | Custom WebSocket | Supabase Realtime postgres_changes | Already proven in useRealtimeLoads |
| Driver selection UI | Custom autocomplete | HTML select or existing pattern | Phase 1 dispatch, dropdown is sufficient |
| Optimistic UI updates | Custom optimistic state | router.refresh() via Realtime | Established pattern, simpler |

**Key insight:** Phase 3 introduces no new technology. Every pattern has a direct analog in Phase 2. The dispatch module is a structural copy of the load management module with different business rules.

## Common Pitfalls

### Pitfall 1: Race Condition on Dispatch-Load Sync
**What goes wrong:** Two dispatchers assign the same load simultaneously. Both create dispatch records, both try to update load status.
**Why it happens:** No database-level uniqueness constraint on load_id for active dispatches.
**How to avoid:** Add a partial unique index: `CREATE UNIQUE INDEX idx_dispatches_active_load ON dispatches(load_id) WHERE status NOT IN ('completed', 'rejected')`. Also validate load status is 'booked' before creating dispatch (server action check).
**Warning signs:** Multiple dispatch records for the same load, load stuck in 'dispatched' after rejection.

### Pitfall 2: Orphaned Dispatch on Load Status Revert
**What goes wrong:** Driver rejects dispatch, load reverts to 'booked', but the old dispatch record's status is not properly set to 'rejected', or a new dispatch is created without checking for existing rejected dispatches.
**Why it happens:** Incomplete state machine handling in the reject flow.
**How to avoid:** rejectDispatch action must atomically: (1) set dispatch status to 'rejected', (2) revert load status to 'booked', (3) clear driver_id and vehicle_id on load. Test this flow specifically.
**Warning signs:** Load shows 'booked' but still has driver_id set. Dispatch record stuck in 'assigned'.

### Pitfall 3: Driver Availability Showing Stale Data
**What goes wrong:** Driver appears as "available" on the board but actually has an active dispatch that was just created by another dispatcher.
**Why it happens:** Server-rendered data is stale by the time the dispatcher clicks assign.
**How to avoid:** The server action re-validates at mutation time (checks load is still 'booked', checks driver has no active dispatch). The Realtime subscription auto-refreshes the board. The partial unique index provides the database-level safety net.
**Warning signs:** "Failed to create dispatch" errors after clicking assign.

### Pitfall 4: Supabase Realtime Not Firing for dispatches Table
**What goes wrong:** Creating a dispatch record does not trigger Realtime events because the dispatches table does not have Realtime enabled.
**Why it happens:** Supabase Realtime requires explicit publication of tables via `alter publication supabase_realtime add table dispatches`.
**How to avoid:** Include this in the migration SQL. Check the existing migrations to see if loads table has this (it likely does via the load_status_trigger or explicit setup).
**Warning signs:** Dispatch board does not auto-refresh when dispatches are created/updated.

### Pitfall 5: Driver PWA Not Receiving Dispatch in Real Time
**What goes wrong:** Driver does not see new dispatch assignment until they manually refresh.
**Why it happens:** The Driver PWA loads page uses useRealtimeLoads but not useRealtimeDispatches.
**How to avoid:** The driver dispatch page must subscribe to the dispatches Realtime channel. Also, the dispatch board must subscribe to both loads and dispatches channels to see the full picture.
**Warning signs:** Driver has to refresh to see new assignment.

### Pitfall 6: Missing pickup_company/delivery_company in Load Type
**What goes wrong:** The Load type has pickup_company but the field is actually named pickup_company in the database. Check the actual migration to ensure the database column names match the TypeScript types.
**Why it happens:** Column naming inconsistencies between PRD, migration, and TypeScript types.
**How to avoid:** Verify the actual migration SQL column names match the TypeScript Load type before building dispatch UI that displays load info.
**Warning signs:** null values appearing for fields that should have data.

## Code Examples

### Dispatch Migration (00015_dispatches.sql)
```sql
-- Dispatches table per PRD-01 Section 5.2
create table dispatches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  load_id uuid not null references loads(id),
  driver_id uuid not null references drivers(id),
  vehicle_id uuid references vehicles(id),
  status text not null default 'assigned',
  assigned_at timestamptz default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  estimated_pickup_arrival timestamptz,
  estimated_delivery_arrival timestamptz,
  driver_notes text,
  dispatcher_notes text,
  assigned_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table dispatches enable row level security;
create policy "org_dispatches" on dispatches
  for all using (org_id = (select auth.org_id()));

-- Indexes
create index idx_dispatches_org_id on dispatches(org_id);
create index idx_dispatches_load_id on dispatches(load_id);
create index idx_dispatches_driver_id on dispatches(driver_id);
create index idx_dispatches_status on dispatches(status);

-- Prevent duplicate active dispatches for the same load
create unique index idx_dispatches_active_load
  on dispatches(load_id)
  where status not in ('completed', 'rejected');

-- Enable Realtime
alter publication supabase_realtime add table dispatches;
```

### Dispatch Zod Schema
```typescript
// src/schemas/dispatch.ts
import { z } from 'zod'

export const createDispatchSchema = z.object({
  load_id: z.string().uuid('Invalid load ID'),
  driver_id: z.string().uuid('Invalid driver ID'),
  vehicle_id: z.string().uuid('Invalid vehicle ID').optional(),
  estimated_pickup_arrival: z.string().optional(),
  estimated_delivery_arrival: z.string().optional(),
  dispatcher_notes: z.string().optional().default(''),
})

export type CreateDispatchInput = z.input<typeof createDispatchSchema>

export const driverNotesSchema = z.object({
  dispatch_id: z.string().uuid(),
  driver_notes: z.string().min(1, 'Notes cannot be empty').max(1000),
})
```

### StatusBadge Extension
```typescript
// Add to colorMap in status-badge.tsx
dispatch: {
  assigned: { dot: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  accepted: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  en_route_pickup: { dot: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  at_pickup: { dot: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700' },
  en_route_delivery: { dot: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
  at_delivery: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  completed: { dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
  rejected: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
},
```

### Sidebar Navigation Update
```typescript
// In app-sidebar.tsx, update the Dispatch nav item:
{ href: '/dispatch', label: 'Dispatch', icon: Navigation, active: true },
// Remove comingSoon: true
```

### Driver PWA Bottom Nav Update
```typescript
// In src/app/driver/layout.tsx, add dispatch to bottomNavItems:
{ href: '/driver/dispatch', label: 'Dispatch', icon: Navigation },
// Between Dashboard and Loads
```

## Claude's Discretion Recommendations

### Layout Proportions
**Recommendation:** Use a responsive grid with `grid-cols-1 lg:grid-cols-2` for the two-column layout. Each column takes equal width on desktop. On mobile, stack vertically with unassigned loads on top. Active dispatches list spans full width below.

### Driver Availability Display
**Recommendation:** Use compact card rows (not a full table) for drivers in the right column. Each card shows: driver name, phone, assigned vehicle unit number, and an availability badge (green "Available" / blue "On Load" / gray "Off"). Cards for available drivers are clickable to trigger the assignment flow.

### ETA Display
**Recommendation:** Show ETA as absolute time (e.g., "ETA: 2:30 PM") rather than countdown. Absolute time is more useful for dispatchers who scan multiple dispatches. Include a relative label for "overdue" cases (e.g., "ETA: 2:30 PM (45min late)").

### Loading and Empty States
**Recommendation:** Use skeleton loaders matching the card shapes for loading. Empty state for unassigned loads: "All loads are dispatched" with a link to create a new load. Empty state for available drivers: "No drivers available" with context about busy driver count.

### Driver Notes UI
**Recommendation:** Inline text input with a send button at the bottom of the dispatch card. Not a modal -- drivers need quick access from the cab. The input should be a simple textarea with a "Send to Dispatcher" button. Notes appear in the dispatch detail on the Command side.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| WebSocket manual mgmt | Supabase Realtime postgres_changes | Established Phase 2 | Hook pattern already built |
| API routes for mutations | Server Actions | Established Phase 1 | All mutations use 'use server' |
| Custom form validation | Zod + react-hook-form | Established Phase 1 | Schema-first validation |

**Deprecated/outdated:** None for this phase. All patterns carry forward from Phase 2 without changes.

## Open Questions

1. **Supabase Realtime publication for dispatches table**
   - What we know: The loads table broadcasts via Realtime (useRealtimeLoads works). We need to ensure dispatches table is added to the supabase_realtime publication.
   - What's unclear: Whether this was done automatically in the existing migration setup or needs explicit `alter publication`.
   - Recommendation: Include `alter publication supabase_realtime add table dispatches` in the migration. If it already exists, the statement is idempotent.

2. **Existing loads table has driver_id and vehicle_id columns**
   - What we know: The loads table already has driver_id and vehicle_id columns. The dispatch creates a separate dispatches record AND updates these on the load.
   - What's unclear: Should dispatch rejection clear both fields on the load, or only clear them if the load has no other dispatches?
   - Recommendation: On rejection, clear driver_id and vehicle_id on the load since Phase 3 is 1:1 (one active dispatch per load). The partial unique index enforces this.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest with jsdom |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run tests/dispatch/ --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISP-01 | Create dispatch record with driver/vehicle assignment | unit | `npx vitest run tests/dispatch/create.test.ts -x` | Wave 0 |
| DISP-02 | Query unassigned loads and available drivers | unit | `npx vitest run tests/dispatch/board.test.ts -x` | Wave 0 |
| DISP-03 | Active dispatches list with status/ETA | unit | `npx vitest run tests/dispatch/active-list.test.ts -x` | Wave 0 |
| DISP-04 | Driver availability categorization | unit | `npx vitest run tests/dispatch/availability.test.ts -x` | Wave 0 |
| DISP-05 | Driver dispatch card renders load summary | unit | `npx vitest run tests/dispatch/driver-card.test.ts -x` | Wave 0 |
| DISP-06 | Accept/reject dispatch with status sync | unit | `npx vitest run tests/dispatch/accept-reject.test.ts -x` | Wave 0 |
| DISP-07 | Driver notes update | unit | `npx vitest run tests/dispatch/notes.test.ts -x` | Wave 0 |
| DISP-08 | Dispatch status transitions valid/invalid | unit | `npx vitest run tests/dispatch/status.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/dispatch/ --reporter=verbose`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/dispatch/status.test.ts` -- covers DISP-08: dispatch status transitions (mirrors tests/loads/status.test.ts)
- [ ] `tests/dispatch/create.test.ts` -- covers DISP-01: createDispatch validation and dispatch-load sync
- [ ] `tests/dispatch/accept-reject.test.ts` -- covers DISP-06: accept/reject flow with load status revert
- [ ] `tests/dispatch/availability.test.ts` -- covers DISP-04: driver availability categorization logic
- [ ] `tests/dispatch/board.test.ts` -- covers DISP-02, DISP-03: board data queries
- [ ] `tests/dispatch/driver-card.test.ts` -- covers DISP-05: driver dispatch card rendering
- [ ] `tests/dispatch/notes.test.ts` -- covers DISP-07: driver notes validation
- [ ] `tests/setup.ts` -- already exists, no changes needed

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/hooks/use-realtime-loads.ts` -- Realtime hook pattern to clone
- Project codebase: `src/lib/load-status.ts` -- Status transition pattern to mirror
- Project codebase: `src/app/(app)/loads/status-actions.ts` -- Server action pattern for status updates
- Project codebase: `src/components/ui/status-badge.tsx` -- Variant-based badge pattern to extend
- Project codebase: `src/components/drivers/driver-active-load.tsx` -- Driver PWA card pattern to clone
- Project codebase: `src/types/database.ts` -- Type extension pattern
- Project codebase: `src/app/(app)/loads/loads-view.tsx` -- Client wrapper with Realtime pattern
- Project codebase: `src/app/driver/loads/actions.ts` -- Driver-scoped server action pattern
- PRD-01 Section 5.2: Dispatch schema definition

### Secondary (MEDIUM confidence)
- Supabase documentation: Realtime postgres_changes requires table to be in supabase_realtime publication
- Supabase documentation: Partial unique indexes work with RLS

### Tertiary (LOW confidence)
- None -- all patterns are established in the codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use, no new dependencies
- Architecture: HIGH -- every pattern has a direct analog in Phase 2 code
- Pitfalls: HIGH -- identified from actual code review of existing patterns and known database constraints
- Dispatch-load sync: MEDIUM -- the transactional nature of creating dispatch + updating load needs careful testing but the pattern is straightforward

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable -- no external dependencies changing)
