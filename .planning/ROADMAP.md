# Roadmap: Manifest

## Overview

Manifest delivers a complete carrier operations platform in 12 phases. Phases 1-4 build the foundational dispatch-to-invoice workflow that every subsequent feature depends on. Phases 5-6 layer AI intelligence, smart routing, predictive alerts, and analytics on top of operational data. Phases 7-9 add operational depth (compliance, fleet, CRM) that locks in customers with switching costs. Phases 10-12 handle monetization, advanced reporting, and launch readiness (billing, PWA hardening, onboarding, security). Each phase delivers a coherent, verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Auth & Organization** - User accounts, org setup, roles, RLS foundation, and invitation flow (completed 2026-03-25)
- [x] **Phase 2: Loads, Drivers & Vehicles** - Driver roster, vehicle registry, and complete load lifecycle management (completed 2026-03-25)
- [x] **Phase 3: Dispatch** - Driver-to-load assignment, dispatch board, and driver PWA dispatch features (completed 2026-03-25)
- [ ] **Phase 4: Invoicing & Dashboard** - Invoice generation from delivered loads and operational dashboards for all modes
- [ ] **Phase 5: Marie AI & Smart Routing** - AI operations assistant and ranked driver suggestions for dispatch
- [ ] **Phase 6: Alerts, Analytics & Enhanced Dispatch** - Predictive alerts, push notifications, analytics charts, and map/timeline dispatch views
- [ ] **Phase 7: Compliance** - DOT and non-DOT compliance tracking, DQ files, inspections, IFTA, and automated scanning
- [ ] **Phase 8: Fleet Management** - Full vehicle lifecycle, maintenance, fuel tracking, cost-per-mile, and fleet dashboard
- [ ] **Phase 9: CRM & Cross-Module Integration** - Customer/broker/vendor management, lanes, rate agreements, and cross-module automation
- [ ] **Phase 10: Billing & Subscriptions** - Stripe Connect integration, plan tiers, usage tracking, and subscription management
- [ ] **Phase 11: Reporting & Notifications** - Advanced analytics dashboards, PDF reports, and multi-channel notification system
- [ ] **Phase 12: Onboarding, PWA, Security & Polish** - Onboarding wizard, offline PWA, security hardening, white-label, and performance optimization

## Phase Details

### Phase 1: Auth & Organization
**Goal**: Users can create accounts, set up their carrier organization, invite team members, and access the correct mode based on their role -- all with org-level data isolation
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09, AUTH-10
**Success Criteria** (what must be TRUE):
  1. User can sign up, log in (password or magic link), and stay logged in across browser sessions
  2. User can create an organization with company details including DOT/MC numbers and company type
  3. Admin can invite users with role assignment and invitees can join via invitation link
  4. Users are redirected to the correct mode (Command, Driver, Owner-Operator) based on their role
  5. All data access is isolated by organization via RLS policies on auth-related tables
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md -- Project scaffolding, Supabase clients, database schema, RLS policies, auth trigger, test infrastructure
- [ ] 01-02-PLAN.md -- Auth UI (signup, login, magic link), session management, organization creation flow
- [ ] 01-03-PLAN.md -- Team invitation flow, role-based middleware routing, route group layouts, end-to-end verification

### Phase 2: Loads, Drivers & Vehicles
**Goal**: Carrier can manage their driver roster, vehicle registry, and full load lifecycle from booking through delivery with document uploads and real-time status updates
**Depends on**: Phase 1
**Requirements**: DRVR-01, DRVR-02, DRVR-03, DRVR-04, DRVR-05, DRVR-06, DRVR-07, VEHI-01, VEHI-02, LOAD-01, LOAD-02, LOAD-03, LOAD-04, LOAD-05, LOAD-06, LOAD-07, LOAD-08, LOAD-09, LOAD-10, LOAD-11, LOAD-12, LOAD-13, LOAD-14, LOAD-15, LOAD-16, LOAD-17
**Success Criteria** (what must be TRUE):
  1. Admin/dispatcher can add, edit, deactivate drivers and search/filter the driver roster
  2. Admin can link a driver to a user account and driver can view their own profile in Driver PWA
  3. Vehicles exist as records with unit number, VIN, year, make, model, type, and status for assignment
  4. User can create a load with full details (pickup, delivery, freight, rate, broker) and load numbers auto-generate
  5. Load status moves through the complete lifecycle (booked through delivered) with every transition logged and broadcast in real-time
  6. Users can upload documents (BOL, POD) to loads including via mobile camera, and filter/view loads in list and kanban views
**Plans**: 6 plans

Plans:
- [ ] 02-01-PLAN.md -- Database migrations (vehicles, drivers, loads, triggers, storage), TypeScript types, Zod schemas, load status logic
- [ ] 02-02-PLAN.md -- Driver management CRUD (list, detail, add/edit, deactivate, search/filter)
- [ ] 02-03-PLAN.md -- Vehicle CRUD and load creation multi-step wizard (5 steps)
- [ ] 02-04-PLAN.md -- Load status lifecycle, transition validation, Realtime hook, document upload system
- [ ] 02-05-PLAN.md -- Load list with filters, kanban board, load detail page, CSV export, sidebar navigation update
- [ ] 02-06-PLAN.md -- Driver PWA loads (active load, status buttons, camera upload, history), driver profile, driver-user linking

### Phase 3: Dispatch
**Goal**: Dispatchers can assign drivers and vehicles to loads, track assignments in real-time, and drivers can interact with dispatch from their mobile devices
**Depends on**: Phase 2
**Requirements**: DISP-01, DISP-02, DISP-03, DISP-04, DISP-05, DISP-06, DISP-07, DISP-08
**Success Criteria** (what must be TRUE):
  1. Dispatcher can assign a driver and vehicle to a load from the dispatch board showing unassigned loads and available drivers
  2. Active dispatches display with ETA and current status, and driver availability view shows who is free, on a load, or off
  3. Driver receives dispatch in PWA with load summary card and can accept, reject, or send notes to dispatcher
  4. Dispatch status changes broadcast via Supabase Realtime so all users see updates immediately
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md -- Database migration, types, dispatch-status utility, Zod schemas, Realtime hook, server actions, tests
- [ ] 03-02-PLAN.md -- Dispatch board UI (Command mode): two-column layout, assignment form, active dispatches, navigation
- [ ] 03-03-PLAN.md -- Driver PWA dispatch: dispatch card, accept/reject, status updates, notes, navigation

### Phase 4: Invoicing & Dashboard
**Goal**: Carrier can generate invoices from delivered loads, track payment status, and view operational health across all three modes (Command, Driver PWA, Owner-Operator)
**Depends on**: Phase 3
**Requirements**: INV-01, INV-02, INV-03, INV-04, INV-05, INV-06, INV-07, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05
**Success Criteria** (what must be TRUE):
  1. User can create an invoice from a delivered load with auto-populated data, auto-generated invoice number, and editable details
  2. User can mark invoices as sent, paid, or void and overdue invoices are auto-detected daily
  3. Invoice PDF can be generated and downloaded
  4. Command dashboard shows stat cards (active loads, booked today, drivers on duty, revenue MTD), activity feed, and quick actions
  5. Driver PWA shows current load card with quick status update, and Owner-Operator dashboard shows stats scoped to own loads
**Plans**: 4 plans

Plans:
- [ ] 04-01-PLAN.md -- Database migration (invoices table, trigger, pg_cron, storage), TypeScript types, invoice-status module, Zod schema, StatusBadge extension, Realtime hook
- [ ] 04-02-PLAN.md -- Invoice CRUD UI: server actions, form component, list/filters, detail, edit, sidebar update, load detail integration
- [ ] 04-03-PLAN.md -- Invoice PDF generation with @react-pdf/renderer and API route handler
- [ ] 04-04-PLAN.md -- Dashboards: Command stat cards/activity feed/quick actions, Driver PWA current load, Owner-Operator scoped stats

### Phase 5: Marie AI & Smart Routing
**Goal**: Users can interact with an AI operations assistant that answers questions about their operations and executes actions, and dispatchers get ranked driver suggestions when assigning loads
**Depends on**: Phase 4
**Requirements**: MARI-01, MARI-02, MARI-03, MARI-04, MARI-05, MARI-06, MARI-07, MARI-08, MARI-09, MARI-10, ROUT-01, ROUT-02, ROUT-03, ROUT-04, ROUT-05
**Success Criteria** (what must be TRUE):
  1. Marie chat opens as slide-out panel in Command and Owner-Operator modes, answering questions about loads, drivers, invoices, and dispatch
  2. Marie can execute actions (create load, dispatch driver, generate invoice) with role-based restrictions and inline action buttons
  3. Marie is stateless per request, org-scoped via RLS, and logs all queries with tokens and latency
  4. Driver PWA has simplified Marie chat for driver-scoped questions and Marie summarizes unacknowledged alerts on open
  5. Smart routing returns ranked driver suggestions (proximity, availability, equipment, performance, lane familiarity) with one-click assign in dispatch UI
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Alerts, Analytics & Enhanced Dispatch
**Goal**: Operations team receives proactive alerts for at-risk situations, push notifications keep everyone informed in real-time, analytics charts show operational trends, and dispatch gains map and timeline views
**Depends on**: Phase 5
**Requirements**: ALRT-01, ALRT-02, ALRT-03, ALRT-04, ALRT-05, ALRT-06, ALRT-07, ALRT-08, PUSH-01, PUSH-02, PUSH-03, PUSH-04, PUSH-05, ANLY-01, ANLY-02, ANLY-03, ANLY-04, ANLY-05, EDSP-01, EDSP-02, EDSP-03, EDSP-04
**Success Criteria** (what must be TRUE):
  1. Predictive alerts fire for late pickup risk, driver gone silent, overdue invoices, dispatch conflicts, ETA risk, and unassigned loads -- visible in dashboard with severity badges and acknowledgeable
  2. Push notifications reach drivers (new dispatch), dispatchers (status updates), and admins (critical alerts) via Web Push API with user-configurable preferences
  3. Daily analytics snapshots generate nightly and power dashboard charts: revenue trend, load volume, on-time performance, and revenue per mile
  4. Enhanced dispatch board shows map view with load/driver pins, timeline/Gantt view of driver schedules, and conflict detection on assignment
  5. Smart routing suggestions are integrated directly into the enhanced dispatch UI
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD
- [ ] 06-03: TBD

### Phase 7: Compliance
**Goal**: Carrier can track all regulatory compliance obligations (DOT and non-DOT), manage driver qualification files, record inspections, calculate IFTA, and receive automated alerts before deadlines
**Depends on**: Phase 4
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, COMP-07, COMP-08, COMP-09, COMP-10, COMP-11, COMP-12, COMP-13
**Success Criteria** (what must be TRUE):
  1. Org has a compliance profile with DOT/MC, carrier type, insurance, IFTA, and UCR -- and compliance adapts based on DOT vs non-DOT
  2. Compliance items track obligations with due dates, status, recurrence, and alerts generate at configurable thresholds (90 to 1 day)
  3. Compliance dashboard shows health score (0-100) and upcoming deadlines calendar (next 90 days)
  4. Driver qualification files (CDL, medical card, endorsements, MVR, drug tests) tracked per driver with completeness percentage and missing document highlights
  5. Inspections (annual, pre-trip, post-trip, roadside) are recorded, DVIR digital form works in Driver PWA with camera upload, and IFTA tracks per vehicle per jurisdiction with CSV export
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

### Phase 8: Fleet Management
**Goal**: Carrier can manage their entire fleet lifecycle -- vehicles of any class with maintenance schedules, fuel tracking, cost analysis, and driver-facing mobile tools
**Depends on**: Phase 4
**Requirements**: FLET-01, FLET-02, FLET-03, FLET-04, FLET-05, FLET-06, FLET-07, FLET-08, FLET-09, FLET-10
**Success Criteria** (what must be TRUE):
  1. Full vehicle CRUD with class, type, registration, odometer, fuel type, photos, and status tracking (active, in_shop, out_of_service, parked, sold)
  2. Maintenance records track type, vendor, cost breakdown, and dates; maintenance schedules define intervals by vehicle or class with automated alerts from edge function
  3. Fuel transactions can be logged (manual or fuel card), cost per mile is calculated per vehicle and fleet-wide, and vehicle assignment history is tracked
  4. Fleet dashboard shows vehicles by status, maintenance due, cost per mile, and top expensive vehicles
  5. Driver PWA shows assigned vehicle info, pre-trip inspection form, report issue button, and fuel log entry
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

### Phase 9: CRM & Cross-Module Integration
**Goal**: Carrier can manage customer, broker, and vendor relationships with lane-based rate tracking, and operational events automatically cascade across modules
**Depends on**: Phases 7, 8
**Requirements**: CRM-01, CRM-02, CRM-03, CRM-04, CRM-05, CRM-06, CRM-07, CRM-08, CRM-09, CRM-10, XMOD-01, XMOD-02, XMOD-03, XMOD-04, XMOD-05
**Success Criteria** (what must be TRUE):
  1. Company CRUD works for customers, brokers, vendors, partners, and prospects with contacts, MC/DOT, and payment terms
  2. Lanes track origin-destination pairs with distance, rates, and run count; rate agreements have effective dates and volume minimums; lane map visualizes active lanes
  3. Activities (calls, emails, notes, meetings) are logged per company/contact/lane, and follow-up reminders send push notifications on the due date
  4. CRM dashboard shows revenue by company, expiring rate agreements, pending follow-ups, and broker pay performance
  5. Cross-module automation works: load completion updates CRM stats, DOT inspection auto-completes compliance items, CDL expiry flags across modules, fuel feeds IFTA, and Marie checks CRM/compliance before actions
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

### Phase 10: Billing & Subscriptions
**Goal**: Manifest can charge customers via Stripe Connect with tiered plans, usage tracking, trial management, and self-service subscription management
**Depends on**: Phase 4
**Requirements**: BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06, BILL-07, BILL-08, BILL-09, BILL-10
**Success Criteria** (what must be TRUE):
  1. Stripe Connect integration works in platform mode with each org as a Connected Account
  2. Four plan tiers (free, starter, professional, enterprise) are enforced with feature limits and 14-day Professional trial auto-downgrades to free
  3. Users can check out via Stripe hosted page and manage payment methods via Stripe Customer Portal
  4. Webhook handler processes subscription lifecycle events and usage tracking counts vehicles, drivers, loads, AI queries, and voice minutes with API-level enforcement (402 on limit exceeded)
  5. Billing UI shows current plan, usage meters, upgrade/downgrade options, invoice history, and plan comparison page with annual/monthly toggle
**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD

### Phase 11: Reporting & Notifications
**Goal**: Carrier has comprehensive analytics dashboards across all modules, downloadable PDF reports, and a unified multi-channel notification system
**Depends on**: Phases 7, 8, 9
**Requirements**: REPT-01, REPT-02, REPT-03, REPT-04, REPT-05, REPT-06, REPT-07, REPT-08, NOTF-01, NOTF-02, NOTF-03, NOTF-04, NOTF-05, NOTF-06
**Success Criteria** (what must be TRUE):
  1. Precomputed analytics snapshots (daily, weekly, monthly) cover revenue, ops, fleet, compliance, and CRM metrics
  2. Analytics dashboard shows revenue/expenses/profit, operations trending, fleet utilization, and customer/broker profitability
  3. Driver performance tracks loads, miles, revenue, on-time %, fuel efficiency, safety, and compliance score
  4. PDF reports (P&L, fleet, compliance, driver) can be generated and downloaded, and Owner-Operator gets simplified P&L with per-mile profitability
  5. Notification system delivers in-app, push, email, and SMS with per-user category/channel preferences, quiet hours, and unread count badge in header
**Plans**: TBD

Plans:
- [ ] 11-01: TBD
- [ ] 11-02: TBD

### Phase 12: Onboarding, PWA, Security & Polish
**Goal**: New users have a guided setup experience, the Driver PWA works fully offline, the application meets security standards, and enterprise customers can white-label the product
**Depends on**: Phases 10, 11
**Requirements**: ONBD-01, ONBD-02, ONBD-03, ONBD-04, PWA-01, PWA-02, PWA-03, PWA-04, PWA-05, SECR-01, SECR-02, SECR-03, SECR-04, SECR-05, SECR-06, WLBL-01, WLBL-02, WLBL-03, WLBL-04
**Success Criteria** (what must be TRUE):
  1. Guided onboarding wizard walks new users through business profile, first vehicle, first driver, integrations, and plan selection with progress tracking
  2. Getting Started checklist widget persists on dashboard until dismissed, and driver onboarding flow covers invite, PWA install, account creation, and first pre-trip tutorial
  3. Driver PWA works offline: service worker caches app shell and active data, inspections and fuel logs queue offline and sync on reconnect
  4. Performance targets met: < 2s FMP on 3G, < 4s TTI, Lighthouse PWA > 90, < 300KB initial bundle with virtualized lists and code splitting
  5. Security hardening complete: RLS verified on every table, CSRF protection, rate limiting, input sanitization, CSP headers, and Stripe webhook signature verification
  6. White-label infrastructure works for enterprise tier: configurable brand name, logo, colors, and custom domain via CSS custom properties
**Plans**: TBD

Plans:
- [ ] 12-01: TBD
- [ ] 12-02: TBD
- [ ] 12-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12
Note: Phases 7, 8, and 10 can execute in parallel after Phase 4. Phase 9 requires 7 and 8. Phase 11 requires 7, 8, and 9. Phase 12 requires 10 and 11.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth & Organization | 3/3 | Complete    | 2026-03-25 |
| 2. Loads, Drivers & Vehicles | 6/6 | Complete    | 2026-03-25 |
| 3. Dispatch | 3/3 | Complete    | 2026-03-25 |
| 4. Invoicing & Dashboard | 0/4 | Not started | - |
| 5. Marie AI & Smart Routing | 0/2 | Not started | - |
| 6. Alerts, Analytics & Enhanced Dispatch | 0/3 | Not started | - |
| 7. Compliance | 0/2 | Not started | - |
| 8. Fleet Management | 0/2 | Not started | - |
| 9. CRM & Cross-Module Integration | 0/2 | Not started | - |
| 10. Billing & Subscriptions | 0/2 | Not started | - |
| 11. Reporting & Notifications | 0/2 | Not started | - |
| 12. Onboarding, PWA, Security & Polish | 0/3 | Not started | - |
