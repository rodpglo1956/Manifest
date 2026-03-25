---
phase: 04-invoicing-dashboard
plan: 02
subsystem: ui
tags: [react, next.js, server-actions, zod, react-hook-form, supabase, realtime]

requires:
  - phase: 04-invoicing-dashboard
    provides: invoices table, Invoice types, invoiceSchema, canTransitionInvoice, StatusBadge invoice variant, useRealtimeInvoices
  - phase: 02-loads-drivers-vehicles
    provides: loads table, load-status pattern, LoadDetail component, sidebar
  - phase: 03-dispatch
    provides: dispatch pages pattern
provides:
  - createInvoiceFromLoad server action (auto-populates from load data, transitions load to invoiced)
  - updateInvoice server action (FormData + Zod validation, recomputes total)
  - markInvoiceSent, markInvoicePaid, markInvoiceVoid status actions
  - InvoiceForm component (react-hook-form + zodResolver, auto-calculated total)
  - Invoice list page with filters (status, date range, broker/customer)
  - Invoice detail page with status action buttons and inline payment form
  - Invoice create page with delivered load selector
  - Invoice edit page
  - InvoiceFilters, InvoiceList, InvoiceDetail components
  - Sidebar /invoices link (activated)
  - Load detail "Create Invoice" button for delivered loads
affects: [04-03, 04-04]

tech-stack:
  added: []
  patterns: [invoice-crud-server-actions, invoice-status-actions, delivered-load-invoice-creation]

key-files:
  created:
    - src/app/(app)/invoices/actions.ts
    - src/app/(app)/invoices/status-actions.ts
    - src/app/(app)/invoices/page.tsx
    - src/app/(app)/invoices/invoices-view.tsx
    - src/app/(app)/invoices/new/page.tsx
    - src/app/(app)/invoices/new/new-invoice-client.tsx
    - src/app/(app)/invoices/[id]/page.tsx
    - src/app/(app)/invoices/[id]/edit/page.tsx
    - src/components/invoices/invoice-form.tsx
    - src/components/invoices/invoice-list.tsx
    - src/components/invoices/invoice-filters.tsx
    - src/components/invoices/invoice-detail.tsx
  modified:
    - src/components/layout/app-sidebar.tsx
    - src/components/loads/load-detail.tsx
    - src/types/database.ts

key-decisions:
  - "Invoice Insert type updated to make nullable fields optional for ergonomic server action inserts"
  - "New invoice creation uses two-step flow: select delivered load, then one-click create with auto-populated data"
  - "Mark Paid uses inline payment form (date, amount, method) instead of modal for simplicity"

patterns-established:
  - "Invoice CRUD: server actions with Zod validation mirroring load pattern"
  - "Status actions separated into status-actions.ts following loads convention"
  - "Delivered load to invoice: auto-populate bill_to from broker, amounts from rate fields"

requirements-completed: [INV-01, INV-03, INV-04, INV-07]

duration: 5min
completed: 2026-03-25
---

# Phase 4 Plan 02: Invoice CRUD UI Summary

**Invoice create/edit/list/detail pages with server actions, status transitions (sent/paid/void), filters, and load-to-invoice integration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-25T06:17:10Z
- **Completed:** 2026-03-25T06:22:10Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Complete invoice CRUD: create from delivered load with auto-populated broker/rate data, edit with Zod-validated form, list with status/date/customer filters
- Status transition actions: mark sent, mark paid (with payment details), mark void -- all with validated transitions
- Invoice detail page with inline payment form, PDF download link, and status action buttons
- Load detail integration: "Create Invoice" button appears for delivered loads; sidebar activates /invoices link

## Task Commits

Each task was committed atomically:

1. **Task 1: Invoice server actions and form component** - `838e697` (feat)
2. **Task 2: Invoice pages, components, sidebar, and load integration** - `d269636` (feat)

## Files Created/Modified
- `src/app/(app)/invoices/actions.ts` - createInvoiceFromLoad, updateInvoice server actions
- `src/app/(app)/invoices/status-actions.ts` - markInvoiceSent, markInvoicePaid, markInvoiceVoid
- `src/components/invoices/invoice-form.tsx` - react-hook-form + zodResolver with auto-calculated total
- `src/components/invoices/invoice-filters.tsx` - Status, date range, broker/customer filters
- `src/components/invoices/invoice-list.tsx` - Invoice table with JetBrains Mono numbers, currency formatting
- `src/components/invoices/invoice-detail.tsx` - Full invoice info with status actions and inline payment
- `src/app/(app)/invoices/page.tsx` - Server component with filtered query
- `src/app/(app)/invoices/invoices-view.tsx` - Client wrapper with realtime subscription
- `src/app/(app)/invoices/new/page.tsx` - Delivered load selector or direct loadId creation
- `src/app/(app)/invoices/new/new-invoice-client.tsx` - One-click invoice creation client component
- `src/app/(app)/invoices/[id]/page.tsx` - Invoice detail server component with load join
- `src/app/(app)/invoices/[id]/edit/page.tsx` - Edit page with InvoiceForm in edit mode
- `src/components/layout/app-sidebar.tsx` - Activated /invoices link (removed "coming soon")
- `src/components/loads/load-detail.tsx` - Added "Create Invoice" button for delivered loads
- `src/types/database.ts` - Fixed Invoice Insert type nullable fields

## Decisions Made
- Invoice Insert type updated to make nullable fields (bill_to_email, bill_to_address, paid_date, paid_amount, payment_method, notes, pdf_url) optional. Required for ergonomic server action inserts without specifying every null field.
- New invoice creation uses two-step flow: if no loadId, user selects from delivered loads list; if loadId provided, one-click create with confirmation. This matches the "one click from delivered load" design intent.
- Mark Paid uses inline form (expands below action buttons) instead of modal dialog, keeping the interaction lightweight and consistent with the detail page layout.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Invoice Insert type for nullable fields**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** Database Insert type required all nullable fields (notes, bill_to_address, etc.) to be provided explicitly, causing TS2769 on server action insert
- **Fix:** Updated Insert type to make nullable fields optional with `field?: type | null` pattern
- **Files modified:** src/types/database.ts
- **Verification:** TypeScript compiles without errors in invoice files
- **Committed in:** d269636 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type fix necessary for correct server action insert. No scope creep.

## Issues Encountered

Pre-existing TypeScript errors in `tests/dashboard/stats.test.ts` and `src/app/api/invoices/[id]/pdf/route.ts` unrelated to this plan's changes. Out of scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Invoice CRUD complete, ready for Plan 03 (PDF generation via @react-pdf/renderer)
- All status actions ready for dashboard integration in Plan 04
- Invoice detail page already links to PDF download endpoint (Plan 03 implements the route handler)
- InvoiceDetail component ready for any future enhancements

---
*Phase: 04-invoicing-dashboard*
*Completed: 2026-03-25*
