# Phase 6: Alerts, Analytics & Enhanced Dispatch - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Predictive alerts (6 types via edge functions), push notifications (Web Push API), analytics foundation (daily snapshots + 4 dashboard charts), and enhanced dispatch board (map view, timeline view, conflict detection). This phase wires the proactive_alerts table from Phase 5 with actual alert generators and connects the intelligence layer to the UI.

</domain>

<decisions>
## Implementation Decisions

### Predictive Alerts (Edge Functions via pg_cron)
- 6 alert types per PRD-02 Section 4.2:
  1. **Late pickup risk:** Driver > 100 miles from pickup with < 3 hours until window (every 30 min)
  2. **Driver gone silent:** No status update > 4 hours while in_transit (every hour)
  3. **Overdue invoice:** Already exists from Phase 4, enhanced to write proactive_alerts (daily 8 AM)
  4. **Dispatch conflict:** Overlapping pickup windows for same driver (on dispatch creation — API middleware)
  5. **ETA risk:** Estimated delivery exceeds window (every hour for in_transit loads)
  6. **Unassigned load:** Booked load with pickup < 24h and no dispatch (every 2 hours)
- Alerts write to proactive_alerts table (created in Phase 5)
- Severity: 'info', 'warning', 'critical' based on time thresholds
- Alerts visible in dashboard and Marie chat with severity badges
- Users can acknowledge alerts
- For Phase 6 MVP: implement alerts as SQL functions called by pg_cron, NOT Supabase Edge Functions (simpler, same result)

### Push Notifications
- Web Push API with service worker registration
- Permission requested after first successful login (not on signup)
- 5 notification types per PRD-02 Section 7.2:
  1. New dispatch assigned → Driver
  2. Load status changed → Dispatcher who created dispatch
  3. Proactive alert → Admins + dispatchers (critical only)
  4. Invoice paid → Admin
  5. Driver accepted/rejected dispatch → Dispatcher
- User can toggle notification types on/off in /settings
- Stored as notification_preferences jsonb on profiles (or separate column)

### Analytics Foundation
- daily_snapshots table per PRD-02 Section 5.2: org_id, snapshot_date, loads_booked, loads_delivered, loads_canceled, revenue, total_miles, revenue_per_mile, on_time_deliveries, total_deliveries, on_time_percentage, active_drivers, invoices_generated, invoices_paid
- daily-snapshot-generator: pg_cron daily at 1 AM, aggregates previous day's data
- 4 dashboard charts (Recharts, already in stack):
  1. Revenue trend: line chart, last 30 days
  2. Load volume: bar chart, booked vs delivered per week
  3. On-time performance: gauge chart, current month %
  4. Revenue per mile: line chart, last 30 days
- Charts added to existing Command dashboard (below stat cards)

### Enhanced Dispatch Board
- **Map view:** MapLibre + react-map-gl showing unassigned loads as pins, available drivers as different-colored pins. Free tiles (no per-tile fees per Stack research)
- **Timeline view:** Gantt-style view of driver schedules showing current load, next load, gaps
- **Conflict detection:** Real-time warning when assigning driver with overlapping pickup windows
- **Smart routing integration:** Already built in Phase 5 — Suggested tab in assignment form

### Design Patterns (carried forward)
- All existing patterns from Phases 1-5
- Recharts imported as specific components (tree-shaking per cursorrules)
- MapLibre + react-map-gl for map views

### Claude's Discretion
- Exact alert message wording
- Map pin styling and colors
- Timeline/Gantt component design
- Chart styling and color scheme (use #EC008C primary where appropriate)
- Push notification permission prompt UX
- How to display alerts in dashboard (list vs cards)

</decisions>

<specifics>
## Specific Ideas

- Predictive alerts should feel like a dispatcher's early warning system — not noise, not spam
- Start with critical alerts only for push notifications — too many pushes and people turn them off
- The map view on dispatch is for visual proximity matching — dispatchers look at it to see which driver is closest to which load
- Revenue trend chart should be the hero chart on the dashboard — this is the number operators care about most
- Timeline view should look like a scheduling tool — clear, readable, not cramped

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `supabase/migrations/00017_marie_queries.sql` — proactive_alerts table already exists with RLS
- `src/app/(app)/dashboard/page.tsx` — Dashboard server component to extend with charts
- `src/app/(app)/dashboard/dashboard-view.tsx` — Client wrapper for Realtime
- `src/hooks/use-realtime-dashboard.ts` — Combined Realtime channel for dashboard
- `src/app/(app)/dispatch/dispatch-board.tsx` — Dispatch board to enhance with map/timeline
- `src/components/dispatch/*` — All dispatch components
- `src/lib/routing/adjacency.ts` — US state adjacency (proximity reference)

### Established Patterns
- pg_cron via SQL migration (from Phase 4 overdue scanner)
- Realtime hooks pattern
- Dashboard stat cards + activity feed pattern
- StatusBadge for severity indicators

### Integration Points
- Dashboard: add charts below existing stat cards
- Dispatch board: add map/timeline view tabs alongside existing list
- Alert indicators: wire Marie button badge to real alert count
- Push: service worker registration in root layout
- New npm deps: recharts, maplibre-gl, react-map-gl

</code_context>

<deferred>
## Deferred Ideas

- Full reporting suite (PDF export, trend charts) — Phase 11
- Alert-based auto-dispatch suggestions — Future
- Historical map playback — Future
- Driver GPS tracking pins (real location) — requires ELD integration (v2)

</deferred>

---

*Phase: 06-alerts-analytics-enhanced-dispatch*
*Context gathered: 2026-03-25*
