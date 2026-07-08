# PAC_ALUMNI_TRACKING_SYSTEM — Admin Side Production Roadmap

> **Scope:** Admin Side only. Derived strictly from the completed production audit.
> **Rule for executors:** Complete one phase fully — including its Validation Checklist and Completion Criteria — before starting the next. Each phase is self-contained.

---

## Executive Summary

The Admin Side of PAC_ALUMNI_TRACKING_SYSTEM is architecturally strong on the backend (clean Controller → Service → Repository layering, UUID route binding, whitelisted sort columns, HTMLPurifier + DOMPurify double XSS defense, brute-force lockout, blacklist-enabled JWT) but is **not yet production-ready**. The blockers are a small, well-defined set: committed secrets, debug mode enabled, no admin audit trail, a synchronous import path that will time out at scale, no code-splitting on the frontend, an unfilled design system causing heavy duplication, no user-facing error feedback, and a complete absence of automated tests.

This roadmap sequences every audit finding into **six execution phases plus a final go/no-go checklist**, ordered so that security-critical and foundational work lands first and cosmetic/feature work lands last. No new issues are introduced; every item traces to the audit.

---

## Overall Production Readiness

**Current state: NOT PRODUCTION-READY.**

| Dimension | Status | Notes |
|-----------|--------|-------|
| Backend architecture | 🟢 Strong | Layering, contracts, resources, enums all above-average. |
| Backend security | 🟠 At risk | Committed `.env` secrets, `APP_DEBUG=true`, no audit log, no security headers. |
| Backend performance | 🟠 At risk | Synchronous import with N+1; ~20 uncached dashboard queries. |
| Frontend performance | 🟠 At risk | No code-splitting; unmemoized AuthContext; 750-line dashboard. |
| Frontend quality/UX | 🔴 Weak | Empty `ui/` primitives, massive Tailwind duplication, no admin toast/error feedback. |
| Missing features | 🟠 Partial | No admin audit log, no soft-delete/Trash, import not queued. |
| Testing | 🔴 None | `tests/` is empty — zero automated tests. |

---

## Current Project Status

- Admin Side is **functionally near-complete** across ~40 pages (users, graduates, departments/courses, verification/blacklist, employers, job moderation, announcements, analytics, tracer, reports, notifications, login logs, settings).
- Backend endpoints, services, repositories, form requests, and resources exist and are consistently structured, with two known off-contract auth endpoints.
- The intended `src/ui/` design system exists as **0-byte stubs** and was never implemented.
- No automated test suite exists.

---

## Total Number of Phases

**6 implementation phases + 1 final production checklist** (8 documents total including this roadmap).

| Phase | Document | Theme |
|-------|----------|-------|
| 1 | `PHASE_01_CRITICAL_SECURITY_FIXES.md` | Secrets, debug mode, audit log, password-reset leak, headers |
| 2 | `PHASE_02_BACKEND_PERFORMANCE.md` | Queued import, N+1 fixes, dashboard caching, indexes, query correctness |
| 3 | `PHASE_03_FRONTEND_PERFORMANCE.md` | Code-splitting, AuthContext memoization, dashboard decomposition |
| 4 | `PHASE_04_FRONTEND_REFACTOR_AND_DESIGN_SYSTEM.md` | `ui/` primitives, shared Modal/DataTable, toast/error UX, theme tokens |
| 5 | `PHASE_05_MISSING_PRODUCTION_FEATURES.md` | Soft-delete/Trash, expanded settings, Policies/Gates, contract normalization |
| 6 | `PHASE_06_TESTING_AND_QUALITY_ASSURANCE.md` | Test suite for auth, authorization, import |
| — | `FINAL_PRODUCTION_CHECKLIST.md` | Consolidated go/no-go gate |

---

## Phase Execution Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Final Checklist
```

**Rationale for the order:**

1. **Phase 1 (Critical Security)** first — the committed secrets and debug mode are exploitable *right now*; nothing else matters until they are closed. The admin audit log is also foundational: later phases (soft-delete, settings) should emit audit events, so the audit-log substrate must exist first.
2. **Phase 2 (Backend Performance)** second — the synchronous import can time out and silently fail; this is a correctness-and-stability blocker independent of the frontend. Backend must be stable before the frontend is optimized against it.
3. **Phase 3 (Frontend Performance)** third — code-splitting and re-render fixes are structural and must land *before* the design-system refactor so the refactor is applied to a lazy-loaded, memoized baseline (avoiding rework).
4. **Phase 4 (Frontend Refactor & Design System)** fourth — builds the shared `ui/` primitives and migrates pages onto them; depends on the performance baseline from Phase 3 to avoid touching the same files twice.
5. **Phase 5 (Missing Features)** fifth — soft-delete, expanded settings, and Policies build on the audit-log and stable backend; they also consume the shared UI components from Phase 4 (Modal, Toast, DataTable).
6. **Phase 6 (Testing)** last — tests are written against the *final* stabilized behavior so they don't need constant rewriting as earlier phases change signatures.

---

## Estimated Timeline

Indicative effort assuming a single focused developer/agent. Adjust to team capacity.

| Phase | Estimated Duration | Complexity Weight |
|-------|--------------------|-------------------|
| Phase 1 — Critical Security | 1–2 days | Mixed (config = Low, audit log = Medium) |
| Phase 2 — Backend Performance | 2–4 days | High (queued import), Medium (indexes/caching) |
| Phase 3 — Frontend Performance | 1–2 days | Medium |
| Phase 4 — Frontend Refactor & Design System | 4–7 days | High (breadth of migration) |
| Phase 5 — Missing Features | 3–5 days | Medium–High |
| Phase 6 — Testing & QA | 2–4 days | Medium |
| **Total** | **~13–24 days** | — |

---

## Risk Matrix

| Risk | Likelihood | Impact | Where Addressed | Mitigation |
|------|-----------|--------|-----------------|------------|
| Leaked JWT secret enables admin token forgery | High (if repo public) | Critical | Phase 1 | Rotate secrets, remove `.env`, gitignore |
| `APP_DEBUG=true` leaks stack traces/secrets | High | High | Phase 1 | Force production env config |
| Plaintext temp password in reset response | Medium | High | Phase 1 | Email one-time link instead |
| No audit trail for destructive admin actions | Certain (currently absent) | High | Phase 1 (substrate) + Phase 5 (emit) | Add audit log + wire events |
| Import times out / silently fails at scale | High at volume | High | Phase 2 | Queue the job, fix N+1, batch checks |
| Dashboard slow under load | Medium | Medium | Phase 2 | Cache aggregate, fix `distinct()->count()` |
| Missing DB indexes → slow filters & login lookups | Medium | Medium | Phase 2 | Add/verify indexes |
| Oversized bundle (all roles shipped to admin) | Certain | Medium | Phase 3 | Route-level `React.lazy` |
| No user-facing error feedback (errors swallowed) | Certain | Medium (UX) | Phase 4 | App-wide toast system |
| Design-system duplication blocks maintainability | Certain | Medium | Phase 4 | Fill `ui/` primitives, theme tokens |
| Hard deletes irreversible | Medium | Medium | Phase 5 | Soft-delete + Trash/Restore |
| Zero tests → regressions undetected | Certain | High | Phase 6 | Auth/authz/import test suite |

---

## Dependency Graph

```
Phase 1 (Security + Audit-Log substrate)
   │
   ├──> Phase 2 (Backend Performance)  ── requires stable, secure backend
   │        │
   │        └──> Phase 3 (Frontend Performance)  ── optimizes against stable API
   │                 │
   │                 └──> Phase 4 (Design System)  ── refactors the lazy/memoized baseline
   │                          │
   │                          └──> Phase 5 (Features)  ── consumes Modal/Toast/DataTable
   │                                   │                    + emits audit events (from P1)
   │                                   └──> Phase 6 (Testing)  ── tests final behavior
   │
   └──> (Audit-log substrate from P1 is a prerequisite for P5 event emission)
```

**Hard dependencies:**
- Phase 5's audit-event emission **requires** Phase 1's audit-log table/service.
- Phase 4 **requires** Phase 3 (avoid double-editing the same pages).
- Phase 6 **requires** all prior phases (tests target final signatures).

**Soft dependencies:** Phase 5 UI (Trash pages, settings forms) is cleaner if built on Phase 4 components, but could be done with inline markup if urgently needed.

---

## Priority Matrix

| Priority | Items | Phase |
|----------|-------|-------|
| 🔴 Critical (block launch) | Remove `.env`/rotate secrets; `APP_DEBUG=false`; stop plaintext password leak; admin audit log; test suite | 1, 6 |
| 🟠 High | Queue import + fix N+1; frontend code-splitting; app-wide toast/error feedback; security headers; DB indexes; TrustProxies | 1, 2, 3, 4 |
| 🟡 Medium | Fill `ui/` primitives + shared Modal/DataTable/SearchInput/StatCard + theme tokens; Policies/Gates; normalize off-contract endpoints; fix `distinct()->count()`; cache dashboard; harden upload; soft-delete/Trash; memoize AuthContext; split DashboardPage | 2, 4, 5 |
| 🟢 Nice to have | Invalidate other JWTs on password change; move inline `email-logs` route to controller; modal focus-trap/ESC; TypeScript/JSDoc; scheduled reports; expanded settings | 4, 5 |

---

## Overall Completion Checklist

- [ ] **Phase 1** complete — secrets rotated & removed, debug off, audit log live, password-reset leak closed, security headers set.
- [ ] **Phase 2** complete — import queued & N+1-free, dashboard cached & correct, indexes verified, TrustProxies configured.
- [ ] **Phase 3** complete — routes lazy-loaded, AuthContext memoized, DashboardPage decomposed.
- [ ] **Phase 4** complete — `ui/` primitives filled, shared Modal/DataTable/SearchInput/StatCard in use, app-wide toast/error feedback, theme tokens adopted.
- [ ] **Phase 5** complete — soft-delete/Trash, Policies/Gates, normalized endpoints, expanded settings, audit events emitted.
- [ ] **Phase 6** complete — auth/authorization/import tests passing in CI.
- [ ] **FINAL_PRODUCTION_CHECKLIST.md** fully green — Go decision recorded.

---

*End of ROADMAP.md*
