# Phase 4: Invoicing & Dashboard - Research

**Researched:** 2026-03-25
**Domain:** Invoice CRUD, PDF generation, dashboard aggregation, pg_cron scheduling
**Confidence:** HIGH

## Summary

Phase 4 adds invoicing (create from delivered loads, edit, status lifecycle, PDF generation, overdue detection) and operational dashboards for all three modes (Command, Driver PWA, Owner-Operator). The project already has established patterns for server actions, Zod validation, Realtime hooks, StatusBadge variants, and database triggers that can be extended directly. The invoicing schema is defined in PRD-01 Section 6.2 and needs a new migration, invoice number trigger (modeled on the load number trigger), and a pg_cron job for overdue detection.

The most significant technical risk is @react-pdf/renderer compatibility with Next.js 15 App Router. The project uses React 19.1.0 and Next.js 15.5.14, which resolves the known "PDFDocument is not a constructor" issue (fixed by upgrading to React 19+). However, `serverExternalPackages` configuration in next.config.ts is required to prevent bundling conflicts. The PDF generation should use `renderToBuffer` in a Next.js API route handler (App Router `route.ts`), not a server action, since server actions cannot return binary data.

**Primary recommendation:** Follow existing project patterns exactly (server actions, Zod schemas, StatusBadge variants, Realtime hooks). Use @react-pdf/renderer v4.x with `serverExternalPackages` config. Overdue scanner should be pure SQL via pg_cron -- no edge function needed. Dashboard queries are simple aggregations against existing tables.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Invoices table per PRD-01 Section 6.2: id, org_id, load_id, invoice_number, bill_to_company, bill_to_email, bill_to_address, amount, fuel_surcharge, accessorials, total, status, issued_date, due_date, paid_date, paid_amount, payment_method, notes, pdf_url
- Invoice statuses: 'draft', 'sent', 'paid', 'overdue', 'void'
- Invoice number auto-generates via database trigger: INV-YYYYMM-SEQUENCE
- RLS policy: org_id isolation using auth.org_id() helper
- Create invoice from a delivered load -- auto-populates bill_to from broker info, amounts from load rate data
- User can edit all fields before saving
- Invoice list with filters: status, date range, broker/customer
- Invoice detail with PDF preview
- Mark as sent, mark as paid (with paid_date, amount, method), mark as void
- Overdue detection: pg_cron edge function runs daily at 8 AM, checks due_date < today for status = 'sent', updates to 'overdue'
- Use @react-pdf/renderer for JSX-based PDF creation
- PDF stored in Supabase Storage, URL saved to invoice record
- Command Mode Dashboard: 4 stat cards (Active loads, Booked today, Drivers on duty, Revenue MTD), recent activity feed, quick actions
- Driver PWA Dashboard: Current load card (reuse driver-active-load), next upcoming load, quick status update, compliance placeholder
- Owner-Operator Dashboard: Same as Command but scoped to own loads/vehicle
- Invoice status changes on Realtime channel org:{org_id}:invoices
- Dashboard stat cards refresh on Realtime events
- Server actions for all mutations, Zod schemas, react-hook-form, StatusBadge extended for invoice statuses
- JetBrains Mono for invoice numbers

### Claude's Discretion
- Exact PDF layout and styling
- Dashboard card component design
- Activity feed component design
- Quick action button placement
- Invoice form layout (single page vs sections)
- How to display Revenue MTD calculation

### Deferred Ideas (OUT OF SCOPE)
- Full accounts receivable aging -- Phase 10 (Billing)
- Stripe Connect payouts -- Phase 10
- Analytics charts on dashboard -- Phase 6 (Analytics Foundation)
- Revenue trend line chart -- Phase 6
- Map view on dashboard -- Phase 6
- Compliance item countdown on Driver PWA -- Phase 7
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INV-01 | User can create an invoice from a delivered load with auto-populated data | Server action pattern from status-actions.ts; auto-populate from load broker/rate fields; "Create Invoice" button on load detail page when status = 'delivered' |
| INV-02 | Invoice number auto-generates (INV-YYYYMM-SEQUENCE) | Database trigger pattern from 00011_load_number_trigger.sql; new invoice_number_sequences table with month-scoped sequence |
| INV-03 | User can edit invoice details (bill-to, amounts, dates, notes) | react-hook-form + Zod schema pattern from load wizard; single-page form (discretion) |
| INV-04 | User can mark invoice as sent, paid, or void | invoice-status.ts module mirroring load-status.ts; server actions for each transition |
| INV-05 | Overdue invoices auto-detected daily (due_date < today, status = sent) | pg_cron SQL-only job in migration; no edge function needed |
| INV-06 | Invoice PDF generation and download | @react-pdf/renderer v4.x with renderToBuffer in route.ts; serverExternalPackages config; store in Supabase Storage |
| INV-07 | Invoice list with filters (status, date range, broker/customer) | URL-based filter pattern from loads-view.tsx; server-side query with searchParams |
| DASH-01 | Command dashboard: active loads, booked today, drivers on duty, revenue MTD | Four parallel Supabase queries; stat card component |
| DASH-02 | Dashboard recent activity feed | Union of load_status_history, dispatches, invoices ordered by created_at; limit 10/5/5 |
| DASH-03 | Dashboard quick actions: create load, dispatch driver, create invoice | Link buttons to /loads/new, /dispatch, /invoices/new |
| DASH-04 | Driver PWA dashboard: current load card, next load, quick status | Reuse DriverActiveLoad component; query dispatches for next upcoming |
| DASH-05 | Owner-Operator dashboard: same stats scoped to own loads/vehicle | Filter all queries by driver record linked to current user_id |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-pdf/renderer | ^4.3.2 | JSX-based PDF generation | CONTEXT.md locked decision; React 19 compatible since v4.1.0 |
| react-hook-form | ^7.72.0 | Invoice form state | Already in project |
| zod | ^4.3.6 | Invoice validation schemas | Already in project |
| @hookform/resolvers | ^5.2.2 | Zod-to-form integration | Already in project |
| date-fns | ^4.1.0 | Date formatting/comparison | Already in project |
| lucide-react | ^1.6.0 | Icons for dashboard/invoices | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | ^2.100.0 | Database queries, Realtime, Storage | All data operations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @react-pdf/renderer | jsPDF | jsPDF is imperative API, not JSX; react-pdf matches project's React-centric approach |
| @react-pdf/renderer | Puppeteer/Playwright | Heavy runtime dependency, needs headless Chrome; overkill for structured invoices |
| pg_cron SQL job | Edge Function + pg_cron HTTP | Unnecessary complexity for a simple UPDATE query; SQL-only is zero latency |

**Installation:**
```bash
npm install @react-pdf/renderer
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    (app)/
      invoices/
        page.tsx              # Invoice list (server component)
        invoices-view.tsx     # Client wrapper with filters
        actions.ts            # createInvoice, updateInvoice server actions
        status-actions.ts     # markSent, markPaid, markVoid
        new/
          page.tsx            # Create invoice page
        [id]/
          page.tsx            # Invoice detail (server component)
          edit/
            page.tsx          # Edit invoice
      dashboard/
        page.tsx              # Command dashboard (replace placeholder)
        stat-cards.tsx        # Stat card components
        activity-feed.tsx     # Recent activity feed
        quick-actions.tsx     # Quick action buttons
    driver/
      dashboard/
        page.tsx              # Driver PWA dashboard (replace placeholder)
    api/
      invoices/
        [id]/
          pdf/
            route.ts          # PDF generation endpoint (GET)
  components/
    invoices/
      invoice-form.tsx        # Invoice create/edit form
      invoice-list.tsx        # Invoice list table
      invoice-detail.tsx      # Invoice detail view
      invoice-filters.tsx     # Filter controls
      invoice-pdf.tsx         # @react-pdf/renderer Document component
  hooks/
    use-realtime-invoices.ts  # Realtime hook for invoices
  lib/
    invoice-status.ts         # Invoice status logic (mirroring load-status.ts)
  schemas/
    invoice.ts                # Zod validation schema
  types/
    database.ts               # Add Invoice types
supabase/
  migrations/
    00016_invoices.sql         # Table, RLS, sequence, trigger, pg_cron
```

### Pattern 1: Invoice Number Auto-Generation Trigger
**What:** PL/pgSQL trigger on invoices INSERT that generates INV-YYYYMM-SEQUENCE format
**When to use:** Every invoice insert
**Example:**
```sql
-- Modeled on existing 00011_load_number_trigger.sql
create table invoice_number_sequences (
  org_id uuid not null references organizations(id) on delete cascade,
  year_month text not null,  -- 'YYYYMM' format
  last_number integer not null default 0,
  primary key (org_id, year_month)
);

create or replace function public.generate_invoice_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _year_month text;
  _next_number integer;
begin
  _year_month := to_char(now(), 'YYYYMM');

  insert into public.invoice_number_sequences (org_id, year_month, last_number)
  values (new.org_id, _year_month, 1)
  on conflict (org_id, year_month)
  do update set last_number = public.invoice_number_sequences.last_number + 1
  returning last_number into _next_number;

  if new.invoice_number is null or new.invoice_number = '' then
    new.invoice_number := 'INV-' || _year_month || '-' || lpad(_next_number::text, 4, '0');
  end if;

  return new;
end;
$$;

create trigger trg_generate_invoice_number
  before insert on public.invoices
  for each row execute function public.generate_invoice_number();
```

### Pattern 2: pg_cron Overdue Scanner (SQL-Only)
**What:** Daily SQL job that marks overdue invoices
**When to use:** Migration file, runs automatically
**Example:**
```sql
-- Enable pg_cron extension (Supabase has it available)
create extension if not exists pg_cron;

-- Schedule daily at 8 AM UTC
select cron.schedule(
  'overdue-invoice-scanner',
  '0 8 * * *',
  $$
    UPDATE public.invoices
    SET status = 'overdue', updated_at = now()
    WHERE status = 'sent'
      AND due_date < CURRENT_DATE;
  $$
);
```

### Pattern 3: PDF Generation via Route Handler
**What:** Next.js App Router route.ts that renders PDF and returns binary or stores in Supabase Storage
**When to use:** GET /api/invoices/[id]/pdf
**Example:**
```typescript
// src/app/api/invoices/[id]/pdf/route.ts
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { InvoicePDF } from '@/components/invoices/invoice-pdf'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, loads(*)')
    .eq('id', id)
    .single()

  if (!invoice) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const buffer = await renderToBuffer(<InvoicePDF invoice={invoice} />)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`,
    },
  })
}
```

### Pattern 4: Invoice Creation from Delivered Load
**What:** Server action that auto-populates invoice from load data
**When to use:** "Create Invoice" button on load detail page
**Example:**
```typescript
// Server action pattern following status-actions.ts
export async function createInvoiceFromLoad(loadId: string): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: load } = await supabase
    .from('loads')
    .select('*')
    .eq('id', loadId)
    .eq('status', 'delivered')
    .single()

  if (!load) return { error: 'Load not found or not in delivered status' }

  const defaultDueDate = new Date()
  defaultDueDate.setDate(defaultDueDate.getDate() + 30)

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      org_id: load.org_id,
      load_id: load.id,
      bill_to_company: load.broker_name || '',
      bill_to_email: load.broker_email || '',
      amount: load.rate_amount || 0,
      fuel_surcharge: load.fuel_surcharge || 0,
      accessorials: load.accessorial_charges || 0,
      total: load.total_charges || 0,
      status: 'draft',
      issued_date: new Date().toISOString().split('T')[0],
      due_date: defaultDueDate.toISOString().split('T')[0],
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Update load status to 'invoiced'
  await supabase.from('loads').update({ status: 'invoiced' }).eq('id', loadId)

  revalidatePath('/loads')
  revalidatePath('/invoices')
  return { id: invoice.id }
}
```

### Pattern 5: Dashboard Stat Queries
**What:** Efficient aggregation queries for dashboard cards
**When to use:** Command and Owner-Operator dashboard pages
**Example:**
```typescript
// All queries run in parallel in the server component
const [activeLoads, bookedToday, driversOnDuty, revenueMtd] = await Promise.all([
  supabase.from('loads').select('id', { count: 'exact', head: true })
    .eq('status', 'in_transit'),
  supabase.from('loads').select('id', { count: 'exact', head: true })
    .gte('created_at', startOfToday),
  supabase.from('drivers').select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('current_vehicle_id', 'is', null),
  supabase.from('loads').select('total_charges')
    .in('status', ['delivered', 'invoiced', 'paid'])
    .gte('delivery_date', startOfMonth),
])

// Revenue MTD: sum client-side from the query results
const totalRevenue = (revenueMtd.data ?? [])
  .reduce((sum, load) => sum + (load.total_charges ?? 0), 0)
```

### Pattern 6: Owner-Operator Scoping
**What:** Filter all dashboard queries by the current user's driver record
**When to use:** Owner-Operator mode dashboard
**Example:**
```typescript
// Get driver record linked to current user
const { data: driver } = await supabase
  .from('drivers')
  .select('id')
  .eq('user_id', user.id)
  .single()

// Then scope all queries:
const activeLoads = await supabase.from('loads')
  .select('id', { count: 'exact', head: true })
  .eq('driver_id', driver.id)
  .eq('status', 'in_transit')
```

### Anti-Patterns to Avoid
- **Server actions for PDF binary responses:** Server actions return serializable data only. Use route.ts handlers for binary PDF responses.
- **Client-side PDF rendering with SSR:** Do NOT use `<PDFViewer>` or `<PDFDownloadLink>` in server components. These are browser-only. Use `renderToBuffer` in route handlers instead.
- **Precomputed dashboard stats:** The CONTEXT.md explicitly states "live queries against existing tables (not precomputed)". Do not create materialized views or snapshot tables -- that is Phase 6.
- **Edge Function for overdue scanner:** A simple SQL UPDATE is all that is needed. pg_cron can execute SQL directly with zero network latency. No edge function deployment required.
- **Separate Realtime channels per entity:** Follow existing pattern of one channel per table per org (org:{org_id}:invoices), not per-invoice channels.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generation | Custom canvas/HTML-to-PDF | @react-pdf/renderer | JSX components, proper typography, consistent rendering |
| Invoice number sequences | Application-level counters | Database trigger with ON CONFLICT | Race-condition-safe atomic increment |
| Scheduled tasks | setInterval / external cron | pg_cron extension | Runs inside Postgres, zero latency, survives restarts |
| Currency formatting | Manual string formatting | Intl.NumberFormat | Already used in load-detail.tsx (formatCurrency), handles locale |
| Date arithmetic | Manual date math | date-fns | Already in project, handles edge cases (month boundaries, DST) |
| Status color mapping | Inline conditionals | StatusBadge with 'invoice' variant | Consistent with existing driver/vehicle/load/dispatch variants |

**Key insight:** Every pattern needed for invoicing already exists in the codebase from Phases 1-3. The invoice module is structurally identical to the load module (CRUD, status lifecycle, list with filters, detail page, Realtime). Reuse patterns, do not invent new ones.

## Common Pitfalls

### Pitfall 1: @react-pdf/renderer Bundling in Next.js
**What goes wrong:** `PDFDocument is not a constructor` or `ba.Component is not a constructor` errors when using renderToBuffer in route handlers.
**Why it happens:** Next.js App Router uses a "react-server" bundle condition that provides a limited React bundle missing internal APIs that react-pdf depends on.
**How to avoid:** Add `serverExternalPackages: ['@react-pdf/renderer']` to next.config.ts. This project uses React 19.1.0 which resolves the core compatibility issue, but the config is still needed.
**Warning signs:** Any error mentioning "constructor" or "SECRET_INTERNALS" in the PDF route handler.

### Pitfall 2: Invoice-to-Load Status Coupling
**What goes wrong:** Creating an invoice does not transition the load to 'invoiced' status, or marking invoice as paid does not transition load to 'paid'.
**Why it happens:** The invoice and load status lifecycles are coupled but implemented in separate tables.
**How to avoid:** When creating an invoice from a load, update load status to 'invoiced' in the same server action. When marking invoice as 'paid', update load status to 'paid'. Use the existing canTransition() check.
**Warning signs:** Loads stuck in 'delivered' status after invoice creation.

### Pitfall 3: Revenue MTD Double-Counting
**What goes wrong:** Revenue MTD counts loads that have both 'invoiced' and 'paid' status, or counts canceled loads.
**Why it happens:** Unclear which statuses represent "revenue" and which date field to use.
**How to avoid:** Revenue MTD = sum of total_charges for loads where status IN ('delivered', 'invoiced', 'paid') AND delivery_date >= first day of current month. Use delivery_date, not created_at.
**Warning signs:** Revenue numbers that seem too high or change when loads are invoiced.

### Pitfall 4: pg_cron Not Enabled
**What goes wrong:** Migration fails with "extension pg_cron is not available."
**Why it happens:** pg_cron is available on Supabase hosted but must be explicitly enabled. Local dev with supabase CLI may not have it.
**How to avoid:** Use `create extension if not exists pg_cron;` at the top of the migration. For local dev, the cron job can be tested manually by running the SQL UPDATE directly.
**Warning signs:** Migration errors mentioning pg_cron during local development.

### Pitfall 5: Owner-Operator Without Driver Record
**What goes wrong:** Owner-Operator dashboard shows empty data or errors.
**Why it happens:** The user is detected as Owner-Operator by org member count but has no linked driver record.
**How to avoid:** When querying for the driver record, handle the null case gracefully. Show "Link your driver profile" prompt if no driver record is found for the user.
**Warning signs:** Owner-Operator users seeing blank dashboards.

### Pitfall 6: Supabase Storage PDF Upload Permissions
**What goes wrong:** PDF upload to storage fails with RLS error.
**Why it happens:** The existing storage bucket is 'load-documents' with RLS scoped to that bucket. Invoice PDFs need their own bucket or a different path structure.
**How to avoid:** Create a new 'invoice-documents' storage bucket in the migration with the same RLS pattern (org_id folder scoping), or reuse load-documents with an invoices/ prefix path.
**Warning signs:** 403 errors when storing generated PDFs.

## Code Examples

### Invoice Zod Schema
```typescript
// src/schemas/invoice.ts
import { z } from 'zod'

export const invoiceSchema = z.object({
  bill_to_company: z.string().min(1, 'Bill-to company is required'),
  bill_to_email: z.string().email('Valid email required').optional().or(z.literal('')),
  bill_to_address: z.string().optional().default(''),
  amount: z.coerce.number().min(0, 'Amount must be non-negative'),
  fuel_surcharge: z.coerce.number().min(0).default(0),
  accessorials: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0),
  issued_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  notes: z.string().optional().default(''),
  payment_method: z.string().optional().default(''),
})

export type InvoiceInput = z.input<typeof invoiceSchema>
```

### Invoice Status Module
```typescript
// src/lib/invoice-status.ts (mirrors load-status.ts)
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void'

export const INVOICE_STATUSES: InvoiceStatus[] = [
  'draft', 'sent', 'paid', 'overdue', 'void'
]

export const VALID_INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['sent', 'void'],
  sent: ['paid', 'void'],   // 'overdue' set by pg_cron, not user action
  overdue: ['paid', 'void'],
  paid: [],                  // terminal state
  void: [],                  // terminal state
}

export function canTransitionInvoice(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return VALID_INVOICE_TRANSITIONS[from]?.includes(to) ?? false
}
```

### StatusBadge Invoice Variant Extension
```typescript
// Add to colorMap in status-badge.tsx
invoice: {
  draft: { dot: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-700' },
  sent: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  paid: { dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
  overdue: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  void: { dot: 'bg-gray-400', bg: 'bg-gray-100', text: 'text-gray-500' },
},
```

### Realtime Invoice Hook
```typescript
// src/hooks/use-realtime-invoices.ts (mirrors use-realtime-loads.ts)
'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeInvoices(orgId: string | null) {
  const router = useRouter()
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    if (!orgId) return
    const supabase = supabaseRef.current
    const channel: RealtimeChannel = supabase
      .channel(`org:${orgId}:invoices`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'invoices',
        filter: `org_id=eq.${orgId}`,
      }, () => { router.refresh() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId, router])
}
```

### Next.js Config for react-pdf
```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
};

export default nextConfig;
```

### Activity Feed Query Pattern
```typescript
// Fetch recent activity from multiple tables in parallel
const [statusChanges, recentDispatches, recentInvoices] = await Promise.all([
  supabase.from('load_status_history')
    .select('id, load_id, old_status, new_status, created_at, loads!inner(load_number)')
    .order('created_at', { ascending: false })
    .limit(10),
  supabase.from('dispatches')
    .select('id, load_id, driver_id, status, created_at, loads!inner(load_number), drivers!inner(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(5),
  supabase.from('invoices')
    .select('id, invoice_number, total, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5),
])

// Merge and sort by created_at for unified feed
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| serverComponentsExternalPackages (experimental) | serverExternalPackages (stable) | Next.js 15 | Config key moved out of experimental |
| react-pdf v3.x | react-pdf v4.x | 2024 | React 19 support added in v4.1.0 |
| Edge Function for cron jobs | pg_cron SQL-only jobs | Supabase Cron module (2024) | Zero latency, no deployment needed |
| Separate Pages Router API for PDF | App Router route.ts handlers | Next.js 14.1.1+ | Unified routing, no pages/ needed |

**Deprecated/outdated:**
- `experimental.serverComponentsExternalPackages` -- use `serverExternalPackages` (top-level) in Next.js 15
- `PDFViewer` / `PDFDownloadLink` for server-side use -- these are browser-only components
- Edge Functions for simple SQL updates -- pg_cron can execute SQL directly

## Open Questions

1. **PDF storage bucket naming**
   - What we know: Existing bucket is 'load-documents' with org_id folder scoping
   - What's unclear: Whether to create a separate 'invoice-documents' bucket or use load-documents with invoices/ prefix
   - Recommendation: Create separate 'invoice-documents' bucket for clean separation and independent RLS policies

2. **Bill-to address structure**
   - What we know: PRD-01 schema has single `bill_to_address` text field
   - What's unclear: Whether this should be structured (line1, city, state, zip) or freeform text
   - Recommendation: Use freeform text as per PRD-01 schema. Keep it simple; structured addresses can be added later if needed.

3. **Dashboard Realtime refresh strategy**
   - What we know: Dashboard subscribes to loads, dispatches, and invoices Realtime channels
   - What's unclear: Whether to subscribe to three separate channels or one combined channel
   - Recommendation: Subscribe to all three tables in one useEffect with three `.on()` calls on a single channel named `org:{org_id}:dashboard`. This avoids three separate WebSocket subscriptions.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 |
| Config file | vitest.config.ts |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INV-01 | Create invoice from delivered load auto-populates data | unit | `npx vitest run tests/invoices/create-invoice.test.ts -t "auto-populate" --reporter=verbose` | Wave 0 |
| INV-02 | Invoice number auto-generates INV-YYYYMM-SEQ | unit | `npx vitest run tests/invoices/invoice-number.test.ts --reporter=verbose` | Wave 0 |
| INV-03 | Invoice edit validates with Zod | unit | `npx vitest run tests/invoices/invoice-schema.test.ts --reporter=verbose` | Wave 0 |
| INV-04 | Invoice status transitions (sent, paid, void) | unit | `npx vitest run tests/invoices/invoice-status.test.ts --reporter=verbose` | Wave 0 |
| INV-05 | Overdue detection SQL correctness | manual-only | SQL migration tested via Supabase local; no automated test for pg_cron | N/A |
| INV-06 | PDF generation renders without error | unit | `npx vitest run tests/invoices/invoice-pdf.test.ts --reporter=verbose` | Wave 0 |
| INV-07 | Invoice list filters by status/date/customer | unit | `npx vitest run tests/invoices/invoice-filters.test.ts --reporter=verbose` | Wave 0 |
| DASH-01 | Dashboard stat queries return correct counts | unit | `npx vitest run tests/dashboard/stat-cards.test.ts --reporter=verbose` | Wave 0 |
| DASH-02 | Activity feed merges and sorts events | unit | `npx vitest run tests/dashboard/activity-feed.test.ts --reporter=verbose` | Wave 0 |
| DASH-03 | Quick action links render correctly | unit | `npx vitest run tests/dashboard/quick-actions.test.tsx --reporter=verbose` | Wave 0 |
| DASH-04 | Driver dashboard shows active load | unit | `npx vitest run tests/dashboard/driver-dashboard.test.tsx --reporter=verbose` | Wave 0 |
| DASH-05 | Owner-Operator queries scoped to own loads | unit | `npx vitest run tests/dashboard/owner-operator.test.ts --reporter=verbose` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --reporter=verbose`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/invoices/invoice-schema.test.ts` -- Zod schema validation for INV-03
- [ ] `tests/invoices/invoice-status.test.ts` -- Status transition logic for INV-04
- [ ] `tests/invoices/create-invoice.test.ts` -- Auto-population logic for INV-01
- [ ] `tests/invoices/invoice-number.test.ts` -- Number format validation for INV-02
- [ ] `tests/invoices/invoice-pdf.test.ts` -- PDF component renders for INV-06
- [ ] `tests/invoices/invoice-filters.test.ts` -- Filter logic for INV-07
- [ ] `tests/dashboard/stat-cards.test.ts` -- Stat query logic for DASH-01
- [ ] `tests/dashboard/activity-feed.test.ts` -- Feed merge logic for DASH-02
- [ ] `tests/dashboard/quick-actions.test.tsx` -- Render test for DASH-03
- [ ] `tests/dashboard/driver-dashboard.test.tsx` -- Driver dashboard for DASH-04
- [ ] `tests/dashboard/owner-operator.test.ts` -- Scoping logic for DASH-05

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/app/(app)/loads/status-actions.ts`, `src/lib/load-status.ts`, `src/components/ui/status-badge.tsx`, `src/hooks/use-realtime-loads.ts` -- established patterns
- Project codebase: `supabase/migrations/00011_load_number_trigger.sql` -- trigger pattern for invoice numbers
- Project codebase: `supabase/migrations/00013_storage_bucket.sql` -- storage bucket RLS pattern
- [react-pdf.org/compatibility](https://react-pdf.org/compatibility) -- Official compatibility docs confirming Next.js 14.1.1+ support
- [Supabase Cron Quickstart](https://supabase.com/docs/guides/cron/quickstart) -- pg_cron SQL job scheduling
- [Supabase pg_cron Docs](https://supabase.com/docs/guides/database/extensions/pg_cron) -- Extension documentation

### Secondary (MEDIUM confidence)
- [GitHub Issue #3074](https://github.com/diegomura/react-pdf/issues/3074) -- renderToBuffer fix confirmed with React 19 upgrade
- [GitHub Issue #2460](https://github.com/diegomura/react-pdf/issues/2460) -- Workarounds for App Router, Pages Router API alternative
- [@react-pdf/renderer npm](https://www.npmjs.com/package/@react-pdf/renderer) -- Version 4.3.2 current

### Tertiary (LOW confidence)
- None -- all claims verified with primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries either already in project or well-documented with verified compatibility
- Architecture: HIGH -- all patterns directly modeled on existing Phase 1-3 code in this project
- Pitfalls: HIGH -- react-pdf/Next.js issues verified across multiple GitHub issues and official docs; pg_cron verified via Supabase official docs

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable domain, no fast-moving dependencies)
