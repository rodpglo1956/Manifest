# Phase 4: Invoicing & Dashboard - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Invoice generation from delivered loads and operational dashboards for all three modes (Command, Driver PWA, Owner-Operator). Invoicing covers create, edit, mark sent/paid/void, overdue detection, and PDF generation. Dashboards show stat cards, activity feed, and quick actions. No full AR aging (Phase 10), no analytics charts (Phase 6), no Stripe payments (Phase 10).

</domain>

<decisions>
## Implementation Decisions

### Invoicing Schema
- Invoices table per PRD-01 Section 6.2: id, org_id, load_id, invoice_number, bill_to_company, bill_to_email, bill_to_address, amount, fuel_surcharge, accessorials, total, status, issued_date, due_date, paid_date, paid_amount, payment_method, notes, pdf_url
- Invoice statuses: 'draft', 'sent', 'paid', 'overdue', 'void'
- Invoice number auto-generates via database trigger: INV-YYYYMM-SEQUENCE
- RLS policy: org_id isolation using auth.org_id() helper

### Invoice Creation Flow
- Create invoice from a delivered load — auto-populates bill_to from broker info, amounts from load rate data
- User can edit all fields before saving
- Invoice list with filters: status, date range, broker/customer
- Invoice detail with PDF preview
- Mark as sent, mark as paid (with paid_date, amount, method), mark as void
- Overdue detection: pg_cron edge function runs daily at 8 AM, checks due_date < today for status = 'sent', updates to 'overdue'

### Invoice PDF Generation
- Use @react-pdf/renderer (from Stack research) for JSX-based PDF creation
- PDF includes: company logo placeholder, invoice number, dates, bill-to, line items (rate, fuel surcharge, accessorials), total, payment terms
- PDF stored in Supabase Storage, URL saved to invoice record
- Download link on invoice detail page

### Command Mode Dashboard (/)
- Stat row (4 cards): Active loads (in_transit), Loads booked today, Drivers on duty, Revenue MTD
- Recent activity feed: last 10 load status changes, last 5 dispatches, last 5 invoices
- Quick actions: Create load, Dispatch driver, Create invoice
- Stats are live queries against existing tables (not precomputed — that's Phase 6 analytics)

### Driver PWA Dashboard (/)
- Current load card (big, prominent) — reuse driver-active-load component from Phase 2
- Next upcoming load
- Quick status update button
- Days until next compliance item expires (placeholder text — wired in Phase 7)

### Owner-Operator Dashboard (/)
- Same as Command but all stats scoped to own loads/vehicle
- Single vehicle status card
- Revenue MTD for their operation
- Auto-detected via single-admin org member count (from Phase 1 middleware)

### Realtime
- Invoice status changes on channel org:{org_id}:invoices
- Dashboard stat cards refresh on load/dispatch/invoice Realtime events
- Reuse existing Realtime hook patterns

### Edge Functions
- overdue-invoice-scanner: pg_cron daily at 8 AM — SQL migration with pg_cron schedule
- invoice-number-generator: database trigger on invoices INSERT

### Design Patterns (carried forward)
- Server actions for all mutations
- Zod schemas for invoice validation
- react-hook-form for invoice form
- StatusBadge extended for invoice statuses
- JetBrains Mono for invoice numbers
- All existing component/layout patterns from Phases 1-3

### Claude's Discretion
- Exact PDF layout and styling
- Dashboard card component design
- Activity feed component design
- Quick action button placement
- Invoice form layout (single page vs sections)
- How to display Revenue MTD calculation

</decisions>

<specifics>
## Specific Ideas

- Invoice creation should feel like "one click from a delivered load" — the form is pre-populated, user just reviews and saves
- Dashboard stat cards should use real data from existing tables, not mocked
- Activity feed should be a simple chronological list, not complex — just recent events
- Owner-Operator dashboard should feel focused and personal, not like a stripped-down version of Command mode

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/status-badge.tsx` — Extend with invoice status variants
- `src/hooks/use-realtime-loads.ts` — Pattern for invoice Realtime hook
- `src/app/(app)/loads/status-actions.ts` — Pattern for invoice actions
- `src/components/drivers/driver-active-load.tsx` — Reuse directly in Driver PWA dashboard
- `src/lib/load-status.ts` — Pattern for invoice status logic
- `src/lib/csv-export.ts` — Pattern for generating downloadable files
- `src/app/(app)/dispatch/dispatch-board.tsx` — Pattern for dashboard with multiple data sources

### Established Patterns
- Server action: Zod validate → Supabase query → revalidatePath
- Realtime hook: useEffect → channel → postgres_changes → router.refresh()
- RLS: auth.org_id(), org_id indexed
- Database trigger: PL/pgSQL function + CREATE TRIGGER

### Integration Points
- Sidebar: add /invoices link
- Load detail page: add "Create Invoice" button when status = 'delivered'
- Dashboard replaces placeholder pages at / routes for (app) and driver
- Supabase Storage: reuse load-documents bucket pattern for invoice PDFs

</code_context>

<deferred>
## Deferred Ideas

- Full accounts receivable aging — Phase 10 (Billing)
- Stripe Connect payouts — Phase 10
- Analytics charts on dashboard — Phase 6 (Analytics Foundation)
- Revenue trend line chart — Phase 6
- Map view on dashboard — Phase 6
- Compliance item countdown on Driver PWA — Phase 7

</deferred>

---

*Phase: 04-invoicing-dashboard*
*Context gathered: 2026-03-25*
