# Requirements: Manifest

**Defined:** 2026-03-24
**Core Value:** A carrier can manage their entire operation — loads, drivers, fleet, compliance, billing — from one platform without needing separate tools.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Organization

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can log in and stay logged in across sessions
- [x] **AUTH-03**: User can log in via magic link as alternative to password
- [x] **AUTH-04**: Database trigger creates profile record on signup
- [x] **AUTH-05**: User can create a new organization with company details (name, address, DOT/MC numbers, company type)
- [ ] **AUTH-06**: Admin can invite users to join their organization with role assignment
- [ ] **AUTH-07**: Invited users can join an existing organization via invitation link
- [ ] **AUTH-08**: Role-based access enforced: admin, dispatcher, driver, viewer
- [ ] **AUTH-09**: Middleware redirects users to correct mode (Command, Driver, Owner-Operator) based on role
- [x] **AUTH-10**: RLS policy on organizations, profiles, and org_members tables with org_id isolation

### Driver Management

- [ ] **DRVR-01**: Admin/dispatcher can add a driver with name, contact info, license details, and hire date
- [ ] **DRVR-02**: Admin/dispatcher can edit driver information
- [ ] **DRVR-03**: Admin/dispatcher can deactivate/terminate a driver
- [ ] **DRVR-04**: Admin/dispatcher can search and filter driver list by status
- [ ] **DRVR-05**: Admin can link a driver record to a user account (generates invitation)
- [ ] **DRVR-06**: Driver can view own profile in Driver PWA (read-only except phone and emergency contact)
- [ ] **DRVR-07**: Driver detail page shows contact info, license info, assigned vehicle, load history

### Load Management

- [ ] **LOAD-01**: User can create a load with pickup details (company, address, date, time window, reference)
- [ ] **LOAD-02**: User can create a load with delivery details (company, address, date, time window, reference)
- [ ] **LOAD-03**: User can set freight details (commodity, weight, pieces, equipment type, temperature, hazmat flag)
- [ ] **LOAD-04**: User can set rate details (rate, type, miles, fuel surcharge, accessorials, total revenue)
- [ ] **LOAD-05**: User can set broker/source info (name, MC, contact, phone, email)
- [ ] **LOAD-06**: Load number auto-generates if not provided (ORG-PREFIX-SEQUENCE)
- [ ] **LOAD-07**: Load status lifecycle works end-to-end: booked → dispatched → in_transit → at_pickup → loaded → at_delivery → delivered → invoiced → paid
- [ ] **LOAD-08**: Every status change writes to load_status_history with timestamp, user, location, notes
- [ ] **LOAD-09**: Load status changes broadcast via Supabase Realtime
- [ ] **LOAD-10**: User can upload documents (BOL, rate confirmation, POD) to a load
- [ ] **LOAD-11**: Driver can upload BOL/POD via mobile camera in Driver PWA
- [ ] **LOAD-12**: User can filter loads by status, driver, date range, broker
- [ ] **LOAD-13**: Load board view shows loads in kanban layout by status
- [ ] **LOAD-14**: Load detail page shows full info, status timeline, documents, notes, rate breakdown
- [ ] **LOAD-15**: Driver PWA shows current active load prominently with status update buttons
- [ ] **LOAD-16**: Driver PWA shows load history (past 30 days)
- [ ] **LOAD-17**: Bulk actions: dispatch multiple loads, export CSV

### Dispatch

- [ ] **DISP-01**: Dispatcher can assign a driver and vehicle to a load (creates dispatch record)
- [ ] **DISP-02**: Dispatch board shows unassigned loads and available drivers
- [ ] **DISP-03**: Active dispatches list shows ETA and current status
- [ ] **DISP-04**: Driver availability view shows who is free, on a load, or off
- [ ] **DISP-05**: Driver PWA shows current dispatch card with load summary
- [ ] **DISP-06**: Driver can accept or reject dispatch assignments in PWA
- [ ] **DISP-07**: Driver can send notes to dispatcher from PWA
- [ ] **DISP-08**: Dispatch status changes broadcast via Supabase Realtime

### Invoicing

- [ ] **INV-01**: User can create an invoice from a delivered load with auto-populated data
- [ ] **INV-02**: Invoice number auto-generates (INV-YYYYMM-SEQUENCE)
- [ ] **INV-03**: User can edit invoice details (bill-to, amounts, dates, notes)
- [ ] **INV-04**: User can mark invoice as sent, paid, or void
- [ ] **INV-05**: Overdue invoices auto-detected daily (due_date < today, status = sent)
- [ ] **INV-06**: Invoice PDF generation and download
- [ ] **INV-07**: Invoice list with filters (status, date range, broker/customer)

### Dashboard

- [ ] **DASH-01**: Command mode dashboard shows stat cards: active loads, booked today, drivers on duty, revenue MTD
- [ ] **DASH-02**: Dashboard shows recent activity feed (last 10 status changes, 5 dispatches, 5 invoices)
- [ ] **DASH-03**: Dashboard quick actions: create load, dispatch driver, create invoice
- [ ] **DASH-04**: Driver PWA dashboard shows current load card, next upcoming load, quick status update
- [ ] **DASH-05**: Owner-Operator dashboard shows same stats scoped to own loads/vehicle

### Vehicles (Basic)

- [ ] **VEHI-01**: Basic vehicles table exists for load and driver assignment references
- [ ] **VEHI-02**: Vehicle record includes unit number, VIN, year, make, model, type, status

### Marie AI

- [ ] **MARI-01**: Marie chat panel opens as slide-out from any page in Command and Owner-Operator modes
- [ ] **MARI-02**: Marie answers natural language questions about loads, drivers, invoices, and dispatch
- [ ] **MARI-03**: Marie can execute actions: create load, dispatch driver, generate invoice
- [ ] **MARI-04**: Marie queries are stateless — context rebuilt from database per request
- [ ] **MARI-05**: Marie is scoped to requesting user's org via RLS
- [ ] **MARI-06**: Marie respects user roles (driver cannot execute admin actions)
- [ ] **MARI-07**: Marie queries logged to marie_queries table with tokens, latency, model
- [ ] **MARI-08**: Driver PWA has simplified Marie chat for driver-scoped questions
- [ ] **MARI-09**: Marie summarizes unacknowledged proactive alerts when chat opens
- [ ] **MARI-10**: Marie responses include inline action buttons (dispatch, view load, generate invoice)

### Smart Routing

- [ ] **ROUT-01**: API endpoint returns ranked driver suggestions for a load
- [ ] **ROUT-02**: Ranking considers proximity (30%), availability (25%), equipment match (20%), on-time performance (15%), lane familiarity (10%)
- [ ] **ROUT-03**: Dispatch UI shows "Suggested" tab with ranked recommendations and score breakdown
- [ ] **ROUT-04**: One-click assign from suggestion list
- [ ] **ROUT-05**: Override button for manual driver selection

### Predictive Alerts

- [ ] **ALRT-01**: Late pickup risk alert when driver > 100 miles from pickup with < 3 hours remaining
- [ ] **ALRT-02**: Driver gone silent alert when no status update in > 4 hours while in_transit
- [ ] **ALRT-03**: Overdue invoice alert (enhances Phase 1 scanner to write proactive_alerts)
- [ ] **ALRT-04**: Dispatch conflict alert when overlapping pickup windows for same driver
- [ ] **ALRT-05**: ETA risk alert when estimated delivery exceeds window
- [ ] **ALRT-06**: Unassigned load alert when booked load has pickup < 24h with no dispatch
- [ ] **ALRT-07**: Alerts appear in dashboard and Marie chat with severity badges
- [ ] **ALRT-08**: Users can acknowledge alerts

### Analytics Foundation

- [ ] **ANLY-01**: Daily snapshots generated nightly (loads, revenue, miles, on-time %, driver count)
- [ ] **ANLY-02**: Revenue trend line chart (last 30 days)
- [ ] **ANLY-03**: Load volume bar chart (booked vs delivered per week)
- [ ] **ANLY-04**: On-time performance gauge chart (current month)
- [ ] **ANLY-05**: Revenue per mile trend line chart (last 30 days)

### Push Notifications

- [ ] **PUSH-01**: Web Push API with service worker for desktop and Driver PWA
- [ ] **PUSH-02**: Driver receives push notification when new dispatch assigned
- [ ] **PUSH-03**: Dispatcher receives push when driver updates load status
- [ ] **PUSH-04**: Admins/dispatchers receive push for critical proactive alerts
- [ ] **PUSH-05**: User can toggle notification types on/off in settings

### Enhanced Dispatch

- [ ] **EDSP-01**: Map view showing unassigned loads and available drivers as pins
- [ ] **EDSP-02**: Timeline/Gantt view of driver schedules with gaps
- [ ] **EDSP-03**: Conflict detection warns when assigning driver with overlapping load
- [ ] **EDSP-04**: Smart routing suggestion panel integrated into dispatch UI

### Compliance

- [ ] **COMP-01**: Compliance profile per org with DOT/MC numbers, carrier type, insurance, IFTA, UCR
- [ ] **COMP-02**: Compliance items track individual obligations with due dates, status, recurrence
- [ ] **COMP-03**: Compliance alerts generated at configurable thresholds (90, 60, 30, 14, 7, 1 days)
- [ ] **COMP-04**: Compliance dashboard shows health score (0-100) based on overdue items, DQ completeness, inspection currency
- [ ] **COMP-05**: Driver qualification files: CDL, medical card, endorsements, MVR, drug tests, annual review
- [ ] **COMP-06**: DQ file tracker shows completeness percentage per driver with missing document highlights
- [ ] **COMP-07**: Inspection records (annual DOT, pre-trip, post-trip, roadside) with pass/fail/conditional
- [ ] **COMP-08**: DVIR (pre-trip/post-trip) digital form in Driver PWA with camera upload
- [ ] **COMP-09**: IFTA quarterly tracking per vehicle per jurisdiction
- [ ] **COMP-10**: IFTA export to CSV for filing
- [ ] **COMP-11**: compliance-scanner edge function runs daily, generates alerts, auto-creates next recurrence
- [ ] **COMP-12**: Compliance adapts based on DOT vs non-DOT carrier type
- [ ] **COMP-13**: Upcoming deadlines calendar view (next 90 days)

### Fleet Management

- [ ] **FLET-01**: Full vehicle CRUD with class, type, registration, odometer, fuel type, photos
- [ ] **FLET-02**: Vehicle status tracking: active, in_shop, out_of_service, parked, sold
- [ ] **FLET-03**: Maintenance records with type, vendor, cost (parts/labor/total), date in/out, downtime
- [ ] **FLET-04**: Maintenance schedules (templates) by vehicle or vehicle class with mile/day intervals
- [ ] **FLET-05**: maintenance-monitor edge function identifies upcoming service and creates alerts
- [ ] **FLET-06**: Fuel transaction logging (manual or fuel card sync)
- [ ] **FLET-07**: Cost per mile calculation per vehicle and fleet-wide
- [ ] **FLET-08**: Vehicle assignment history tracking
- [ ] **FLET-09**: Fleet dashboard: vehicles by status, maintenance due, cost per mile, top expensive vehicles
- [ ] **FLET-10**: Driver PWA: assigned vehicle info, pre-trip inspection form, report issue, fuel log entry

### CRM

- [ ] **CRM-01**: Company CRUD (customers, brokers, vendors, partners, prospects) with contact info, MC/DOT, payment terms
- [ ] **CRM-02**: Contact management per company with primary contact designation
- [ ] **CRM-03**: Lane tracking: origin-destination pairs with distance, rates, run count, preferred equipment
- [ ] **CRM-04**: Lane map visualization showing active lanes as origin-destination arcs
- [ ] **CRM-05**: Rate agreements per company/lane with effective dates, rate type, volume minimums
- [ ] **CRM-06**: Activity logging (calls, emails, notes, meetings, follow-ups) per company/contact/lane
- [ ] **CRM-07**: Follow-up reminder edge function sends push notification on follow-up date
- [ ] **CRM-08**: CRM dashboard: revenue by company, expiring rate agreements, pending follow-ups, broker pay performance
- [ ] **CRM-09**: crm-stats-updater edge function recalculates company/lane aggregates nightly
- [ ] **CRM-10**: Auto-update CRM stats when load completes (company revenue, lane stats, system activity)

### Cross-Module Integration

- [ ] **XMOD-01**: Load completion auto-updates CRM company revenue, lane stats, logs system activity
- [ ] **XMOD-02**: DOT inspection auto-completes compliance item and schedules next annual inspection
- [ ] **XMOD-03**: CDL expiry flags driver in compliance and fleet, alerts on active loads
- [ ] **XMOD-04**: Fuel transactions feed into fleet cost-per-mile AND IFTA compliance calculations
- [ ] **XMOD-05**: Marie checks CRM payment history and compliance eligibility before accepting load/dispatch actions

### Billing

- [ ] **BILL-01**: Stripe Connect integration in platform mode (Glo Matrix = platform, each org = Connected Account)
- [ ] **BILL-02**: Plan tiers: free, starter, professional, enterprise with feature limits
- [ ] **BILL-03**: Checkout flow via Stripe hosted page
- [ ] **BILL-04**: Stripe Customer Portal for payment method management
- [ ] **BILL-05**: Webhook handler for subscription lifecycle events
- [ ] **BILL-06**: Usage tracking: vehicles, drivers, loads, AI queries, voice minutes per period
- [ ] **BILL-07**: Usage enforcement at API level (402 on limit exceeded)
- [ ] **BILL-08**: Trial management (14-day Professional, auto-downgrade to free)
- [ ] **BILL-09**: Billing UI: current plan, usage meters, upgrade/downgrade, invoice history
- [ ] **BILL-10**: Plan comparison page with annual/monthly toggle

### Analytics & Reporting

- [ ] **REPT-01**: Precomputed analytics snapshots (daily, weekly, monthly) with revenue, ops, fleet, compliance, CRM metrics
- [ ] **REPT-02**: Driver performance tracking: loads, miles, revenue, on-time %, fuel efficiency, safety, compliance score
- [ ] **REPT-03**: Analytics dashboard with revenue/expenses/profit chart, KPI cards, period comparison
- [ ] **REPT-04**: Operations analytics: load volume, miles, on-time trending, top lanes
- [ ] **REPT-05**: Fleet analytics: utilization, MPG trending, maintenance cost, vehicle TCO ranking
- [ ] **REPT-06**: Customer/broker profitability ranking with pay speed
- [ ] **REPT-07**: PDF report generation (P&L, fleet, compliance, driver) with download
- [ ] **REPT-08**: Owner-Operator simplified P&L view with per-mile profitability and tax estimate

### Notification System

- [ ] **NOTF-01**: Centralized notifications table with category, priority, action URL
- [ ] **NOTF-02**: Multi-channel dispatch: in-app, push, email, SMS
- [ ] **NOTF-03**: Per-user notification preferences (category x channel toggle matrix)
- [ ] **NOTF-04**: Quiet hours support per user
- [ ] **NOTF-05**: Notification bell icon with unread count badge in header
- [ ] **NOTF-06**: notification-dispatcher edge function routes to enabled channels

### Onboarding

- [ ] **ONBD-01**: Guided setup wizard after signup: business profile, first vehicle, first driver, integrations, plan selection
- [ ] **ONBD-02**: Getting Started checklist widget on dashboard (persists until dismissed)
- [ ] **ONBD-03**: Driver onboarding: invite link, PWA install prompt, account creation, first pre-trip tutorial
- [ ] **ONBD-04**: Onboarding progress tracked per org

### PWA & Performance

- [ ] **PWA-01**: Driver PWA service worker caches app shell, current vehicle, active load, notifications
- [ ] **PWA-02**: Pre-trip/post-trip inspection forms work fully offline, sync when connection returns
- [ ] **PWA-03**: Fuel log entries queue offline, sync on reconnect
- [ ] **PWA-04**: Performance targets: < 2s FMP on 3G, < 4s TTI, Lighthouse PWA > 90
- [ ] **PWA-05**: Command mode: virtualized lists, code splitting, < 300KB initial bundle

### Security

- [ ] **SECR-01**: RLS verified on every table with org_id isolation
- [ ] **SECR-02**: CSRF protection on all mutation endpoints
- [ ] **SECR-03**: Rate limiting: 100 req/min standard, 10 req/min auth endpoints
- [ ] **SECR-04**: Input sanitization on all user-provided text fields
- [ ] **SECR-05**: Content Security Policy headers
- [ ] **SECR-06**: Stripe webhook signature verification

### White Label

- [ ] **WLBL-01**: white_label_config table with brand name, logo, colors, custom domain
- [ ] **WLBL-02**: CSS custom properties for all brand colors
- [ ] **WLBL-03**: Brand name and logo loaded from config (no hardcoded "Manifest" in JSX)
- [ ] **WLBL-04**: White label available only on enterprise tier

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Integrations

- **INTG-01**: QuickBooks/Xero accounting integration
- **INTG-02**: ELD provider API integration (Motive, Samsara)
- **INTG-03**: Fuel card API sync (Comdata, EFS, WEX)
- **INTG-04**: Load board import (DAT, Truckstop)

### Operations

- **OPS-01**: Multi-stop load support
- **OPS-02**: Driver settlement calculations
- **OPS-03**: Scheduled recurring reports (weekly P&L, monthly fleet summary)
- **OPS-04**: 2FA authentication

## Out of Scope

| Feature | Reason |
|---------|--------|
| Load board / freight sourcing | Manifest manages booked freight, not sourcing. Commoditized market dominated by DAT. |
| ELD hardware / in-cab devices | Capital-intensive hardware business with FMCSA certification. Integrate via API instead. |
| GPS tracking hardware | Use driver-reported location and ELD integrations. |
| Broker-carrier marketplace | Internal operations tool, not a matching platform. |
| n8n / external workflow engine | All automation via Supabase Edge Functions and pg_cron. |
| Full accounting system | QuickBooks/Xero are mature. Manifest handles invoicing, not GL/AP/AR. |
| HOS/hours-of-service logging | Tightly coupled with ELD hardware. Pull from integrations. |
| Route optimization / turn-by-turn | Google Maps/Waze own this. Link out to navigation apps. |
| Payroll / driver settlements (v1) | Complex tax law, state-by-state. Defer to v2. |
| NEMT Medicaid billing | Specialized EDI domain. Flag for future if NEMT adoption is strong. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| AUTH-06 | Phase 1 | Pending |
| AUTH-07 | Phase 1 | Pending |
| AUTH-08 | Phase 1 | Pending |
| AUTH-09 | Phase 1 | Pending |
| AUTH-10 | Phase 1 | Complete |
| DRVR-01 | Phase 2 | Pending |
| DRVR-02 | Phase 2 | Pending |
| DRVR-03 | Phase 2 | Pending |
| DRVR-04 | Phase 2 | Pending |
| DRVR-05 | Phase 2 | Pending |
| DRVR-06 | Phase 2 | Pending |
| DRVR-07 | Phase 2 | Pending |
| VEHI-01 | Phase 2 | Pending |
| VEHI-02 | Phase 2 | Pending |
| LOAD-01 | Phase 2 | Pending |
| LOAD-02 | Phase 2 | Pending |
| LOAD-03 | Phase 2 | Pending |
| LOAD-04 | Phase 2 | Pending |
| LOAD-05 | Phase 2 | Pending |
| LOAD-06 | Phase 2 | Pending |
| LOAD-07 | Phase 2 | Pending |
| LOAD-08 | Phase 2 | Pending |
| LOAD-09 | Phase 2 | Pending |
| LOAD-10 | Phase 2 | Pending |
| LOAD-11 | Phase 2 | Pending |
| LOAD-12 | Phase 2 | Pending |
| LOAD-13 | Phase 2 | Pending |
| LOAD-14 | Phase 2 | Pending |
| LOAD-15 | Phase 2 | Pending |
| LOAD-16 | Phase 2 | Pending |
| LOAD-17 | Phase 2 | Pending |
| DISP-01 | Phase 3 | Pending |
| DISP-02 | Phase 3 | Pending |
| DISP-03 | Phase 3 | Pending |
| DISP-04 | Phase 3 | Pending |
| DISP-05 | Phase 3 | Pending |
| DISP-06 | Phase 3 | Pending |
| DISP-07 | Phase 3 | Pending |
| DISP-08 | Phase 3 | Pending |
| INV-01 | Phase 4 | Pending |
| INV-02 | Phase 4 | Pending |
| INV-03 | Phase 4 | Pending |
| INV-04 | Phase 4 | Pending |
| INV-05 | Phase 4 | Pending |
| INV-06 | Phase 4 | Pending |
| INV-07 | Phase 4 | Pending |
| DASH-01 | Phase 4 | Pending |
| DASH-02 | Phase 4 | Pending |
| DASH-03 | Phase 4 | Pending |
| DASH-04 | Phase 4 | Pending |
| DASH-05 | Phase 4 | Pending |
| MARI-01 | Phase 5 | Pending |
| MARI-02 | Phase 5 | Pending |
| MARI-03 | Phase 5 | Pending |
| MARI-04 | Phase 5 | Pending |
| MARI-05 | Phase 5 | Pending |
| MARI-06 | Phase 5 | Pending |
| MARI-07 | Phase 5 | Pending |
| MARI-08 | Phase 5 | Pending |
| MARI-09 | Phase 5 | Pending |
| MARI-10 | Phase 5 | Pending |
| ROUT-01 | Phase 5 | Pending |
| ROUT-02 | Phase 5 | Pending |
| ROUT-03 | Phase 5 | Pending |
| ROUT-04 | Phase 5 | Pending |
| ROUT-05 | Phase 5 | Pending |
| ALRT-01 | Phase 6 | Pending |
| ALRT-02 | Phase 6 | Pending |
| ALRT-03 | Phase 6 | Pending |
| ALRT-04 | Phase 6 | Pending |
| ALRT-05 | Phase 6 | Pending |
| ALRT-06 | Phase 6 | Pending |
| ALRT-07 | Phase 6 | Pending |
| ALRT-08 | Phase 6 | Pending |
| PUSH-01 | Phase 6 | Pending |
| PUSH-02 | Phase 6 | Pending |
| PUSH-03 | Phase 6 | Pending |
| PUSH-04 | Phase 6 | Pending |
| PUSH-05 | Phase 6 | Pending |
| ANLY-01 | Phase 6 | Pending |
| ANLY-02 | Phase 6 | Pending |
| ANLY-03 | Phase 6 | Pending |
| ANLY-04 | Phase 6 | Pending |
| ANLY-05 | Phase 6 | Pending |
| EDSP-01 | Phase 6 | Pending |
| EDSP-02 | Phase 6 | Pending |
| EDSP-03 | Phase 6 | Pending |
| EDSP-04 | Phase 6 | Pending |
| COMP-01 | Phase 7 | Pending |
| COMP-02 | Phase 7 | Pending |
| COMP-03 | Phase 7 | Pending |
| COMP-04 | Phase 7 | Pending |
| COMP-05 | Phase 7 | Pending |
| COMP-06 | Phase 7 | Pending |
| COMP-07 | Phase 7 | Pending |
| COMP-08 | Phase 7 | Pending |
| COMP-09 | Phase 7 | Pending |
| COMP-10 | Phase 7 | Pending |
| COMP-11 | Phase 7 | Pending |
| COMP-12 | Phase 7 | Pending |
| COMP-13 | Phase 7 | Pending |
| FLET-01 | Phase 8 | Pending |
| FLET-02 | Phase 8 | Pending |
| FLET-03 | Phase 8 | Pending |
| FLET-04 | Phase 8 | Pending |
| FLET-05 | Phase 8 | Pending |
| FLET-06 | Phase 8 | Pending |
| FLET-07 | Phase 8 | Pending |
| FLET-08 | Phase 8 | Pending |
| FLET-09 | Phase 8 | Pending |
| FLET-10 | Phase 8 | Pending |
| CRM-01 | Phase 9 | Pending |
| CRM-02 | Phase 9 | Pending |
| CRM-03 | Phase 9 | Pending |
| CRM-04 | Phase 9 | Pending |
| CRM-05 | Phase 9 | Pending |
| CRM-06 | Phase 9 | Pending |
| CRM-07 | Phase 9 | Pending |
| CRM-08 | Phase 9 | Pending |
| CRM-09 | Phase 9 | Pending |
| CRM-10 | Phase 9 | Pending |
| XMOD-01 | Phase 9 | Pending |
| XMOD-02 | Phase 9 | Pending |
| XMOD-03 | Phase 9 | Pending |
| XMOD-04 | Phase 9 | Pending |
| XMOD-05 | Phase 9 | Pending |
| BILL-01 | Phase 10 | Pending |
| BILL-02 | Phase 10 | Pending |
| BILL-03 | Phase 10 | Pending |
| BILL-04 | Phase 10 | Pending |
| BILL-05 | Phase 10 | Pending |
| BILL-06 | Phase 10 | Pending |
| BILL-07 | Phase 10 | Pending |
| BILL-08 | Phase 10 | Pending |
| BILL-09 | Phase 10 | Pending |
| BILL-10 | Phase 10 | Pending |
| REPT-01 | Phase 11 | Pending |
| REPT-02 | Phase 11 | Pending |
| REPT-03 | Phase 11 | Pending |
| REPT-04 | Phase 11 | Pending |
| REPT-05 | Phase 11 | Pending |
| REPT-06 | Phase 11 | Pending |
| REPT-07 | Phase 11 | Pending |
| REPT-08 | Phase 11 | Pending |
| NOTF-01 | Phase 11 | Pending |
| NOTF-02 | Phase 11 | Pending |
| NOTF-03 | Phase 11 | Pending |
| NOTF-04 | Phase 11 | Pending |
| NOTF-05 | Phase 11 | Pending |
| NOTF-06 | Phase 11 | Pending |
| ONBD-01 | Phase 12 | Pending |
| ONBD-02 | Phase 12 | Pending |
| ONBD-03 | Phase 12 | Pending |
| ONBD-04 | Phase 12 | Pending |
| PWA-01 | Phase 12 | Pending |
| PWA-02 | Phase 12 | Pending |
| PWA-03 | Phase 12 | Pending |
| PWA-04 | Phase 12 | Pending |
| PWA-05 | Phase 12 | Pending |
| SECR-01 | Phase 12 | Pending |
| SECR-02 | Phase 12 | Pending |
| SECR-03 | Phase 12 | Pending |
| SECR-04 | Phase 12 | Pending |
| SECR-05 | Phase 12 | Pending |
| SECR-06 | Phase 12 | Pending |
| WLBL-01 | Phase 12 | Pending |
| WLBL-02 | Phase 12 | Pending |
| WLBL-03 | Phase 12 | Pending |
| WLBL-04 | Phase 12 | Pending |

**Coverage:**
- v1 requirements: 174 total
- Mapped to phases: 174
- Unmapped: 0

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after roadmap creation*
