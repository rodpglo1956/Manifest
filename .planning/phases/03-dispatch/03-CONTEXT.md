# Phase 3: Dispatch - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Dispatch assignment: assign drivers and vehicles to loads, track assignment status and ETAs, and driver PWA dispatch interaction (accept/reject, notes). This is Phase 1 dispatch (manual) — no smart routing (Phase 5), no map view (Phase 6), no enhanced dispatch board features yet. Just the core assignment workflow.

</domain>

<decisions>
## Implementation Decisions

### Dispatch Schema
- Dispatches table per PRD-01 Section 5.2: id, org_id, load_id, driver_id, vehicle_id, status, assigned_at, accepted_at, completed_at, estimated_pickup_arrival, estimated_delivery_arrival, driver_notes, dispatcher_notes, assigned_by
- Dispatch statuses: 'assigned', 'accepted', 'en_route_pickup', 'at_pickup', 'en_route_delivery', 'at_delivery', 'completed', 'rejected'
- RLS policy: org_id isolation using auth.org_id() helper
- Dispatch creation also updates load status to 'dispatched'

### Dispatch Board (Command Mode /dispatch)
- Two-column layout: unassigned loads on the left, available drivers on the right
- Dropdown select for driver/vehicle assignment (NOT drag-and-drop — that's Phase 6)
- Active dispatches list below showing ETA and current status
- Driver availability view: who is free (no active dispatch), who is on a load, who is off (inactive/terminated filtered out)
- Dispatch status changes broadcast via Supabase Realtime on channel org:{org_id}:dispatch

### Driver PWA Dispatch (/driver/dispatch or integrated into /driver/loads)
- Current dispatch card with load summary (pickup → delivery, dates, broker)
- Accept/reject buttons for new assignments
- Status update flow — driver can update dispatch status (en_route_pickup, at_pickup, etc.)
- Notes to dispatcher text input
- Dispatch acceptance/rejection triggers Realtime update to Command mode

### Assignment Flow
- Dispatcher selects a load from unassigned list
- Picks a driver from available drivers dropdown
- Optionally picks a vehicle (defaults to driver's current_vehicle_id)
- Creates dispatch record + updates load status to 'dispatched'
- Driver receives the assignment in their PWA (via Realtime)
- Driver accepts or rejects
- On accept: dispatch status → 'accepted', load remains 'dispatched'
- On reject: dispatch status → 'rejected', load reverts to 'booked', dispatcher notified

### Realtime
- Reuse useRealtimeLoads pattern from Phase 2 for dispatch updates
- Create useRealtimeDispatches hook with same pattern
- Dispatch board subscribes to both loads and dispatches channels

### Design Patterns (carried from Phase 1-2)
- Server actions for all mutations (createDispatch, acceptDispatch, rejectDispatch, updateDispatchStatus)
- Zod schema for dispatch validation
- react-hook-form for dispatch assignment form
- Supabase server client for data fetching in server components
- StatusBadge component (from Phase 2) extended for dispatch statuses

### Claude's Discretion
- Exact layout proportions for the dispatch board two-column view
- How to display driver availability (cards vs table rows)
- Whether to show ETA as time or countdown
- Loading states and empty states for dispatch board
- How to handle driver notes UI (inline vs modal)

</decisions>

<specifics>
## Specific Ideas

- The dispatch board is where dispatchers spend most of their day — it needs to be scannable and efficient
- Unassigned loads should show key info at a glance: load number, pickup city → delivery city, date, equipment type
- Available drivers should show: name, current status, assigned vehicle, last known location (if available from last load delivery)
- Driver PWA dispatch card should be big and prominent — this is the most important thing a driver sees

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/hooks/use-realtime-loads.ts` — Clone pattern for useRealtimeDispatches
- `src/components/ui/status-badge.tsx` — Extend with dispatch status variants
- `src/app/(app)/loads/status-actions.ts` — Pattern for dispatch status update actions
- `src/components/loads/load-list.tsx` — Pattern for dispatch list component
- `src/components/drivers/driver-active-load.tsx` — Pattern for driver PWA dispatch card
- `src/lib/load-status.ts` — Pattern for dispatch status transition logic
- `src/app/(app)/loads/loads-view.tsx` — Client wrapper with Realtime pattern

### Established Patterns
- Server action pattern: validate with Zod → Supabase query → revalidatePath → redirect
- Realtime pattern: useEffect → supabase.channel() → .on('postgres_changes') → router.refresh()
- RLS pattern: auth.org_id() helper, org_id indexed
- Component pattern: server component page → client component for interactive elements

### Integration Points
- Sidebar navigation: add /dispatch link (between Loads and Fleet)
- Driver PWA navigation: add dispatch section
- Load status: dispatch creation sets load to 'dispatched', rejection reverts to 'booked'
- Drivers table: query active drivers with no current dispatch for availability

</code_context>

<deferred>
## Deferred Ideas

- Smart routing / driver suggestions — Phase 5 (Marie AI & Smart Routing)
- Drag-and-drop assignment — Phase 6 (Enhanced Dispatch)
- Map view with driver/load pins — Phase 6
- Timeline/Gantt view of driver schedules — Phase 6
- Conflict detection for overlapping loads — Phase 6
- Push notifications for new dispatch — Phase 6 (Push Notifications)

</deferred>

---

*Phase: 03-dispatch*
*Context gathered: 2026-03-25*
