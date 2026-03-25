---
phase: 04-invoicing-dashboard
plan: 01
subsystem: database
tags: [postgres, supabase, zod, realtime, pg_cron, rls]

requires:
  - phase: 02-loads-drivers-vehicles
    provides: loads table, load-status pattern, StatusBadge, realtime hook pattern
  - phase: 01-auth-organization
    provides: organizations table, auth.org_id() RLS function
provides:
  - invoices table with RLS and indexes
  - invoice_number_sequences with auto-generation trigger (INV-YYYYMM-NNNN)
  - pg_cron daily overdue invoice scanner
  - invoice-documents storage bucket
  - InvoiceStatus, Invoice, InvoiceNumberSequence, PaymentMethod types
  - canTransitionInvoice status transition logic
  - invoiceSchema Zod validation with InvoiceInput type
  - StatusBadge 'invoice' variant (draft/sent/paid/overdue/void)
  - useRealtimeInvoices hook
  - next.config serverExternalPackages for @react-pdf/renderer
affects: [04-02, 04-03, 04-04]

tech-stack:
  added: [pg_cron]
  patterns: [invoice-number-trigger, monthly-sequence-table, overdue-cron-scanner]

key-files:
  created:
    - supabase/migrations/00016_invoices.sql
    - src/lib/invoice-status.ts
    - src/schemas/invoice.ts
    - src/hooks/use-realtime-invoices.ts
    - tests/invoices/schema.test.ts
    - tests/invoices/status.test.ts
  modified:
    - src/types/database.ts
    - src/components/ui/status-badge.tsx
    - next.config.ts

key-decisions:
  - "Invoice number format INV-YYYYMM-NNNN with per-org per-month sequence table"
  - "pg_cron overdue scanner runs daily at 8am UTC, transitions sent->overdue when past due_date"
  - "Used z.input for InvoiceInput type maintaining zodResolver compatibility (per project convention)"

patterns-established:
  - "Monthly invoice numbering: composite key (org_id, year_month) for sequence isolation"
  - "Invoice status machine: draft->sent->paid with void from non-terminal, overdue set by cron"

requirements-completed: [INV-01, INV-02, INV-03, INV-04, INV-05]

duration: 3min
completed: 2026-03-25
---

# Phase 4 Plan 01: Invoice Foundation Summary

**Invoice database schema with RLS, auto-numbering trigger, pg_cron overdue scanner, TypeScript types, Zod validation, StatusBadge invoice variant, and realtime hook**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-25T06:11:53Z
- **Completed:** 2026-03-25T06:14:35Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Invoices table with full PRD-01 Section 6.2 schema, RLS, indexes, and auto-number trigger
- Invoice status transition logic (draft->sent->paid, void from non-terminal, overdue by cron)
- Zod schema validates invoice form input with coercion and email validation
- StatusBadge supports invoice variant; realtime hook mirrors loads pattern; next.config ready for PDF

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration, types, status, schema** (TDD)
   - `1fe29bb` (test: add failing tests for invoice schema and status transitions)
   - `e75246e` (feat: invoice database schema, types, status logic, and Zod validation)
2. **Task 2: StatusBadge, Realtime hook, next.config** - `a0155f0` (feat)

## Files Created/Modified
- `supabase/migrations/00016_invoices.sql` - Invoices table, sequences, trigger, pg_cron, storage bucket
- `src/types/database.ts` - InvoiceStatus, PaymentMethod, Invoice, InvoiceNumberSequence types + Database extension
- `src/lib/invoice-status.ts` - INVOICE_STATUSES, VALID_INVOICE_TRANSITIONS, canTransitionInvoice, getInvoiceStatusLabel
- `src/schemas/invoice.ts` - invoiceSchema Zod validation, InvoiceInput type
- `src/components/ui/status-badge.tsx` - Added 'invoice' variant with 5 status colors
- `src/hooks/use-realtime-invoices.ts` - Realtime subscription for invoices table
- `next.config.ts` - Added serverExternalPackages for @react-pdf/renderer
- `tests/invoices/schema.test.ts` - 10 invoice schema validation tests
- `tests/invoices/status.test.ts` - 16 invoice status transition tests

## Decisions Made
- Invoice number format INV-YYYYMM-NNNN with per-org per-month composite key sequence table (differs from load numbers which use org-prefix + global counter)
- pg_cron overdue scanner runs daily at 8am UTC, only transitions 'sent' invoices past due_date
- Used z.input for InvoiceInput type maintaining zodResolver compatibility (per project convention from Phase 2)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing test failures in tests/loads/schema.test.ts (3 tests) unrelated to invoice changes. Out of scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Invoice table, types, and status logic ready for Plan 02 (CRUD actions and list UI)
- Zod schema ready for invoice form validation
- StatusBadge and realtime hook ready for invoice dashboard
- next.config ready for Plan 03 (PDF generation with @react-pdf/renderer)

---
*Phase: 04-invoicing-dashboard*
*Completed: 2026-03-25*
