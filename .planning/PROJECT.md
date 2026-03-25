# Manifest

## What This Is

Manifest is an all-in-one logistics operations platform built for carriers of every size — from medical transport vans to 18-wheelers, DOT-regulated and non-DOT. It handles dispatch, load management, fleet tracking, compliance, driver management, invoicing, CRM, and reporting in a single product. Built and operated by Glo Matrix LLC, it lives at manifest.glomatrix.app.

## Core Value

A carrier can manage their entire operation — loads, drivers, fleet, compliance, billing — from one platform without needing separate TMS, compliance, CRM, or fleet tools.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Auth with email/password via Supabase Auth, role-based access (admin, dispatcher, driver, viewer)
- [ ] Organization setup with DOT/MC numbers, company type, invitation flow
- [ ] Driver management: roster, license info, contact details, vehicle assignment, status tracking
- [ ] Load management: full lifecycle from booked through paid, pickup/delivery details, rate info, document upload
- [ ] Load status history with every transition logged
- [ ] Dispatch: assign drivers and vehicles to loads, track assignment status and ETAs
- [ ] Invoicing: generate from delivered loads, track payment status, PDF generation
- [ ] Dashboard: stat cards (active loads, booked today, drivers on duty, revenue MTD), activity feed, quick actions
- [ ] Realtime updates via Supabase Realtime for load status, dispatch, invoices
- [ ] RLS on every table with org_id isolation
- [ ] Three modes: Command (desktop), Driver PWA (mobile), Owner-Operator (desktop+mobile)
- [ ] Marie AI operations assistant on Railway via Claude API — questions, actions, proactive alerts
- [ ] Smart routing: ranked driver suggestions based on proximity, availability, equipment, performance, lane familiarity
- [ ] Predictive alerts: late pickup risk, driver silent, overdue invoice, dispatch conflict, ETA risk, unassigned load
- [ ] Analytics foundation: daily snapshots, dashboard charts (revenue, volume, on-time, RPM)
- [ ] Push notifications via Web Push API with user preferences
- [ ] Enhanced dispatch board: map view, timeline view, conflict detection
- [ ] Compliance module: DOT and non-DOT tracking, compliance items, alerts, driver qualifications, inspections, IFTA
- [ ] Fleet management: vehicles of any class, maintenance schedules/records, fuel transactions, cost-per-mile
- [ ] CRM: customers, brokers, vendors, lanes, rate agreements, activities, follow-up reminders
- [ ] Cross-module integration: load completion → CRM update, fuel → IFTA, inspection → compliance
- [ ] Billing via Stripe Connect: plans (free/starter/professional/enterprise), usage tracking, enforcement
- [ ] Analytics and reporting: precomputed snapshots, driver performance, PDF report generation
- [ ] Notification system: in-app, push, email, SMS with per-user preferences and quiet hours
- [ ] Onboarding wizard: business profile, first vehicle, first driver, integrations, plan selection
- [ ] Driver PWA optimization: offline capability, service worker, IndexedDB, Background Sync
- [ ] White-label infrastructure: CSS custom properties, configurable branding for enterprise tier
- [ ] Security hardening: CSRF, rate limiting, input sanitization, CSP headers

### Out of Scope

- Load board / freight sourcing — Manifest manages booked freight, not sourcing
- ELD hardware — integrates with providers but doesn't replace in-cab devices
- GPS tracking hardware — uses driver-reported location and ELD integrations
- Broker-carrier marketplace — internal operations tool only
- n8n or external workflow engines — all automation via Supabase Edge Functions and pg_cron
- External TMS, CRM, or compliance tools — everything built in

## Context

- Rod Patterson has 10+ years in logistics and 8+ years as a trucking business owner. Every feature exists because a real problem demanded it.
- Manifest supports all commercial vehicle types: semis, trailers, box trucks, sprinters, cargo vans, medical transport vans, straight trucks, flatbeds, reefers.
- The compliance module adapts based on DOT vs non-DOT carrier type.
- Marie AI is stateless per query — context rebuilt from database each request, scoped by org RLS.
- Estimated infrastructure cost: $60-160/month at launch.
- Four PRD documents define the build phases in detail: PRD-01 (Foundation), PRD-02 (Intelligence), PRD-03 (Compliance/Fleet/CRM), PRD-04 (Scale/Polish/Billing).
- Design system specifies: #EC008C primary, 15px Inter body, JetBrains Mono for VINs/DOT/MC numbers, 8px spacing grid, white default theme with manual dark mode toggle.

## Constraints

- **Tech stack**: Next.js 15 (App Router) on Vercel, Supabase (PostgreSQL + RLS + Realtime + Edge Functions + pg_cron + Storage), Stripe Connect, Claude API on Railway, Vapi, Tailwind CSS, Recharts, Lucide React — locked per PRD
- **No n8n**: All automation through Supabase Edge Functions and pg_cron only
- **RLS mandatory**: Every table must have org_id isolation via row-level security
- **Three modes**: All served from one Next.js app via route groups: (app), (driver), (auth), (marketing)
- **Brand**: Primary color #EC008C, product name always capitalized "Manifest", company "Glo Matrix LLC"
- **Build order**: Phases 1-4 are sequential, each depends on the previous

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase for entire backend | Single platform for DB, auth, realtime, edge functions, storage, pg_cron — reduces ops complexity | — Pending |
| Marie on Railway (not Supabase Edge Functions) | AI agent needs longer runtime and more memory than edge functions allow | — Pending |
| Stripe Connect platform mode | Supports SaaS subscriptions + future per-transaction fees + white-label reseller model | — Pending |
| No conversation history for Marie | Stateless queries with DB context rebuild — simpler, RLS-compliant, no stale context | — Pending |
| PWA not native app for drivers | Lower dev cost, one codebase, easier updates, offline via service worker | — Pending |
| Fine granularity (8-12 phases) | Comprehensive PRDs warrant detailed phasing to manage complexity | — Pending |

---
*Last updated: 2026-03-24 after initialization*
