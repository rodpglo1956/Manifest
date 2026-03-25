# Phase 6: Alerts, Analytics & Enhanced Dispatch - Research

**Researched:** 2026-03-25
**Domain:** Predictive alerts (pg_cron SQL functions), Web Push notifications, Recharts dashboard charts, MapLibre/react-map-gl dispatch map, timeline/Gantt scheduling view
**Confidence:** HIGH

## Summary

Phase 6 wires the proactive_alerts table (created in Phase 5) to actual alert generators, adds push notifications via the Web Push API, builds four dashboard charts using Recharts, and enhances the dispatch board with a map view (MapLibre + react-map-gl) and a timeline/Gantt view. The phase spans four distinct sub-domains that share a common theme: making the operator's situational awareness better.

The alert generators are SQL functions invoked by pg_cron -- the same pattern already established in the Phase 4 overdue invoice scanner. Push notifications use the `web-push` npm package with a service worker at `public/sw.js`. Recharts v3.8.0 is React 19 compatible and supports tree-shakeable component imports. MapLibre GL JS with react-map-gl provides free map rendering with no per-tile API costs using OpenFreeMap or CartoCDN tiles.

**Primary recommendation:** Build alerts as pure SQL functions called by pg_cron (proven pattern), use `web-push` with server actions for push delivery, import Recharts components individually for tree-shaking, dynamically import the map component with `ssr: false` to avoid SSR issues, and build the timeline view as a custom component rather than pulling in a heavy Gantt library.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 6 alert types per PRD-02 Section 4.2 (late pickup, driver silent, overdue invoice, dispatch conflict, ETA risk, unassigned load)
- Alerts implemented as SQL functions called by pg_cron, NOT Supabase Edge Functions
- Web Push API with service worker registration for push notifications
- 5 notification types (new dispatch, load status change, critical alert, invoice paid, driver accept/reject)
- Permission requested after first successful login, not on signup
- Notification preferences stored as jsonb on profiles (or separate column)
- daily_snapshots table per PRD-02 Section 5.2 schema
- daily-snapshot-generator via pg_cron daily at 1 AM
- 4 dashboard charts: revenue trend (line), load volume (bar), on-time performance (gauge), revenue per mile (line)
- Charts built with Recharts (already in stack decision)
- MapLibre + react-map-gl for map views (free tiles)
- Timeline/Gantt view for driver schedules
- Conflict detection on dispatch assignment (overlapping pickup windows)
- Smart routing integration already built in Phase 5

### Claude's Discretion
- Exact alert message wording
- Map pin styling and colors
- Timeline/Gantt component design
- Chart styling and color scheme (use #EC008C primary where appropriate)
- Push notification permission prompt UX
- How to display alerts in dashboard (list vs cards)

### Deferred Ideas (OUT OF SCOPE)
- Full reporting suite (PDF export, trend charts) -- Phase 11
- Alert-based auto-dispatch suggestions -- Future
- Historical map playback -- Future
- Driver GPS tracking pins (real location) -- requires ELD integration (v2)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ALRT-01 | Late pickup risk alert when driver > 100 miles from pickup with < 3 hours remaining | pg_cron SQL function using city/state proximity heuristic (no geocoding API) |
| ALRT-02 | Driver gone silent alert when no status update in > 4 hours while in_transit | pg_cron SQL function checking load_status_history timestamps |
| ALRT-03 | Overdue invoice alert (enhances Phase 4 scanner to write proactive_alerts) | Extend existing cron.schedule for overdue-invoice-scanner |
| ALRT-04 | Dispatch conflict alert when overlapping pickup windows for same driver | API-level check in createDispatch server action |
| ALRT-05 | ETA risk alert when estimated delivery exceeds window | pg_cron SQL function using miles / avg_speed vs delivery_time |
| ALRT-06 | Unassigned load alert when booked load has pickup < 24h with no dispatch | pg_cron SQL function checking loads without dispatches |
| ALRT-07 | Alerts appear in dashboard and Marie chat with severity badges | Dashboard alert feed component + extend Marie alert summarization |
| ALRT-08 | Users can acknowledge alerts | Server action updating proactive_alerts.acknowledged |
| PUSH-01 | Web Push API with service worker for desktop and Driver PWA | web-push npm + public/sw.js + registration in root layout |
| PUSH-02 | Driver receives push notification when new dispatch assigned | Trigger in createDispatch server action |
| PUSH-03 | Dispatcher receives push when driver updates load status | Trigger in status update actions |
| PUSH-04 | Admins/dispatchers receive push for critical proactive alerts | Trigger in alert generator SQL or post-insert hook |
| PUSH-05 | User can toggle notification types on/off in settings | notification_preferences jsonb column + settings UI |
| ANLY-01 | Daily snapshots generated nightly | pg_cron SQL function aggregating loads/invoices/dispatches |
| ANLY-02 | Revenue trend line chart (last 30 days) | Recharts LineChart from daily_snapshots |
| ANLY-03 | Load volume bar chart (booked vs delivered per week) | Recharts BarChart from daily_snapshots |
| ANLY-04 | On-time performance gauge chart (current month) | Recharts RadialBarChart as gauge |
| ANLY-05 | Revenue per mile trend line chart (last 30 days) | Recharts LineChart from daily_snapshots |
| EDSP-01 | Map view showing unassigned loads and available drivers as pins | MapLibre GL + react-map-gl with dynamic import |
| EDSP-02 | Timeline/Gantt view of driver schedules with gaps | Custom timeline component (no heavy library) |
| EDSP-03 | Conflict detection warns when assigning driver with overlapping load | Overlap check query in createDispatch |
| EDSP-04 | Smart routing suggestion panel integrated into dispatch UI | Already built in Phase 5 (ROUT-03/04) -- no new work |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | ^3.8.0 | Dashboard charts (line, bar, radial) | React 19 compatible, tree-shakeable, composable components |
| maplibre-gl | ^5.x | Map rendering engine (WebGL) | Free, no API key for tiles, OSS fork of Mapbox GL |
| react-map-gl | ^8.1.0 | React wrapper for MapLibre GL | Official visgl wrapper, `react-map-gl/maplibre` import path |
| web-push | ^3.6.7 | Server-side push notification delivery | Standard VAPID-based Web Push, no third-party service needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.1.0 (already installed) | Date arithmetic for alert thresholds | Alert time calculations, snapshot date ranges |
| lucide-react | ^1.6.0 (already installed) | Alert/notification icons | Severity badges, map controls, timeline icons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom timeline | frappe-gantt / @svar/react-gantt | Gantt libs are heavy (100KB+), our use case is simple horizontal bars per driver -- custom is lighter |
| MapLibre | Leaflet | MapLibre has better WebGL perf, vector tiles, and react-map-gl provides clean React API |
| RadialBarChart gauge | react-gauge-chart | Extra dep for one chart; Recharts RadialBarChart works as gauge with endAngle trick |
| web-push | Firebase Cloud Messaging | FCM requires Google account, more complex setup; web-push is provider-free |

**Installation:**
```bash
npm install recharts maplibre-gl react-map-gl web-push
npm install -D @types/web-push
```

**Note on Recharts + React 19:** Recharts 3.8.0 works with React 19. If `react-is` version mismatch errors occur, add to package.json:
```json
"overrides": {
  "react-is": "19.1.0"
}
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(app)/
│   ├── dashboard/
│   │   ├── page.tsx                    # Extend: pass snapshot data to charts
│   │   ├── dashboard-view.tsx          # Extend: add chart grid below stat cards
│   │   ├── charts/
│   │   │   ├── revenue-trend-chart.tsx # 'use client' - LineChart
│   │   │   ├── load-volume-chart.tsx   # 'use client' - BarChart
│   │   │   ├── on-time-gauge.tsx       # 'use client' - RadialBarChart
│   │   │   └── rpm-trend-chart.tsx     # 'use client' - LineChart
│   │   └── alert-feed.tsx             # Dashboard alerts panel
│   ├── dispatch/
│   │   ├── dispatch-board.tsx          # Extend: add tab view (list/map/timeline)
│   │   ├── dispatch-map.tsx            # 'use client' dynamic import, ssr:false
│   │   ├── dispatch-timeline.tsx       # 'use client' Gantt/timeline view
│   │   └── conflict-warning.tsx        # Inline conflict detection UI
│   └── settings/
│       └── notifications/
│           └── page.tsx                # Notification preferences toggles
├── components/
│   └── push/
│       ├── push-provider.tsx           # Service worker registration + permission
│       └── push-prompt.tsx             # Permission request UI
├── hooks/
│   └── use-push-subscription.ts        # Hook for managing push subscription
├── lib/
│   ├── push/
│   │   ├── send-notification.ts        # Server-side web-push sender
│   │   └── vapid.ts                    # VAPID key config
│   └── alerts/
│       └── alert-helpers.ts            # Alert severity utils, message formatting
├── app/api/
│   ├── push/
│   │   ├── subscribe/route.ts          # POST: save subscription to DB
│   │   └── send/route.ts              # POST: internal trigger for sending push
│   └── analytics/
│       └── snapshots/route.ts          # GET: daily snapshot data for charts
public/
└── sw.js                              # Service worker for push notifications
supabase/migrations/
├── 00018_daily_snapshots.sql           # daily_snapshots table + RLS
├── 00019_alert_generators.sql          # SQL functions + pg_cron schedules
├── 00020_push_subscriptions.sql        # push_subscriptions table
└── 00021_notification_preferences.sql  # Add column to profiles
```

### Pattern 1: pg_cron SQL Function for Alert Generation
**What:** SQL functions that scan tables and insert into proactive_alerts, called by pg_cron
**When to use:** All 5 scheduled alert types (late pickup, driver silent, ETA risk, unassigned load, snapshot generator)
**Example:**
```sql
-- Source: Existing pattern from 00016_invoices.sql pg_cron overdue scanner
CREATE OR REPLACE FUNCTION check_unassigned_loads()
RETURNS void AS $$
BEGIN
  INSERT INTO proactive_alerts (org_id, alert_type, severity, title, message, related_entity_type, related_entity_id)
  SELECT
    l.org_id,
    'unassigned_load',
    CASE
      WHEN l.pickup_date::timestamp - now() < interval '12 hours' THEN 'critical'
      ELSE 'warning'
    END,
    'Unassigned Load: ' || COALESCE(l.load_number, l.id::text),
    'Load ' || COALESCE(l.load_number, 'unknown') || ' picks up in ' ||
      EXTRACT(HOUR FROM l.pickup_date::timestamp - now())::int || ' hours with no driver assigned.',
    'load',
    l.id
  FROM loads l
  LEFT JOIN dispatches d ON d.load_id = l.id AND d.status NOT IN ('completed', 'rejected')
  WHERE l.status = 'booked'
    AND d.id IS NULL
    AND l.pickup_date IS NOT NULL
    AND l.pickup_date::timestamp - now() < interval '24 hours'
    AND l.pickup_date::timestamp > now()
    -- Avoid duplicate alerts (none in last 2 hours for this load)
    AND NOT EXISTS (
      SELECT 1 FROM proactive_alerts pa
      WHERE pa.related_entity_id = l.id
        AND pa.alert_type = 'unassigned_load'
        AND pa.created_at > now() - interval '2 hours'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT cron.schedule('check-unassigned-loads', '0 */2 * * *', $$SELECT check_unassigned_loads();$$);
```

### Pattern 2: Dynamic Import for MapLibre (SSR Avoidance)
**What:** MapLibre GL JS requires browser APIs (WebGL, DOM) and cannot render server-side
**When to use:** Any component using maplibre-gl or react-map-gl
**Example:**
```typescript
// src/app/(app)/dispatch/dispatch-board.tsx
import dynamic from 'next/dynamic'

const DispatchMap = dynamic(() => import('./dispatch-map'), { ssr: false })

// In JSX:
{activeView === 'map' && <DispatchMap loads={unassignedLoads} drivers={drivers} />}
```

```typescript
// src/app/(app)/dispatch/dispatch-map.tsx
'use client'

import { Map, Marker, NavigationControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

// Use free tile source -- no API key
const TILE_STYLE = 'https://tiles.openfreemap.org/styles/positron'

export default function DispatchMap({ loads, drivers }: DispatchMapProps) {
  return (
    <Map
      initialViewState={{ longitude: -98.5, latitude: 39.8, zoom: 4 }}
      style={{ width: '100%', height: '500px' }}
      mapStyle={TILE_STYLE}
    >
      <NavigationControl position="top-right" />
      {/* Load pins */}
      {loads.map(load => (
        <Marker key={load.id} longitude={getLng(load)} latitude={getLat(load)}>
          <LoadPin load={load} />
        </Marker>
      ))}
      {/* Driver pins */}
      {drivers.map(driver => (
        <Marker key={driver.id} longitude={getLng(driver)} latitude={getLat(driver)}>
          <DriverPin driver={driver} />
        </Marker>
      ))}
    </Map>
  )
}
```

### Pattern 3: Recharts Tree-Shakeable Component Imports
**What:** Import only the specific Recharts components used in each chart
**When to use:** All chart components
**Example:**
```typescript
// Source: Recharts official docs / npm
'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'

export function RevenueTrendChart({ data }: { data: SnapshotRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="snapshot_date" />
        <YAxis />
        <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
        <Line type="monotone" dataKey="revenue" stroke="#EC008C" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Pattern 4: Service Worker for Web Push
**What:** Service worker at `public/sw.js` handles incoming push events
**When to use:** Push notification delivery
**Example:**
```javascript
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const options = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: data.tag || 'default',
    data: { url: data.url || '/' },
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Manifest', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
```

### Pattern 5: Conflict Detection in createDispatch
**What:** Before creating a dispatch, check if the driver has overlapping pickup windows
**When to use:** EDSP-03 and ALRT-04 -- dispatch conflict alert
**Example:**
```typescript
// In dispatch actions.ts, before creating dispatch:
async function checkDispatchConflict(
  supabase: SupabaseClient,
  driverId: string,
  newLoadId: string
): Promise<{ hasConflict: boolean; conflictingLoad?: string }> {
  // Get the new load's pickup window
  const { data: newLoad } = await supabase
    .from('loads')
    .select('pickup_date, pickup_time, delivery_date')
    .eq('id', newLoadId)
    .single()

  if (!newLoad?.pickup_date) return { hasConflict: false }

  // Find active dispatches for this driver with overlapping dates
  const { data: activeDispatches } = await supabase
    .from('dispatches')
    .select('id, load_id, loads!inner(pickup_date, delivery_date, load_number)')
    .eq('driver_id', driverId)
    .not('status', 'in', '("completed","rejected")')

  // Check for date overlaps
  for (const dispatch of activeDispatches ?? []) {
    const existingLoad = dispatch.loads
    if (datesOverlap(newLoad, existingLoad)) {
      return { hasConflict: true, conflictingLoad: existingLoad.load_number }
    }
  }
  return { hasConflict: false }
}
```

### Anti-Patterns to Avoid
- **Importing all of Recharts:** `import * as Recharts from 'recharts'` -- defeats tree-shaking, import specific components only
- **SSR rendering map components:** MapLibre requires browser APIs; always use `dynamic(() => import(...), { ssr: false })`
- **Geocoding API for proximity:** Project uses city/state text matching with adjacency map (from Phase 5); do NOT add geocoding API dependency
- **Storing push subscriptions on profiles table:** Keep push_subscriptions as separate table -- one user can have multiple devices/browsers
- **Running expensive queries in pg_cron without limits:** Always add de-duplication checks (NOT EXISTS on recent alerts) to prevent alert spam

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Push notification delivery | Custom WebSocket-based push | web-push npm + Web Push API | VAPID signing, endpoint management, browser compatibility all handled |
| Map rendering | Custom canvas/SVG map | MapLibre GL + react-map-gl | WebGL performance, tile loading, zoom/pan, marker clustering |
| Chart rendering | Custom SVG charts | Recharts components | Responsive, animated, accessible, tooltip/legend built-in |
| VAPID key generation | Manual key generation | `npx web-push generate-vapid-keys` | Correct format, proper encoding |
| Cron scheduling | Custom interval timers | pg_cron extension | Database-native, survives restarts, managed by Supabase |
| Alert deduplication | Application-level dedup | SQL NOT EXISTS clause in alert generators | Single atomic operation, no race conditions |

**Key insight:** Every sub-domain in this phase has a well-established library or Postgres extension that handles the hard parts. The implementation work is wiring these together with the existing Manifest codebase, not building novel functionality.

## Common Pitfalls

### Pitfall 1: MapLibre SSR Crash
**What goes wrong:** `window is not defined` or `document is not defined` error during Next.js build
**Why it happens:** MapLibre GL JS accesses browser-only APIs at import time
**How to avoid:** Always use `next/dynamic` with `{ ssr: false }` for any component that imports from `react-map-gl/maplibre` or `maplibre-gl`
**Warning signs:** Build failures, hydration errors

### Pitfall 2: Alert Spam from pg_cron
**What goes wrong:** Same alert generated every cycle (e.g., unassigned load alert every 2 hours for same load)
**Why it happens:** No deduplication check in the alert generator SQL
**How to avoid:** Every alert generator must include `AND NOT EXISTS (SELECT 1 FROM proactive_alerts WHERE related_entity_id = X AND alert_type = Y AND created_at > now() - interval 'Z')` -- where Z matches the cron interval
**Warning signs:** Dashboard flooded with identical alerts

### Pitfall 3: Push Subscription Storage Per-Device
**What goes wrong:** User logs in on phone and desktop but only gets push on one device
**Why it happens:** Storing subscription on the user profile instead of a separate subscriptions table
**How to avoid:** Use a `push_subscriptions` table with user_id + endpoint as unique constraint; one user can have multiple subscriptions (one per browser/device)
**Warning signs:** Missing notifications on secondary devices

### Pitfall 4: Recharts react-is Version Mismatch
**What goes wrong:** Runtime error about `react-is` not matching React version
**Why it happens:** Recharts depends on `react-is` which must match the React version exactly
**How to avoid:** Add `"overrides": { "react-is": "19.1.0" }` to package.json if errors occur (Recharts 3.8.0 may have resolved this)
**Warning signs:** Console errors mentioning react-is during chart rendering

### Pitfall 5: Proximity Calculation Without Geocoding
**What goes wrong:** "Driver > 100 miles from pickup" check is impossible without lat/lng coordinates
**Why it happens:** Project uses city/state text fields, not geocoded coordinates
**How to avoid:** Use the same adjacency-based proximity heuristic from Phase 5 smart routing. For late pickup alerts, check if driver's last delivery state matches pickup state or is adjacent. This is a heuristic, not exact distance -- frame alert messages accordingly ("Driver may be far from pickup" instead of "Driver is 150 miles away")
**Warning signs:** Alert messages claiming exact distances when no geocoding exists

### Pitfall 6: Service Worker Cache Issues During Development
**What goes wrong:** Old service worker cached, not picking up new push handler code
**Why it happens:** Service workers have aggressive caching by default
**How to avoid:** During development, use Chrome DevTools > Application > Service Workers > "Update on reload". In production, version the SW or use `self.skipWaiting()` + `clients.claim()`
**Warning signs:** Push notifications not appearing despite server sending them

### Pitfall 7: Map Marker Placement Without Coordinates
**What goes wrong:** Loads and drivers don't have lat/lng fields -- can't place markers on map
**Why it happens:** The loads table stores city/state text, not geocoded coordinates
**How to avoid:** Two options: (1) Use a simple city-to-coordinate lookup table for major US cities (sufficient for dispatch map at zoom level 4-6), or (2) Add a lightweight geocoding step when loads are created. Option 1 is recommended for Phase 6 MVP -- a static JSON map of ~500 major US cities covers most trucking origins/destinations.
**Warning signs:** All pins stacked at (0,0) or map empty

## Code Examples

### Daily Snapshot Generator (pg_cron SQL Function)
```sql
-- Source: PRD-02 Section 5.2 schema
CREATE OR REPLACE FUNCTION generate_daily_snapshot()
RETURNS void AS $$
DECLARE
  org RECORD;
  snap_date DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  FOR org IN SELECT DISTINCT org_id FROM loads LOOP
    INSERT INTO daily_snapshots (
      org_id, snapshot_date, loads_booked, loads_delivered, loads_canceled,
      revenue, total_miles, revenue_per_mile,
      on_time_deliveries, total_deliveries, on_time_percentage,
      active_drivers, invoices_generated, invoices_paid
    )
    SELECT
      org.org_id,
      snap_date,
      COUNT(*) FILTER (WHERE l.status = 'booked' AND l.created_at::date = snap_date),
      COUNT(*) FILTER (WHERE l.status IN ('delivered','invoiced','paid')
        AND EXISTS (
          SELECT 1 FROM load_status_history lsh
          WHERE lsh.load_id = l.id AND lsh.new_status = 'delivered'
            AND lsh.created_at::date = snap_date
        )),
      COUNT(*) FILTER (WHERE l.status = 'canceled' AND l.updated_at::date = snap_date),
      COALESCE(SUM(l.total_charges) FILTER (WHERE EXISTS (
        SELECT 1 FROM load_status_history lsh
        WHERE lsh.load_id = l.id AND lsh.new_status = 'delivered'
          AND lsh.created_at::date = snap_date
      )), 0),
      COALESCE(SUM(l.miles) FILTER (WHERE EXISTS (
        SELECT 1 FROM load_status_history lsh
        WHERE lsh.load_id = l.id AND lsh.new_status = 'delivered'
          AND lsh.created_at::date = snap_date
      )), 0),
      CASE WHEN SUM(l.miles) FILTER (WHERE EXISTS (
        SELECT 1 FROM load_status_history lsh
        WHERE lsh.load_id = l.id AND lsh.new_status = 'delivered'
          AND lsh.created_at::date = snap_date
      )) > 0
      THEN COALESCE(SUM(l.total_charges), 0) / SUM(l.miles)
      ELSE 0 END,
      0, -- on_time_deliveries calculated separately
      0, -- total_deliveries calculated separately
      0, -- on_time_percentage
      (SELECT COUNT(*) FROM drivers d WHERE d.org_id = org.org_id AND d.status = 'active'),
      (SELECT COUNT(*) FROM invoices i WHERE i.org_id = org.org_id AND i.created_at::date = snap_date),
      (SELECT COALESCE(SUM(i.total), 0) FROM invoices i WHERE i.org_id = org.org_id AND i.status = 'paid' AND i.paid_date::date = snap_date)
    FROM loads l
    WHERE l.org_id = org.org_id
    ON CONFLICT (org_id, snapshot_date) DO UPDATE SET
      loads_booked = EXCLUDED.loads_booked,
      loads_delivered = EXCLUDED.loads_delivered,
      revenue = EXCLUDED.revenue,
      total_miles = EXCLUDED.total_miles,
      revenue_per_mile = EXCLUDED.revenue_per_mile,
      active_drivers = EXCLUDED.active_drivers,
      invoices_generated = EXCLUDED.invoices_generated,
      invoices_paid = EXCLUDED.invoices_paid;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT cron.schedule('daily-snapshot-generator', '0 1 * * *', $$SELECT generate_daily_snapshot();$$);
```

### Push Subscription Storage Schema
```sql
CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  keys_p256dh text NOT NULL,
  keys_auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions"
  ON push_subscriptions FOR ALL
  USING (user_id = auth.uid());
```

### Notification Preferences Column
```sql
-- Add to profiles table
ALTER TABLE profiles
ADD COLUMN notification_preferences jsonb DEFAULT '{
  "new_dispatch": true,
  "load_status_change": true,
  "critical_alert": true,
  "invoice_paid": true,
  "driver_response": true
}'::jsonb;
```

### Recharts Gauge (RadialBarChart as Gauge)
```typescript
'use client'

import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'

export function OnTimeGauge({ percentage }: { percentage: number }) {
  const data = [{ value: percentage, fill: '#EC008C' }]
  return (
    <div className="flex flex-col items-center">
      <RadialBarChart
        width={200} height={200}
        cx={100} cy={100}
        innerRadius={60} outerRadius={80}
        barSize={12}
        data={data}
        startAngle={180}
        endAngle={0}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
        <RadialBar
          background clockWise
          dataKey="value"
          cornerRadius={6}
          angleAxisId={0}
        />
      </RadialBarChart>
      <div className="text-2xl font-bold text-gray-900 -mt-16">{percentage}%</div>
      <div className="text-xs text-gray-500 mt-1">On-Time This Month</div>
    </div>
  )
}
```

### Server-Side Push Notification Sender
```typescript
// src/lib/push/send-notification.ts
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:support@glomatrix.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, keys_p256dh, keys_auth')
    .eq('user_id', userId)

  const results = await Promise.allSettled(
    (subscriptions ?? []).map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth } },
        JSON.stringify(payload)
      )
    )
  )

  // Clean up expired subscriptions (410 Gone)
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'rejected') {
      const err = (results[i] as PromiseRejectedResult).reason
      if (err?.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', subscriptions![i].endpoint)
      }
    }
  }
}
```

### City-to-Coordinates Lookup for Map Pins
```typescript
// src/lib/geo/city-coords.ts
// Static lookup for major US trucking cities -- sufficient for dispatch map visualization
// This avoids geocoding API dependency. ~500 entries covers most trucking O/D pairs.
type CityCoord = { lat: number; lng: number }

const CITY_COORDS: Record<string, CityCoord> = {
  'dallas_tx': { lat: 32.7767, lng: -96.7970 },
  'houston_tx': { lat: 29.7604, lng: -95.3698 },
  'atlanta_ga': { lat: 33.7490, lng: -84.3880 },
  'chicago_il': { lat: 41.8781, lng: -87.6298 },
  'los angeles_ca': { lat: 34.0522, lng: -118.2437 },
  // ... ~500 more entries
}

export function getCityCoords(city: string | null, state: string | null): CityCoord | null {
  if (!city || !state) return null
  const key = `${city.toLowerCase()}_${state.toLowerCase()}`
  return CITY_COORDS[key] ?? null
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recharts 2.x | Recharts 3.8.0 | 2024 | Better React 19 support, improved tree-shaking |
| Mapbox GL JS (proprietary) | MapLibre GL JS (open source) | 2020 fork | No per-tile fees, identical API, free tiles available |
| Firebase Cloud Messaging | Web Push API + web-push npm | Always available | No vendor lock-in, works with any VAPID-compatible push service |
| Supabase Edge Functions for cron | pg_cron SQL functions | Both available | SQL functions have zero network latency, simpler for DB-centric operations |

**Deprecated/outdated:**
- `react-map-gl` < v7: Old versions used different API; v8+ uses the modern `Map` component API
- Mapbox GL JS v2+: Requires paid API key; MapLibre is the free alternative
- `web-push` < v3.5: Older versions had VAPID compatibility issues

## Open Questions

1. **City-to-coordinates data source**
   - What we know: Need ~500 US city coordinates for map pins
   - What's unclear: Best source for this data (Census Bureau, manual curation, or GeoNames)
   - Recommendation: Use a static JSON file with the top 500 US cities by trucking volume. Can be generated once from Census data or manually curated. No runtime geocoding needed.

2. **Push notification for pg_cron-generated alerts (PUSH-04)**
   - What we know: pg_cron functions run inside Postgres, web-push requires Node.js
   - What's unclear: How to trigger push notification from a SQL function
   - Recommendation: Use pg_net extension to call an internal API route (`/api/push/send`) from the SQL function, OR use a Postgres NOTIFY + Supabase Realtime listener pattern, OR simply have the dashboard poll for new alerts and trigger push client-side. Simplest: pg_net HTTP request to internal API.

3. **On-time delivery calculation**
   - What we know: Need to compare actual delivery time vs delivery window
   - What's unclear: delivery_time column stores the window end time as text, not a precise timestamp
   - Recommendation: A delivery is "on-time" if the load_status_history entry for `new_status = 'delivered'` has `created_at` on or before the `delivery_date`. Ignore delivery_time for simplicity since it's a text field with inconsistent formatting.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ALRT-01 | Late pickup risk alert generation | unit | `npx vitest run tests/alerts/late-pickup.test.ts -x` | Wave 0 |
| ALRT-02 | Driver gone silent alert generation | unit | `npx vitest run tests/alerts/driver-silent.test.ts -x` | Wave 0 |
| ALRT-04 | Dispatch conflict detection | unit | `npx vitest run tests/dispatch/conflict.test.ts -x` | Wave 0 |
| ALRT-06 | Unassigned load alert generation | unit | `npx vitest run tests/alerts/unassigned-load.test.ts -x` | Wave 0 |
| ALRT-08 | Alert acknowledgment | unit | `npx vitest run tests/alerts/acknowledge.test.ts -x` | Wave 0 |
| ANLY-01 | Daily snapshot aggregation logic | unit | `npx vitest run tests/analytics/snapshot.test.ts -x` | Wave 0 |
| PUSH-01 | Push subscription management | unit | `npx vitest run tests/push/subscribe.test.ts -x` | Wave 0 |
| PUSH-05 | Notification preferences CRUD | unit | `npx vitest run tests/push/preferences.test.ts -x` | Wave 0 |
| EDSP-03 | Conflict detection overlap logic | unit | `npx vitest run tests/dispatch/overlap.test.ts -x` | Wave 0 |
| ALRT-03 | Overdue invoice alert (SQL) | integration | SQL migration test (manual) | N/A |
| ALRT-05 | ETA risk alert (SQL) | integration | SQL migration test (manual) | N/A |
| ALRT-07 | Alerts in dashboard UI | manual-only | Visual check -- alerts render with badges | N/A |
| ANLY-02-05 | Chart rendering | manual-only | Visual check -- charts render with data | N/A |
| EDSP-01 | Map view rendering | manual-only | Visual check -- map loads, pins render | N/A |
| EDSP-02 | Timeline view rendering | manual-only | Visual check -- timeline shows driver schedules | N/A |
| PUSH-02-04 | Push delivery triggers | integration | Manual test -- trigger action, verify push | N/A |

### Sampling Rate
- **Per task commit:** `npm test -- --reporter=verbose`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/alerts/` directory -- all alert generator unit tests
- [ ] `tests/analytics/snapshot.test.ts` -- snapshot aggregation logic
- [ ] `tests/push/subscribe.test.ts` -- push subscription management
- [ ] `tests/push/preferences.test.ts` -- notification preferences
- [ ] `tests/dispatch/conflict.test.ts` -- conflict detection overlap logic
- [ ] `tests/dispatch/overlap.test.ts` -- date overlap utility function

## Sources

### Primary (HIGH confidence)
- [pg_cron Supabase docs](https://supabase.com/docs/guides/database/extensions/pg_cron) - pg_cron schedule patterns, concurrency limits
- [Supabase Cron module](https://supabase.com/docs/guides/cron) - SQL function scheduling patterns
- [web-push npm](https://www.npmjs.com/package/web-push) - VAPID key generation, sendNotification API
- [react-map-gl docs](https://visgl.github.io/react-map-gl/docs/get-started) - MapLibre integration, `react-map-gl/maplibre` import
- [recharts npm](https://www.npmjs.com/package/recharts) - v3.8.0, React 19 compatibility, component API
- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps) - Service worker registration in App Router
- Existing codebase: `supabase/migrations/00016_invoices.sql` (pg_cron pattern), `00017_marie_queries.sql` (proactive_alerts table)

### Secondary (MEDIUM confidence)
- [OpenFreeMap](https://tiles.openfreemap.org/) - Free tile server, no API key required
- [Medium: Web Push in Next.js (Jan 2026)](https://medium.com/@amirjld/implementing-push-notifications-in-next-js-using-web-push-and-server-actions-f4b95d68091f) - Server action pattern for push
- [GitHub: Recharts React 19 issue #4558](https://github.com/recharts/recharts/issues/4558) - react-is override workaround
- [GitHub: Recharts gauge gist](https://gist.github.com/emiloberg/ee549049ea0f6a83e25f1a1110947086) - RadialBarChart as gauge pattern
- [shadcn/ui Radial Charts](https://ui.shadcn.com/charts/radial) - Recharts RadialBarChart gauge pattern reference

### Tertiary (LOW confidence)
- City coordinates data source -- needs validation of which dataset to use for the static lookup table

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via npm, version compatibility confirmed
- Architecture: HIGH - pg_cron pattern proven in Phase 4, dynamic import pattern is standard Next.js
- Pitfalls: HIGH - SSR issues with map libs and alert dedup are well-documented problems
- Map tile source: MEDIUM - OpenFreeMap is free but should be tested for reliability
- City coordinates: MEDIUM - Static lookup approach is sound but data curation needed

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (30 days -- stable libraries, no rapid changes expected)
