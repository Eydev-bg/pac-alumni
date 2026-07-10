# Phase 05 — Missing Production Features

> **Scope:** Admin Side. Derived strictly from the production audit.
> **Prerequisite:** Phase 4 complete.

---

## Phase Objective

Add the production-grade capabilities the audit identified as missing, and pay down the remaining Laravel best-practice debt: soft-delete with Trash/Restore for records, expanded system settings, formal Policies/Gates to centralize the scattered inline authorization checks, normalization of the two off-contract auth endpoints, and moving the inline `email-logs` route into a controller. Privileged actions added here emit audit events using the Phase 1 substrate.

---

## Why this phase comes first (before testing)

Testing (Phase 6) should target the **final** behavior and signatures. Introducing soft-delete, Policies, and endpoint normalization *after* tests are written would force test rewrites. These features also build on earlier phases: they emit audit events (Phase 1), run on the stable backend (Phase 2), and consume shared UI components — Modal, Toast, DataTable (Phase 4). Doing them now means Phase 6 locks in a stable target.

---

## Issues Included

From the audit's Feature Review, Laravel Best Practices, and Priority Checklist:

1. 🟡 **Medium** — No Trash/soft-delete + Restore for **graduates**; hard deletes are irreversible (risky for a records system). *(User-management pages have been removed from this system, so soft-delete applies to graduate records only, not admin users.)*
2. 🟡 **Medium** — No formal Policies/Gates; authorization is middleware + inline `if ($user->isAdmin())` scattered across services. Centralizing it reduces the risk of inconsistent checks. *(System roles are Admin, Alumni, Employer — no separate HR role; the Employer role is the third-party/HR-equivalent and already exists.)*
3. 🟡 **Medium** — Two auth endpoints (`updateProfile`, `changePassword`) bypass the `ApiResponse` trait; `updateProfile` returns a raw model (`$user->fresh()`) instead of a `UserResource`, risking field leakage and contract drift.
4. 🟡 **Medium** — Harden file upload (real content sniffing) — carried here if not fully addressed in Phase 2's import work.
5. 🟢 **Nice to have** — Move the inline `email-logs` closure route in `admin.php` into a controller method.
6. 🟢 **Nice to have** — Expanded System Settings beyond registration (maintenance mode, email config).
7. 🟢 **Nice to have** — Scheduled/emailed reports.

> **Note:** The **admin audit log** itself was built in Phase 1. This phase **wires audit-event emission** into the new privileged actions (soft-delete, restore, settings changes) using that substrate.

---

## Files or Modules Affected

**Backend:**
- `app/Models/Graduate.php` (add `SoftDeletes`) — *User model soft-delete dropped: no user-management UI*
- Migration to add `deleted_at` to `graduates` (user-management removed, so no `users` Trash)
- `app/Http/Controllers/Api/Admin/GraduateController.php` (destroy → soft delete; add restore + force-delete + trashed-listing endpoints)
- `app/Services/Admin/GraduateService.php` (soft-delete/restore logic; emit audit events)
- `routes/api/admin.php` (Trash/restore routes; move `email-logs` closure into a controller — new `EmailLogController` or existing controller method)
- New: `app/Policies/*` (GraduatePolicy, and policies for announcements/employers/verification as needed) + registration; introduce Gates where appropriate. *(No UserPolicy — user-management UI removed; `updateProfile`/`changePassword` remain self-service and are covered by P5-T06, not a management policy.)*
- `app/Http/Controllers/Api/Auth/AuthController.php` (`updateProfile`, `changePassword` → use `ApiResponse` trait + `UserResource`)
- `app/Http/Requests/*` (add Form Requests for the normalized profile/password endpoints if not already present)
- `app/Services/*` or `app/Console/*` (optional: scheduled report command)
- `config/` (maintenance-mode / expanded settings, if implemented)
- Audit wiring: reuse the Phase 1 audit service in all new privileged actions

**Frontend:**
- New Trash/Archive page for **graduates** (consume Phase 4 `DataTable`, `Modal`, `Toast`) — no users Trash page
- `src/pages/admin/settings/*` (expanded settings UI — maintenance mode, email config, if implemented)
- `src/api/adminApi.js` (new endpoints: trashed lists, restore, force-delete, expanded settings)
- Any page whose delete action should now offer restore/Trash affordances

---

## Dependencies

- **Phase 1 complete** — audit-log substrate must exist to emit events from new privileged actions.
- **Phase 2 complete** — stable backend; upload hardening context.
- **Phase 4 complete** — shared UI components for the new Trash/settings screens.

---

## Detailed Implementation Tasks

| Task ID | Description | Expected Result | Risk | Complexity |
|---------|-------------|-----------------|------|------------|
| P5-T01 | Add `SoftDeletes` + `deleted_at` migration to `graduates`; convert `destroy` to soft delete. *(Users excluded — no user-management UI.)* | Graduate deletes are reversible; records move to Trash. | Medium | Medium |
| P5-T02 | Add trashed-list, restore, and force-delete endpoints for **graduates**; guard them admin-only. | Admins can view, restore, or permanently delete trashed graduate records. | Medium | Medium |
| P5-T03 | Emit audit events (Phase 1 substrate) on soft-delete, restore, and force-delete. | Every Trash action is auditable. | Low | Low |
| P5-T04 | Build Trash/Archive UI for **graduates** using Phase 4 `DataTable`/`Modal`/`Toast`, with restore and permanent-delete confirmations. | Admins manage the graduate Trash from the UI. | Medium | Medium |
| P5-T05 | Introduce Laravel Policies for **graduate management** (and announcements/employers/verification as appropriate, plus Gates); register them; replace inline `if ($user->isAdmin())` checks with policy authorization while preserving current admin-only behavior. *(No user-management policy — those pages were removed.)* | Authorization is centralized and consistent (admin-only behavior preserved exactly). | High | High |
| P5-T06 | Normalize `AuthController::updateProfile` and `changePassword` to use the `ApiResponse` trait and return a `UserResource` (never a raw model). Add Form Requests for their validation. | Both endpoints match the app-wide contract; no raw-model leakage. | Medium | Medium |
| P5-T07 | Move the inline `email-logs` closure route in `admin.php` into a dedicated controller method (e.g., `EmailLogController@index`). | Route logic lives in a controller; router stays declarative. | Low | Low |
| P5-T08 | (If not fully handled in Phase 2) Harden import file upload with real content sniffing beyond extension/MIME. | Renamed/hostile files are rejected before parsing. | Medium | Medium |
| P5-T09 | (Nice to have) Add expanded System Settings: maintenance mode toggle and email configuration surface; emit audit events on change. | Admins control maintenance mode and email config from settings. | Medium | Medium |
| P5-T10 | (Nice to have) Add a scheduled/emailed report command reusing existing export logic. | Reports can be scheduled and emailed. | Low | Medium |

---

## Validation Checklist

**Functional**
- [ ] Deleting a graduate moves it to Trash (not permanently removed); it disappears from default lists.
- [ ] Trashed records can be listed, restored (reappear in normal lists), and permanently deleted.
- [ ] `updateProfile` and `changePassword` return the standard `{success, message, data}` envelope with a `UserResource` payload.
- [ ] `email-logs` endpoint behaves identically after moving to a controller.
- [ ] Maintenance mode (if implemented) blocks non-admin access as intended.

**Security**
- [ ] Trash/restore/force-delete endpoints are admin-only and authorized via Policies.
- [ ] Policies preserve current behavior exactly (admins can do what they could before; no privilege is silently broadened).
- [ ] `updateProfile` no longer leaks non-`$hidden` fields via a raw model.
- [ ] Every new privileged action writes an audit record.
- [ ] Hardened upload rejects content-mismatched files.

**Performance**
- [ ] Soft-delete `deleted_at` filtering is index-friendly; default lists still perform well.
- [ ] Trashed-list endpoints paginate.

**UI**
- [ ] Trash pages use the Phase 4 shared components (DataTable, Modal, Toast) and are visually consistent.
- [ ] Delete actions clearly communicate that records go to Trash and can be restored.

**Regression**
- [ ] Existing graduate CRUD still works; default lists exclude trashed rows.
- [ ] All existing admin endpoints keep their contracts (now including the two normalized auth endpoints).
- [ ] Existing role middleware still blocks non-admins even with Policies added.
- [ ] Import still functions (with the hardened upload check).

---

## Completion Criteria

- Soft-delete + Trash/Restore/force-delete implemented for **graduates**, audited, and surfaced in the UI.
- Policies/Gates introduced and preserve current admin-only behavior while enabling future roles.
- `updateProfile` and `changePassword` normalized to the app-wide contract with `UserResource`.
- `email-logs` route moved into a controller.
- Upload hardening in place (here or confirmed done in Phase 2).
- All Validation Checklist items are checked.

---

## Risks

- **Policy misconfiguration** can accidentally deny admins or allow unintended access; mirror the exact current behavior and test both allow and deny paths.
- **Soft-delete without scoping** can cause trashed records to leak into lists/exports; ensure default scopes exclude trashed rows and tracer/export queries account for them.
- **Contract change on auth endpoints** can break any frontend still parsing the old shape; update `adminApi`/pages together with the backend change.
- **Maintenance mode** can lock out admins if not exempted; ensure admin bypass.
- **Force-delete is irreversible** — require explicit confirmation and audit it.

---

## Rollback Plan

- Soft-delete is additive; to roll back, revert `destroy` to hard delete and drop the `deleted_at` migrations (only if no records were soft-deleted, otherwise migrate carefully to avoid data loss).
- Policies can be unregistered to fall back to middleware + inline checks (which remain functionally equivalent).
- Revert the auth-endpoint normalization to the prior response shape if the frontend can't be updated simultaneously.
- Revert the `email-logs` controller move to the inline closure.
- Each feature is independently revertible; roll back the smallest failing unit. Tag the pre-phase commit.

---

## Git Commit Recommendation

```
feat(admin): soft-delete/Trash, Policies/Gates, normalize auth endpoints, expand settings

- Add SoftDeletes + Trash/Restore/force-delete for graduates (audited)
- Introduce Policies/Gates centralizing scattered inline checks (admin-only behavior preserved)
- Normalize AuthController updateProfile/changePassword to ApiResponse + UserResource
- Move inline email-logs route into a controller
- Harden import upload with content sniffing; (optional) maintenance mode & scheduled reports

Phase 5 of 6 — Missing Production Features
```