# Phase 2: Loads, Drivers & Vehicles - Research

**Researched:** 2026-03-25
**Domain:** CRUD operations, multi-step forms, Supabase Realtime/Storage, Kanban UI, database triggers
**Confidence:** HIGH

## Summary

Phase 2 builds the operational core of Manifest: driver roster management, basic vehicle registry, and the complete load lifecycle from booking through delivery. This phase involves 26 requirements (DRVR-01 through DRVR-07, VEHI-01 through VEHI-02, LOAD-01 through LOAD-17) spanning database migrations, server actions, multi-step forms, file uploads, realtime subscriptions, and both Command mode and Driver PWA interfaces.

The existing codebase from Phase 1 provides strong patterns to follow: Zod schema validation, react-hook-form with zodResolver, server actions with Supabase server client, RLS via `auth.org_id()`, and typed Database interface. Phase 2 extends all of these. The primary technical challenges are: (1) the 30+ field load creation form requiring a multi-step wizard, (2) Supabase Storage setup with org-scoped RLS for document uploads, (3) Supabase Realtime subscriptions for live load status updates, and (4) a database trigger for auto-generating load numbers in ORG-PREFIX-SEQUENCE format.

**Primary recommendation:** Build database layer first (migrations for drivers, vehicles, loads, load_status_history + load number trigger), then CRUD for drivers/vehicles, then loads with multi-step form, then realtime + document upload, then Driver PWA views and kanban board last.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Drivers table per PRD-01 schema: first_name, last_name, email, phone, license info, hire_date, status, current_vehicle_id, home_terminal, emergency contact
- Driver status: 'active', 'inactive', 'terminated'
- License class options: 'A', 'B', 'C', 'standard'
- Driver list page at /drivers with search and filter by status
- Driver detail page shows contact info, license info, assigned vehicle, load history
- Add/edit driver form with Zod validation (reuse pattern from Phase 1 auth forms)
- Link driver to user account generates invitation (reuse Phase 1 invitation flow)
- Driver PWA /settings shows own profile (read-only except phone and emergency contact)
- RLS policy: org_id isolation using established auth.org_id() helper
- Vehicles table: id, org_id, unit_number, vin, year, make, model, vehicle_type, status, created_at, updated_at
- Vehicle types: 'dry_van', 'reefer', 'flatbed', 'sprinter', 'box_truck', 'other'
- Vehicle status: 'active', 'inactive'
- Basic vehicle CRUD -- full fleet management deferred to Phase 8
- Loads table per PRD-01 schema (comprehensive: pickup, delivery, freight, rate, broker, documents, assignment)
- Load number auto-generation via database trigger: ORG-PREFIX-SEQUENCE format
- 10 load statuses: 'booked', 'dispatched', 'in_transit', 'at_pickup', 'loaded', 'at_delivery', 'delivered', 'invoiced', 'paid', 'canceled'
- Load status history table logs every transition with timestamp, user, location, notes
- Status changes broadcast via Supabase Realtime on channel org:{org_id}:loads
- Create load form is multi-step: pickup -> delivery -> freight -> rate -> assignment
- Load detail page shows full info, status timeline visualization, documents, notes, rate breakdown
- Load list with filters: status, driver, date range, broker
- Load board view: kanban layout grouped by status columns
- Bulk actions: export CSV (dispatch multiple deferred to Phase 3)
- Supabase Storage for BOL, rate confirmation, POD files
- Storage bucket scoped by org_id with RLS
- Desktop: standard file upload input
- Driver PWA: camera capture for BOL/POD upload (use HTML input with capture attribute)
- Document URLs stored on load record (bol_url, rate_confirmation_url, pod_url)
- Driver PWA: current active load shown prominently, status update buttons, upload BOL/POD, load history past 30 days
- Owner-Operator mode: same as Command mode but scoped to own loads only
- Supabase Realtime subscription on loads table filtered by org_id
- Zod schemas for all form validation
- Server actions for all mutations
- Supabase server client for server components/actions
- Supabase browser client for client-side realtime subscriptions
- Tailwind v4 with design tokens from globals.css
- JetBrains Mono for VINs, license plates
- #EC008C primary, 8px grid, Inter 15px body

### Claude's Discretion
- Exact multi-step form implementation (wizard vs accordion vs tabs)
- Status timeline visualization component design
- Kanban board implementation approach
- Table vs card layout for load/driver lists
- Exact Realtime subscription hook patterns
- Camera capture UX flow on mobile

### Deferred Ideas (OUT OF SCOPE)
- Drag-and-drop load assignment on kanban board -- Phase 3 (Dispatch)
- Smart routing / driver suggestions -- Phase 5
- Map view for loads -- Phase 6 (Enhanced Dispatch)
- Full fleet management (maintenance, fuel, cost) -- Phase 8
- Bulk dispatch of multiple loads -- Phase 3
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DRVR-01 | Admin/dispatcher can add a driver with name, contact info, license details, and hire date | Zod schema + react-hook-form pattern from Phase 1; server action with Supabase insert |
| DRVR-02 | Admin/dispatcher can edit driver information | Same form pattern with prefilled data; server action with Supabase update |
| DRVR-03 | Admin/dispatcher can deactivate/terminate a driver | Status update server action; RLS policy allows org members to update |
| DRVR-04 | Admin/dispatcher can search and filter driver list by status | Server component with Supabase query + URL search params for filters |
| DRVR-05 | Admin can link a driver record to a user account (generates invitation) | Reuse Phase 1 invitation flow; update driver.user_id on link |
| DRVR-06 | Driver can view own profile in Driver PWA (read-only except phone and emergency contact) | RLS policy for driver self-access; partial update server action |
| DRVR-07 | Driver detail page shows contact info, license info, assigned vehicle, load history | Server component with joined query (driver + vehicle + loads) |
| VEHI-01 | Basic vehicles table exists for load and driver assignment references | Migration with RLS; simple CRUD server actions |
| VEHI-02 | Vehicle record includes unit number, VIN, year, make, model, type, status | Zod schema for vehicle validation; Database types extension |
| LOAD-01 | User can create a load with pickup details | Multi-step form Step 1; Zod schema for pickup fields |
| LOAD-02 | User can create a load with delivery details | Multi-step form Step 2; Zod schema for delivery fields |
| LOAD-03 | User can set freight details | Multi-step form Step 3; Zod schema for freight fields |
| LOAD-04 | User can set rate details | Multi-step form Step 4; Zod schema for rate fields with computed total |
| LOAD-05 | User can set broker/source info | Multi-step form Step 5; Zod schema for broker fields |
| LOAD-06 | Load number auto-generates if not provided | Database trigger function using sequences per org |
| LOAD-07 | Load status lifecycle works end-to-end | Status enum type, server action for transitions, validation of allowed transitions |
| LOAD-08 | Every status change writes to load_status_history | Database trigger on loads.status UPDATE; insert into load_status_history |
| LOAD-09 | Load status changes broadcast via Supabase Realtime | Supabase Realtime postgres_changes subscription with org_id filter |
| LOAD-10 | User can upload documents (BOL, rate confirmation, POD) to a load | Supabase Storage bucket with RLS; upload via supabase.storage.from().upload() |
| LOAD-11 | Driver can upload BOL/POD via mobile camera in Driver PWA | HTML input with capture="environment" attribute; same Storage upload path |
| LOAD-12 | User can filter loads by status, driver, date range, broker | Server component with Supabase query; URL search params for filter state |
| LOAD-13 | Load board view shows loads in kanban layout by status | Client component grouping loads by status into columns; CSS grid/flex |
| LOAD-14 | Load detail page shows full info, status timeline, documents, notes, rate breakdown | Server component with load + status_history + joined driver/vehicle data |
| LOAD-15 | Driver PWA shows current active load prominently with status update buttons | Server component filtered by driver_id + active statuses; big card UI |
| LOAD-16 | Driver PWA shows load history (past 30 days) | Supabase query with date filter; simple list view |
| LOAD-17 | Bulk actions: export CSV | Client-side CSV generation via Blob + download; no library needed |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | ^7.72.x | Form state for 30+ field load form, driver form, vehicle form | Already used in Phase 1 signup; handles multi-step forms via shared form instance |
| @hookform/resolvers | ^5.x | Zod resolver bridge | Already used in Phase 1 |
| zod | ^4.3.x | Schema validation for all entities | Already used in Phase 1; single source of truth for types |
| date-fns | ^4.1.x | Date formatting for pickup/delivery dates, hire dates, timelines | Already installed |
| lucide-react | ^1.6.x | Icons for status indicators, actions, navigation | Already installed |

### New for Phase 2 (Install Required)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | -- | -- | Phase 2 requires no new npm packages |

**Key insight:** Phase 2 needs zero new npm dependencies. Everything is achievable with the existing stack plus native browser APIs (Blob for CSV, `<input capture>` for camera). Supabase Storage and Realtime are part of `@supabase/supabase-js` already installed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native Blob CSV | export-to-csv npm package | Adds dependency for trivial operation; Blob approach is ~15 lines |
| Native `<input capture>` | react-dropzone | Over-engineering for camera capture; `<input type="file" accept="image/*" capture="environment">` does the job |
| Custom kanban CSS | @dnd-kit | Kanban in Phase 2 is read-only (no drag-drop); CSS grid is sufficient. @dnd-kit reserved for Phase 3 dispatch |

**Installation:**
```bash
# No new packages needed for Phase 2
# All dependencies already in package.json from Phase 1
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  schemas/
    driver.ts              # Zod schemas for driver CRUD
    vehicle.ts             # Zod schemas for vehicle CRUD
    load.ts                # Zod schemas for load (per-step + combined)
  types/
    database.ts            # Extend with Driver, Vehicle, Load, LoadStatusHistory types
  components/
    drivers/
      driver-form.tsx      # Add/edit driver form (react-hook-form)
      driver-list.tsx      # Filterable driver table
      driver-detail.tsx    # Driver detail view
    vehicles/
      vehicle-form.tsx     # Add/edit vehicle form
      vehicle-list.tsx     # Vehicle list/table
    loads/
      load-form/
        load-wizard.tsx    # Multi-step wizard container
        step-pickup.tsx    # Step 1: pickup details
        step-delivery.tsx  # Step 2: delivery details
        step-freight.tsx   # Step 3: freight details
        step-rate.tsx      # Step 4: rate details
        step-assignment.tsx # Step 5: driver/vehicle assignment
      load-list.tsx        # Filterable load table/list
      load-detail.tsx      # Full load detail view
      load-kanban.tsx      # Kanban board by status
      load-timeline.tsx    # Status history timeline visualization
      load-documents.tsx   # Document upload/display section
      load-filters.tsx     # Filter bar component
    ui/
      status-badge.tsx     # Reusable status badge with color mapping
      file-upload.tsx      # File upload component (desktop + camera)
      csv-export.tsx       # CSV export button
  hooks/
    use-realtime-loads.ts  # Supabase Realtime subscription hook
  lib/
    load-status.ts         # Status transition logic, status metadata
    csv-export.ts          # CSV generation utility

app/
  (app)/
    drivers/
      page.tsx             # Driver list page
      [id]/page.tsx        # Driver detail page
      new/page.tsx         # Add driver page
      [id]/edit/page.tsx   # Edit driver page
    fleet/
      page.tsx             # Vehicle list page
      new/page.tsx         # Add vehicle page
      [id]/edit/page.tsx   # Edit vehicle page
    loads/
      page.tsx             # Load list page (with kanban toggle)
      [id]/page.tsx        # Load detail page
      new/page.tsx         # Create load (multi-step wizard)
      [id]/edit/page.tsx   # Edit load page
      actions.ts           # Load server actions
    drivers/actions.ts     # Driver server actions
    fleet/actions.ts       # Vehicle server actions
  /driver/                 # (note: /driver prefix, not route group per Phase 1 decision)
    loads/
      page.tsx             # Driver active load + history
      [id]/page.tsx        # Load detail (driver view)
      actions.ts           # Driver status update actions
    settings/
      page.tsx             # Driver profile view/edit

supabase/
  migrations/
    00007_vehicles.sql
    00008_drivers.sql
    00009_loads.sql
    00010_load_status_history.sql
    00011_load_number_trigger.sql
    00012_load_status_trigger.sql
    00013_storage_bucket.sql
```

### Pattern 1: Multi-Step Wizard Form with react-hook-form

**What:** Single `useForm()` instance shared across wizard steps via React context. Each step validates only its fields using `trigger()`. Final step submits the complete form.

**When to use:** Load creation form (30+ fields across 5 steps).

**Recommendation (Claude's Discretion):** Use a wizard with numbered steps and a progress bar at the top. This is the best fit for the load creation flow because: (a) each step has a clear domain (pickup, delivery, freight, rate, assignment), (b) the user can see progress, (c) back/forward navigation preserves all entered data, (d) validation happens per-step so errors are caught early.

```typescript
// src/schemas/load.ts
import { z } from 'zod'

// Per-step schemas for individual step validation
export const pickupSchema = z.object({
  pickup_company: z.string().min(1, 'Pickup company is required'),
  pickup_address: z.string().min(1, 'Address is required'),
  pickup_city: z.string().min(1, 'City is required'),
  pickup_state: z.string().length(2, 'Use 2-letter state code'),
  pickup_zip: z.string().min(5, 'ZIP is required'),
  pickup_date: z.string().min(1, 'Pickup date is required'),
  pickup_time_start: z.string().optional(),
  pickup_time_end: z.string().optional(),
  pickup_reference: z.string().optional(),
})

export const deliverySchema = z.object({
  delivery_company: z.string().min(1, 'Delivery company is required'),
  delivery_address: z.string().min(1, 'Address is required'),
  delivery_city: z.string().min(1, 'City is required'),
  delivery_state: z.string().length(2, 'Use 2-letter state code'),
  delivery_zip: z.string().min(5, 'ZIP is required'),
  delivery_date: z.string().min(1, 'Delivery date is required'),
  delivery_time_start: z.string().optional(),
  delivery_time_end: z.string().optional(),
  delivery_reference: z.string().optional(),
})

export const freightSchema = z.object({
  commodity: z.string().optional(),
  weight: z.coerce.number().positive().optional(),
  weight_unit: z.enum(['lbs', 'kg']).default('lbs'),
  pieces: z.coerce.number().int().positive().optional(),
  equipment_type: z.enum(['dry_van', 'reefer', 'flatbed', 'sprinter', 'box_truck', 'other']),
  temperature_min: z.coerce.number().optional(),
  temperature_max: z.coerce.number().optional(),
  hazmat: z.boolean().default(false),
})

export const rateSchema = z.object({
  rate: z.coerce.number().positive('Rate is required'),
  rate_type: z.enum(['flat', 'per_mile', 'hourly', 'per_stop']).default('flat'),
  estimated_miles: z.coerce.number().int().positive().optional(),
  fuel_surcharge: z.coerce.number().default(0),
  accessorial_charges: z.coerce.number().default(0),
})

export const assignmentSchema = z.object({
  driver_id: z.string().uuid().optional(),
  vehicle_id: z.string().uuid().optional(),
})

export const brokerSchema = z.object({
  broker_name: z.string().optional(),
  broker_mc: z.string().optional(),
  broker_contact: z.string().optional(),
  broker_phone: z.string().optional(),
  broker_email: z.union([z.string().email(), z.literal('')]).optional(),
})

// Combined schema for full load validation on submit
export const loadSchema = pickupSchema
  .merge(deliverySchema)
  .merge(freightSchema)
  .merge(rateSchema)
  .merge(assignmentSchema)
  .merge(brokerSchema)
  .extend({
    load_number: z.string().optional(), // auto-generated if empty
    notes: z.string().optional(),
  })

export type LoadInput = z.input<typeof loadSchema>

// Step field name arrays for trigger() validation
export const STEP_FIELDS = {
  pickup: Object.keys(pickupSchema.shape) as (keyof z.infer<typeof pickupSchema>)[],
  delivery: Object.keys(deliverySchema.shape) as (keyof z.infer<typeof deliverySchema>)[],
  freight: Object.keys(freightSchema.shape) as (keyof z.infer<typeof freightSchema>)[],
  rate: Object.keys(rateSchema.shape) as (keyof z.infer<typeof rateSchema>)[],
  assignment: Object.keys(assignmentSchema.shape) as (keyof z.infer<typeof assignmentSchema>)[],
} as const
```

```typescript
// src/components/loads/load-form/load-wizard.tsx (simplified pattern)
'use client'
import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loadSchema, type LoadInput, STEP_FIELDS } from '@/schemas/load'

const STEPS = ['Pickup', 'Delivery', 'Freight', 'Rate & Broker', 'Assignment'] as const

export function LoadWizard() {
  const [step, setStep] = useState(0)
  const methods = useForm<LoadInput>({
    resolver: zodResolver(loadSchema),
    defaultValues: { weight_unit: 'lbs', rate_type: 'flat', hazmat: false },
  })

  const stepKeys = ['pickup', 'delivery', 'freight', 'rate', 'assignment'] as const

  async function handleNext() {
    const fields = STEP_FIELDS[stepKeys[step]]
    const valid = await methods.trigger(fields as any)
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  async function onSubmit(data: LoadInput) {
    const formData = new FormData()
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined && val !== null) formData.append(key, String(val))
    })
    // Call server action
  }

  return (
    <FormProvider {...methods}>
      {/* Progress bar */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1 rounded ${i <= step ? 'bg-primary' : 'bg-gray-200'}`} />
            <span className="text-xs mt-1">{label}</span>
          </div>
        ))}
      </div>

      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {/* Render current step component */}
        {/* step === 0 && <StepPickup /> */}
        {/* etc. */}

        <div className="flex justify-between mt-6">
          {step > 0 && <button type="button" onClick={() => setStep(s => s - 1)}>Back</button>}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={handleNext}>Next</button>
          ) : (
            <button type="submit">Create Load</button>
          )}
        </div>
      </form>
    </FormProvider>
  )
}
```

### Pattern 2: Supabase Realtime Subscription Hook

**What:** Custom hook wrapping Supabase channel subscription for load status changes. Uses browser client (not server client). Cleans up on unmount.

**When to use:** Load list page, kanban board, load detail page -- anywhere that needs live updates.

**Recommendation (Claude's Discretion):** Use a custom `useRealtimeLoads` hook that calls `router.refresh()` on receiving a change event. This triggers a server component re-render which re-fetches data through RLS. This is simpler than maintaining client-side state and ensures RLS is always enforced.

```typescript
// src/hooks/use-realtime-loads.ts
'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function useRealtimeLoads(orgId: string) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`org:${orgId}:loads`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loads',
          filter: `org_id=eq.${orgId}`,
        },
        () => {
          // Refresh server components to get fresh data through RLS
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orgId, router, supabase])
}
```

### Pattern 3: Supabase Storage Upload with Org-Scoped RLS

**What:** Private storage bucket with RLS policies scoped by org_id in the file path. Upload from client, store URL on load record.

**When to use:** BOL, rate confirmation, POD document uploads.

```sql
-- Migration: 00013_storage_bucket.sql

-- Create private bucket for load documents
insert into storage.buckets (id, name, public)
values ('load-documents', 'load-documents', false);

-- RLS: Allow uploads scoped by org_id folder
create policy "org_upload_documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'load-documents'
  and (storage.foldername(name))[1] = (select auth.org_id())::text
);

-- RLS: Allow reading documents in own org folder
create policy "org_read_documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'load-documents'
  and (storage.foldername(name))[1] = (select auth.org_id())::text
);

-- RLS: Allow deleting documents in own org folder
create policy "org_delete_documents"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'load-documents'
  and (storage.foldername(name))[1] = (select auth.org_id())::text
);
```

```typescript
// Upload pattern (client-side)
async function uploadDocument(
  file: File,
  orgId: string,
  loadId: string,
  docType: 'bol' | 'rate_confirmation' | 'pod'
) {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `${orgId}/${loadId}/${docType}.${ext}`

  const { data, error } = await supabase.storage
    .from('load-documents')
    .upload(path, file, { upsert: true })

  if (error) throw error

  // Get public URL (still requires auth due to RLS)
  const { data: { publicUrl } } = supabase.storage
    .from('load-documents')
    .getPublicUrl(path)

  return publicUrl
}
```

### Pattern 4: Load Number Auto-Generation Trigger

**What:** Database trigger that generates load numbers in ORG-PREFIX-SEQUENCE format when a load is inserted without a load_number.

**When to use:** Every load insert (LOAD-06).

```sql
-- Migration: 00011_load_number_trigger.sql

-- Sequence tracking table (per-org counters)
create table load_number_sequences (
  org_id uuid primary key references organizations(id),
  last_number integer not null default 0
);

alter table load_number_sequences enable row level security;
create policy "org_sequences" on load_number_sequences
  for all using (org_id = (select auth.org_id()));

-- Trigger function to auto-generate load numbers
create or replace function generate_load_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  org_prefix text;
  next_num integer;
begin
  -- Only generate if load_number not provided
  if NEW.load_number is not null and NEW.load_number != '' then
    return NEW;
  end if;

  -- Get org name prefix (first 3 chars, uppercase)
  select upper(left(name, 3)) into org_prefix
  from public.organizations where id = NEW.org_id;

  -- Increment and get next number (upsert for first use)
  insert into public.load_number_sequences (org_id, last_number)
  values (NEW.org_id, 1)
  on conflict (org_id)
  do update set last_number = public.load_number_sequences.last_number + 1
  returning last_number into next_num;

  -- Format: ORG-PREFIX-SEQUENCE (e.g., ACM-001234)
  NEW.load_number := org_prefix || '-' || lpad(next_num::text, 6, '0');

  return NEW;
end;
$$;

create trigger set_load_number
  before insert on public.loads
  for each row
  execute function generate_load_number();
```

### Pattern 5: Status History Trigger

**What:** Database trigger that logs every status change to `load_status_history` table automatically.

```sql
-- Migration: 00012_load_status_trigger.sql

create or replace function log_load_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only log if status actually changed
  if OLD.status is distinct from NEW.status then
    insert into public.load_status_history (load_id, old_status, new_status, changed_by)
    values (NEW.id, OLD.status, NEW.status, auth.uid());
  end if;
  return NEW;
end;
$$;

create trigger log_status_change
  after update of status on public.loads
  for each row
  execute function log_load_status_change();
```

### Pattern 6: Camera Capture for Mobile Document Upload

**What:** HTML input with `capture` attribute for mobile camera access. No library needed.

**Recommendation (Claude's Discretion):** Show a simple upload button that opens the camera on mobile and file picker on desktop. Use `accept="image/*,application/pdf"` for flexibility. On mobile, the `capture="environment"` attribute triggers the rear camera directly.

```tsx
// src/components/ui/file-upload.tsx
'use client'

interface FileUploadProps {
  onFileSelected: (file: File) => void
  accept?: string
  label: string
  isMobile?: boolean
}

export function FileUpload({ onFileSelected, accept, label, isMobile }: FileUploadProps) {
  return (
    <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
      <input
        type="file"
        accept={accept || 'image/*,application/pdf'}
        capture={isMobile ? 'environment' : undefined}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFileSelected(file)
        }}
        className="sr-only"
      />
      <span>{label}</span>
    </label>
  )
}
```

### Pattern 7: CSV Export (Client-Side)

**What:** Generate CSV from load data and trigger browser download. No library needed.

```typescript
// src/lib/csv-export.ts
export function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0])
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h]
        const str = val === null || val === undefined ? '' : String(val)
        // Escape commas and quotes
        return str.includes(',') || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
```

### Pattern 8: Kanban Board (Read-Only)

**What:** CSS grid layout grouping loads by status into columns. No drag-and-drop (Phase 3).

**Recommendation (Claude's Discretion):** Use a horizontally scrollable container with fixed-width columns. Each column header shows the status name and count. Cards show load number, pickup/delivery cities, driver name, and date. Use `overflow-x-auto` for mobile scrolling.

```tsx
// Simplified kanban structure
const STATUS_COLUMNS = [
  { key: 'booked', label: 'Booked', color: 'bg-gray-100' },
  { key: 'dispatched', label: 'Dispatched', color: 'bg-blue-50' },
  { key: 'in_transit', label: 'In Transit', color: 'bg-yellow-50' },
  { key: 'at_pickup', label: 'At Pickup', color: 'bg-orange-50' },
  { key: 'loaded', label: 'Loaded', color: 'bg-amber-50' },
  { key: 'at_delivery', label: 'At Delivery', color: 'bg-emerald-50' },
  { key: 'delivered', label: 'Delivered', color: 'bg-green-50' },
] as const

// Group loads by status, render columns with cards
// Use overflow-x-auto wrapper for horizontal scroll
```

### Pattern 9: Status Timeline Visualization

**Recommendation (Claude's Discretion):** Use a vertical timeline with dots connected by lines. Each entry shows: status badge, timestamp (formatted with date-fns), who changed it, and optional notes. The current status has a larger, filled dot. Past statuses have smaller filled dots. Future/skipped statuses show empty dots.

```tsx
// Vertical timeline pattern
// Each entry: dot -- line -- content block
// Active entry: larger dot with primary color
// Completed: filled dot with green
// Future: empty circle with gray border
```

### Anti-Patterns to Avoid
- **Client-side form state management without react-hook-form:** Do not use useState for 30+ form fields. react-hook-form with uncontrolled inputs avoids re-render storms.
- **Fetching data in client components for initial load:** Use server components to fetch data through RLS. Only use client components for interactivity (forms, realtime, kanban).
- **Storing file content in the database:** Store files in Supabase Storage, store URLs in load record columns. Never base64-encode files into text columns.
- **Multiple Realtime channels per page:** Use one channel per page with multiple `.on()` listeners. Supabase recommends minimizing channel count.
- **Manual load number generation in application code:** Use the database trigger. Application-level counters have race conditions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Load number uniqueness | Application-level counter with SELECT max() | Database trigger with INSERT ... ON CONFLICT for atomic increment | Race conditions under concurrent inserts; trigger is atomic |
| Status history logging | Application-level insert in every status-changing endpoint | Database trigger on loads.status UPDATE | Easy to miss an endpoint; trigger catches ALL changes |
| File storage | Local file system or database blob columns | Supabase Storage with RLS | CDN delivery, access control, no server disk management |
| CSV generation | Server-side CSV with streaming/temp files | Client-side Blob construction | No server load; works offline; instant for typical load counts (<10K rows) |
| Form validation | Manual validation in server actions | Zod schema shared between client (react-hook-form) and server (safeParse) | Single source of truth; type-safe; DRY |
| Real-time state sync | Polling with setInterval | Supabase Realtime postgres_changes | WebSocket-based; instant; built into Supabase client |

**Key insight:** The database should enforce business rules (load numbers, status history) via triggers. The application layer should enforce validation (Zod schemas). The infrastructure should handle files (Supabase Storage) and real-time (Supabase Realtime). Do not duplicate these responsibilities in application code.

## Common Pitfalls

### Pitfall 1: Supabase Realtime with RLS
**What goes wrong:** Realtime subscriptions silently fail to deliver events when RLS policies are misconfigured. The subscription connects but no events arrive.
**Why it happens:** Supabase Realtime checks RLS policies against the subscribing user. If the policy uses a function that is not available in the Realtime context, events are silently dropped.
**How to avoid:** Enable Realtime on the loads table in Supabase Dashboard (Database > Replication). Use the `(select auth.org_id())` pattern in RLS policies (already established in Phase 1). Test with two browser tabs logged in as different orgs to confirm isolation.
**Warning signs:** Subscription connects (no error) but no events fire on data changes.

### Pitfall 2: Supabase Storage RLS with `auth.org_id()` in Path
**What goes wrong:** Upload succeeds but download fails, or vice versa, because the RLS policy path check does not match the upload path.
**Why it happens:** `storage.foldername(name)` returns an array. If the org_id is stored as UUID type but compared as text, the cast fails silently.
**How to avoid:** Always cast: `(storage.foldername(name))[1] = (select auth.org_id())::text`. Test both upload and download in the same RLS policy review.
**Warning signs:** 403 errors on storage operations despite being authenticated.

### Pitfall 3: Multi-Step Form Losing State on Navigation
**What goes wrong:** User navigates away and back, losing all entered form data.
**Why it happens:** Form state lives in component state which is destroyed on unmount.
**How to avoid:** Keep the wizard on a single page (not separate routes per step). Use `useForm` at the top level and render step components conditionally. If persistence across navigation is needed, save to sessionStorage.
**Warning signs:** Users complaining about lost data after accidentally clicking a nav link.

### Pitfall 4: Load Status Transition Validation
**What goes wrong:** A load jumps from 'booked' directly to 'delivered', bypassing the lifecycle.
**Why it happens:** No validation on which transitions are allowed.
**How to avoid:** Define a `VALID_TRANSITIONS` map and validate in the server action before updating. The database trigger should only LOG transitions, not validate them (triggers should not reject updates for UX reasons -- better to return an error from the server action).
**Warning signs:** Load status history showing impossible jumps.

### Pitfall 5: Database Types File Growing Unmanageable
**What goes wrong:** The `database.ts` file becomes hundreds of lines of manual types that drift from the actual schema.
**Why it happens:** Manually maintaining TypeScript types for database tables.
**How to avoid:** Continue the established pattern from Phase 1 but keep types organized. Consider running `supabase gen types typescript` if the manual types become too burdensome. For Phase 2, manual types are still manageable.
**Warning signs:** Type errors at runtime that TypeScript did not catch.

### Pitfall 6: Realtime Re-Subscription on Every Render
**What goes wrong:** Hundreds of channel subscriptions pile up, causing performance degradation and event duplication.
**Why it happens:** Creating the Supabase client inside the useEffect or not including proper cleanup.
**How to avoid:** Create the client outside the effect. Include proper cleanup with `supabase.removeChannel(channel)`. Use stable dependencies in the effect dependency array.
**Warning signs:** Console showing multiple subscription messages; events firing multiple times.

## Code Examples

### Server Action Pattern (Load Creation)
```typescript
// src/app/(app)/loads/actions.ts
'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadSchema } from '@/schemas/load'

export async function createLoad(formData: FormData) {
  const raw = Object.fromEntries(formData.entries())
  const parsed = loadSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: { form: parsed.error.issues.map(i => i.message) } }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { form: ['Not authenticated'] } }

  // Get org_id from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) return { error: { form: ['No organization'] } }

  const { data, error } = await supabase
    .from('loads')
    .insert({
      org_id: profile.org_id,
      created_by: user.id,
      ...parsed.data,
      // total_revenue computed
      total_revenue: (parsed.data.rate || 0) + (parsed.data.fuel_surcharge || 0) + (parsed.data.accessorial_charges || 0),
    })
    .select('id')
    .single()

  if (error) return { error: { form: [error.message] } }

  redirect(`/loads/${data.id}`)
}
```

### Driver Zod Schema Pattern
```typescript
// src/schemas/driver.ts
import { z } from 'zod'

export const driverSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  phone: z.string().min(1, 'Phone number is required'),
  license_number: z.string().optional(),
  license_state: z.string().max(2).optional(),
  license_class: z.enum(['A', 'B', 'C', 'standard']).optional(),
  license_expiration: z.string().optional(), // date string
  hire_date: z.string().optional(),
  status: z.enum(['active', 'inactive', 'terminated']).default('active'),
  current_vehicle_id: z.string().uuid().optional().nullable(),
  home_terminal: z.string().optional(),
  notes: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
})

export type DriverInput = z.input<typeof driverSchema>
```

### Status Transition Logic
```typescript
// src/lib/load-status.ts
export const LOAD_STATUSES = [
  'booked', 'dispatched', 'in_transit', 'at_pickup', 'loaded',
  'at_delivery', 'delivered', 'invoiced', 'paid', 'canceled',
] as const

export type LoadStatus = typeof LOAD_STATUSES[number]

// Which statuses can transition to which
export const VALID_TRANSITIONS: Record<LoadStatus, LoadStatus[]> = {
  booked: ['dispatched', 'canceled'],
  dispatched: ['in_transit', 'canceled'],
  in_transit: ['at_pickup', 'canceled'],
  at_pickup: ['loaded', 'canceled'],
  loaded: ['at_delivery', 'canceled'],
  at_delivery: ['delivered', 'canceled'],
  delivered: ['invoiced'],
  invoiced: ['paid'],
  paid: [],
  canceled: [],
}

export function canTransition(from: LoadStatus, to: LoadStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export const STATUS_COLORS: Record<LoadStatus, string> = {
  booked: 'bg-gray-100 text-gray-800',
  dispatched: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-yellow-100 text-yellow-800',
  at_pickup: 'bg-orange-100 text-orange-800',
  loaded: 'bg-amber-100 text-amber-800',
  at_delivery: 'bg-emerald-100 text-emerald-800',
  delivered: 'bg-green-100 text-green-800',
  invoiced: 'bg-purple-100 text-purple-800',
  paid: 'bg-green-200 text-green-900',
  canceled: 'bg-red-100 text-red-800',
}
```

### Database Types Extension
```typescript
// Additions to src/types/database.ts
export type DriverStatus = 'active' | 'inactive' | 'terminated'
export type LicenseClass = 'A' | 'B' | 'C' | 'standard'
export type VehicleType = 'dry_van' | 'reefer' | 'flatbed' | 'sprinter' | 'box_truck' | 'other'
export type VehicleStatus = 'active' | 'inactive'
export type LoadStatus = 'booked' | 'dispatched' | 'in_transit' | 'at_pickup' | 'loaded' | 'at_delivery' | 'delivered' | 'invoiced' | 'paid' | 'canceled'
export type RateType = 'flat' | 'per_mile' | 'hourly' | 'per_stop'
export type EquipmentType = VehicleType

export type Driver = {
  id: string
  org_id: string
  user_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string
  license_number: string | null
  license_state: string | null
  license_class: LicenseClass | null
  license_expiration: string | null
  hire_date: string | null
  status: DriverStatus
  current_vehicle_id: string | null
  home_terminal: string | null
  notes: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  created_at: string
  updated_at: string
}

export type Vehicle = {
  id: string
  org_id: string
  unit_number: string
  vin: string | null
  year: number | null
  make: string | null
  model: string | null
  vehicle_type: VehicleType
  status: VehicleStatus
  created_at: string
  updated_at: string
}

export type Load = {
  id: string
  org_id: string
  load_number: string
  status: LoadStatus
  // ... all fields per PRD-01 schema
  created_by: string | null
  created_at: string
  updated_at: string
}

export type LoadStatusHistory = {
  id: string
  load_id: string
  old_status: LoadStatus | null
  new_status: LoadStatus
  changed_by: string | null
  location_lat: number | null
  location_lng: number | null
  notes: string | null
  created_at: string
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Supabase auth-helpers-nextjs | @supabase/ssr | 2024 | Project already uses @supabase/ssr -- no migration needed |
| useState-based multi-step forms | react-hook-form FormProvider with trigger() | 2023+ | Per-step validation without losing state; already in project |
| Separate file upload services | Supabase Storage with RLS | Built-in | No extra vendor; org-scoped access via SQL policies |
| Polling for updates | Supabase Realtime postgres_changes | Built-in | WebSocket-based; filter by column value (org_id) |
| Application-level sequence generation | PostgreSQL trigger with ON CONFLICT upsert | Standard PG pattern | Atomic, no race conditions |

**Deprecated/outdated:**
- None relevant. All Phase 2 patterns use current, stable APIs.

## Open Questions

1. **Realtime publication configuration**
   - What we know: Supabase Realtime requires tables to be added to the `supabase_realtime` publication.
   - What's unclear: Whether this is handled via migration SQL or must be toggled in the Supabase Dashboard.
   - Recommendation: Add `alter publication supabase_realtime add table loads;` to the loads migration. This can be done in SQL and does not require Dashboard interaction.

2. **Storage bucket creation via migration**
   - What we know: Buckets can be created via SQL `insert into storage.buckets`.
   - What's unclear: Whether Supabase local dev (supabase CLI) handles this correctly in migrations.
   - Recommendation: Include bucket creation in a migration file. If it fails in local dev, create it via the Dashboard as a fallback and document the manual step.

3. **Driver PWA route structure**
   - What we know: Phase 1 used `/driver` prefix (not route group) to avoid Next.js parallel page resolution conflict.
   - What's unclear: Whether `/driver/loads` vs `/driver/loads/[id]` will need its own layout.
   - Recommendation: Follow the established `/driver` prefix pattern. Create a nested layout for `/driver/loads` that includes the load navigation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.x + @testing-library/react 16.x |
| Config file | vitest.config.ts (exists) |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DRVR-01 | Driver schema validates required fields | unit | `npx vitest run tests/drivers/schema.test.ts -t "valid driver"` | -- Wave 0 |
| DRVR-02 | Driver update schema validates partial fields | unit | `npx vitest run tests/drivers/schema.test.ts -t "update"` | -- Wave 0 |
| DRVR-03 | Driver status can be set to inactive/terminated | unit | `npx vitest run tests/drivers/schema.test.ts -t "status"` | -- Wave 0 |
| DRVR-04 | Driver list filters by status | unit | `npx vitest run tests/drivers/list.test.ts` | -- Wave 0 |
| DRVR-05 | Driver-user link generates invitation | integration | manual-only (requires Supabase) | -- |
| DRVR-06 | Driver can update own phone/emergency contact | unit | `npx vitest run tests/drivers/driver-self.test.ts` | -- Wave 0 |
| DRVR-07 | Driver detail shows joined data | unit | `npx vitest run tests/drivers/detail.test.ts` | -- Wave 0 |
| VEHI-01 | Vehicle schema validates required fields | unit | `npx vitest run tests/vehicles/schema.test.ts` | -- Wave 0 |
| VEHI-02 | Vehicle record includes all specified fields | unit | `npx vitest run tests/vehicles/schema.test.ts` | -- Wave 0 |
| LOAD-01 | Pickup schema validates required fields | unit | `npx vitest run tests/loads/schema.test.ts -t "pickup"` | -- Wave 0 |
| LOAD-02 | Delivery schema validates required fields | unit | `npx vitest run tests/loads/schema.test.ts -t "delivery"` | -- Wave 0 |
| LOAD-03 | Freight schema validates equipment types | unit | `npx vitest run tests/loads/schema.test.ts -t "freight"` | -- Wave 0 |
| LOAD-04 | Rate schema validates rate types and computes total | unit | `npx vitest run tests/loads/schema.test.ts -t "rate"` | -- Wave 0 |
| LOAD-05 | Broker schema validates email format | unit | `npx vitest run tests/loads/schema.test.ts -t "broker"` | -- Wave 0 |
| LOAD-06 | Load number auto-generates | integration | manual-only (requires DB trigger) | -- |
| LOAD-07 | Status transitions follow valid lifecycle | unit | `npx vitest run tests/loads/status.test.ts -t "transitions"` | -- Wave 0 |
| LOAD-08 | Status history logged on transition | integration | manual-only (requires DB trigger) | -- |
| LOAD-09 | Realtime broadcasts on status change | integration | manual-only (requires Supabase Realtime) | -- |
| LOAD-10 | Document upload accepts files | unit | `npx vitest run tests/loads/documents.test.ts` | -- Wave 0 |
| LOAD-11 | Camera capture input renders on mobile | unit | `npx vitest run tests/loads/documents.test.ts -t "camera"` | -- Wave 0 |
| LOAD-12 | Load filters produce correct query params | unit | `npx vitest run tests/loads/filters.test.ts` | -- Wave 0 |
| LOAD-13 | Kanban groups loads by status | unit | `npx vitest run tests/loads/kanban.test.ts` | -- Wave 0 |
| LOAD-14 | Load detail renders all sections | unit | `npx vitest run tests/loads/detail.test.ts` | -- Wave 0 |
| LOAD-15 | Driver PWA shows active load | unit | `npx vitest run tests/driver/loads.test.ts` | -- Wave 0 |
| LOAD-16 | Driver load history filters by 30 days | unit | `npx vitest run tests/driver/loads.test.ts -t "history"` | -- Wave 0 |
| LOAD-17 | CSV export generates valid CSV from load data | unit | `npx vitest run tests/loads/csv-export.test.ts` | -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --reporter=verbose`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/drivers/schema.test.ts` -- covers DRVR-01, DRVR-02, DRVR-03
- [ ] `tests/drivers/list.test.ts` -- covers DRVR-04
- [ ] `tests/drivers/driver-self.test.ts` -- covers DRVR-06
- [ ] `tests/drivers/detail.test.ts` -- covers DRVR-07
- [ ] `tests/vehicles/schema.test.ts` -- covers VEHI-01, VEHI-02
- [ ] `tests/loads/schema.test.ts` -- covers LOAD-01, LOAD-02, LOAD-03, LOAD-04, LOAD-05
- [ ] `tests/loads/status.test.ts` -- covers LOAD-07
- [ ] `tests/loads/documents.test.ts` -- covers LOAD-10, LOAD-11
- [ ] `tests/loads/filters.test.ts` -- covers LOAD-12
- [ ] `tests/loads/kanban.test.ts` -- covers LOAD-13
- [ ] `tests/loads/detail.test.ts` -- covers LOAD-14
- [ ] `tests/loads/csv-export.test.ts` -- covers LOAD-17
- [ ] `tests/driver/loads.test.ts` -- covers LOAD-15, LOAD-16

## Sources

### Primary (HIGH confidence)
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) -- channel API, filtering, event types, payload handling
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) -- RLS policies for storage.objects, bucket setup, helper functions
- [Supabase Storage Helper Functions](https://supabase.com/docs/guides/storage/schema/helper-functions) -- storage.foldername(), storage.filename(), storage.extension()
- [react-hook-form Advanced Usage](https://react-hook-form.com/advanced-usage) -- multi-step form patterns with trigger()
- Existing codebase patterns: `src/schemas/auth.ts`, `src/components/auth/signup-form.tsx`, `src/app/(auth)/signup/actions.ts`

### Secondary (MEDIUM confidence)
- [ClarityDev: Multi-step forms with react-hook-form](https://claritydev.net/blog/build-a-multistep-form-with-react-hook-form) -- Wizard pattern with FormProvider
- [LogRocket: Reusable multi-step form](https://blog.logrocket.com/building-reusable-multi-step-form-react-hook-form-zod/) -- Zod per-step validation
- [Supabase Realtime with Next.js](https://supabase.com/docs/guides/realtime/realtime-with-nextjs) -- Next.js-specific subscription patterns
- [GitHub Issue #35195](https://github.com/supabase/supabase/issues/35195) -- RLS + Realtime interaction caveats

### Tertiary (LOW confidence)
- CSV export via Blob pattern -- well-established browser API, multiple community sources confirm approach

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and patterns established in Phase 1
- Architecture: HIGH -- follows existing project patterns exactly, PRD-01 schemas are explicit
- Database triggers: HIGH -- standard PostgreSQL patterns, well-documented
- Supabase Realtime: HIGH -- official docs with code examples, filter by column value confirmed
- Supabase Storage RLS: MEDIUM -- org-scoped path pattern requires careful UUID-to-text casting
- Multi-step form: HIGH -- react-hook-form FormProvider + trigger() is the standard approach
- Kanban board: HIGH -- CSS-only since no drag-drop needed in Phase 2
- Pitfalls: HIGH -- based on official docs and known Supabase behavior

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable patterns, no fast-moving dependencies)
