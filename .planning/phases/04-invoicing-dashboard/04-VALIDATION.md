---
phase: 4
slug: invoicing-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest with jsdom (exists) |
| **Config file** | vitest.config.ts (exists) |
| **Quick run command** | `npx vitest run tests/invoices/ tests/dashboard/ --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | INV-01,02,03,04 | unit | `npx vitest run tests/invoices/schema.test.ts tests/invoices/status.test.ts` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 2 | INV-05,06,07 | unit | `npx vitest run tests/invoices/pdf.test.ts` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 2 | DASH-01,02,03,04,05 | unit | `npx vitest run tests/dashboard/stats.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/invoices/schema.test.ts` — invoice schema validation
- [ ] `tests/invoices/status.test.ts` — invoice status transitions
- [ ] `tests/invoices/pdf.test.ts` — PDF generation stubs
- [ ] `tests/dashboard/stats.test.ts` — dashboard stat calculation stubs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Invoice number auto-generation | INV-02 | Database trigger | Create invoice, verify INV-YYYYMM-NNN format |
| Overdue scanner pg_cron | INV-05 | Requires pg_cron runtime | Check invoices with past due_date update to 'overdue' |
| PDF download | INV-06 | Requires Supabase Storage | Generate PDF, verify download link works |
| Realtime dashboard updates | DASH-01 | Requires Supabase Realtime | Change load status, verify dashboard stat updates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
