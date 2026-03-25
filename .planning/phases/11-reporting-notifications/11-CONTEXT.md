# Phase 11: Reporting & Notifications - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Advanced analytics dashboards (operations, fleet, drivers, customers, lanes), PDF report generation, scheduled recurring reports, and centralized notification system with multi-channel dispatch (in-app, push, email, SMS).

</domain>

<decisions>
## Implementation Decisions

### Analytics Dashboards
- analytics_snapshots table expansion per PRD-04 Section 3.2: add expenses, profit, cost_per_mile, profit_per_mile, deadhead metrics, fleet utilization, compliance score, customer counts, avg_days_to_pay
- driver_performance table: per-driver metrics (loads, miles, revenue, on-time %, mpg, safety, compliance)
- analytics-builder pg_cron: expanded from Phase 6 daily snapshot to compute all new metrics
- 6 analytics pages: /analytics (main), /analytics/operations, /analytics/fleet, /analytics/drivers, /analytics/customers, /analytics/reports

### PDF Reports
- Use @react-pdf/renderer (already installed from Phase 4 invoice PDF)
- Report types: P&L, fleet, compliance, driver performance
- Report generation triggered via API, stored in Supabase Storage
- Report history with download links
- Schedule recurring reports (weekly P&L, monthly fleet summary)

### Notification System
- notifications table per PRD-04 Section 4.2: user_id, category, priority, title, body, action_url, read status, channels_sent
- notification_preferences table: per-category channel toggles, quiet hours, timezone
- notification-dispatcher: triggered on INSERT to notifications, routes to enabled channels
- Channels: in-app (Supabase Realtime), push (already built Phase 6), email (Resend API), SMS (Twilio)
- Notification bell in header with unread count badge

### OO Analytics
- Simplified P&L view: income vs expenses
- Per-mile profitability
- Year-to-date tax estimate

### Claude's Discretion
- Analytics chart designs and layouts
- Report PDF templates
- Notification dropdown design
- Email template styling

</decisions>

<code_context>
## Existing Code
- Recharts charts from Phase 6 (revenue, load volume, on-time, RPM)
- @react-pdf/renderer from Phase 4 (invoice PDF)
- Push notification infra from Phase 6
- analytics_snapshots + daily snapshot generator from Phase 6
- Notification preferences pattern from Phase 6 settings
- All dashboard patterns established

### Integration
- Header: add notification bell
- Sidebar: add Analytics section with sub-nav
- Reports: use existing Supabase Storage patterns
- Email: Resend API (new dependency)
- SMS: Twilio (new dependency, env vars needed)
</code_context>

<deferred>
- Real-time analytics streaming — v2
- Custom report builder — v2
- Slack/Teams notification channel — v2
</deferred>
