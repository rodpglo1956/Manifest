# Phase 9: CRM & Cross-Module Integration - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Logistics CRM for customers, brokers, vendors, and lanes with rate agreements. Activity logging with follow-up reminders. Cross-module data flows: load completion updates CRM stats, fuel feeds IFTA, inspections auto-complete compliance items. Lane map visualization.

</domain>

<decisions>
## Implementation Decisions

### CRM Companies
- crm_companies table per PRD-03 Section 4.2: customers, brokers, vendors, partners, prospects
- Tracks MC/DOT, credit score, days to pay, payment terms, factoring, contacts
- Aggregated fields: total_revenue, total_loads, avg_rate_per_mile, last_load_date (updated by edge function)

### CRM Contacts
- crm_contacts table: people at companies with title, email, phone, is_primary flag

### Lanes
- crm_lanes table: origin-destination pairs with distance, avg rate, run count
- crm_lane_companies: which companies run which lanes (shipper, broker, receiver roles)
- Lane map: arcs showing active lanes on a map (reuse MapLibre from Phase 6)

### Rate Agreements
- crm_rate_agreements: per company per lane, rate type/amount, effective/expiry dates, equipment type, min volume

### Activities
- crm_activities: calls, emails, notes, meetings, rate negotiations, follow-ups
- Follow-up reminders via pg_cron daily at 7 AM

### Cross-Module Integration
- Load completion → auto-update crm_companies revenue/loads/rate stats + log system activity
- Fuel transactions → feed IFTA calculations (already connected in Phase 7)
- DOT inspection completion → auto-complete compliance_items + schedule next annual
- Driver CDL expiry → flag in compliance AND fleet, alert active loads
- Marie: CRM insights ("Broker XYZ avg days to pay", "Rate agreement expiring in 12 days")

### UI Pages
- Command: /crm (dashboard), /crm/companies (tabbed by type), /crm/companies/:id (detail), /crm/lanes (map + table), /crm/activities
- Owner-Operator: /oo/customers (simplified)
- No Driver PWA CRM access

### Claude's Discretion
- Lane map arc visualization style
- Activity feed component design
- Company detail page section layout
- Rate agreement form design
- CRM dashboard metric cards

</decisions>

<code_context>
## Existing Code
- MapLibre + react-map-gl from Phase 6 dispatch map
- Activity feed pattern from Phase 4 dashboard
- pg_cron patterns proven in Phases 4/6/7/8
- Server action patterns, Zod schemas, StatusBadge all established
- Marie tools pattern from Phase 5

### Integration Points
- Sidebar: add CRM section
- Load status actions: trigger CRM stat updates on delivery
- Compliance: inspection completion triggers
- IFTA: fuel transaction cross-reference

</code_context>

<deferred>
- Automated broker credit checking via API — v2
- Load board integration for rate comparison — v2
- Email/call tracking integration — v2
</deferred>
