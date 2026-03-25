# Phase 2: Loads, Drivers & Vehicles - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Driver roster management, basic vehicle registry, and complete load lifecycle from booking through delivery. Includes document upload (BOL, POD, rate confirmation), load status history with realtime broadcasting, load board kanban view, and Driver PWA load views with camera upload. This is the operational core that dispatch (Phase 3) and invoicing (Phase 4) build on.

</domain>

<decisions>
## Implementation Decisions

### Driver Management
- Drivers table per PRD-01 schema: first_name, last_name, email, phone, license info, hire_date, status, current_vehicle_id, home_terminal, emergency contact
- Driver status: 'active', 'inactive', 'terminated'
- License class options: 'A', 'B', 'C', 'standard'
- Driver list page at /drivers with search and filter by status
- Driver detail page shows contact info, license info, assigned vehicle, load history
- Add/edit driver form with Zod validation (reuse pattern from Phase 1 auth forms)
- Link driver to user account generates invitation (reuse Phase 1 invitation flow)
- Driver PWA /settings shows own profile (read-only except phone and emergency contact)
- RLS policy: org_id isolation using established auth.org_id() helper

### Vehicle Registry (Basic)
- Vehicles table: id, org_id, unit_number, vin, year, make, model, vehicle_type, status, created_at, updated_at
- Vehicle types: 'dry_van', 'reefer', 'flatbed', 'sprinter', 'box_truck', 'other' (simplified for Phase 2, expanded in Phase 3 fleet management)
- Vehicle status: 'active', 'inactive'
- Basic vehicle CRUD — full fleet management deferred to Phase 8
- RLS policy: org_id isolation

### Load Management
- Loads table per PRD-01 schema (comprehensive: pickup, delivery, freight, rate, broker, documents, assignment)
- Load number auto-generation via database trigger: ORG-PREFIX-SEQUENCE format
- 10 load statuses: 'booked', 'dispatched', 'in_transit', 'at_pickup', 'loaded', 'at_delivery', 'delivered', 'invoiced', 'paid', 'canceled'
- Load status history table logs every transition with timestamp, user, location, notes
- Status changes broadcast via Supabase Realtime on channel org:{org_id}:loads
- Create load form is multi-step: pickup → delivery → freight → rate → assignment (optional in Phase 2, required in Phase 3 dispatch)
- Load detail page shows full info, status timeline visualization, documents, notes, rate breakdown
- Load list with filters: status, driver, date range, broker
- Load board view: kanban layout grouped by status columns
- Bulk actions: export CSV (dispatch multiple deferred to Phase 3)

### Document Upload
- Supabase Storage for BOL, rate confirmation, POD files
- Storage bucket scoped by org_id with RLS
- Desktop: standard file upload input
- Driver PWA: camera capture for BOL/POD upload (use HTML input with capture attribute)
- Document URLs stored on load record (bol_url, rate_confirmation_url, pod_url)

### Driver PWA Load Views
- Current active load shown prominently as big card on /loads
- Status update buttons: "At Pickup", "Loaded", "At Delivery", "Delivered" (tap or swipe)
- Upload BOL/POD via camera
- Load history past 30 days
- Owner-Operator mode: same as Command mode but scoped to own loads only

### Realtime
- Supabase Realtime subscription on loads table filtered by org_id
- Load status changes reflect instantly across all connected sessions
- Reuse Supabase client patterns established in Phase 1

### Design Patterns (carried from Phase 1)
- Zod schemas for all form validation
- Server actions for all mutations
- Supabase server client for server components/actions
- Supabase browser client for client-side realtime subscriptions
- Tailwind v4 with design tokens from globals.css
- JetBrains Mono for VINs, license plates
- #EC008C primary, 8px grid, Inter 15px body

### Claude's Discretion
- Exact multi-step form implementation (wizard vs accordion vs tabs)
- Status timeline visualization component design
- Kanban board implementation approach
- Table vs card layout for load/driver lists
- Exact Realtime subscription hook patterns
- Camera capture UX flow on mobile

</decisions>

<specifics>
## Specific Ideas

- Load board kanban should feel like a dispatch board — dragging loads between columns is NOT needed in Phase 2 (that's dispatch in Phase 3), but the visual grouping by status is important
- Status update buttons on Driver PWA should be big, thumb-friendly, one-tap — drivers are doing this from a truck cab
- The load creation form has 30+ fields — it needs to feel manageable, not overwhelming. Multi-step with clear progress indication
- VINs and license plates displayed in JetBrains Mono per design system
- Equipment types on loads should match what the carrier actually runs (from cursorrules: dry_van, reefer, flatbed, sprinter, box_truck, other)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase/client.ts` — Browser client for Realtime subscriptions
- `src/lib/supabase/server.ts` — Server client for server components and actions
- `src/lib/supabase/admin.ts` — Admin client for service-role operations
- `src/schemas/auth.ts`, `src/schemas/organization.ts` — Zod schema patterns to follow
- `src/components/auth/*` — Form component patterns (react-hook-form + zodResolver)
- `src/components/layout/app-sidebar.tsx` — Add drivers/loads/fleet nav items
- `src/components/layout/driver-header.tsx` — Driver PWA navigation
- `src/types/database.ts` — Extend with drivers, vehicles, loads, load_status_history types

### Established Patterns
- Server actions pattern: `src/app/(auth)/signup/actions.ts` — Supabase server client, redirect on success
- Form pattern: Zod schema → react-hook-form → server action → redirect
- RLS pattern: `auth.org_id()` helper, `(select auth.uid())` optimization, index on org_id
- Migration naming: `000XX_tablename.sql` sequential numbering
- Route groups: `(app)` for Command mode, `(driver)` for Driver PWA, `(auth)` for auth

### Integration Points
- Sidebar navigation needs drivers, loads, fleet links added
- Driver PWA navigation needs loads, settings links
- Database types file needs new table types
- Middleware already handles routing — no changes needed for Phase 2 routes

</code_context>

<deferred>
## Deferred Ideas

- Drag-and-drop load assignment on kanban board — Phase 3 (Dispatch)
- Smart routing / driver suggestions — Phase 5
- Map view for loads — Phase 6 (Enhanced Dispatch)
- Full fleet management (maintenance, fuel, cost) — Phase 8
- Bulk dispatch of multiple loads — Phase 3

</deferred>

---

*Phase: 02-loads-drivers-vehicles*
*Context gathered: 2026-03-25*
