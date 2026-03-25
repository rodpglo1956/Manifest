---
phase: 3
slug: dispatch
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest with jsdom (exists from Phase 1) |
| **Config file** | vitest.config.ts (exists) |
| **Quick run command** | `npx vitest run tests/dispatch/ --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/dispatch/ --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | DISP-01,08 | unit | `npx vitest run tests/dispatch/status.test.ts tests/dispatch/create.test.ts` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 2 | DISP-02,03,04 | unit | `npx vitest run tests/dispatch/board.test.ts tests/dispatch/availability.test.ts` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 2 | DISP-05,06,07 | unit | `npx vitest run tests/dispatch/driver-card.test.ts tests/dispatch/accept-reject.test.ts tests/dispatch/notes.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/dispatch/status.test.ts` — dispatch status transitions
- [ ] `tests/dispatch/create.test.ts` — createDispatch validation and load sync
- [ ] `tests/dispatch/accept-reject.test.ts` — accept/reject flow with load revert
- [ ] `tests/dispatch/availability.test.ts` — driver availability categorization
- [ ] `tests/dispatch/board.test.ts` — board data queries
- [ ] `tests/dispatch/driver-card.test.ts` — driver dispatch card
- [ ] `tests/dispatch/notes.test.ts` — driver notes validation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Realtime dispatch updates | DISP-08 | Requires Supabase Realtime | Open 2 tabs, create dispatch in one, verify update in other |
| Driver PWA dispatch notification | DISP-05 | Requires live Supabase + two user sessions | Create dispatch, verify driver sees it in PWA |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
