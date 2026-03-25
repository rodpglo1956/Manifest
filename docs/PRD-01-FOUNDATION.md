# PRD-01: Foundation

**Manifest (by Glo Matrix)** | Phase 1 | Weeks 1-8 | v1.1 | March 2026

---

## 1. What this phase covers

Phase 1 builds the core operating skeleton of Manifest. By the end of this phase, a carrier can sign up, set up their organization, create loads, dispatch drivers, track load status, manage their driver roster, generate invoices, and see a working dashboard. No AI, no compliance, no CRM yet. Just the operational backbone.

**Depends on:** Nothing. This is the starting point.

---

## 2. Auth and organization setup

### 2.1 Auth flow

Supabase Auth handles all authentication. Email/password at launch. Magic link as secondary option.

**Signup flow:**
1. User enters email + password at `manifest.glomatrix.app/signup`
2. Supabase creates auth.users record
3. Database trigger creates a `profiles` record linked to auth.uid()
4. User is prompted to create an organization or join an existing one via invitation
5. On org creation, `organizations` record created and user assigned admin role
6. Redirect to dashboard

**Login flow:**
1. Email + password at `manifest.glomatrix.app/login`
2. Supabase verifies, returns session
3. Middleware checks profile.org_id and profile.role
4. Redirects to appropriate mode (Command, Driver, Owner-Operator) based on role

### 2.2 Roles

| Role | Access | Assign to |
|---|---|---|
| admin | Full access to all Command mode features, settings, billing, team management | Fleet owners, ops managers |
| dispatcher | Loads, dispatch, driver management, fleet view. No billing, no team management. | Dispatchers, office staff |
| driver | Driver PWA only. Own loads, own vehicle, own compliance, fuel entry, inspections. | Drivers |
| viewer | Read-only access to dashboard, loads, fleet, reports. | Accountants, partners, investors |

### 2.3 Schema: auth and org

```sql
-- Organizations
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  dot_number text,
  mc_number text,
  address_line1 text,
  address_city text,
  address_state text,
  address_zip text,
  phone text,
  email text,
  company_type text not null default 'dot_carrier', -- 'dot_carrier', 'non_dot_carrier', 'both'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User profiles (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references organizations(id),
  full_name text,
  role text not null default 'viewer', -- 'admin', 'dispatcher', 'driver', 'viewer'
  phone text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Org membership (for invitation flow)
create table org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  user_id uuid not null references auth.users(id),
  role text not null,
  joined_at timestamptz default now(),
  unique(org_id, user_id)
);

-- RLS
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table org_members enable row level security;

create policy "users_own_profile" on profiles
  for all using (id = auth.uid());
create policy "org_profiles" on profiles
  for select using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "org_members_access" on org_members
  for all using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "org_access" on organizations
  for all using (id = (select org_id from profiles where id = auth.uid()));
```

---

## 3. Driver management

### 3.1 What it does

Central roster of every driver in the organization. Tracks their license info, contact details, assigned vehicle, employment status, and hire date. Phase 1 is the registry only. Compliance tracking (CDL expiration, medical cards, drug tests) comes in Phase 3.

### 3.2 Schema

```sql
create table drivers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  user_id uuid references auth.users(id), -- linked when driver has a login
  first_name text not null,
  last_name text not null,
  email text,
  phone text not null,
  license_number text,
  license_state text,
  license_class text, -- 'A', 'B', 'C', 'standard'
  license_expiration date,
  hire_date date,
  status text not null default 'active', -- 'active', 'inactive', 'terminated'
  current_vehicle_id uuid references vehicles(id),
  home_terminal text, -- for carriers with multiple locations
  notes text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table drivers enable row level security;
create policy "org_drivers" on drivers
  for all using (org_id = (select org_id from profiles where id = auth.uid()));
```

### 3.3 UI pages

**Command mode: /drivers**
- Driver list with search, filter by status
- Driver detail page: contact info, license info, assigned vehicle, load history
- Add/edit driver form
- Link driver to user account (generates invitation email)

**Driver PWA: /settings**
- View own profile (read-only except phone and emergency contact)

---

## 4. Load management

### 4.1 What it does

Create, track, and manage loads from booking to delivery. A load represents a single shipment with pickup and delivery details, rate info, and status tracking.

### 4.2 Schema

```sql
create table loads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  load_number text not null, -- auto-generated or manual
  status text not null default 'booked', -- 'booked', 'dispatched', 'in_transit', 'at_pickup', 'loaded', 'at_delivery', 'delivered', 'invoiced', 'paid', 'canceled'

  -- Pickup
  pickup_company text,
  pickup_address text,
  pickup_city text,
  pickup_state text,
  pickup_zip text,
  pickup_date date,
  pickup_time_start time,
  pickup_time_end time,
  pickup_reference text, -- PO number, pickup number
  actual_pickup_at timestamptz,

  -- Delivery
  delivery_company text,
  delivery_address text,
  delivery_city text,
  delivery_state text,
  delivery_zip text,
  delivery_date date,
  delivery_time_start time,
  delivery_time_end time,
  delivery_reference text,
  actual_delivery_at timestamptz,

  -- Freight details
  commodity text,
  weight numeric(10,2),
  weight_unit text default 'lbs',
  pieces integer,
  equipment_type text, -- 'dry_van', 'reefer', 'flatbed', 'sprinter', 'box_truck', 'other'
  temperature_min numeric(5,1),
  temperature_max numeric(5,1),
  hazmat boolean default false,

  -- Rate
  rate numeric(10,2),
  rate_type text default 'flat', -- 'flat', 'per_mile', 'hourly', 'per_stop'
  estimated_miles integer,
  fuel_surcharge numeric(10,2) default 0,
  accessorial_charges numeric(10,2) default 0,
  total_revenue numeric(10,2),

  -- Assignment
  driver_id uuid references drivers(id),
  vehicle_id uuid references vehicles(id),

  -- Source
  broker_name text,
  broker_mc text,
  broker_contact text,
  broker_phone text,
  broker_email text,

  -- Documents
  bol_url text,
  rate_confirmation_url text,
  pod_url text, -- proof of delivery

  -- Meta
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Load status history (every transition logged)
create table load_status_history (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references loads(id),
  old_status text,
  new_status text not null,
  changed_by uuid references auth.users(id),
  location_lat numeric(9,6),
  location_lng numeric(9,6),
  notes text,
  created_at timestamptz default now()
);

alter table loads enable row level security;
alter table load_status_history enable row level security;

create policy "org_loads" on loads
  for all using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "org_load_history" on load_status_history
  for select using (
    load_id in (select id from loads where org_id = (select org_id from profiles where id = auth.uid()))
  );
```

### 4.3 Load lifecycle

```
booked -> dispatched -> in_transit -> at_pickup -> loaded -> at_delivery -> delivered -> invoiced -> paid
                                                                                     \-> canceled (from any status)
```

Every status change writes to `load_status_history` and broadcasts via Supabase Realtime.

### 4.4 UI pages

**Command mode: /loads**
- Load list with filters (status, driver, date range, broker)
- Load detail page: full shipment info, status timeline, documents, notes
- Create load form (multi-step: pickup, delivery, freight, rate, assignment)
- Quick status update buttons
- Bulk actions (dispatch multiple loads, export CSV)
- Load board view (kanban by status)

**Command mode: /loads/[id]**
- Full detail view
- Status timeline visualization
- Document upload/view (BOL, rate con, POD)
- Driver and vehicle assignment
- Rate and revenue breakdown
- Notes thread

**Driver PWA: /loads**
- Current active load (big card at top)
- Status update buttons (swipe or tap: "At Pickup", "Loaded", "At Delivery", "Delivered")
- Upload BOL/POD via camera
- Load history (past 30 days)

**Owner-Operator mode: /loads**
- Same as Command mode but scoped to their own loads only

---

## 5. Dispatch

### 5.1 What it does

Assigns drivers and vehicles to loads. Tracks assignment status, ETAs, and driver availability. Phase 1 is manual dispatch. Smart routing and AI-assisted dispatch come in Phase 2.

### 5.2 Schema

```sql
create table dispatches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  load_id uuid not null references loads(id),
  driver_id uuid not null references drivers(id),
  vehicle_id uuid references vehicles(id),
  status text not null default 'assigned', -- 'assigned', 'accepted', 'en_route_pickup', 'at_pickup', 'en_route_delivery', 'at_delivery', 'completed', 'rejected'
  assigned_at timestamptz default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  estimated_pickup_arrival timestamptz,
  estimated_delivery_arrival timestamptz,
  driver_notes text,
  dispatcher_notes text,
  assigned_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table dispatches enable row level security;
create policy "org_dispatches" on dispatches
  for all using (org_id = (select org_id from profiles where id = auth.uid()));
```

### 5.3 UI pages

**Command mode: /dispatch**
- Dispatch board: list of unassigned loads + list of available drivers
- Drag-and-drop assignment (or dropdown select)
- Active dispatches list with ETA and status
- Driver availability view (who is free, who is on a load, who is off)

**Driver PWA: /dispatch**
- Current dispatch card with load summary
- Accept/reject buttons for new assignments
- Status update flow
- Notes to dispatcher

---

## 6. Invoicing

### 6.1 What it does

Generates invoices from delivered loads. Tracks payment status. Simple invoice management for Phase 1. Full accounts receivable aging and Stripe Connect payouts come in Phase 4.

### 6.2 Schema

```sql
create table invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  load_id uuid not null references loads(id),
  invoice_number text not null,
  bill_to_company text not null,
  bill_to_email text,
  bill_to_address text,
  amount numeric(10,2) not null,
  fuel_surcharge numeric(10,2) default 0,
  accessorials numeric(10,2) default 0,
  total numeric(10,2) not null,
  status text not null default 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'void'
  issued_date date,
  due_date date,
  paid_date date,
  paid_amount numeric(10,2),
  payment_method text,
  notes text,
  pdf_url text, -- generated invoice PDF
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table invoices enable row level security;
create policy "org_invoices" on invoices
  for all using (org_id = (select org_id from profiles where id = auth.uid()));
```

### 6.3 UI pages

**Command mode: /invoices**
- Invoice list with filters (status, date range, broker/customer)
- Create invoice from delivered load (pre-populates from load data)
- Invoice detail with PDF preview
- Mark as sent, mark as paid
- Overdue indicator

**Owner-Operator mode: /invoices**
- Same view, scoped to own loads

**Driver PWA: No invoice access**

---

## 7. Dashboard

### 7.1 Command mode dashboard (/)

Top-level view of the entire operation:

**Stat row (4 cards):**
- Active loads (currently in transit)
- Loads booked today
- Drivers on duty
- Revenue MTD

**Active loads map** (Phase 1: list view. Map visualization deferred to Phase 2.)

**Recent activity feed:**
- Last 10 load status changes
- Last 5 dispatches
- Last 5 invoices

**Quick actions:**
- Create load
- Dispatch driver
- Create invoice

### 7.2 Driver PWA dashboard (/)

- Current load card (big, prominent)
- Next upcoming load
- Quick status update button
- Days until next compliance item expires (placeholder, wired in Phase 3)

### 7.3 Owner-Operator dashboard (/)

- Same as Command but all stats scoped to their own loads/vehicle
- Single vehicle status card
- Revenue MTD for their operation

---

## 8. API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/signup` | POST | Create account + org |
| `/api/auth/invite` | POST | Send invitation to join org |
| `/api/drivers` | GET | List drivers |
| `/api/drivers` | POST | Create driver |
| `/api/drivers/[id]` | GET/PATCH | Get/update driver |
| `/api/loads` | GET | List loads with filters |
| `/api/loads` | POST | Create load |
| `/api/loads/[id]` | GET/PATCH | Get/update load |
| `/api/loads/[id]/status` | POST | Update load status (writes history) |
| `/api/loads/[id]/documents` | POST | Upload BOL/POD/rate con |
| `/api/dispatch` | GET | List dispatches |
| `/api/dispatch` | POST | Create dispatch (assign driver to load) |
| `/api/dispatch/[id]` | PATCH | Update dispatch status |
| `/api/invoices` | GET | List invoices |
| `/api/invoices` | POST | Create invoice from load |
| `/api/invoices/[id]` | GET/PATCH | Get/update invoice |
| `/api/invoices/[id]/pdf` | GET | Generate/retrieve invoice PDF |
| `/api/dashboard/stats` | GET | Dashboard stat cards data |
| `/api/dashboard/activity` | GET | Recent activity feed |

---

## 9. Edge functions

| Function | Trigger | Purpose |
|---|---|---|
| `load-number-generator` | DB trigger on loads INSERT | Auto-generates load number (ORG-PREFIX-SEQUENCE) if not provided |
| `invoice-number-generator` | DB trigger on invoices INSERT | Auto-generates invoice number (INV-YYYYMM-SEQUENCE) |
| `load-status-broadcaster` | DB trigger on loads UPDATE (status column) | Writes to load_status_history, broadcasts via Realtime |
| `overdue-invoice-scanner` | pg_cron: daily at 8 AM | Checks invoices where due_date < today and status = 'sent'. Updates to 'overdue'. |

---

## 10. Realtime channels

| Channel | Events | Subscribers |
|---|---|---|
| `org:{org_id}:loads` | Load status changes | Command dashboard, dispatch board |
| `org:{org_id}:dispatch` | New dispatches, status updates | Command dispatch board, Driver PWA |
| `org:{org_id}:invoices` | Invoice status changes | Command invoice list |

---

## 11. Exit criteria

Phase 1 is complete when:

- [ ] User can sign up, create org, and log in
- [ ] Admin can invite users with role assignment
- [ ] Driver roster with add/edit/deactivate
- [ ] Load creation with full shipment details (pickup, delivery, freight, rate)
- [ ] Load status lifecycle works end-to-end (booked through paid)
- [ ] Status history logged and viewable
- [ ] Document upload (BOL, rate con, POD) works on desktop and mobile camera
- [ ] Dispatch assignment: assign driver + vehicle to load
- [ ] Driver PWA: view current load, update status, upload documents
- [ ] Invoice creation from delivered load with auto-populated data
- [ ] Invoice PDF generation
- [ ] Dashboard stat cards showing live data
- [ ] Realtime updates: load status changes reflect instantly across all connected sessions
- [ ] RLS verified: two test orgs with complete data isolation
- [ ] All three modes render correctly (Command desktop, Driver PWA mobile, Owner-Operator)
