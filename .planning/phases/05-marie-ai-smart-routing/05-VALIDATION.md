---
phase: 5
slug: marie-ai-smart-routing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest with jsdom (exists) |
| **Config file** | vitest.config.ts (exists) |
| **Quick run command** | `npx vitest run tests/marie/ tests/routing/ --reporter=verbose` |
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
| 5-01-01 | 01 | 1 | MARI-04,05,07 | unit | `npx vitest run tests/marie/context.test.ts tests/marie/tools.test.ts` | ❌ W0 | ⬜ pending |
| 5-01-02 | 01 | 1 | ROUT-01,02 | unit | `npx vitest run tests/routing/scoring.test.ts` | ❌ W0 | ⬜ pending |
| 5-02-01 | 02 | 2 | MARI-01,02,03,06,08,09,10 | unit | `npx vitest run tests/marie/chat.test.ts` | ❌ W0 | ⬜ pending |
| 5-02-02 | 02 | 2 | ROUT-03,04,05 | unit | `npx vitest run tests/routing/suggestions.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/marie/context.test.ts` — org context builder, role checks
- [ ] `tests/marie/tools.test.ts` — tool definitions and parameter validation
- [ ] `tests/routing/scoring.test.ts` — scoring algorithm with weighted factors
- [ ] `tests/marie/chat.test.ts` — chat panel rendering stubs
- [ ] `tests/routing/suggestions.test.ts` — suggestion UI rendering stubs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Marie answers questions | MARI-02 | Requires Claude API key | Ask "How many loads this week?", verify response |
| Marie executes actions | MARI-03 | Requires Claude API + Supabase | Ask "Create a load from Dallas to Houston", verify load created |
| Marie role enforcement | MARI-06 | Requires multi-role session testing | Login as driver, ask to create load, verify refusal |
| Smart routing proximity | ROUT-02 | Requires load/driver data with locations | Create load, verify drivers ranked by proximity |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
