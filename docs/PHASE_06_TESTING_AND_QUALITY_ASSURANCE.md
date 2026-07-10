# Phase 06 — Testing & Quality Assurance

> **Scope:** Admin Side. Derived strictly from the production audit.
> **Prerequisite:** Phases 1–5 complete.

---

## Phase Objective

Establish the automated test suite the audit found entirely absent (`tests/` is empty — zero tests). Prioritize the highest-risk paths surfaced by the audit: authentication, authorization/role gating, and the graduate import pipeline. Wire the suite into CI so regressions in future work (Alumni Portal, Employer modules) are caught automatically.

---

## Why this phase comes last

Tests should assert the **final** behavior. Every prior phase changes signatures or contracts — secret handling and audit logging (P1), queued import and dashboard queries (P2), lazy routing (P3), component APIs (P4), soft-delete/Policies/normalized endpoints (P5). Writing tests earlier would mean rewriting them repeatedly. Running QA last locks in a stable, production-shaped target and turns the whole roadmap's work into a regression-protected baseline.

---

## Issues Included

From the audit's Production Readiness and Code Quality sections:

1. 🔴 **Critical** — No test suite; `tests/` is empty.
2. Coverage focus dictated by the audit's highest risks:
   - Authentication flows (login, refresh, logout, forgot/reset, brute-force lockout).
   - Authorization/role middleware and (post-Phase-5) Policies.
   - The graduate import pipeline (now queued, N+1-free, with stricter row rejection).
3. Supporting: verify the two normalized auth endpoints, audit-log emission, soft-delete/restore behavior, and dashboard metric correctness are covered.
4. 🟢 **Nice to have** — TypeScript/JSDoc for API-contract type safety (documented as a follow-on, not required to pass this phase).

---

## Files or Modules Affected

**Backend:**
- `tests/` (Feature and Unit tests — currently empty)
- `phpunit.xml` (already present — confirm test DB config; note `DATE_FORMAT` MySQL-specificity from Phase 2)
- `database/factories/` (extend factories for User, Graduate, and related models as needed)
- CI configuration (add a test job)

**Frontend:**
- (Optional, if a frontend test runner is introduced) smoke tests for guards and the toast system. Not required to pass this phase unless a runner is already configured.

---

## Dependencies

- **Phases 1–5 complete** — all signatures/contracts finalized.
- A test database matching production driver behavior (MySQL) so `DATE_FORMAT` and other MySQL-specific SQL behave correctly (flagged in Phase 2).
- A queue configured for synchronous/inline execution in tests so the import job can be asserted.

---

## Detailed Implementation Tasks

| Task ID | Description | Expected Result | Risk | Complexity |
|---------|-------------|-----------------|------|------------|
| P6-T01 | Configure the test environment: test DB (MySQL-compatible), inline queue for jobs, factories for User/Graduate and related models. | Tests run deterministically against a realistic environment. | Medium | Medium |
| P6-T02 | Auth feature tests: successful login, invalid credentials (generic message), account-status blocking, refresh, logout/invalidation, forgot/reset (including email-enumeration-safe response and hashed-token check). | Auth behavior is locked by tests. | Medium | Medium |
| P6-T03 | Brute-force tests: email lockout at 5 failed attempts and IP lockout at 15 within the window; `BLOCKED` logging. | Lockout thresholds verified. | Medium | Medium |
| P6-T04 | Authorization tests: `role:admin` middleware blocks non-admins; `account.status` blocks suspended/deactivated users mid-session; (post-P5) Policies allow admins and deny others. | Role/permission gating verified. | Medium | Medium |
| P6-T05 | Import pipeline tests: valid file imports correct counts; duplicates detected; unresolvable college course rows rejected as errors (Phase 2 behavior); job runs on the queue; batch status transitions. | Import correctness and stability verified. | High | High |
| P6-T06 | Privileged-action audit tests: user create/update/status/reset, graduate delete/batch-update, blacklist add/remove each write an `audit_logs` row (Phase 1). | Audit emission verified. | Low | Medium |
| P6-T07 | Soft-delete tests: destroy soft-deletes; default lists exclude trashed; restore and force-delete work; exports/tracer exclude trashed (Phase 5). | Trash behavior verified. | Medium | Medium |
| P6-T08 | Contract tests: `updateProfile`/`changePassword` return `{success, message, data}` with a `UserResource` (no raw-model fields) (Phase 5). | Normalized endpoints verified. | Low | Low |
| P6-T09 | Dashboard metric tests: board passers/failed/not-taken, employment rate, and growth are correct with seeded data (Phase 2 `COUNT(DISTINCT)`/`whereNotExists`). | Dashboard correctness verified. | Medium | Medium |
| P6-T10 | Security-headers smoke test: responses include CSP, X-Frame-Options, nosniff, Referrer-Policy (Phase 1). | Headers verified present. | Low | Low |
| P6-T11 | Wire the suite into CI so it runs on every push/PR; fail the build on test failure. | Regressions blocked automatically. | Medium | Medium |
| P6-T12 | (Nice to have) Document a follow-on plan for TypeScript/JSDoc adoption on the API contract. | Type-safety path recorded (not blocking). | Low | Low |

---

## Validation Checklist

**Functional**
- [ ] All auth, authorization, import, audit, soft-delete, contract, and dashboard tests pass locally.
- [ ] Import test proves the job runs on the queue and produces correct counts.

**Security**
- [ ] Tests assert generic auth error messages, hashed reset tokens, lockout thresholds, role/status gating, and security headers.
- [ ] Tests confirm no privilege was broadened by Policies (deny paths covered).

**Performance**
- [ ] Import test confirms lookups are batched (no per-row query explosion) — assert via query count or timing bound.
- [ ] Dashboard test confirms cached behavior does not corrupt figures.

**UI**
- [ ] (If a frontend runner exists) guard redirects and toast rendering have smoke coverage. Otherwise documented as follow-on.

**Regression**
- [ ] The full suite passes in CI on a clean checkout.
- [ ] No previously-passing behavior from Phases 1–5 is broken (the suite encodes those behaviors).

---

## Completion Criteria

- A working test suite exists covering auth, authorization/Policies, import, audit emission, soft-delete, normalized endpoints, dashboard metrics, and security headers.
- The suite passes in CI on every push/PR and fails the build on any failure.
- The test DB matches production driver behavior (MySQL) so MySQL-specific SQL is exercised correctly.
- All Validation Checklist items are checked.

---

## Risks

- **Flaky environment**: mismatched test DB driver (e.g., SQLite) would make `DATE_FORMAT`-based queries behave differently and produce false failures/passes — use MySQL-compatible test infra.
- **Queue not inline in tests** would leave the import job unasserted — configure synchronous execution for tests.
- **Over-mocking** can make tests pass while real behavior breaks; prefer feature tests hitting real endpoints with factories.
- **Tests encoding buggy behavior**: if a metric was validated against known-good data in Phase 2, encode the corrected value, not the legacy one.

---

## Rollback Plan

- Tests are additive and cannot break production behavior; "rollback" means skipping/removing failing tests only if they are proven incorrect (not to hide real regressions).
- If a test reveals a real defect from an earlier phase, fix the defect rather than deleting the test; if urgent, revert the specific earlier-phase change per that phase's rollback plan.
- CI wiring can be disabled independently if it blocks unrelated urgent work, but should be restored immediately.

---

## Git Commit Recommendation

```
test(admin): add auth/authorization/import test suite and wire CI

- Configure test DB (MySQL-compatible) + inline queue + factories
- Feature tests: login/refresh/logout, forgot/reset, brute-force lockout
- Authorization tests: role & account-status middleware and Policies
- Import pipeline tests: counts, duplicates, error rejection, queued execution
- Audit-emission, soft-delete/restore, normalized-endpoint contract, dashboard-metric, and security-header tests
- Run suite in CI; fail build on any test failure

Phase 6 of 6 — Testing & Quality Assurance
```