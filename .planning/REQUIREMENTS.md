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
- [x] **AUTH-06**: Admin can invite users to join their organization with role assignment
- [x] **AUTH-07**: Invited users can join an existing organization via invitation link
- [x] **AUTH-08**: Role-based access enforced: admin, dispatcher, driver, viewer
- [x] **AUTH-09**: Middleware redirects users to correct mode (Command, Driver, Owner-Operator) based on role
- [x] **AUTH-10**: RLS policy on organizations, profiles, and org_members tables with org_id isolation

### Driver Management

- [x] **DRVR-01**: Admin/dispatcher can add a driver with name, contact info, license details, and hire date
- [x] **DRVR-02**: Admin/dispatcher can edit driver information
- [x] **DRVR-03**: Admin/dispatcher can deactivate/terminate a driver
- [x] **DRVR-04**: Admin/dispatcher can search and filter driver list by status
- [x] **DRVR-05**: Admin can link a driver record to a user account (generates invitation)
- [x] **DRVR-06**: Driver can view own profile in Driver PWA (read-only except phone and emergency contact)
- [x] **DRVR-07**: Driver detail page shows contact info, license info, assigned vehicle, load history

### Load Management

- [x] **LOAD-01**: User can create a load with pickup details (company, address, date, time window, reference)
- [x] **LOAD-02**: User can create a load with delivery details (company, address, date, time window, reference)
- [x] **LOAD-03**: User can set freight details (commodity, weight, pieces, equipment type, temperature, hazmat flag)
- [x] **LOAD-04**: User can set rate details (rate, type, miles, fuel surcharge, accessorials, total revenue)
- [x] **LOAD-05**: User can set broker/source info (name, MC, contact, phone, email)
- [x] **LOAD-06**: Load number auto-generates if not provided (ORG-PREFIX-SEQUENCE)
- [x] **LOAD-07**: Load status lifecycle works end-to-end: booked → dispatched → in_transit → at_pickup → loaded → at_delivery → delivered → invoiced → paid
- [x] **LOAD-08**: Every status change writes to load_status_history with timestamp, user, location, notes
- [x] **LOAD-09**: Load status changes broadcast via Supabase Realtime
- [x] **LOAD-10**: User can upload documents (BOL, rate confirmation, POD) to a load
- [x] **LOAD-11**: Driver can upload BOL/POD via mobile camera in Driver PWA
- [x] **LOAD-12**: User can filter loads by status, driver, date range, broker
- [x] **LOAD-13**: Load board view shows loads in kanban layout by status
- [x] **LOAD-14**: Load detail page shows full info, status timeline, documents, notes, rate breakdown
- [x] **LOAD-15**: Driver PWA shows current active load prominently with status update buttons
- [x] **LOAD-16**: Driver PWA shows load history (past 30 days)
- [x] **LOAD-17**: Bulk actions: dispatch multiple loads, export CSV

### Dispatch

- [x] **DISP-01**: Dispatcher can assign a driver and vehicle to a load (creates dispatch record)
- [x] **DISP-02**: Dispatch board shows unassigned loads and available drivers
- [x] **DISP-03**: Active dispatches list shows ETA and current status
- [x] **DISP-04**: Driver availability view shows who is free, on a load, or off
- [x] **DISP-05**: Driver PWA shows current dispatch card with load summary
- [x] **DISP-06**: Driver can accept or reject dispatch assignments in PWA
- [x] **DISP-07**: Driver can send notes to dispatcher from PWA
- [x] **DISP-08**: Dispatch status changes broadcast via Supabase Realtime

### Invoicing

- [x] **INV-01**: User can create an invoice from a delivered load with auto-populated data
- [x] **INV-02**: Invoice number auto-generates (INV-YYYYMM-SEQUENCE)
- [x] **INV-03**: User can edit invoice details (bill-to, amounts, dates, notes)
- [x] **INV-04**: User can mark invoice as sent, paid, or void
- [x] **INV-05**: Overdue invoices auto-detected daily (due_date < today, status = sent)
- [x] **INV-06**: Invoice PDF generation and download
- [x] **INV-07**: Invoice list with filters (status, date range, broker/customer)

### Dashboard

- [x] **DASH-01**: Command mode dashboard shows stat cards: active loads, booked today, drivers on duty, revenue MTD
- [x] **DASH-02**: Dashboard shows recent activity feed (last 10 status changes, 5 dispatches, 5 invoices)
- [x] **DASH-03**: Dashboard quick actions: create load, dispatch driver, create invoice
- [x] **DASH-04**: Driver PWA dashboard shows current load card, next upcoming load, quick status update
- [x] **DASH-05**: Owner-Operator dashboard shows same stats scoped to own loads/vehicle

### Vehicles (Basic)

- [x] **VEHI-01**: Basic vehicles table exists for load and driver assignment references
- [x] **VEHI-02**: Vehicle record includes unit number, VIN, year, make, model, type, status

### Marie AI

- [x] **MARI-01**: Marie chat panel opens as slide-out from any page in Command and Owner-Operator modes
- [x] **MARI-02**: Marie answers natural language questions about loads, drivers, invoices, and dispatch
- [x] **MARI-03**: Marie can execute actions: create load, dispatch driver, generate invoice
- [x] **MARI-04**: Marie queries are stateless — context rebuilt from database per request
- [x] **MARI-05**: Marie is scoped to requesting user's org via RLS
- [x] **MARI-06**: Marie respects user roles (driver cannot execute admin actions)
- [x] **MARI-07**: Marie queries logged to marie_queries table with tokens, latency, model
- [x] **MARI-08**: Driver PWA has simplified Marie chat for driver-scoped questions
- [x] **MARI-09**: Marie summarizes unacknowledged proactive alerts when chat opens
- [x] **MARI-10**: Marie responses include inline action buttons (dispatch, view load, generate invoice)

### Smart Routing

- [x] **ROUT-01**: API endpoint returns ranked driver suggestions for a load
- [x] **ROUT-02**: Ranking considers proximity (30%), availability (25%), equipment match (20%), on-time performance (15%), lane familiarity (10%)
- [x] **ROUT-03**: Dispatch UI shows "Suggested" tab with ranked recommendations and score breakdown
- [x] **ROUT-04**: One-click assign from suggestion list
- [x] **ROUT-05**: Override button for manual driver selection

### Predictive Alerts

- [x] **ALRT-01**: Late pickup risk alert when driver > 100 miles from pickup with < 3 hours remaining
- [x] **ALRT-02**: Driver gone silent alert when no status update in > 4 hours while in_transit
- [x] **ALRT-03**: Overdue invoice alert (enhances Phase 1 scanner to write proactive_alerts)
- [x] **ALRT-04**: Dispatch conflict alert when overlapping pickup windows for same driver
- [x] **ALRT-05**: ETA risk alert when estimated delivery exceeds window
- [x] **ALRT-06**: Unassigned load alert when booked load has pickup < 24h with no dispatch
- [x] **ALRT-07**: Alerts appear in dashboard and Marie chat with severity badges
- [x] **ALRT-08**: Users can acknowledge alerts

### Analytics Foundation

- [x] **ANLY-01**: Daily snapshots generated nightly (loads, revenue, miles, on-time %, driver count)
- [x] **ANLY-02**: Revenue trend line chart (last 30 days)
- [x] **ANLY-03**: Load volume bar chart (booked vs delivered per week)
- [x] **ANLY-04**: On-time performance gauge chart (current month)
- [x] **ANLY-05**: Revenue per mile trend line chart (last 30 days)

### Push Notifications

- [x] **PUSH-01**: Web Push API with service worker for desktop and Driver PWA
- [x] **PUSH-02**: Driver receives push notification when new dispatch assigned
- [x] **PUSH-03**: Dispatcher receives push when driver updates load status
- [x] **PUSH-04**: Admins/dispatchers receive push for critical proactive alerts
- [x] **PUSH-05**: User can toggle notification types on/off in settings

### Enhanced Dispatch

- [x] **EDSP-01**: Map view showing unassigned loads and available drivers as pins
- [x] **EDSP-02**: Timeline/Gantt view of driver schedules with gaps
- [x] **EDSP-03**: Conflict detection warns when assigning driver with overlapping load
- [x] **EDSP-04**: Smart routing suggestion panel integrated into dispatch UI

### Compliance

- [x] **COMP-01**: Compliance profile per org with DOT/MC numbers, carrier type, insurance, IFTA, UCR
- [x] **COMP-02**: Compliance items track individual obligations with due dates, status, recurrence
- [x] **COMP-03**: Compliance alerts generated at configurable thresholds (90, 60, 30, 14, 7, 1 days)
- [x] **COMP-04**: Compliance dashboard shows health score (0-100) based on overdue items, DQ completeness, inspection currency
- [x] **COMP-05**: Driver qualification files: CDL, medical card, endorsements, MVR, drug tests, annual review
- [x] **COMP-06**: DQ file tracker shows completeness percentage per driver with missing document highlights
- [x] **COMP-07**: Inspection records (annual DOT, pre-trip, post-trip, roadside) with pass/fail/conditional
- [x] **COMP-08**: DVIR (pre-trip/post-trip) digital form in Driver PWA with camera upload
- [x] **COMP-09**: IFTA quarterly tracking per vehicle per jurisdiction
- [x] **COMP-10**: IFTA export to CSV for filing
- [x] **COMP-11**: compliance-scanner edge function runs daily, generates alerts, auto-creates next recurrence
- [x] **COMP-12**: Compliance adapts based on DOT vs non-DOT carrier type
- [x] **COMP-13**: Upcoming deadlines calendar view (next 90 days)

### Fleet Management

- [x] **FLET-01**: Full vehicle CRUD with class, type, registration, odometer, fuel type, photos
- [x] **FLET-02**: Vehicle status tracking: active, in_shop, out_of_service, parked, sold
- [x] **FLET-03**: Maintenance records with type, vendor, cost (parts/labor/total), date in/out, downtime
- [x] **FLET-04**: Maintenance schedules (templates) by vehicle or vehicle class with mile/day intervals
- [x] **FLET-05**: maintenance-monitor edge function identifies upcoming service and creates alerts
- [x] **FLET-06**: Fuel transaction logging (manual or fuel card sync)
- [x] **FLET-07**: Cost per mile calculation per vehicle and fleet-wide
- [x] **FLET-08**: Vehicle assignment history tracking
- [x] **FLET-09**: Fleet dashboard: vehicles by status, maintenance due, cost per mile, top expensive vehicles
- [x] **FLET-10**: Driver PWA: assigned vehicle info, pre-trip inspection form, report issue, fuel log entry

### CRM

- [x] **CRM-01**: Company CRUD (customers, brokers, vendors, partners, prospects) with contact info, MC/DOT, payment terms
- [x] **CRM-02**: Contact management per company with primary contact designation
- [x] **CRM-03**: Lane tracking: origin-destination pairs with distance, rates, run count, preferred equipment
- [x] **CRM-04**: Lane map visualization showing active lanes as origin-destination arcs
- [x] **CRM-05**: Rate agreements per company/lane with effective dates, rate type, volume minimums
- [x] **CRM-06**: Activity logging (calls, emails, notes, meetings, follow-ups) per company/contact/lane
- [x] **CRM-07**: Follow-up reminder edge function sends push notification on follow-up date
- [x] **CRM-08**: CRM dashboard: revenue by company, expiring rate agreements, pending follow-ups, broker pay performance
- [x] **CRM-09**: crm-stats-updater edge function recalculates company/lane aggregates nightly
- [x] **CRM-10**: Auto-update CRM stats when load completes (company revenue, lane stats, system activity)

### Cross-Module Integration

- [x] **XMOD-01**: Load completion auto-updates CRM company revenue, lane stats, logs system activity
- [x] **XMOD-02**: DOT inspection auto-completes compliance item and schedules next annual inspection
- [x] **XMOD-03**: CDL expiry flags driver in compliance and fleet, alerts on active loads
- [x] **XMOD-04**: Fuel transactions feed into fleet cost-per-mile AND IFTA compliance calculations
- [x] **XMOD-05**: Marie checks CRM payment history and compliance eligibility before accepting load/dispatch actions

### Billing

- [x] **BILL-01**: Stripe Connect integration in platform mode (Glo Matrix = platform, each org = Connected Account)
- [x] **BILL-02**: Plan tiers: free, starter, professional, enterprise with feature limits
- [x] **BILL-03**: Checkout flow via Stripe hosted page
- [x] **BILL-04**: Stripe Customer Portal for payment method management
- [x] **BILL-05**: Webhook handler for subscription lifecycle events
- [x] **BILL-06**: Usage tracking: vehicles, drivers, loads, AI queries, voice minutes per period
- [x] **BILL-07**: Usage enforcement at API level (402 on limit exceeded)
- [x] **BILL-08**: Trial management (14-day Professional, auto-downgrade to free)
- [x] **BILL-09**: Billing UI: current plan, usage meters, upgrade/downgrade, invoice history
- [x] **BILL-10**: Plan comparison page with annual/monthly toggle

### Analytics & Reporting

- [x] **REPT-01**: Precomputed analytics snapshots (daily, weekly, monthly) with revenue, ops, fleet, compliance, CRM metrics
- [x] **REPT-02**: Driver performance tracking: loads, miles, revenue, on-time %, fuel efficiency, safety, compliance score
- [x] **REPT-03**: Analytics dashboard with revenue/expenses/profit chart, KPI cards, period comparison
- [x] **REPT-04**: Operations analytics: load volume, miles, on-time trending, top lanes
- [x] **REPT-05**: Fleet analytics: utilization, MPG trending, maintenance cost, vehicle TCO ranking
- [x] **REPT-06**: Customer/broker profitability ranking with pay speed
- [x] **REPT-07**: PDF report generation (P&L, fleet, compliance, driver) with download
- [x] **REPT-08**: Owner-Operator simplified P&L view with per-mile profitability and tax estimate

### Notification System

- [x] **NOTF-01**: Centralized notifications table with category, priority, action URL
- [x] **NOTF-02**: Multi-channel dispatch: in-app, push, email, SMS
- [x] **NOTF-03**: Per-user notification preferences (category x channel toggle matrix)
- [x] **NOTF-04**: Quiet hours support per user
- [x] **NOTF-05**: Notification bell icon with unread count badge in header
- [x] **NOTF-06**: notification-dispatcher edge function routes to enabled channels

### Onboarding

- [ ] **ONBD-01**: Guided setup wizard after signup: business profile, first vehicle, first driver, integrations, plan selection
- [ ] **ONBD-02**: Getting Started checklist widget on dashboard (persists until dismissed)
- [ ] **ONBD-03**: Driver onboarding: invite link, PWA install prompt, account creation, first pre-trip tutorial
- [ ] **ONBD-04**: Onboarding progress tracked per org

### PWA & Performance

- [x] **PWA-01**: Driver PWA service worker caches app shell, current vehicle, active load, notifications
- [x] **PWA-02**: Pre-trip/post-trip inspection forms work fully offline, sync when connection returns
- [x] **PWA-03**: Fuel log entries queue offline, sync on reconnect
- [x] **PWA-04**: Performance targets: < 2s FMP on 3G, < 4s TTI, Lighthouse PWA > 90
- [x] **PWA-05**: Command mode: virtualized lists, code splitting, < 300KB initial bundle

### Security

- [x] **SECR-01**: RLS verified on every table with org_id isolation
- [x] **SECR-02**: CSRF protection on all mutation endpoints
- [x] **SECR-03**: Rate limiting: 100 req/min standard, 10 req/min auth endpoints
- [x] **SECR-04**: Input sanitization on all user-provided text fields
- [x] **SECR-05**: Content Security Policy headers
- [x] **SECR-06**: Stripe webhook signature verification

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
| AUTH-06 | Phase 1 | Complete |
| AUTH-07 | Phase 1 | Complete |
| AUTH-08 | Phase 1 | Complete |
| AUTH-09 | Phase 1 | Complete |
| AUTH-10 | Phase 1 | Complete |
| DRVR-01 | Phase 2 | Complete |
| DRVR-02 | Phase 2 | Complete |
| DRVR-03 | Phase 2 | Complete |
| DRVR-04 | Phase 2 | Complete |
| DRVR-05 | Phase 2 | Complete |
| DRVR-06 | Phase 2 | Complete |
| DRVR-07 | Phase 2 | Complete |
| VEHI-01 | Phase 2 | Complete |
| VEHI-02 | Phase 2 | Complete |
| LOAD-01 | Phase 2 | Complete |
| LOAD-02 | Phase 2 | Complete |
| LOAD-03 | Phase 2 | Complete |
| LOAD-04 | Phase 2 | Complete |
| LOAD-05 | Phase 2 | Complete |
| LOAD-06 | Phase 2 | Complete |
| LOAD-07 | Phase 2 | Complete |
| LOAD-08 | Phase 2 | Complete |
| LOAD-09 | Phase 2 | Complete |
| LOAD-10 | Phase 2 | Complete |
| LOAD-11 | Phase 2 | Complete |
| LOAD-12 | Phase 2 | Complete |
| LOAD-13 | Phase 2 | Complete |
| LOAD-14 | Phase 2 | Complete |
| LOAD-15 | Phase 2 | Complete |
| LOAD-16 | Phase 2 | Complete |
| LOAD-17 | Phase 2 | Complete |
| DISP-01 | Phase 3 | Complete |
| DISP-02 | Phase 3 | Complete |
| DISP-03 | Phase 3 | Complete |
| DISP-04 | Phase 3 | Complete |
| DISP-05 | Phase 3 | Complete |
| DISP-06 | Phase 3 | Complete |
| DISP-07 | Phase 3 | Complete |
| DISP-08 | Phase 3 | Complete |
| INV-01 | Phase 4 | Complete |
| INV-02 | Phase 4 | Complete |
| INV-03 | Phase 4 | Complete |
| INV-04 | Phase 4 | Complete |
| INV-05 | Phase 4 | Complete |
| INV-06 | Phase 4 | Complete |
| INV-07 | Phase 4 | Complete |
| DASH-01 | Phase 4 | Complete |
| DASH-02 | Phase 4 | Complete |
| DASH-03 | Phase 4 | Complete |
| DASH-04 | Phase 4 | Complete |
| DASH-05 | Phase 4 | Complete |
| MARI-01 | Phase 5 | Complete |
| MARI-02 | Phase 5 | Complete |
| MARI-03 | Phase 5 | Complete |
| MARI-04 | Phase 5 | Complete |
| MARI-05 | Phase 5 | Complete |
| MARI-06 | Phase 5 | Complete |
| MARI-07 | Phase 5 | Complete |
| MARI-08 | Phase 5 | Complete |
| MARI-09 | Phase 5 | Complete |
| MARI-10 | Phase 5 | Complete |
| ROUT-01 | Phase 5 | Complete |
| ROUT-02 | Phase 5 | Complete |
| ROUT-03 | Phase 5 | Complete |
| ROUT-04 | Phase 5 | Complete |
| ROUT-05 | Phase 5 | Complete |
| ALRT-01 | Phase 6 | Complete |
| ALRT-02 | Phase 6 | Complete |
| ALRT-03 | Phase 6 | Complete |
| ALRT-04 | Phase 6 | Complete |
| ALRT-05 | Phase 6 | Complete |
| ALRT-06 | Phase 6 | Complete |
| ALRT-07 | Phase 6 | Complete |
| ALRT-08 | Phase 6 | Complete |
| PUSH-01 | Phase 6 | Complete |
| PUSH-02 | Phase 6 | Complete |
| PUSH-03 | Phase 6 | Complete |
| PUSH-04 | Phase 6 | Complete |
| PUSH-05 | Phase 6 | Complete |
| ANLY-01 | Phase 6 | Complete |
| ANLY-02 | Phase 6 | Complete |
| ANLY-03 | Phase 6 | Complete |
| ANLY-04 | Phase 6 | Complete |
| ANLY-05 | Phase 6 | Complete |
| EDSP-01 | Phase 6 | Complete |
| EDSP-02 | Phase 6 | Complete |
| EDSP-03 | Phase 6 | Complete |
| EDSP-04 | Phase 6 | Complete |
| COMP-01 | Phase 7 | Complete |
| COMP-02 | Phase 7 | Complete |
| COMP-03 | Phase 7 | Complete |
| COMP-04 | Phase 7 | Complete |
| COMP-05 | Phase 7 | Complete |
| COMP-06 | Phase 7 | Complete |
| COMP-07 | Phase 7 | Complete |
| COMP-08 | Phase 7 | Complete |
| COMP-09 | Phase 7 | Complete |
| COMP-10 | Phase 7 | Complete |
| COMP-11 | Phase 7 | Complete |
| COMP-12 | Phase 7 | Complete |
| COMP-13 | Phase 7 | Complete |
| FLET-01 | Phase 8 | Complete |
| FLET-02 | Phase 8 | Complete |
| FLET-03 | Phase 8 | Complete |
| FLET-04 | Phase 8 | Complete |
| FLET-05 | Phase 8 | Complete |
| FLET-06 | Phase 8 | Complete |
| FLET-07 | Phase 8 | Complete |
| FLET-08 | Phase 8 | Complete |
| FLET-09 | Phase 8 | Complete |
| FLET-10 | Phase 8 | Complete |
| CRM-01 | Phase 9 | Complete |
| CRM-02 | Phase 9 | Complete |
| CRM-03 | Phase 9 | Complete |
| CRM-04 | Phase 9 | Complete |
| CRM-05 | Phase 9 | Complete |
| CRM-06 | Phase 9 | Complete |
| CRM-07 | Phase 9 | Complete |
| CRM-08 | Phase 9 | Complete |
| CRM-09 | Phase 9 | Complete |
| CRM-10 | Phase 9 | Complete |
| XMOD-01 | Phase 9 | Complete |
| XMOD-02 | Phase 9 | Complete |
| XMOD-03 | Phase 9 | Complete |
| XMOD-04 | Phase 9 | Complete |
| XMOD-05 | Phase 9 | Complete |
| BILL-01 | Phase 10 | Complete |
| BILL-02 | Phase 10 | Complete |
| BILL-03 | Phase 10 | Complete |
| BILL-04 | Phase 10 | Complete |
| BILL-05 | Phase 10 | Complete |
| BILL-06 | Phase 10 | Complete |
| BILL-07 | Phase 10 | Complete |
| BILL-08 | Phase 10 | Complete |
| BILL-09 | Phase 10 | Complete |
| BILL-10 | Phase 10 | Complete |
| REPT-01 | Phase 11 | Complete |
| REPT-02 | Phase 11 | Complete |
| REPT-03 | Phase 11 | Complete |
| REPT-04 | Phase 11 | Complete |
| REPT-05 | Phase 11 | Complete |
| REPT-06 | Phase 11 | Complete |
| REPT-07 | Phase 11 | Complete |
| REPT-08 | Phase 11 | Complete |
| NOTF-01 | Phase 11 | Complete |
| NOTF-02 | Phase 11 | Complete |
| NOTF-03 | Phase 11 | Complete |
| NOTF-04 | Phase 11 | Complete |
| NOTF-05 | Phase 11 | Complete |
| NOTF-06 | Phase 11 | Complete |
| ONBD-01 | Phase 12 | Pending |
| ONBD-02 | Phase 12 | Pending |
| ONBD-03 | Phase 12 | Pending |
| ONBD-04 | Phase 12 | Pending |
| PWA-01 | Phase 12 | Complete |
| PWA-02 | Phase 12 | Complete |
| PWA-03 | Phase 12 | Complete |
| PWA-04 | Phase 12 | Complete |
| PWA-05 | Phase 12 | Complete |
| SECR-01 | Phase 12 | Complete |
| SECR-02 | Phase 12 | Complete |
| SECR-03 | Phase 12 | Complete |
| SECR-04 | Phase 12 | Complete |
| SECR-05 | Phase 12 | Complete |
| SECR-06 | Phase 12 | Complete |
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
