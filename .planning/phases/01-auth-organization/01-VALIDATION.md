---
phase: 1
slug: auth-organization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x + @testing-library/react |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
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
| 1-01-01 | 01 | 1 | AUTH-01 | integration | `npx vitest run tests/auth/signup.test.ts -t "signup" --reporter=verbose` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | AUTH-02 | integration | `npx vitest run tests/auth/session.test.ts -t "session" --reporter=verbose` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | AUTH-03 | integration | `npx vitest run tests/auth/magic-link.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | AUTH-04 | unit (SQL) | `supabase db test` | ❌ W0 | ⬜ pending |
| 1-01-05 | 01 | 1 | AUTH-05 | unit | `npx vitest run tests/org/create.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | AUTH-06 | integration | `npx vitest run tests/auth/invite.test.ts -t "invite" --reporter=verbose` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | AUTH-07 | integration | `npx vitest run tests/auth/invite.test.ts -t "accept" --reporter=verbose` | ❌ W0 | ⬜ pending |
| 1-02-03 | 02 | 1 | AUTH-08 | unit (SQL) | `supabase db test` | ❌ W0 | ⬜ pending |
| 1-02-04 | 02 | 1 | AUTH-09 | unit | `npx vitest run tests/middleware/routing.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 1-02-05 | 02 | 1 | AUTH-10 | integration (SQL) | Cross-org isolation test | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest framework configuration
- [ ] `tests/auth/signup.test.ts` — stubs for AUTH-01
- [ ] `tests/auth/session.test.ts` — stubs for AUTH-02
- [ ] `tests/auth/magic-link.test.ts` — stubs for AUTH-03
- [ ] `tests/org/create.test.ts` — stubs for AUTH-05
- [ ] `tests/auth/invite.test.ts` — stubs for AUTH-06, AUTH-07
- [ ] `tests/middleware/routing.test.ts` — stubs for AUTH-09

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Magic link email delivery | AUTH-03 | Requires actual email service | Trigger magic link, verify email arrives, click link, verify login |
| Profile trigger fires on signup | AUTH-04 | Database trigger, verify via Supabase dashboard | Sign up, check profiles table has new row |
| RLS org isolation | AUTH-10 | Cross-org query test in Supabase SQL editor | Sign in as Org A user, attempt to SELECT from Org B data |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
