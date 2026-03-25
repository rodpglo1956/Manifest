# Feature Landscape

**Domain:** Logistics operations platform (carrier-side TMS, fleet management, dispatch, compliance)
**Researched:** 2026-03-24
**Competitors Analyzed:** Motive (KeepTruckin), Samsara, Rose Rocket, TruckingOffice, Axon Software, Truckbase, Alvys, FleetRabbit, NEMT-specific platforms (Bambi, RouteGenie, MediRoutes)

---

## Table Stakes

Features users expect from any carrier-focused logistics platform in 2026. Missing any of these means prospects will not take Manifest seriously.

| Feature | Why Expected | Complexity | Manifest PRD Coverage | Notes |
|---------|--------------|------------|----------------------|-------|
| Load/order management with full lifecycle | Every TMS has this. Carriers cannot operate without tracking loads from booking to payment. | Medium | Phase 1 (PRD-01) - comprehensive | Manifest's 10-status lifecycle (booked through paid) is thorough. Matches or exceeds competitors. |
| Dispatch board with driver assignment | Core workflow for any multi-driver operation. Manual assignment is baseline; smart suggestions are bonus. | Medium | Phase 1 basic, Phase 2 enhanced | Phase 1 manual dispatch is the right starting point. |
| Driver roster and management | Every competitor tracks drivers. License info, contact, status, vehicle assignment. | Low | Phase 1 (PRD-01) | Solid coverage. |
| Invoice generation from loads | Carriers need to bill. Auto-populating invoices from delivered loads is expected, not a differentiator. | Medium | Phase 1 (PRD-01) | Good. PDF generation included. |
| Dashboard with operational KPIs | Active loads, revenue MTD, driver status. Every platform has a homepage dashboard. | Medium | Phase 1 basic, Phase 2 charts | Stat cards in Phase 1, charts in Phase 2 is correct sequencing. |
| Document management (BOL, POD, rate con) | Carriers must store and retrieve shipping documents. Camera upload on mobile is expected. | Medium | Phase 1 (PRD-01) | Covered via Supabase Storage. |
| Role-based access control | Admin/dispatcher/driver roles are standard across Motive, Samsara, Rose Rocket, Axon. | Low | Phase 1 (PRD-01) | Four roles (admin, dispatcher, driver, viewer) is appropriate. |
| Real-time load status updates | Dispatchers expect to see status changes without refreshing. Samsara and Motive set the bar with real-time. | Medium | Phase 1 via Supabase Realtime | Strong architectural choice with Supabase Realtime. |
| Vehicle/fleet registry | Basic vehicle tracking (make, model, VIN, status, assignment). Every fleet tool has this. | Low | Phase 1 skeleton, Phase 3 full | Must have at least a basic vehicles table in Phase 1 since loads reference vehicles. |
| Basic reporting (revenue, load volume) | Operators need to answer "how is my business doing?" Monthly/weekly revenue and load counts. | Medium | Phase 2 analytics foundation | Consider moving basic stat reporting earlier; competitors all have day-one reporting. |
| Mobile access for drivers | Drivers update status, upload documents, see current load from their phone. Motive, Samsara, Truckbase all have this. | High | Phase 1 Driver PWA | PWA approach is smart and cost-effective vs native apps. |
| Multi-stop / pickup-delivery details | Load needs pickup location, delivery location, dates, reference numbers, company names. | Low | Phase 1 (PRD-01) | Single pickup/delivery per load. Consider multi-stop in future (many competitors support it). |
| IFTA mileage tracking | DOT carriers must file IFTA quarterly. Motive, Samsara, TruckingOffice, Axon all handle this. | Medium | Phase 3 (PRD-03) | Good placement in Phase 3 with compliance module. |
| Maintenance tracking | Scheduling service, logging repairs, tracking costs per vehicle. FleetRabbit, Motive, Samsara all cover this. | Medium | Phase 3 (PRD-03) | Comprehensive in PRD-03 with schedules, records, and cost tracking. |
| DOT compliance tracking | CDL expiration, medical cards, annual inspections, drug testing. Any DOT-focused platform has this. | High | Phase 3 (PRD-03) | Very thorough coverage including DQ files, recurring items, and alert thresholds. |

---

## Differentiators

Features that set Manifest apart from the competitive landscape. Not expected by default, but create meaningful competitive advantage.

| Feature | Value Proposition | Complexity | Manifest PRD Coverage | Notes |
|---------|-------------------|------------|----------------------|-------|
| **AI operations assistant (Marie)** | No competitor in the small-to-mid carrier space has an embedded AI assistant that can query operations data, execute actions, and proactively alert. Rose Rocket's TMS.ai is the closest but targets larger operations and costs significantly more. | High | Phase 2 (PRD-02) | This is Manifest's single biggest differentiator. The combination of natural language queries + action execution + proactive alerts is genuinely novel for this market segment. |
| **DOT + non-DOT unified platform** | Most TMS platforms assume DOT-regulated trucking. NEMT platforms (Bambi, RouteGenie) only handle medical transport. Manifest serves both with adaptive compliance. No competitor spans medical transport vans to Class 8 semis in one product. | Medium | All phases | This is the second biggest differentiator. The vehicle class flexibility and adaptive compliance module based on carrier type is unique. |
| **Smart routing with driver scoring** | Ranked driver suggestions based on proximity, availability, equipment match, performance history, and lane familiarity. Most small-fleet TMS tools have manual dispatch only. Motive/Samsara have routing but are hardware-dependent. | High | Phase 2 (PRD-02) | The 5-factor weighted scoring (30% proximity, 25% availability, 20% equipment, 15% performance, 10% lane familiarity) is well-designed. |
| **Predictive operational alerts** | Proactive warnings (late pickup risk, driver gone silent, ETA risk, unassigned loads) before problems happen. Most small-carrier tools are reactive. Samsara has some alerting but requires their hardware ecosystem. | High | Phase 2 (PRD-02) | Six alert types with severity escalation is solid. The edge function architecture via pg_cron is pragmatic. |
| **Integrated logistics CRM** | Purpose-built for carrier relationships: customers, brokers, lanes, rate agreements, payment terms tracking. Generic CRMs (HubSpot, Salesforce) do not understand lanes or rate per mile. Most TMS tools have basic broker/customer fields on loads but not a full CRM. | High | Phase 3 (PRD-03) | Lane-based CRM with rate agreement tracking and auto-updated revenue stats per company is genuinely useful. Axon has some of this but at much higher price points. |
| **Owner-operator mode** | Dedicated simplified view for solo operators. Most platforms are either full-fleet TMS (too complex for 1-truck shops) or basic tools (TruckingOffice) that lack features as you grow. Manifest scales from owner-op to 200+ vehicles. | Medium | All phases | Smart product design. Auto-detection based on org tier and user count avoids forcing users to choose. |
| **Three-mode architecture** | Command (desktop), Driver PWA (mobile), Owner-Operator (simplified) from one codebase. Most competitors have separate apps or lack the OO mode entirely. | Medium | All phases | The route-group architecture keeps complexity manageable while serving three audiences. |
| **Voice-enabled AI (Vapi)** | Marie via voice for drivers. Hands-free operation querying. No small-fleet competitor offers voice-driven dispatch or ops queries. | Medium | Phase 2+ | Vapi integration is listed in stack but implementation details are light. Could be a strong driver-safety differentiator. |
| **Cross-module intelligence** | Load completion auto-updates CRM stats, fuel transactions feed IFTA, inspections auto-complete compliance items. Most platforms silo these modules. | Medium | Phase 3 (PRD-03) | Five explicit cross-module integration points documented. This is what makes "all-in-one" actually work vs being a bundle of separate tools. |
| **White-label infrastructure** | Enterprise-tier customers can rebrand Manifest. Useful for NEMT agencies, fleet management companies, and 3PLs. Most competitors do not offer white-labeling at all. | Medium | Phase 4 (PRD-04) | CSS custom properties + config table approach is the right lightweight solution. Do not over-invest here pre-launch. |
| **Offline-capable driver app** | PWA with IndexedDB, service worker caching, Background Sync. Critical for drivers in rural areas or warehouse dead zones. Most web-based TMS tools break without connectivity. Samsara/Motive solve this via native apps with local storage. | High | Phase 4 (PRD-04) | Ambitious but essential. The Workbox + idb-keyval approach is well-chosen. Performance targets (< 2s FMP on 3G) are aggressive but achievable. |

---

## Anti-Features

Features to explicitly NOT build. These are intentional scope boundaries that keep Manifest focused.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Load board / freight sourcing** | Commoditized market dominated by DAT, Truckstop, Amazon Relay. Building a load board requires massive network effects Manifest cannot achieve at launch. It also shifts the product from operator tool to marketplace, which is a fundamentally different business. | Manage booked freight only. Consider API integrations with load boards in future phases (import loads from DAT, etc). |
| **ELD hardware / in-cab devices** | Motive and Samsara have billions in hardware investment. Building ELD hardware is a capital-intensive hardware business with FMCSA certification requirements. | Integrate with ELD providers (Motive, Samsara, etc.) via their APIs. Use their GPS/HOS data inside Manifest. |
| **GPS tracking hardware** | Same as ELD -- hardware-dependent, capital-intensive, existing market leaders. | Use driver-reported location from the PWA and ELD integration data for ETAs and proximity. |
| **Broker-carrier marketplace** | Two-sided marketplace dynamics require both supply and demand. Manifest is a carrier operations tool, not a matching platform. | Focus on CRM for managing existing broker relationships. |
| **External workflow engine (n8n)** | Adds infrastructure complexity, another failure point, and a learning curve for ops. | Supabase Edge Functions + pg_cron handle all automation needs. Keeps the stack unified. |
| **Full accounting system** | QuickBooks and Xero are mature. Building GL, AP, AR, bank reconciliation is years of work with no competitive advantage. | Integrate with QuickBooks/Xero. Manifest handles invoicing and expense tracking; accounting software handles the books. |
| **HOS/hours-of-service logging** | Tightly coupled with ELD hardware. FMCSA-certified HOS requires specific device compliance. | Pull HOS data from ELD integrations. Display remaining hours in Manifest but do not be the system of record for HOS. |
| **Route optimization with turn-by-turn navigation** | Google Maps, Waze, and CoPilot Truck own this. Building mapping/routing is a massive engineering effort with minimal differentiation. | Use mapping APIs for distance/ETA calculations. Link out to navigation apps for turn-by-turn. |
| **Payroll / driver settlements** | Complex tax law, state-by-state compliance, 1099 vs W-2 handling. Axon and ADP handle this well. | Track driver pay data (loads completed, miles driven) that feeds into external payroll systems. Consider basic driver settlement reports in Phase 4+. |
| **NEMT-specific billing (Medicaid claims, CMS-1500)** | NEMT billing is a specialized domain with Medicaid/Medicare claim submission, EDI formats, and payer-specific rules. Bambi and MediRoutes specialize here. Building this delays the core platform significantly. | Focus on standard carrier invoicing. NEMT users use Manifest for dispatch/fleet/compliance and their existing billing tool (or a future integration) for Medicaid claims. Flag for future consideration if NEMT adoption is strong. |

---

## Feature Dependencies

```
Auth + Org Setup
  |-> Driver Management
  |-> Vehicle Registry (basic)
  |     |-> Fleet Management (Phase 3, expands vehicles)
  |     |     |-> Maintenance Tracking
  |     |     |-> Fuel Management
  |     |     |     |-> IFTA Calculations
  |     |-> Compliance Module (Phase 3)
  |           |-> Driver Qualifications (DQ Files)
  |           |-> Inspection Records
  |           |-> Compliance Alerts
  |-> Load Management
  |     |-> Load Status History
  |     |-> Document Management (BOL, POD)
  |     |-> Dispatch
  |     |     |-> Smart Routing (Phase 2, requires load + driver + vehicle data)
  |     |     |-> Predictive Alerts (Phase 2, requires dispatch + load data)
  |     |     |-> Enhanced Dispatch Board (Phase 2, map + timeline views)
  |     |-> Invoicing
  |           |-> Billing/Subscriptions (Phase 4, platform-level billing via Stripe)
  |-> Dashboard
        |-> Analytics Foundation (Phase 2, daily snapshots)
        |     |-> Full Analytics + Reporting (Phase 4)
        |-> Marie AI (Phase 2, requires all Phase 1 tables for context)
              |-> Proactive Alerts
              |-> Voice (Vapi, Phase 2+)

CRM (Phase 3, independent of compliance/fleet but enhanced by load data)
  |-> Companies (customers, brokers, vendors)
  |-> Contacts
  |-> Lanes + Rate Agreements
  |-> Activities + Follow-ups

Cross-module integration (Phase 3, requires loads + fleet + compliance + CRM):
  Load completion -> CRM revenue update
  Fuel transactions -> IFTA calculations
  Inspections -> Compliance item completion
  CDL expiry -> Driver flagging across modules

Notifications (Phase 4, wraps around all modules)
Onboarding Wizard (Phase 4, creates records in Phase 1-3 tables)
White-label (Phase 4, CSS/config layer, no data dependencies)
PWA Offline (Phase 4, caches Phase 1-3 data locally)
```

---

## MVP Recommendation

### Prioritize (Phase 1 -- table stakes that make the product usable):
1. **Auth + org setup with roles** -- gate to everything else
2. **Load management with full lifecycle** -- the core workflow
3. **Dispatch with manual driver assignment** -- second core workflow
4. **Driver management roster** -- required for dispatch
5. **Basic vehicle registry** -- required for dispatch and load assignment
6. **Invoice generation from loads** -- carriers need to get paid
7. **Dashboard with stat cards** -- first impression matters
8. **Real-time status updates** -- modern expectation
9. **Document upload (BOL, POD)** -- operational necessity
10. **Driver PWA with status updates** -- drivers need mobile access day one

### Phase 2 -- intelligence that creates differentiation:
1. **Marie AI assistant** -- the headline differentiator
2. **Smart routing suggestions** -- makes dispatch 10x faster
3. **Predictive alerts** -- prevents revenue-losing mistakes
4. **Analytics dashboard charts** -- operators crave visibility
5. **Enhanced dispatch board** -- map + timeline views
6. **Push notifications** -- keeps drivers and dispatchers connected

### Phase 3 -- operational depth that locks in customers:
1. **Compliance module** -- prevents regulatory fines, high retention value
2. **Fleet management** -- maintenance and fuel tracking reduce costs
3. **CRM** -- relationship management prevents churn to competitors
4. **Cross-module integration** -- makes the all-in-one promise real

### Defer:
- **Billing/subscriptions (Phase 4):** Free tier until Phase 4 is fine. Do not gate features behind billing before the product has users.
- **White-label (Phase 4):** No enterprise customers will need this before the core product is proven. Configuration-ready architecture is enough.
- **PDF report generation (Phase 4):** Charts and dashboards serve reporting needs until formal PDF reports are needed.
- **Onboarding wizard (Phase 4):** Manual setup is acceptable for early adopters. Wizard improves conversion at scale.
- **Multi-stop loads:** Not in any PRD phase. Single pickup/delivery covers 80%+ of small carrier loads. Add when customer demand emerges.
- **QuickBooks integration:** Not in any PRD phase. Consider for Phase 4 or post-launch. TruckingOffice, Axon, and Truckbase all offer this and it is frequently requested.
- **ELD/telematics integrations:** Referenced in PRD-03 (IFTA, fuel card sync) but no detailed integration specs. This needs deeper research when Phase 3 begins. Motive and Samsara both have public APIs.
- **Driver settlements:** Common feature in Axon, TruckingOffice, TruckLogics. Not in Manifest's PRD. Consider for post-launch based on demand.

---

## Competitive Gap Analysis

### Where Manifest Leads

| Advantage | vs. Which Competitors | Why It Matters |
|-----------|-----------------------|----------------|
| AI assistant with action execution | All listed competitors | No small/mid-carrier tool has a conversational AI that can create loads, dispatch drivers, and answer operational questions |
| DOT + non-DOT unified platform | All listed competitors | Medical transport operators currently use separate NEMT software. Manifest serves them alongside traditional trucking. |
| Integrated logistics CRM | Motive, Samsara, TruckingOffice, FleetRabbit | Most competitors either have no CRM or require external CRM integration |
| Owner-operator to fleet scaling | TruckingOffice (too basic), Rose Rocket (too complex) | One product that grows with the business instead of forcing a platform switch |
| Low infrastructure cost ($60-160/mo) | Samsara ($27-45/vehicle/mo), Motive (hardware + subscription) | Manifest can price aggressively because there is no hardware dependency |

### Where Manifest Trails

| Gap | Competitors with Advantage | Impact | Mitigation |
|-----|---------------------------|--------|------------|
| No ELD/GPS hardware | Motive, Samsara | Cannot offer first-party real-time vehicle tracking without integration. Limits location accuracy. | ELD integrations planned but not detailed. Prioritize Motive + Samsara API integrations. |
| No driver settlements | Axon, TruckingOffice, TruckLogics | Owner-operators and small fleets expect driver pay calculations. | Track revenue per driver. Build basic settlement reports in Phase 4+ or integrate with payroll providers. |
| No load board integration | Truckbase (limited), Alvys | Carriers sourcing freight want loads to flow from DAT/Truckstop into TMS. | Out of scope per PRD. Consider API import from load boards post-launch. |
| No accounting integration | TruckingOffice (QuickBooks), Axon (built-in accounting) | Carriers want invoice data to flow into QuickBooks without manual re-entry. | QuickBooks/Xero integration should be considered for Phase 4 or post-launch. High demand feature. |
| No native mobile app | Motive, Samsara (native iOS/Android) | PWA has limitations on iOS (push notification support only since iOS 16.4, no background GPS). | PWA is pragmatic for v1. Monitor iOS PWA improvements. Native app is a future consideration only if PWA limitations hurt adoption. |
| No multi-stop load support | Rose Rocket, Axon, Alvys | LTL carriers and multi-drop operations need multiple stops per load. | Single pickup/delivery covers most small carrier use cases. Add multi-stop when demand justifies complexity. |
| No HOS visibility | Motive, Samsara (native ELD) | Dispatchers want to see remaining drive hours before assigning loads. | Depends on ELD integration. Display HOS from integrated ELD data. Do not build HOS tracking from scratch. |

---

## Market Positioning Summary

Manifest occupies a unique position: **more capable than budget tools (TruckingOffice, FleetRabbit), more affordable than enterprise platforms (Rose Rocket, Axon), and more flexible than hardware-locked ecosystems (Motive, Samsara).**

The AI assistant (Marie) and multi-vehicle-class support (medical vans to semis) are the two features that no direct competitor matches. The all-in-one approach (dispatch + fleet + compliance + CRM) eliminates the common small-carrier problem of juggling 3-5 separate tools.

The biggest risk is that carriers who already use Motive or Samsara for ELD/GPS may see Manifest as redundant rather than complementary. The integration story (pulling ELD data into Manifest's intelligence layer) must be strong to overcome this.

---

## Sources

- [Motive (formerly KeepTruckin) official site](https://gomotive.com/)
- [Motive review - Tech.co](https://tech.co/fleet-management/motive-review)
- [Samsara official site - G2 #1 Fleet Management](https://www.samsara.com/company/news/press-releases/Samsara-Ranks-No-1-in-Fleet-Management-on-G2-for-2025)
- [Samsara review - Tech.co](https://tech.co/fleet-management/samsara-fleet-management-review)
- [Rose Rocket TMS.ai launch](https://www.roserocket.com/blog/release-rose-rocket-launches-tms-ai)
- [TruckingOffice official site](https://www.truckingoffice.com/)
- [Axon Software TMS overview](https://axonsoftware.com/transportation-management-system/)
- [Truckbase vs Alvys - FreightWaves](https://ratings.freightwaves.com/truckbase-vs-alvys-tms-for-carriers/)
- [Top NEMT software 2025 - NEMTrepreneur](https://www.nemtrepreneur.com/blog/top-10-nemt-software-for-2025-and-how-they-compare)
- [Best software for small trucking companies - Toro TMS](https://www.torotms.com/blog/best-software-for-small-trucking-company)
- [TMS solutions for 2026 - FleetOwner](https://www.fleetowner.com/product-spotlight/article/55325608/product-spotlight-tms-solutions-for-2026)
- [AI-powered TMS trends - FTM Cloud](https://ftm.cloud/blog/ai-powered-tms-logistics-transformation/)
- [Fleet management apps for owner operators 2025 - Heavy Duty Journal](https://heavydutyjournal.com/mobile-fleet-management-apps-for-owner-operators-2025/)

**Confidence levels:**
- Table stakes categorization: HIGH (verified across multiple competitor platforms)
- Differentiator assessment: MEDIUM-HIGH (Marie AI is genuinely novel for the segment; DOT+non-DOT unification verified against competitor feature sets)
- Anti-features rationale: HIGH (aligned with PRD scope and validated against market realities)
- Competitive gap analysis: MEDIUM (based on public feature lists and reviews; actual implementation depth of competitors was not hands-on tested)
