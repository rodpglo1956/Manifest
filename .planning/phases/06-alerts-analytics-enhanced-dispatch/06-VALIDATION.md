---
phase: 6
slug: alerts-analytics-enhanced-dispatch
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest with jsdom (exists) |
| **Config file** | vitest.config.ts (exists) |
| **Quick run command** | `npx vitest run tests/alerts/ tests/analytics/ tests/dispatch/ --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Wave 0 Requirements

- [ ] `tests/alerts/generators.test.ts` — alert SQL function logic stubs
- [ ] `tests/alerts/ui.test.ts` — alert display component stubs
- [ ] `tests/analytics/snapshots.test.ts` — daily snapshot aggregation stubs
- [ ] `tests/analytics/charts.test.ts` — chart rendering stubs
- [ ] `tests/dispatch/map.test.ts` — map view stubs
- [ ] `tests/dispatch/timeline.test.ts` — timeline view stubs
- [ ] `tests/push/subscription.test.ts` — push subscription stubs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| pg_cron alert generation | ALRT-01,02,05,06 | Requires live Supabase with pg_cron | Verify alerts created on schedule |
| Push notification delivery | PUSH-01,02,03,04 | Requires browser push permission | Enable push, trigger event, verify notification |
| Map view rendering | EDSP-01 | Requires MapLibre + tile server | Open dispatch, verify map with pins |
| Conflict detection | EDSP-03 | Requires overlapping load data | Assign driver with overlap, verify warning |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
