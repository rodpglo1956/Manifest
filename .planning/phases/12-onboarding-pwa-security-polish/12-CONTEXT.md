# Phase 12: Onboarding, PWA, Security & Polish - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Guided onboarding wizard for new organizations, Driver PWA offline capability and performance optimization, security hardening (CSRF, rate limiting, CSP, RLS audit), and white-label infrastructure. This is the final phase before market launch.

</domain>

<decisions>
## Implementation Decisions

### Onboarding Wizard
- 5-step guided setup after signup per PRD-04 Section 5:
  1. Business profile (company name, address, carrier type, DOT number, fleet size)
  2. First vehicle (year, make, model, VIN, unit number)
  3. First driver (name, CDL, phone, assign to vehicle) — skip if OO
  4. Integration check (ELD, fuel card, accounting — skip for now options)
  5. Plan selection (14-day Professional trial, plan comparison)
- onboarding_progress table tracks completion
- "Getting Started" checklist widget on dashboard until dismissed
- Driver onboarding: SMS/email invite → PWA install prompt → account creation → first DVIR tutorial

### PWA Hardening
- Service worker caches: app shell, current vehicle data, active load details, last 10 notifications
- Offline DVIR and fuel log forms queue writes via IndexedDB (idb-keyval)
- Background Sync API for queued mutation replay on reconnect
- Performance targets: < 2s FMP on 3G, < 4s TTI, Lighthouse PWA > 90, bundle < 200KB initial
- next/dynamic for code splitting, Workbox for SW management

### Security
- CSRF protection on all mutation endpoints
- Rate limiting: 100 req/min standard, 10 req/min auth
- Input sanitization (DOMPurify for any rendered HTML)
- RLS audit: verify every table has org_id isolation
- Stripe webhook signature verification (already done in Phase 10)
- Content Security Policy headers
- API key rotation schedule documented

### White-Label
- white_label_config table: brand_name, logo_url, primary_color, custom_domain, support_email
- CSS custom properties for all brand colors loaded from config at app init
- Enterprise-tier only feature
- Custom domain support via Vercel custom domains API

### UI
- /onboarding (wizard pages)
- /settings/white-label (enterprise only)
- Dashboard checklist widget

### Claude's Discretion
- Wizard step UI/UX design
- Checklist widget styling
- Offline indicator component
- Rate limiter implementation details
- CSP header values

</decisions>

<code_context>
## Existing Code
- Auth callback + onboarding redirect from Phase 1
- public/sw.js from Phase 6 (push notifications)
- Service worker pattern established
- Dashboard components from Phase 4
- Settings layout from Phase 6
- All form patterns established
- Middleware from Phase 1 (add security headers)

### Integration
- Post-signup redirect to /onboarding instead of /dashboard
- Middleware: add security headers
- Dashboard: add checklist widget
- Settings: add white-label page
</code_context>

<deferred>
- A/B testing for onboarding flow — v2
- Automated performance regression testing — v2
- SOC 2 compliance documentation — v2
</deferred>
