# FINAL PRODUCTION CHECKLIST — Admin Side

> **Scope:** Admin Side. Consolidated go/no-go gate derived strictly from the production audit and the six phase documents.
> **Rule:** Every 🔴 Critical item must be green before a Go decision. This checklist is the single source of truth for launch readiness.

---

## Security Checklist

- [ ] 🔴 No `.env` tracked in the repo/archive; `.gitignore` excludes it; `.env.example` is placeholder-only. *(Phase 1)*
- [ ] 🔴 `JWT_SECRET` and `APP_KEY` rotated; tokens signed with the old secret are rejected. *(Phase 1)*
- [ ] 🔴 `APP_ENV=production` and `APP_DEBUG=false`; error responses are generic (no stack traces). *(Phase 1)*
- [ ] 🔴 Admin password reset emails a one-time link; no plaintext temporary password is returned anywhere. *(Phase 1)*
- [ ] 🔴 Admin audit log records every privileged/destructive action (create/update/suspend user, delete/batch-update graduate, blacklist add/remove, soft-delete/restore/force-delete, settings changes). *(Phase 1 + Phase 5)*
- [ ] 🟠 Security headers present on all responses: CSP, X-Frame-Options, X-Content-Type-Options (nosniff), Referrer-Policy, HSTS (production). *(Phase 1)*
- [ ] 🟠 `TrustProxies` configured; login logs and throttles key off the real client IP. *(Phase 1)*
- [ ] 🟠 CORS `allowed_origins` restricted to the production frontend domain (not localhost). *(Phase 1)*
- [ ] 🟡 Password change invalidates the user's other active JWT sessions. *(Phase 1)*
- [ ] 🟡 Import upload hardened with real content sniffing (beyond extension/MIME). *(Phase 2/Phase 5)*
- [ ] ✅ Confirmed intact from audit: no SQL injection (parameterized queries, whitelisted sorts); XSS double-defended (HTMLPurifier + DOMPurify); IDOR mitigated (UUID route binding); brute-force lockout active; email enumeration prevented; reset tokens hashed at rest; JWT blacklist enabled.

---

## Performance Checklist

- [ ] 🟠 Graduate import runs on the queue; the request returns immediately with a batch handle. *(Phase 2)*
- [ ] 🟠 Import is N+1-free (courses/departments preloaded; duplicate checks batched). *(Phase 2)*
- [ ] 🟡 Dashboard payload is cached; repeat loads show a large reduction in DB queries. *(Phase 2)*
- [ ] 🟠 Frontend routes are code-split (`React.lazy` + `Suspense`); admin entry no longer bundles alumni/employer page code. *(Phase 3)*
- [ ] 🟡 `AuthContext` value is memoized; consumers don't re-render on unrelated updates. *(Phase 3)*
- [ ] 🟡 `DashboardPage` decomposed into memoized children; chart data memoized. *(Phase 3)*
- [ ] Bundle size measured before/after and confirmed reduced for the admin entry. *(Phase 3)*

---

## Backend Checklist

- [ ] 🟡 `distinct()->count()` replaced with `COUNT(DISTINCT ...)`; `whereNotIn(pluck())` replaced with `whereNotExists`. *(Phase 2)*
- [ ] Import rejects unresolvable college-course rows as errors (no orphaned `course_id = null` rows that vanish from tracer exports). *(Phase 2)*
- [ ] 🟡 Policies/Gates introduced; preserve current admin-only behavior; centralize scattered inline checks. *(Phase 5)*
- [ ] 🟡 `AuthController::updateProfile` and `changePassword` use the `ApiResponse` trait and return a `UserResource` (no raw-model leakage). *(Phase 5)*
- [ ] 🟢 Inline `email-logs` route moved into a controller. *(Phase 5)*
- [ ] A supervised queue worker runs in the production environment. *(Phase 2)*
- [ ] ✅ Confirmed intact from audit: Controller → Service → Repository layering, Form Requests, API Resources, Enums, centralized exception rendering.

---

## Frontend Checklist

- [ ] 🔴 (UX-critical) App-wide toast/error feedback exists; no admin action fails silently via `console.error` only. *(Phase 4)*
- [ ] 🟡 `src/ui/` primitives implemented (Button, Card, Input, Select, Modal, DataTable, Toast) — no 0-byte stubs remain. *(Phase 4)*
- [ ] 🟡 Shared `SearchInput`, `FilterBar`, `StatCard`, `Alert` in use where duplication existed. *(Phase 4)*
- [ ] 🟡 The 9 hand-rolled modals replaced by one shared, accessible `Modal`. *(Phase 4)*
- [ ] 🟡 Hardcoded color literals migrated to Tailwind theme tokens. *(Phase 4)*
- [ ] Admin pages consume shared primitives; duplicated Tailwind strings eliminated. *(Phase 4)*
- [ ] New Trash and expanded-settings screens use the shared components. *(Phase 5)*

---

## UI/UX Checklist

- [ ] Visual parity after migration (colors via tokens; look preserved). *(Phase 4)*
- [ ] Consistent spacing, typography, button styles, and modal behavior across all admin pages. *(Phase 4)*
- [ ] Loading, empty, and error states are consistent (shared components). *(Phase 4)*
- [ ] Delete actions communicate that records go to Trash and can be restored. *(Phase 5)*
- [ ] Import page shows a queued/progress state instead of blocking. *(Phase 2/Phase 3)*
- [ ] Success/failure of every admin action produces a visible toast. *(Phase 4)*

---

## Accessibility Checklist

- [ ] Modals trap focus, restore focus on close, and close on ESC. *(Phase 4)*
- [ ] Buttons, inputs, and selects are keyboard-navigable. *(Phase 4)*
- [ ] Suspense loading states do not trap or disorient keyboard/screen-reader users. *(Phase 3)*
- [ ] Theme is token-driven and dark-mode-capable (toggle optional). *(Phase 4)*

---

## Database Checklist

- [ ] 🟡 Indexes present and verified with `EXPLAIN`: `graduates(education_level, graduation_year, department_id, course_id)`, `graduates(last_name)`, `users(role, status, last_login_at)`, `board_exam_records(graduate_id, status)`, `alumni_profiles(employment_status, graduate_id)`, `login_activity_logs(email, ip, created_at)`. *(Phase 2)*
- [ ] Soft-delete `deleted_at` added to `graduates` and `users`; default scopes exclude trashed rows; exports/tracer exclude trashed. *(Phase 5)*
- [ ] `audit_logs` table exists and is written to by all privileged actions. *(Phase 1 + Phase 5)*
- [ ] `DATE_FORMAT` MySQL-specific query is compatible with the production and test databases. *(Phase 2/Phase 6)*
- [ ] ✅ Confirmed intact from audit: eager loading correct elsewhere; pagination used consistently.

---

## Testing Checklist

- [ ] 🔴 A working automated test suite exists (was empty at audit). *(Phase 6)*
- [ ] Auth flows tested: login, invalid credentials, account-status blocking, refresh, logout, forgot/reset. *(Phase 6)*
- [ ] Brute-force lockout tested (5/email, 15/IP, 15-min window; BLOCKED logging). *(Phase 6)*
- [ ] Authorization tested: `role:admin`, `account.status`, and Policies (allow and deny paths). *(Phase 6)*
- [ ] Import pipeline tested: counts, duplicates, error rejection, queued execution, batch status. *(Phase 6)*
- [ ] Audit emission, soft-delete/restore, normalized-endpoint contract, dashboard metrics, and security headers tested. *(Phase 6)*
- [ ] Suite runs in CI and fails the build on any failure. *(Phase 6)*
- [ ] Test DB matches production driver behavior (MySQL); queue runs inline in tests. *(Phase 6)*

---

## Production Deployment Checklist

- [ ] Secrets injected from the environment/secret store (not files); rotated values in place. *(Phase 1)*
- [ ] `APP_ENV=production`, `APP_DEBUG=false` confirmed on the deployed environment. *(Phase 1)*
- [ ] Supervised queue worker deployed and running. *(Phase 2)*
- [ ] CORS origin, TrustProxies, and security headers verified on the deployed environment. *(Phase 1)*
- [ ] Database migrations (indexes, `deleted_at`, `audit_logs`) applied; index-creation ran in a maintenance window if tables are large. *(Phases 1, 2, 5)*
- [ ] Mail transport configured for admin reset-link and reminder/announcement mail. *(Phase 1)*
- [ ] Cache backend configured for the dashboard cache with a documented TTL. *(Phase 2)*
- [ ] CI green on the release commit. *(Phase 6)*
- [ ] Rollback tags exist for each phase; per-phase rollback plans reviewed.

---

## Final Go / No-Go Decision Checklist

**GO requires ALL of the following to be true:**

- [ ] 🔴 Every Critical item in Security, Frontend (toast/error feedback), and Testing is green.
- [ ] All 🟠 High-priority items across phases are green (queued import, code-splitting, security headers, indexes, TrustProxies).
- [ ] The full test suite passes in CI on the release commit.
- [ ] The deployed environment passes the Production Deployment Checklist.
- [ ] Audit logging is confirmed live for all privileged actions.
- [ ] No open regression from any phase's Validation Checklist.
- [ ] Rollback plans and phase tags are in place.

**Decision:**

- [ ] ✅ **GO** — all conditions above met; Admin Side approved for production.
- [ ] ⛔ **NO-GO** — one or more conditions unmet; record blockers below and return to the owning phase.

**Blockers (if NO-GO):**

| Blocker | Owning Phase | Owner | Target Date |
|---------|-------------|-------|-------------|
| | | | |

---

*End of FINAL_PRODUCTION_CHECKLIST.md*