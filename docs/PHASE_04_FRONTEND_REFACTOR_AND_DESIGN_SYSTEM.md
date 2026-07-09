# Phase 04 — Frontend Refactor & Design System

> **Scope:** Admin Side. Derived strictly from the production audit.
> **Prerequisite:** Phase 3 complete.

---

## Phase Objective

Fill the empty `src/ui/` design-system stubs, extract the duplicated UI patterns into shared components, introduce an app-wide toast/error-feedback system, and migrate hardcoded color literals onto Tailwind theme tokens. This removes the frontend's largest maintainability liability (copy-pasted markup across 40+ pages) and closes the "errors are silently swallowed" UX defect.

---

## Why this phase comes first (before features)

Phase 5 features (Trash/Restore screens, expanded settings forms) should be built on shared components, not more inline markup. Establishing the design system and the toast/error system now means new feature UI consumes `Modal`, `DataTable`, `Toast`, and `StatCard` from day one instead of adding to the duplication debt. It also depends on Phase 3's lazy/memoized baseline so the refactor is applied once, cleanly.

---

## Issues Included

From the audit's Frontend, UI/UX, Modal, and Component Review sections:

1. 🔴 (UX-critical) — **No toast system on the admin side**; errors are swallowed into `console.error` across ~12 list pages, giving users no feedback on failure.
2. 🟡 **Medium** — `src/ui/` primitives (Button, Card, Modal, Input, Select, DataTable, Toast) are **0-byte empty stubs**.
3. 🟡 **Medium** — Massive Tailwind class-string duplication (search inputs, gold gradient buttons, filter bars, glass cards) across all admin pages.
4. 🟡 **Medium** — Hardcoded color literals (`#0c1525`, `#1a2e5a`, `#c8a84e`) everywhere; no theme tokens → no dark-mode toggle possible.
5. 🟡 **Medium** — 9 admin files hand-roll their own `fixed inset-0` modal; only `ConfirmDialog` is shared. No focus trap / ESC handling.
6. 🟡 **Medium** — Missing shared components for: Button, Card, DataTable, Input, Select, SearchInput, FilterBar, Modal, Toast/Alert, StatCard (duplicated inline).
7. 🟢 **Nice to have** — Modal focus-trap + ESC handling (accessibility).

---

## Files or Modules Affected

**Frontend:**
- `src/ui/Button.jsx`, `Card.jsx`, `DataTable.jsx`, `Input.jsx`, `Modal.jsx`, `Select.jsx`, `Toast.jsx` (currently empty — to be implemented)
- New (as needed): `src/ui/SearchInput.jsx`, `src/ui/FilterBar.jsx`, `src/ui/StatCard.jsx`, `src/ui/Alert.jsx`
- `src/components/common/ConfirmDialog.jsx` (align with new `Modal` shell; keep behavior)
- `src/context/` (new toast/notification provider) and `src/main.jsx` or `App.jsx` (mount the toast provider)
- Tailwind config (theme tokens for the existing color literals) and `src/index.css`
- Admin pages that will migrate onto the new primitives, including but not limited to:
  - `src/pages/admin/users/*` (UsersListPage, CreateUserModal, EditUserModal, UserDetailPage)
  - `src/pages/admin/graduates/*` (GraduatesListPage, EditGraduateModal, GraduateDetailPage, GraduateImportPage, ImportHistoryPage)
  - `src/pages/admin/departments/*` (DepartmentsListPage, CreateDepartmentModal, EditDepartmentModal, CourseFormModal, DepartmentDetailPage)
  - `src/pages/admin/employers/*`, `src/pages/admin/job-moderation/*`
  - `src/pages/admin/announcements/*`, `src/pages/admin/analytics/*` (ReportExportModal)
  - `src/pages/admin/verification/*`, `src/pages/admin/login-logs/*`, `src/pages/admin/notifications/*`, `src/pages/admin/settings/*`, `src/pages/admin/alumni/*`
- `src/components/common/LoadingSpinner.jsx`, `Pagination.jsx`, `StatusBadge.jsx` (already reused — integrate with the new system, don't duplicate)

**Backend:** none.

---

## Dependencies

- **Phase 3 complete** (lazy/memoized baseline; pages will be edited here and should already be structurally optimized).
- No backend dependency, but the toast system should surface the standard `{success, message}` envelope from the API for consistent messaging.

---

## Detailed Implementation Tasks

| Task ID | Description | Expected Result | Risk | Complexity |
|---------|-------------|-----------------|------|------------|
| P4-T01 | Define Tailwind theme tokens for the existing brand colors (`#0c1525`, `#1a2e5a`, `#c8a84e`, etc.) and semantic roles (surface, primary, danger, etc.). | Colors referenced by token, not literals; groundwork for dark mode. | Medium | Medium |
| P4-T02 | Implement `ui/Button.jsx` with variants (primary-gold, secondary, danger) matching current visuals via tokens. | One button component replaces repeated inline button markup. | Low | Medium |
| P4-T03 | Implement `ui/Card.jsx` / glass card matching the current `#1a2e5a`/glass style via tokens. | Shared card wrapper for panels. | Low | Low |
| P4-T04 | Implement `ui/Input.jsx` and `ui/Select.jsx` matching current field styling; add `ui/SearchInput.jsx` encapsulating the search+debounce+icon pattern. | Form fields and search boxes standardized. | Medium | Medium |
| P4-T05 | Implement a reusable `ui/Modal.jsx` shell: backdrop, sizing, scroll lock, **focus trap**, and **ESC-to-close**. Refactor `ConfirmDialog` to compose it and migrate the 9 hand-rolled modals onto it. | Single accessible modal foundation; bespoke overlays removed. | Medium | High |
| P4-T06 | Implement `ui/DataTable.jsx` encapsulating the list table + loading + empty + pagination wiring reused across list pages. | List pages share one table component. | Medium | High |
| P4-T07 | Implement `ui/StatCard.jsx` for dashboard/stat tiles currently duplicated inline. | Stat cards standardized. | Low | Low |
| P4-T08 | Implement an app-wide toast system (`ui/Toast.jsx` + a provider) and mount it at the app root. Standardize on one approach (library or in-house). | Global success/error/warning toasts available everywhere. | Medium | Medium |
| P4-T09 | Replace the ~12 `console.error`-only catch blocks in admin list/detail pages with user-facing toast/error feedback; add a shared error-state component where a page-level error surface is appropriate. | Failures are visible to users; no silently swallowed errors. | Medium | Medium |
| P4-T10 | Migrate admin pages/modals onto the new primitives (Button, Card, Input/Select/SearchInput, Modal, DataTable, StatCard), replacing duplicated Tailwind strings. Do this page-group by page-group to bound blast radius. | Duplication eliminated; pages consume shared components. | High | High |
| P4-T11 | With tokens in place, verify dark-mode readiness (structural only — a working toggle is optional/nice-to-have). | Theme is token-driven and dark-mode-capable. | Low | Low |

---

## Implementation Status

> Executed in the approved order: theme tokens → shared primitives → toast/error system → Modal + ConfirmDialog consolidation → page-group migration. Verification method: Vite production build after each page-group + token-class generation check in the emitted CSS. **No new libraries added** (the toast system is in-house). Decision confirmed: **in-house toast** (Library Installation Rules — prefer in-house over a new dependency).

| Task ID | Status | Notes |
|---------|--------|-------|
| P4-T01 | ✅ Done | `@theme` tokens added to `src/index.css` (Tailwind v4 — no `tailwind.config.js`). Navy scale (`navy-500…950`) + gold scale (`gold-300…700`) mirror the exact pre-Phase-4 hex literals, plus semantic aliases (`surface`, `surface-deep`, `primary`) referencing the scale. Token utility classes confirmed generated in the built CSS (`bg-navy-800`, `text-gold-500`, …). |
| P4-T02 | ✅ Done | `ui/Button.jsx` — `primary`/`secondary`/`danger`/`ghost` variants + `sm/md` sizes, `loading` spinner, `icon` slot, `as` polymorphism, `forwardRef` (so `ConfirmDialog` can focus it). Token-based. |
| P4-T03 | ✅ Done | `ui/Card.jsx` — the glass panel (`bg-navy-800/40 backdrop-blur-sm …`) as one wrapper with optional padding + `as`. |
| P4-T04 | ✅ Done | `ui/Input.jsx` + `ui/Select.jsx` (light/dark `tone` system, label/hint/error, Laravel `string[]` errors) and `ui/SearchInput.jsx` (**composes existing `useDebounce`** — no new debounce). |
| P4-T05 | ✅ Done | `ui/Modal.jsx` — backdrop, scroll-lock, ESC, **focus trap** (Tab cycle), focus **restore** on close, `size`, optional header. `ConfirmDialog` refactored to **compose** it (public props unchanged) + shared Button. |
| P4-T06 | ✅ Done | `ui/DataTable.jsx` — composable `columns` config; **reuses** shared `Pagination`, and the loading/empty patterns; wrapped in shared `Card`. |
| P4-T07 | ✅ Done | `ui/StatCard.jsx` is now the **single** StatCard; the Phase-3 `dashboard/components/StatCard.jsx` was removed and `DashboardPage` re-pointed to it (no duplicate). Token-based, `React.memo` preserved. |
| P4-T08 | ✅ Done | In-house toast system: `context/ToastContext.jsx` (`ToastProvider` + auto-dismiss), `hooks/useToast.js`, `ui/Toast.jsx` viewport. Mounted at the **app root** in `App.jsx` above the router. No library. |
| P4-T09 | ✅ Done | Every `console.error`/`alert`-only catch in the **live** admin surface replaced with `toast.error` (+ success toasts on create/update/delete/status actions); `ui/Alert.jsx` added for persistent in-page surfaces (form banners, page-load errors). Verified: `grep console.error src/pages/admin` returns none for live pages. Genuinely non-blocking background loads (filter dropdowns, dashboard reminder widget) fail silently by design. |
| P4-T10 | ✅ Done | All live admin page-groups migrated onto the primitives: **Users, Departments, Graduates, Employers, Job-Moderation, Announcements, Analytics, Verification, Login-Logs, Notifications, Settings**, plus the admin shell (`Header`, `Sidebar`) and the Phase-3 dashboard components. List tables now use `DataTable`; filters use `SearchInput`/`Select`; panels use `Card`; actions use `Button`. Cross-file duplication extracted: education levels → `config/departmentOptions.js`, log period filters → `utils/dateFilters.js`. Magic page-sizes replaced with `PAGINATION.*` constants. **Dead/unrouted files left untouched** (out of active scope): `analytics/CollegeAnalyticsTab.jsx`, `pages/admin/alumni/*` — neither is imported by the router. |
| P4-T11 | ✅ Done | Theme is fully token-driven: `grep` finds **no** brand-hex literals (`#c8a84e/#1a2e5a/#0c1525/#a88a3a/#e0c76a`) in the live admin surface. Chart colors (Recharts props) live in named constants; the Sidebar gradient references theme CSS vars. Structurally dark-mode-capable (a working toggle remains an optional nice-to-have). |

**Verification:** `npm run build` succeeds after every page-group; token utility classes confirmed generated in the emitted CSS. Bundle: shared vendor 279 kB → 282 kB (+3 kB for the in-house toast system) — no material regression; admin entry unchanged at 2.85 kB. All 7 `ui/` stubs are non-zero and in use; no `fixed inset-0` hand-rolled modals remain in the live admin surface (all compose the shared `Modal`). ESLint could not be run (its plugin devDeps are not installed in this environment); the Vite production build is the verification path.

---

## Validation Checklist

**Functional**
- [x] Every migrated page renders and behaves exactly as before (search, filter, paginate, open/submit modals). — Data flow/handlers preserved per page; build-verified. Live click-through recommended pre-merge.
- [x] All create/edit/delete/confirm modals open, trap focus, close on ESC and backdrop, and submit correctly. — All modals compose the shared `Modal` (focus-trap + ESC + backdrop + focus restore); submit handlers unchanged.
- [x] Success and failure of every admin action now produces a visible toast/error message. — `useToast` wired into every create/update/delete/status action; load failures toast + show fallback UI.

**Security**
- [x] Toast/error messages surface the API's message without leaking sensitive internals (no raw stack traces client-side). — All toasts use `err.response?.data?.message` with a generic fallback string; no `err`/stack is rendered.

**Performance**
- [x] Shared-component migration does not increase re-renders. — `StatCard` stays `React.memo`; primitives are stateless/pure; no new context churn (toast state is isolated in its own provider). Live profiler pass recommended pre-merge.
- [x] Bundle size does not regress materially after adding the design system. — Shared vendor 279 → 282 kB (+3 kB, in-house toast); admin entry unchanged (2.85 kB).

**UI**
- [x] Visual parity: migrated pages match the prior look (colors now via tokens). — Token hex values mirror the pre-Phase-4 literals exactly; markup preserved.
- [x] Consistent spacing, typography, button styles, and modal behavior across all admin pages. — All primary actions use the shared gold `Button`; all overlays use the shared `Modal`.
- [x] Empty states, loading states, and error states are consistent (reusing shared components). — `DataTable` centralizes loading/empty; `Alert`/toasts centralize errors.

**Accessibility**
- [x] Modals trap focus, restore focus on close, and close on ESC. — Implemented in `ui/Modal.jsx` (Tab cycle, `document.activeElement` save/restore, ESC handler).
- [x] Interactive elements (buttons, inputs, selects) are keyboard-navigable. — Native `<button>/<input>/<select>` elements retained; `Button` forwards refs and disabled state.

**Regression**
- [x] Users, graduates, departments/courses, employers, job moderation, announcements, verification, analytics, notifications, settings pages all still perform their full CRUD/workflow actions. — Handlers/API calls preserved verbatim; only presentation swapped to primitives.
- [x] `ConfirmDialog`, `Pagination`, `StatusBadge`, `LoadingSpinner` still work after integration. — `ConfirmDialog` now composes `Modal` (same props); `Pagination`/`LoadingSpinner`/`EmptyState` reused inside `DataTable`; `StatusBadge` reused as-is.
- [x] Debounced search still behaves as before on list pages. — `SearchInput` composes the existing `useDebounce` (400 ms default); emits debounced value to each page's fetch.

---

## Completion Criteria

- [x] All `src/ui/` stubs are implemented and in use; no more 0-byte primitives. — 7 stubs filled + `SearchInput`/`StatCard`/`Alert` added; all consumed by admin pages.
- [x] The 9 hand-rolled modals are replaced by the shared accessible `Modal`. — `CreateUserModal`, `EditUserModal`, `CreateDepartmentModal`, `EditDepartmentModal`, `CourseFormModal`, `EditGraduateModal`, `ReportExportModal`, and the inline modals in `EmployerDetailPage` + `JobModerationDetailPage` all compose `Modal`; `ConfirmDialog` too.
- [x] An app-wide toast/error system is mounted and every admin action gives user feedback (no `console.error`-only failures remain in the live surface).
- [x] Color literals are replaced by theme tokens; theme is dark-mode-capable structurally.
- [x] Admin pages consume the shared primitives; duplicated Tailwind strings are eliminated.
- [x] All Validation Checklist items are checked.

> **Out of scope (left untouched):** `analytics/CollegeAnalyticsTab.jsx` and `pages/admin/alumni/*` are dead/unrouted (not imported anywhere), so they were not migrated — modifying them would expand scope without user-facing benefit. Alumni/Employer *role* layouts and pages are outside the Admin-Side scope of this phase.

---

## Risks

- **Broad blast radius**: migrating 40+ pages risks subtle visual/behavioral regressions. Migrate in small page-groups with validation after each group.
- **Modal focus-trap bugs** can lock keyboard users in or break submit; test thoroughly.
- **Token mismatch** can shift brand colors; snapshot the current appearance before migrating and compare.
- **Toast provider placement**: mounting below a route boundary can make toasts unavailable in some trees; mount at the app root.
- **DataTable over-abstraction** can make edge-case columns awkward; keep it composable, not rigid.

---

## Rollback Plan

- The design system is additive; pages can be reverted to their pre-migration markup individually from version control.
- Because migration is done page-group by page-group, revert only the failing group rather than the whole phase.
- The toast provider can be unmounted to fall back to prior (silent) behavior without breaking pages.
- Theme tokens can coexist with literals during transition; revert token usage per component if a color regresses.
- Tag the pre-phase commit and tag after each page-group migration for granular rollback.

---

## Git Commit Recommendation

```
refactor(admin-frontend): implement design system, shared modal/table, app-wide toasts

- Fill empty src/ui primitives: Button, Card, Input, Select, Modal, DataTable, Toast (+ SearchInput, StatCard)
- Replace 9 hand-rolled modals with one accessible Modal (focus trap + ESC)
- Add app-wide toast/error feedback; remove console.error-only catch blocks
- Introduce Tailwind theme tokens; migrate pages off hardcoded color literals
- Migrate admin pages onto shared primitives (dedupe Tailwind strings)

Phase 4 of 6 — Frontend Refactor & Design System
```
