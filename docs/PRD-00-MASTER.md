# PRD-00: Master Overview

**Manifest (by Glo Matrix)** | v1.1 | March 2026 | Rod Patterson | Confidential

---

## 1. What this is

Manifest is an all-in-one logistics operations platform built for carriers of every size. Medical transport vans to 18-wheelers. DOT-regulated and non-DOT. It handles dispatch, load management, fleet tracking, compliance, driver management, invoicing, CRM, and reporting in a single product.

It is not a TMS bolt-on or a load board wrapper. It is the operating system for a carrier's entire back office.

Manifest lives at `manifest.glomatrix.app`. It is built and operated by Glo Matrix LLC.

---

## 2. Who it is for

| Segment | Examples | Mode |
|---|---|---|
| Fleet operators (office) | Dispatchers, ops managers, fleet owners running 5-200+ vehicles | Command |
| Drivers (in-cab) | CDL holders, medical transport drivers, delivery drivers | Driver PWA |
| Owner-operators | Solo operators or 1-3 truck shops running everything themselves | Owner-Operator |

All three segments use the same product. The mode determines what they see, what they can do, and how the interface adapts.

---

## 3. Three modes

### Command mode (desktop primary)

The full operations dashboard. Dispatch board, load management, fleet overview, compliance dashboard, CRM, reports, billing, team management, settings. This is where the business runs.

Accessed at: `manifest.glomatrix.app/app`

### Driver PWA (mobile primary)

Progressive web app optimized for phones. Current load details, dispatch info, pre/post-trip inspections, fuel logging, document uploads (BOLs, receipts, medical cards), compliance status. Offline capable.

Accessed at: `manifest.glomatrix.app/driver`

### Owner-Operator mode (desktop + mobile)

A streamlined version of Command mode for solo operators. They see their own loads, their own truck, their own compliance items, their own broker relationships. No team management. No multi-vehicle fleet views.

Accessed at: `manifest.glomatrix.app/app` (auto-detects based on org tier and user count)

---

## 4. Core principles

- **Built by an operator.** Rod Patterson has 10+ years in logistics and 8+ years running his own trucking business. Every feature exists because a real problem demanded it.
- **One product, full coverage.** Dispatch, loads, fleet, compliance, CRM, invoicing, reporting. No third-party TMS, no separate compliance tool, no external CRM.
- **Marie is the AI operations assistant.** She surfaces alerts, answers questions about your operation, generates reports, and handles proactive compliance and dispatch notifications. She runs on Claude API via Railway.
- **Supabase is the backbone.** Database, auth, real-time subscriptions, edge functions, row-level security, file storage. One platform for the entire data and automation layer.
- **White by default, dark by choice.** Clean, professional interface. Manual dark mode toggle. No system preference auto-detect.
- **No n8n.** All automation runs through Supabase Edge Functions and pg_cron. No external workflow engine.

---

## 5. Technology stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 15 (App Router) + Tailwind | All three modes served from one app |
| Database | Supabase PostgreSQL | All data: loads, dispatch, fleet, compliance, CRM, billing |
| Auth | Supabase Auth | Login, role-based access, org scoping |
| Real-time | Supabase Realtime | Live dispatch updates, load status changes, compliance alerts |
| Automation | Supabase Edge Functions + pg_cron | Scheduled compliance scans, maintenance reminders, report generation, cost aggregation |
| AI | Claude API (via Railway) | Marie operations assistant |
| Voice | Vapi | Voice capabilities for Marie |
| Payments | Stripe Connect | Subscription billing, invoicing |
| Hosting (frontend) | Vercel | Next.js deployment |
| Hosting (Marie) | Railway | AI agent runtime |
| File storage | Supabase Storage | BOLs, receipts, inspection photos, compliance documents |
| Primary color | #EC008C | Brand pink from GloMatrix identity |

---

## 6. Document structure

This PRD is split into 5 documents plus a design system:

| Document | Phase | Scope | Timeline |
|---|---|---|---|
| PRD-00-MASTER | n/a | Architecture, stack, principles (this document) | n/a |
| PRD-01-FOUNDATION | Phase 1 | Auth, org setup, loads, dispatch, driver management, invoicing, dashboard skeleton | Weeks 1-8 |
| PRD-02-INTELLIGENCE | Phase 2 | Marie AI integration, smart routing, predictive compliance, proactive alerts, analytics foundation | Weeks 9-16 |
| PRD-03-COMPLIANCE-FLEET-CRM | Phase 3 | Regulatory compliance, fleet management, logistics CRM | Weeks 17-24 |
| PRD-04-SCALE-POLISH | Phase 4 | Multi-tenant billing, onboarding, mobile polish, reports, accessibility, launch readiness | Weeks 25-32 |
| DESIGN-SYSTEM | n/a | Colors, typography, spacing, components, layouts, accessibility, responsive rules | n/a |

Each document is self-contained with its own schema, API routes, edge functions, UI pages, and exit criteria. Build in order. Each phase depends on the one before it.

---

## 7. Vehicle types supported

Manifest is not a trucking-only product. It supports any commercial vehicle operation:

| Type | DOT regulated | Examples |
|---|---|---|
| Semi tractor | Yes | OTR, regional, dedicated |
| Semi trailer | Yes | Dry van, reefer, flatbed, tanker |
| Box truck | Depends on weight | Local delivery, LTL |
| Sprinter van | Typically no | Medical transport, courier, last mile |
| Cargo van | Typically no | Delivery, mobile service |
| Medical transport van | Varies by state | NEMT, patient transport |
| Straight truck | Depends on weight | Construction, moving, delivery |
| Flatbed | Yes | Heavy haul, construction, equipment |
| Reefer | Yes | Temperature-controlled freight |

The compliance module adapts based on whether a vehicle/carrier is DOT-regulated or not. DOT carriers get FMCSA, ELD/HOS, IFTA, CDL tracking, drug testing. Non-DOT carriers get state licenses, insurance, certifications, and vehicle maintenance tracking.

---

## 8. Cost structure

| Service | Estimated monthly | Notes |
|---|---|---|
| Supabase Pro | $25 | Database, auth, realtime, edge functions, pg_cron, storage |
| Vercel | $0-20 | Next.js frontend. Free tier likely sufficient at launch. |
| Railway (Marie) | $5-15 | Single AI agent service |
| Claude API | $30-100 | Marie AI queries. Scales with user count. |
| Vapi | Variable | Per-minute voice pricing |
| Stripe | 2.9% + 30c per transaction | Payment processing |

Total estimated infrastructure: $60-160/month at launch. Scales with customer count.

---

## 9. Security boundaries

| Boundary | Rule |
|---|---|
| Org data isolation | RLS on every table. Org A cannot see Org B data. |
| Auth | Supabase Auth with role-based access (admin, dispatcher, driver, viewer) |
| Marie AI | Scoped to requesting org's data only. Never surfaces cross-org information. |
| File uploads | Supabase Storage buckets scoped by org_id with RLS |
| Stripe keys | Stored in Supabase Vault, not env vars |
| API routes | All routes verify auth and org membership before any data access |
| Driver PWA | Drivers see only their own loads, vehicle, and compliance items |

---

## 10. What Manifest is not

- Not a load board. It does not source freight. It manages freight your operation has already booked.
- Not an ELD. It integrates with ELD providers (KeepTruckin, Samsara, etc.) but does not replace the in-cab device.
- Not a GPS tracker. It uses driver-reported location and ELD integrations for ETAs, not hardware GPS units.
- Not a marketplace. There is no broker-carrier matching. It is an internal operations tool.
