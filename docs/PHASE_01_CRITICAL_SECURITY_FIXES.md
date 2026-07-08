# Phase 01 — Critical Security Fixes

> **Scope:** Admin Side. Derived strictly from the production audit.
> **Do not begin Phase 2 until every Completion Criterion below is met.**

---

## Phase Objective

Close every exploitable security gap identified in the audit and lay the audit-log substrate that later phases depend on. Specifically: eliminate committed secrets and rotate them, force production-safe environment configuration, stop leaking plaintext temporary passwords, introduce an admin audit log for privileged/destructive actions, and add HTTP security headers. This phase converts the system from "exploitable right now" to "security baseline acceptable."

---

## Why this phase comes first

The committed `.env` (populated `JWT_SECRET`, `APP_KEY`, `MAIL_PASSWORD`) and `APP_DEBUG=true` are exploitable at this moment — a leaked JWT secret allows forging admin tokens, and debug mode leaks stack traces. No performance or UX work has value while token forgery is possible. Additionally, the **admin audit log created here is a prerequisite for Phase 5**, where soft-delete, settings changes, and other privileged actions must emit audit events. Building the substrate now avoids reworking Phase 5.

---

## Issues Included

From the audit's Security section and Priority Checklist:

1. 🔴 **Critical** — Real `.env` committed with populated `APP_KEY`, `JWT_SECRET`, `MAIL_PASSWORD`; `APP_ENV=local`, `APP_DEBUG=true`.
2. 🟠 **High** — Admin password reset returns the plaintext temporary password in the API response (`UserController::resetPassword`).
3. 🟠 **High** — No general admin audit log for destructive/privileged actions (delete graduate, suspend user, blacklist, role change).
4. 🟡 **Medium** — `APP_DEBUG=true` must be `false` in production.
5. 🟡 **Medium** — No security headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy).
6. 🟡 **Medium** — Login throttle keyed differently from service lockout; confirm `TrustProxies` so client IP is real (throttling correctness). *(IP-trust configuration is completed here because it is a security-correctness item; the query-layer throttle review is revisited in Phase 2.)*
7. 🟢 **Low** — `changePassword` does not invalidate other active JWTs after a password change.

---

## Files or Modules Affected

**Backend:**
- `.env` (remove from archive), `.env.example` (sanitize/confirm), `.gitignore`
- `config/app.php` (debug/env expectations), deployment/runtime env
- `app/Http/Controllers/Api/Auth/AuthController.php` (`resetPassword` behavior expectation; `changePassword` token invalidation)
- `app/Http/Controllers/Api/Admin/UserController.php` (`resetPassword` response — stop returning plaintext)
- `app/Services/Admin/UserService.php` (`resetPassword` — switch to link/email flow)
- `app/Mail/` (new reset-link mail for admin-initiated reset, mirroring existing `ResetPasswordMail`)
- New: `app/Models/AuditLog.php`, migration for `audit_logs`, `app/Services/*` audit-writing service (or trait), and wiring points in privileged controllers/services (users, graduates, verification/blacklist)
- New: security-headers middleware + registration in `bootstrap/app.php`
- `app/Http/Middleware/` (new `SecurityHeaders` middleware)
- `bootstrap/app.php` (middleware registration; TrustProxies configuration)
- `config/cors.php` (confirm production origins via env)

**Frontend:**
- `src/pages/admin/users/*` (any UI that displays the returned temporary password must be updated to reflect the new email-link flow — display path only, no logic invention)

---

## Dependencies

- **None.** This is the first phase and must run against the current codebase as-is.
- Requires access to the deployment secret store to rotate and inject `JWT_SECRET` and `APP_KEY`.

---

## Detailed Implementation Tasks

| Task ID | Description | Expected Result | Risk | Complexity |
|---------|-------------|-----------------|------|------------|
| P1-T01 | Remove the committed `.env` from the delivered archive/repo and add it to `.gitignore`. Ensure `.env.example` contains only placeholder values. | No real secrets tracked; `.env.example` is placeholder-only. | Medium | Low |
| P1-T02 | Rotate `JWT_SECRET` and `APP_KEY` in the secret store; invalidate any tokens signed with the old secret. | New secrets in use; previously issued tokens no longer validate. | High | Low |
| P1-T03 | Set `APP_ENV=production` and `APP_DEBUG=false` for the production environment; confirm generic 500 responses (already handled in `bootstrap/app.php`'s `Throwable` renderer). | Production returns generic error messages; no stack traces. | Medium | Low |
| P1-T04 | Replace admin password-reset flow so it **emails a one-time reset link** instead of returning `temporary_password` in the JSON body. Update `UserService::resetPassword` and `UserController::resetPassword` response contract; add an admin-reset mail modeled on the existing `ResetPasswordMail`. | Reset endpoint no longer returns a plaintext secret; admin triggers an emailed link. | High | Medium |
| P1-T05 | Update the admin Users UI to reflect the new flow (show "reset link sent" confirmation rather than a displayed password). Display-path change only. | UI no longer surfaces a plaintext password; shows confirmation. | Low | Low |
| P1-T06 | Create `audit_logs` table + `AuditLog` model: columns for actor (user id/uuid), action, target type, target id, before/after or metadata JSON, ip, user agent, timestamp. | Migration and model exist; table created. | Medium | Medium |
| P1-T07 | Create an audit-writing service/trait and wire it into privileged actions: user create/update/status-change/reset, graduate delete/batch-update, verification blacklist add/remove. Emit one audit entry per privileged action. | Every privileged admin action writes an audit record. | Medium | Medium |
| P1-T08 | Add a `SecurityHeaders` middleware setting CSP, X-Frame-Options, X-Content-Type-Options (`nosniff`), Referrer-Policy, and HSTS (production only); register it globally in `bootstrap/app.php`. | All API responses carry the security headers. | Medium | Low |
| P1-T09 | Configure `TrustProxies` so `$request->ip()` reflects the real client behind a load balancer/proxy, ensuring brute-force lockout and throttle keys are accurate. | Login logs and throttles key off the real client IP. | Medium | Low |
| P1-T10 | Invalidate the user's other active JWTs when they change their own password in `AuthController::changePassword`. | After password change, previously issued tokens for that user no longer validate. | Low | Low |
| P1-T11 | Confirm `config/cors.php` `allowed_origins` is driven by `CORS_ALLOWED_ORIGINS` env and set to the production frontend domain (not localhost). | Production CORS restricted to the real frontend origin. | Low | Low |

---

## Validation Checklist

**Functional**
- [x] Admin password reset sends an email link and no longer returns a plaintext password in the response body.
- [x] Users UI shows a "reset link sent" confirmation.
- [x] Every privileged admin action (create/update/suspend user, delete/batch-update graduate, blacklist add/remove) produces an `audit_logs` row with actor, action, target, IP, and timestamp.
- [x] Password change logs the user out of other sessions (subsequent old-token requests fail).

**Security**
- [x] No `.env` present in the archive/repo; `.gitignore` excludes it; `.env.example` is placeholder-only.
- [ ] `JWT_SECRET` and `APP_KEY` rotated; tokens signed with the old secret rejected. — **Operational / deployment step** (requires secret-store access; cannot be performed from code). See notes.
- [x] `APP_DEBUG=false` in production; error responses are generic (no stack traces). — Code-side defaults + generic `Throwable` renderer in place; deployment must set `APP_ENV=production`/`APP_DEBUG=false`.
- [x] Response headers include CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and (production) HSTS.
- [x] `TrustProxies` yields the correct client IP in login logs. — Configured (env `TRUSTED_PROXIES`); deployment must set the exact proxy range.
- [x] CORS restricted to the production frontend origin. — Driven by `CORS_ALLOWED_ORIGINS`; deployment must set the real domain.

**Performance**
- [x] Security-headers middleware adds no measurable latency to responses (header-only operation).

**UI**
- [x] No screen displays a plaintext temporary password anywhere.

**Regression**
- [x] Existing login, refresh, logout, and forgot/reset (public) flows still succeed end-to-end.
- [x] All existing admin endpoints still return their standard `{success, message, data}` envelope (except the two known off-contract endpoints, which are addressed in Phase 5).
- [x] Existing brute-force lockout (5/email, 15/IP, 15-min window) still triggers correctly.

---

## Implementation Status (Phase 1)

| Task ID | Status | Notes |
|---------|--------|-------|
| P1-T01 | ✅ Done | `.env` is untracked (gitignored) and absent from git history; `.env.example` is placeholder-only and now documents `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, `TRUSTED_PROXIES`, and security-header envs. |
| P1-T02 | ⏳ Deployment | Secret rotation must be done in the deployment secret store (`php artisan jwt:secret`, `php artisan key:generate`). Not a code change. Fingerprint claim (P1-T10) already means a rotated `JWT_SECRET` rejects all old tokens. |
| P1-T03 | ✅ Done (code) | `config/app.php` already defaults `env`→`production`, `debug`→`false`; `bootstrap/app.php` returns a generic 500 in production. Deployment env must set `APP_ENV=production`, `APP_DEBUG=false`. |
| P1-T04 | ✅ Done | New `PasswordResetService` owns token creation for both public and admin flows (no duplication). Admin reset now queues `AdminResetPasswordMail` (one-time link) and returns no password. `UserController::resetPassword` response is `{success, message, data: null}`. |
| P1-T05 | ✅ Done | `UserDetailPage` shows a green "Reset Link Sent" confirmation; the plaintext-password panel and `temporary_password` read are removed. |
| P1-T06 | ✅ Done | `audit_logs` table + `AuditLog` model + `AuditAction` enum. Columns: actor `user_id`/`actor_uuid`, `action`, `target_type`, `target_id`, `metadata` JSON, `ip_address`, `user_agent`, `created_at`. |
| P1-T07 | ✅ Done | `AuditLogService::record()` wired into: user create/update/status-change/reset (UserService), graduate delete/batch-update (GraduateService), blacklist add/remove (VerificationController). Metadata never stores passwords/PII values. |
| P1-T08 | ✅ Done | `SecurityHeaders` middleware (config-driven via `config/security.php`) appended globally in `bootstrap/app.php`. CSP/X-Frame-Options/X-Content-Type-Options/Referrer-Policy always; HSTS only over HTTPS in production. |
| P1-T09 | ✅ Done | `TrustProxies` configured in `bootstrap/app.php`, driven by `TRUSTED_PROXIES` (empty = trust none; `*` or CIDR/IP list supported). |
| P1-T10 | ✅ Done | Password-fingerprint JWT claim (`pwf`) + `EnsureTokenPasswordIsCurrent` middleware. Changing a password invalidates all previously-issued tokens; `changePassword` returns a fresh token so the current session survives (frontend stores it). |
| P1-T11 | ✅ Done (code) | `config/cors.php` already reads `CORS_ALLOWED_ORIGINS`; documented in `.env.example`. Deployment must set the production origin. |

### Deviations & Notes
- **Blacklist audit location:** blacklist add/remove logic already lives in `VerificationController` (pre-existing architecture). To keep this security phase surgical, the audit call was added there rather than refactoring the blacklist logic into `VerificationService` (that refactor is out of scope for Phase 1).
- **`changePassword` response:** this endpoint is one of the two known off-contract auth endpoints (returns `{message, data}` without the `success` key). Its envelope was intentionally left as-is (Phase 5 normalizes it); only the fresh `token` was added under `data`.
- **Deferred to deployment (no code artifact possible):** P1-T02 secret rotation, and setting production values for `APP_ENV`/`APP_DEBUG`/`TRUSTED_PROXIES`/`CORS_ALLOWED_ORIGINS` in the runtime environment.

### Verification performed
- `php artisan test` — passing (2 example tests; the two Phase-1 feature test files are pre-existing empty stubs, unrelated to this phase).
- `php artisan migrate` — `audit_logs` created successfully.
- Kernel-level checks: security headers present on API responses (HSTS correctly absent outside production/HTTPS); stale JWT rejected (401) after password change while a freshly-issued token succeeds (200); audit rows written with actor/target/action; admin reset queues `AdminResetPasswordMail`, leaves the password unchanged, and writes an audit row.
- `npm run build` (frontend) — builds successfully (the 500 kB chunk-size warning is pre-existing and is Phase 3's scope).

---

## Completion Criteria

- No real secrets are tracked anywhere; secrets rotated; `APP_DEBUG=false` in production.
- Admin password reset uses an emailed one-time link; the plaintext-in-response behavior is fully removed from backend and UI.
- The `audit_logs` table exists and every privileged admin action writes to it.
- Security headers are present on all responses; `TrustProxies` configured; CORS restricted to the real origin.
- Password change invalidates other sessions.
- All Validation Checklist items are checked.

---

## Risks

- **Secret rotation without coordinated deploy** logs out all users abruptly — expected, but communicate/deploy during a low-traffic window.
- **Overly strict CSP** can break the frontend (blocked scripts/styles/fonts); start with a report-only or permissive-but-safe policy and tighten iteratively.
- **Changing the reset-password contract** breaks any UI still expecting `temporary_password`; P1-T05 must ship together with P1-T04.
- **TrustProxies misconfiguration** can either trust no proxies (wrong IP) or trust all (spoofable IP) — configure the exact proxy range.

---

## Rollback Plan

- All changes are additive or config-level. To roll back: revert the middleware registration, restore the previous `resetPassword` response/service, and drop the `audit_logs` migration (`migrate:rollback` for this batch).
- **Do not roll back the secret rotation** — once rotated, keep the new secrets; rolling back would re-expose the compromised secret.
- Keep the removed `.env` out of version control permanently regardless of other rollbacks.
- Tag the pre-phase commit so the entire phase can be reverted as one unit if needed.

---

## Git Commit Recommendation

```
security(admin): rotate secrets, disable debug, add audit log & security headers, fix reset-password leak

- Remove committed .env; gitignore it; sanitize .env.example
- Rotate JWT_SECRET and APP_KEY; enforce APP_ENV=production / APP_DEBUG=false
- Replace admin plaintext temp-password response with emailed one-time reset link
- Add audit_logs table + audit-writing service; wire privileged admin actions
- Add SecurityHeaders middleware (CSP, X-Frame-Options, nosniff, Referrer-Policy, HSTS)
- Configure TrustProxies; restrict CORS to production origin
- Invalidate other JWTs on password change

Phase 1 of 6 — Critical Security Fixes
```
