---
phase: 2
slug: loads-drivers-vehicles
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/react 16.x |
| **Config file** | vitest.config.ts (exists from Phase 1) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | DRVR-01,02,03 | unit | `npx vitest run tests/drivers/schema.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | DRVR-04,07 | unit | `npx vitest run tests/drivers/list.test.ts tests/drivers/detail.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 1 | VEHI-01,02 | unit | `npx vitest run tests/vehicles/schema.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 2 | LOAD-01,02,03,04,05 | unit | `npx vitest run tests/loads/schema.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 2 | LOAD-06,07,08 | unit/integ | `npx vitest run tests/loads/status.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-03 | 02 | 2 | LOAD-10,11 | unit | `npx vitest run tests/loads/documents.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 3 | LOAD-12,13,14,17 | unit | `npx vitest run tests/loads/filters.test.ts tests/loads/kanban.test.ts tests/loads/detail.test.ts tests/loads/csv-export.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-02 | 03 | 3 | LOAD-15,16,DRVR-05,06 | unit | `npx vitest run tests/driver/loads.test.ts tests/drivers/driver-self.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/drivers/schema.test.ts` — stubs for DRVR-01, DRVR-02, DRVR-03
- [ ] `tests/drivers/list.test.ts` — stubs for DRVR-04
- [ ] `tests/drivers/detail.test.ts` — stubs for DRVR-07
- [ ] `tests/drivers/driver-self.test.ts` — stubs for DRVR-06
- [ ] `tests/vehicles/schema.test.ts` — stubs for VEHI-01, VEHI-02
- [ ] `tests/loads/schema.test.ts` — stubs for LOAD-01 through LOAD-05
- [ ] `tests/loads/status.test.ts` — stubs for LOAD-07
- [ ] `tests/loads/documents.test.ts` — stubs for LOAD-10, LOAD-11
- [ ] `tests/loads/filters.test.ts` — stubs for LOAD-12
- [ ] `tests/loads/kanban.test.ts` — stubs for LOAD-13
- [ ] `tests/loads/detail.test.ts` — stubs for LOAD-14
- [ ] `tests/loads/csv-export.test.ts` — stubs for LOAD-17
- [ ] `tests/driver/loads.test.ts` — stubs for LOAD-15, LOAD-16

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Load number auto-generation | LOAD-06 | Database trigger, needs live Supabase | Create load, verify load_number is auto-generated |
| Status history logging | LOAD-08 | Database trigger writes to history table | Change load status, verify load_status_history row |
| Realtime broadcasts | LOAD-09 | Requires Supabase Realtime connection | Open 2 tabs, change status in one, verify update in other |
| Driver-user link invitation | DRVR-05 | Requires Supabase Auth admin API | Link driver to user, verify invitation email sent |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
