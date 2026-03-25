# Phase 8: Fleet Management - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Full vehicle lifecycle management: expanded vehicle records, maintenance scheduling and logging, fuel transaction tracking, cost-per-mile calculations, vehicle assignment history, and fleet dashboard. Integrates with compliance for inspection tracking and with Marie for maintenance alerts.

</domain>

<decisions>
## Implementation Decisions

### Vehicle Table Expansion
- Expand existing vehicles table per PRD-03 Section 3.2: add vehicle_class, fuel_type, avg_mpg, purchase_date, purchase_price, current_value, insurance_policy, gps_device_id, eld_provider, eld_device_id, photo_urls, current_odometer, odometer_updated_at
- Vehicle class: 'class_1_2', 'class_3_4', 'class_5_6', 'class_7', 'class_8', 'trailer', 'other'
- Vehicle type expanded: add 'medical_van', 'hotshot', 'straight_truck', 'day_cab', 'sleeper', 'tanker', etc.
- Status expanded: 'active', 'in_shop', 'out_of_service', 'parked', 'sold', 'totaled'

### Maintenance
- maintenance_records table: type, vendor, odometer, cost breakdown (parts/labor/total), warranty, dates, next service
- maintenance_schedules table: templates for recurring maintenance per vehicle or vehicle class
- maintenance-monitor pg_cron (daily 5 AM): checks odometer + date against schedules, creates compliance items when due

### Fuel Tracking
- fuel_transactions table: vehicle, driver, date, location, gallons, price, total, odometer, source ('manual', 'fuel_card', 'receipt_scan')
- Fleet fuel dashboard: spend chart, MPG ranking, cost per mile trending

### Vehicle Assignments
- vehicle_assignments table: assignment history (who drove what, when)
- Track assign/unassign with reason

### Cost Per Mile
- Calculated from: maintenance + fuel + insurance + depreciation / total miles
- Per vehicle and fleet-wide aggregation

### Fleet Dashboard (/fleet)
- Fleet snapshot: vehicles by status
- Maintenance due within 30 days
- Fleet-wide cost per mile (last 30 days)
- Top 5 most expensive vehicles

### UI Pages
- Command: /fleet (dashboard), /fleet/vehicles (list), /fleet/vehicles/:id (detail with maintenance/fuel/cost), /fleet/maintenance, /fleet/fuel
- Driver PWA: /driver/vehicle (assigned vehicle info, report issue, fuel log)
- Owner-Operator: /oo/vehicle (single vehicle dashboard)

### Claude's Discretion
- Exact maintenance form layout
- Fuel transaction entry form
- Cost breakdown visualization
- Vehicle detail page section order
- MPG chart styling

</decisions>

<code_context>
## Existing Code

### Reusable
- `src/app/(app)/fleet/` — Basic vehicle CRUD from Phase 2 (page.tsx, actions.ts, new/, [id]/edit/)
- `src/components/vehicles/` — vehicle-form.tsx, vehicle-list.tsx from Phase 2
- `src/schemas/vehicle.ts` — Zod schema to extend
- All dashboard/chart patterns from Phase 4/6
- pg_cron pattern from Phases 4/6/7

### Integration
- Compliance: maintenance creates compliance_items when due
- IFTA: fuel transactions feed IFTA calculations
- Marie: maintenance alerts via proactive_alerts
- Sidebar: /fleet already exists, needs sub-nav for maintenance/fuel

</code_context>

<deferred>
- Fuel card API integration (Comdata, EFS, WEX) — v2
- Telematics/GPS integration — v2
- Predictive maintenance based on ML — v2
</deferred>
