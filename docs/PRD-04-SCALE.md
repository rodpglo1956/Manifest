# PRD-04: Scale, Polish, Billing

**Manifest** | by Glo Matrix | Phase 4 | v1.0 | March 2026
**Timeline:** Weeks 25-32
**Depends on:** PRD-01 (Foundation), PRD-02 (Intelligence), PRD-03 (Compliance, Fleet, CRM)
**Author:** Rod Patterson | Confidential

---

## 1. What this phase delivers

Phase 4 is the final build phase before Manifest goes to market. It covers five areas: billing and subscription management via Stripe Connect, analytics and reporting dashboards, notification system, onboarding flows, and performance optimization for the Driver PWA. This phase also includes the infrastructure for multi-tenant white-label deployment so Manifest can be offered to other operators or agencies.

No new core modules. Phase 4 hardens everything built in Phases 1-3, adds the revenue layer, and polishes the experience to production grade.

---

## 2. Billing and subscriptions

### 2.1 Overview

Manifest uses Stripe Connect in platform mode. Glo Matrix is the platform. Each carrier/operator organization is a Connected Account. This supports three revenue models: direct SaaS subscriptions, per-transaction fees on factoring or payment processing, and reseller licensing for agencies who white-label Manifest.

### 2.2 Database schema

```sql
-- Organization billing
CREATE TABLE billing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN (
    'free', 'starter', 'professional', 'enterprise', 'custom'
  )),
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  monthly_rate NUMERIC(10,2),
  annual_rate NUMERIC(10,2),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  status TEXT DEFAULT 'trialing' CHECK (status IN (
    'trialing', 'active', 'past_due', 'canceled', 'paused', 'unpaid'
  )),
  payment_method_last4 TEXT,
  payment_method_brand TEXT,
  cancellation_reason TEXT,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Plan feature limits
CREATE TABLE plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan TEXT NOT NULL UNIQUE,
  max_vehicles INTEGER,
  max_drivers INTEGER,
  max_loads_per_month INTEGER,
  max_users INTEGER,
  compliance_module BOOLEAN DEFAULT false,
  ifta_module BOOLEAN DEFAULT false,
  crm_module BOOLEAN DEFAULT false,
  ai_assistant BOOLEAN DEFAULT false,
  ai_queries_per_month INTEGER DEFAULT 0,
  voice_minutes_per_month INTEGER DEFAULT 0,
  api_access BOOLEAN DEFAULT false,
  white_label BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  custom_integrations BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default plan limits
INSERT INTO plan_limits (plan, max_vehicles, max_drivers, max_loads_per_month, max_users, compliance_module, ifta_module, crm_module, ai_assistant, ai_queries_per_month, voice_minutes_per_month, api_access, white_label, priority_support) VALUES
  ('free', 3, 3, 50, 2, false, false, false, false, 0, 0, false, false, false),
  ('starter', 10, 15, 200, 5, true, false, false, true, 100, 30, false, false, false),
  ('professional', 50, 75, 1000, 15, true, true, true, true, 500, 120, true, false, true),
  ('enterprise', -1, -1, -1, -1, true, true, true, true, -1, -1, true, true, true);
-- -1 = unlimited

-- Usage tracking
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  vehicles_count INTEGER DEFAULT 0,
  drivers_count INTEGER DEFAULT 0,
  loads_count INTEGER DEFAULT 0,
  users_count INTEGER DEFAULT 0,
  ai_queries_count INTEGER DEFAULT 0,
  voice_minutes_used NUMERIC(8,1) DEFAULT 0,
  api_calls_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, period_start)
);

-- Invoices (synced from Stripe, cached locally for fast display)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  stripe_invoice_id TEXT UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  tax NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON billing_accounts
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
CREATE POLICY "org_isolation" ON usage_records
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
CREATE POLICY "org_isolation" ON invoices
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### 2.3 Stripe integration

**Webhook endpoint:** `/api/billing/webhook`

Handles these Stripe events:
- `customer.subscription.created` -> update billing_accounts
- `customer.subscription.updated` -> update plan, status, period dates
- `customer.subscription.deleted` -> set status to canceled
- `invoice.paid` -> insert/update invoices, set paid_at
- `invoice.payment_failed` -> set billing_accounts status to past_due, trigger notification
- `customer.subscription.trial_will_end` -> trigger trial ending notification (3 days before)

**Checkout flow:**
1. User clicks upgrade on `/settings/billing`
2. Frontend calls `/api/billing/create-checkout` with selected plan
3. Backend creates Stripe Checkout Session with org metadata
4. User completes payment on Stripe hosted page
5. Webhook fires, backend updates billing_accounts
6. User redirected back to `/settings/billing?success=true`

**Portal access:**
- `/api/billing/portal` creates a Stripe Customer Portal session
- Users manage payment methods, view invoices, cancel subscriptions through Stripe's hosted portal

### 2.4 Edge functions

**usage-tracker** (pg_cron: daily at midnight)
- Counts current vehicles, drivers, users, loads (this period) per org
- Increments ai_queries_count and voice_minutes_used from respective log tables
- Updates usage_records for current period

**usage-enforcer** (called on relevant API routes)
- Before creating a vehicle: check vehicles_count < plan_limits.max_vehicles
- Before creating a driver: check drivers_count < plan_limits.max_drivers
- Before creating a load: check loads_count < plan_limits.max_loads_per_month
- Before Marie query: check ai_queries_count < plan_limits.ai_queries_per_month
- Returns 402 with upgrade prompt if limit exceeded

**trial-expiry** (pg_cron: daily at 8 AM)
- Finds orgs where trial_ends_at <= now() and status = 'trialing'
- Downgrades to free plan
- Sends notification: "Your Manifest trial has ended. Upgrade to keep using compliance, fleet, and CRM modules."

### 2.5 API routes

```
POST   /api/billing/create-checkout      -- create Stripe checkout session
POST   /api/billing/portal               -- create Stripe customer portal session
GET    /api/billing/status               -- current plan, usage, limits
GET    /api/billing/invoices             -- invoice history
POST   /api/billing/webhook             -- Stripe webhook handler
GET    /api/billing/usage               -- current period usage vs limits
```

### 2.6 UI pages

**Command mode:**

`/settings/billing` (billing center)
- Current plan card with features list
- Usage meters: vehicles, drivers, loads, AI queries, voice minutes (bar charts showing used/limit)
- Upgrade/downgrade buttons
- Payment method display (last 4, brand)
- "Manage billing" button (opens Stripe portal)
- Invoice history table with PDF download links

`/settings/billing/plans` (plan comparison)
- Side-by-side plan comparison grid
- Feature checkmarks per plan
- Annual vs monthly toggle with savings displayed
- "Current plan" badge on active plan
- CTA buttons per plan

**Owner-Operator mode:**

`/oo/billing`
- Simplified single-plan view
- Usage summary
- Upgrade prompt if on free tier
- Invoice history

---

## 3. Analytics and reporting

### 3.1 Overview

Analytics surfaces actionable data from every module. Not vanity metrics. Every chart and number answers a question an operator actually asks: "Am I making money on this lane?" "Which truck is costing me the most?" "Are my drivers staying compliant?" "Is this broker worth working with?"

### 3.2 Database schema

```sql
-- Precomputed analytics snapshots (generated nightly)
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  snapshot_date DATE NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),

  -- Revenue
  total_revenue NUMERIC(14,2) DEFAULT 0,
  total_expenses NUMERIC(14,2) DEFAULT 0,
  net_profit NUMERIC(14,2) DEFAULT 0,
  revenue_per_mile NUMERIC(8,4),
  cost_per_mile NUMERIC(8,4),
  profit_per_mile NUMERIC(8,4),

  -- Operations
  loads_completed INTEGER DEFAULT 0,
  loads_canceled INTEGER DEFAULT 0,
  total_miles INTEGER DEFAULT 0,
  avg_rate_per_mile NUMERIC(8,4),
  deadhead_miles INTEGER DEFAULT 0,
  deadhead_percentage NUMERIC(5,2),
  on_time_delivery_pct NUMERIC(5,2),

  -- Fleet
  fleet_utilization_pct NUMERIC(5,2), -- % of active vehicles with loads
  avg_mpg NUMERIC(5,2),
  total_fuel_cost NUMERIC(10,2),
  total_maintenance_cost NUMERIC(10,2),
  vehicles_in_shop INTEGER DEFAULT 0,

  -- Compliance
  compliance_score INTEGER, -- 0-100
  overdue_items INTEGER DEFAULT 0,
  inspections_passed INTEGER DEFAULT 0,
  inspections_failed INTEGER DEFAULT 0,

  -- CRM
  active_customers INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  avg_days_to_pay NUMERIC(5,1),

  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, snapshot_date, period)
);

-- Driver performance
CREATE TABLE driver_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  loads_completed INTEGER DEFAULT 0,
  miles_driven INTEGER DEFAULT 0,
  revenue_generated NUMERIC(12,2) DEFAULT 0,
  on_time_pct NUMERIC(5,2),
  fuel_efficiency NUMERIC(5,2), -- mpg
  safety_incidents INTEGER DEFAULT 0,
  compliance_score INTEGER, -- 0-100
  customer_complaints INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, driver_id, period_start)
);

ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON analytics_snapshots
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
CREATE POLICY "org_isolation" ON driver_performance
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### 3.3 Edge functions

**analytics-builder** (pg_cron: daily at 1 AM)
- Queries loads, fuel_transactions, maintenance_records, compliance_items, crm_companies for the previous day
- Computes daily snapshot and inserts into analytics_snapshots
- On first day of week: computes weekly snapshot for previous week
- On first day of month: computes monthly snapshot for previous month
- Computes driver_performance for each active driver

**report-generator** (triggered via API)
- Accepts: org_id, report_type, date_range
- Builds PDF report using the analytics_snapshots data
- Stores PDF in Supabase Storage
- Returns download URL

### 3.4 API routes

```
GET    /api/analytics/dashboard          -- current period summary stats
GET    /api/analytics/revenue            -- revenue chart data (daily/weekly/monthly)
GET    /api/analytics/operations         -- ops metrics (loads, miles, on-time %)
GET    /api/analytics/fleet              -- fleet metrics (utilization, mpg, costs)
GET    /api/analytics/compliance         -- compliance score trending
GET    /api/analytics/drivers            -- driver performance rankings
GET    /api/analytics/lanes              -- lane profitability rankings
GET    /api/analytics/customers          -- customer profitability rankings
POST   /api/analytics/reports/generate   -- trigger PDF report generation
GET    /api/analytics/reports            -- list generated reports
GET    /api/analytics/compare            -- period-over-period comparison
```

### 3.5 UI pages

**Command mode:**

`/analytics` (main dashboard)
- Revenue, expenses, profit chart (line chart, selectable period)
- KPI cards: revenue per mile, cost per mile, profit per mile, fleet utilization, on-time %, compliance score
- Period comparison badges (vs previous period, green/red arrows)
- Deadhead percentage gauge

`/analytics/operations`
- Load volume chart (completed vs canceled)
- Miles driven chart
- On-time delivery trending
- Average rate per mile trending
- Top performing lanes table

`/analytics/fleet`
- Fleet utilization chart (% active with loads)
- MPG trending per vehicle
- Maintenance cost by vehicle (bar chart)
- Fuel cost trending
- Vehicle TCO ranking (total cost of ownership)

`/analytics/drivers`
- Driver scorecard table: loads, miles, revenue, on-time %, mpg, safety, compliance
- Sortable by any metric
- Click into driver: individual performance detail page

`/analytics/customers`
- Customer profitability ranking: revenue, loads, avg rate, days to pay
- Broker reliability ranking: pay speed, dispute frequency
- Lane profitability heat map

`/analytics/reports`
- Generate report: select type (P&L, fleet, compliance, driver), date range
- Report history with download links
- Schedule recurring reports (weekly P&L, monthly fleet summary)

**Owner-Operator mode:**

`/oo/analytics`
- Simplified P&L view: income vs expenses
- Per-mile profitability
- Fuel and maintenance cost tracking
- Year-to-date tax estimate (revenue minus deductible expenses)

---

## 4. Notification system

### 4.1 Overview

Centralized notification system that delivers alerts across channels: in-app, push (PWA), email, and SMS. Every module feeds into the same notification pipeline. Users control which notifications they receive and through which channels.

### 4.2 Database schema

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  category TEXT NOT NULL CHECK (category IN (
    'compliance', 'maintenance', 'load', 'billing',
    'crm', 'driver', 'system', 'marie'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  channels_sent TEXT[] DEFAULT '{}', -- 'in_app', 'push', 'email', 'sms'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) UNIQUE,
  compliance_channels TEXT[] DEFAULT '{in_app, push}',
  maintenance_channels TEXT[] DEFAULT '{in_app, push}',
  load_channels TEXT[] DEFAULT '{in_app, push}',
  billing_channels TEXT[] DEFAULT '{in_app, email}',
  crm_channels TEXT[] DEFAULT '{in_app}',
  driver_channels TEXT[] DEFAULT '{in_app, push}',
  system_channels TEXT[] DEFAULT '{in_app}',
  marie_channels TEXT[] DEFAULT '{in_app, push}',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_isolation" ON notifications
  USING (user_id = auth.uid());
CREATE POLICY "user_isolation" ON notification_preferences
  USING (user_id = auth.uid());
```

### 4.3 Notification dispatch

**Edge function: notification-dispatcher** (triggered on INSERT to notifications)
- Reads user's notification_preferences
- Checks quiet hours
- Dispatches to each enabled channel:
  - in_app: already stored in notifications table, frontend reads via Supabase Realtime
  - push: Web Push API (service worker in Driver PWA)
  - email: Resend API (already configured in GloMatrix infrastructure)
  - sms: Twilio (A2P number +1 912-250-7897, pending campaign approval)

### 4.4 API routes

```
GET    /api/notifications                -- list notifications (paginated, filterable by category, read status)
PUT    /api/notifications/:id/read       -- mark as read
PUT    /api/notifications/read-all       -- mark all as read
GET    /api/notifications/unread-count   -- badge count
GET    /api/notifications/preferences    -- get user preferences
PUT    /api/notifications/preferences    -- update preferences
```

### 4.5 UI

- Notification bell icon in header with unread count badge
- Dropdown panel: recent notifications grouped by category
- Click notification: navigates to action_url
- `/settings/notifications`: toggle matrix (category x channel) with quiet hours config

---

## 5. Onboarding flows

### 5.1 New organization onboarding

After signup, the user lands on a guided setup wizard. No empty dashboards. The wizard collects the minimum data needed to make the platform useful immediately.

**Step 1: Business profile**
- Company name, address, phone
- Carrier type (medical transport, trucking, mixed fleet, etc.)
- DOT number (optional, determines compliance module visibility)
- Fleet size range (1-5, 6-20, 21-50, 51+)

**Step 2: First vehicle**
- Add at least one vehicle: year, make, model, VIN, unit number
- Vehicle class auto-detected from make/model when possible
- Photo upload (optional)

**Step 3: First driver** (skip if owner-operator)
- Name, CDL info (if applicable), phone, email
- Assign to vehicle from Step 2

**Step 4: Integration check**
- ELD provider selection (if applicable)
- Fuel card provider selection (if applicable)
- Accounting software (QuickBooks, none)
- Skip for now option on each

**Step 5: Plan selection**
- Show plan comparison with recommended plan highlighted based on fleet size
- Free trial starts automatically (14 days of Professional)
- Skip to free tier option

**Completion:** Redirects to dashboard with a "Getting Started" checklist widget that tracks: add vehicle (done), add driver, create first load, set up compliance profile, invite team member. Checklist persists until dismissed.

### 5.2 Driver onboarding (Driver PWA)

When a driver is invited:
1. Receives SMS/email with invite link
2. Opens in mobile browser, prompted to "Add to Home Screen" (PWA install)
3. Creates account (name, phone, password)
4. Sees assigned vehicle and any pending compliance items
5. Completes first pre-trip inspection as a guided tutorial

### 5.3 Database

```sql
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  step_completed INTEGER DEFAULT 0,
  business_profile_done BOOLEAN DEFAULT false,
  first_vehicle_done BOOLEAN DEFAULT false,
  first_driver_done BOOLEAN DEFAULT false,
  integrations_done BOOLEAN DEFAULT false,
  plan_selected BOOLEAN DEFAULT false,
  checklist_dismissed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON onboarding_progress
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

---

## 6. Performance and PWA hardening

### 6.1 Driver PWA optimization

The Driver PWA must work reliably on spotty cellular connections (rural highways, warehouse dead zones). Key requirements:

**Offline capability:**
- Service worker caches: app shell, current vehicle data, active load details, last 10 notifications
- Pre-trip/post-trip inspection forms work fully offline, sync when connection returns
- Fuel log entries queue offline, sync on reconnect
- Location tracking continues offline, batches GPS points for upload

**Performance targets:**
- First meaningful paint: < 2 seconds on 3G
- Time to interactive: < 4 seconds on 3G
- Lighthouse PWA score: > 90
- Bundle size: < 200KB initial load

**Implementation:**
- next/dynamic for code splitting per route
- Workbox for service worker management
- IndexedDB for offline data storage (via idb-keyval)
- Background Sync API for queued writes
- Periodic Background Sync for location batching

### 6.2 Command mode optimization

**Data loading:**
- React Query (TanStack Query) for all server state with stale-while-revalidate
- Supabase Realtime subscriptions for live dashboard updates (fleet status, notifications, load tracking)
- Virtualized lists for large datasets (vehicle list, load history, activity feed)
- Pagination on all list endpoints (cursor-based, not offset)

**Bundle optimization:**
- Route-based code splitting
- Dynamic imports for heavy components (map views, chart libraries)
- Image optimization via next/image
- Tree-shaking verification on Recharts (import specific components only)

### 6.3 Security hardening

- CSRF protection on all mutation endpoints
- Rate limiting: 100 req/min per user on standard endpoints, 10 req/min on auth endpoints
- Input sanitization on all user-provided text fields (DOMPurify for any rendered HTML)
- Supabase RLS audit: verify every table has org_id isolation policy
- API key rotation schedule documented
- Stripe webhook signature verification on every event
- Content Security Policy headers

---

## 7. White-label infrastructure

### 7.1 Overview

Manifest ships with white-label readiness for agencies or larger operators who want their own branded version. This does not mean building a full white-label system in Phase 4. It means structuring the codebase so white-labeling is a configuration change, not a code fork.

### 7.2 Implementation

```sql
CREATE TABLE white_label_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  enabled BOOLEAN DEFAULT false,
  brand_name TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#EC008C',
  secondary_color TEXT,
  custom_domain TEXT,
  support_email TEXT,
  support_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE white_label_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON white_label_config
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

**Frontend:** CSS custom properties for all brand colors. Logo and favicon loaded from white_label_config at app init. Brand name in page titles and footer. Custom domain support via Vercel custom domains API.

**This is enterprise-tier only.** Free, Starter, and Professional plans see "Manifest by Glo Matrix" branding. Enterprise plans can customize.

---

## 8. Updated .cursorrules additions

Add these rules to the existing `.cursorrules` for Phase 4:

```
## Billing
- Stripe Connect in platform mode. Glo Matrix = platform. Each org = Connected Account.
- All Stripe events handled via webhook at /api/billing/webhook
- Usage enforcement happens at the API route level, not the frontend
- Never expose Stripe secret key to frontend. All Stripe calls go through API routes.

## Analytics
- analytics_snapshots table is the source of truth for all dashboard charts
- Never compute analytics on the fly from raw tables in the frontend
- analytics-builder edge function runs nightly and precomputes everything

## Notifications
- All notifications go through the notifications table
- notification-dispatcher edge function handles channel routing
- Frontend reads notifications via Supabase Realtime subscription
- Respect quiet hours. Check before dispatching push/sms/email.

## PWA
- Driver PWA must work offline. Service worker required.
- All forms that drivers use (DVIR, fuel log) must queue writes when offline
- Use IndexedDB via idb-keyval for offline storage
- Background Sync API for queued mutation replay

## White Label
- All brand values come from CSS custom properties
- Logo and brand name loaded from white_label_config table
- Never hardcode "Manifest" or "Glo Matrix" in component JSX. Use config.
```

---

## 9. Exit criteria

Phase 4 is done when:

- [ ] Stripe Connect integration complete with checkout, portal, and webhooks
- [ ] Plan limits enforced at API level (402 on limit exceeded)
- [ ] Usage tracking accurate and updating daily
- [ ] Billing UI shows plan, usage meters, invoices, and upgrade flow
- [ ] Analytics snapshots generating nightly
- [ ] Analytics dashboard renders revenue, operations, fleet, compliance, driver, and customer charts
- [ ] PDF report generation works for all report types
- [ ] Notification system dispatches across in-app, push, email, and SMS channels
- [ ] Notification preferences UI functional
- [ ] Onboarding wizard completes with real data creation (vehicle, driver, compliance profile)
- [ ] Driver PWA install prompt works on iOS and Android
- [ ] Driver PWA offline mode: DVIR form, fuel log, and load details work without connection
- [ ] PWA performance: < 2s FMP on 3G, Lighthouse PWA > 90
- [ ] Command mode: virtualized lists, code splitting, < 300KB initial bundle
- [ ] Security audit: RLS on every table, CSRF protection, rate limiting, CSP headers
- [ ] White-label config table and CSS custom property system in place
- [ ] Marie proactively surfaces billing alerts ("trial ending in 3 days"), usage warnings, and report summaries
