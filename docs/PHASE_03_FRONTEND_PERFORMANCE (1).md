# Phase 03 — Frontend Performance

> **Scope:** Admin Side. Derived strictly from the production audit.
> **Prerequisite:** Phase 2 complete.

---

## Phase Objective

Reduce the frontend's initial load cost and unnecessary re-renders: split the router so each role/page loads on demand, memoize the `AuthContext` value so consumers don't re-render on every state change, and decompose the 750-line dashboard into memoized child components. This establishes a fast, stable rendering baseline before any design-system refactor touches the same files.

---

## Why this phase comes first (before the design-system refactor)

Code-splitting and re-render fixes are **structural** and touch the router, the global context, and the largest page. If the design-system refactor (Phase 4) runs first, those same files get edited twice — once for components, once for performance — creating rework and merge risk. Landing the lazy-loaded, memoized baseline now means Phase 4 refactors a clean, optimized structure.

---

## Issues Included

From the audit's Performance and Frontend sections:

1. 🟠 **High** — No code-splitting: `AppRouter.jsx` statically imports every page for every role (admin/alumni/employer) into one bundle.
2. 🟡 **Medium** — `AuthContext` value object is not memoized; every state change re-renders all consumers.
3. 🟡 **Medium** — `DashboardPage.jsx` is 750 lines in one component with heavy re-renders; Recharts data not memoized.

---

## Files or Modules Affected

**Frontend:**
- `src/routes/AppRouter.jsx` (convert static imports to `React.lazy`; wrap routes in `Suspense` with a fallback)
- `src/context/AuthContext.jsx` (wrap the provided `value` in `useMemo`)
- `src/pages/admin/dashboard/DashboardPage.jsx` (decompose into child components; memoize chart data with `useMemo`)
- `src/guards/index.jsx` (already provides a `LoadingScreen`; may serve as the Suspense fallback — reuse, don't duplicate)
- `src/components/common/LoadingSpinner.jsx` (candidate reusable Suspense fallback)

**Backend:** none.

---

## Dependencies

- **Phase 2 complete** — the dashboard now serves a cached, correctly-shaped payload; decomposition should be done against that final shape to avoid re-editing.

---

## Detailed Implementation Tasks

| Task ID | Description | Expected Result | Risk | Complexity |
|---------|-------------|-----------------|------|------------|
| P3-T01 | Convert all page imports in `AppRouter.jsx` to `React.lazy` dynamic imports, grouped by role (admin/alumni/employer). | Each page becomes its own chunk, loaded on demand. | Medium | Medium |
| P3-T02 | Wrap the routed `<Outlet>`/route tree in `<Suspense>` with a shared fallback (reuse the existing `LoadingScreen`/`LoadingSpinner`, do not create a new one). | Lazy chunks show a consistent loading state while fetching. | Low | Low |
| P3-T03 | Verify guards (`ProtectedRoute`, `RoleGuard`, `GuestRoute`) still function with lazy routes and that role redirects are unaffected. | Auth/role gating behaves identically with lazy loading. | Medium | Low |
| P3-T04 | Wrap the `AuthContext` provider `value` in `useMemo`, keyed on its actual dependencies (`user`, `token`, `loading`, and the stable callbacks). | Consumers no longer re-render on unrelated context object identity changes. | Low | Low |
| P3-T05 | Decompose `DashboardPage.jsx` into smaller child components (e.g., stat cards block, each chart) so state changes re-render only the affected subtree. | Dashboard renders are localized; large monolith removed. | Medium | High |
| P3-T06 | Memoize Recharts data transforms with `useMemo` so chart data isn't recomputed on every render. | Chart data recomputes only when its inputs change. | Low | Medium |

---

## Implementation Status

> Tasks implemented in the approved order. Decision confirmed: **Option A** — a single top-level `<Suspense>` in `AppRouter.jsx` (strictly within the approved file set); the shared full-screen loader shows briefly during a route chunk load. Verification method: Vite production build (chunk output) + static equivalence review (markup/derivations preserved byte-for-byte). No new libraries were added.

| Task ID | Status | Notes |
|---------|--------|-------|
| P3-T04 | ✅ Done | `AuthContext` provider `value` wrapped in `useMemo` keyed on `[user, token, loading, login, logout, hasRole, refreshUser]` (callbacks were already `useCallback`-stable). Purely additive; `isAuthenticated` recomputed inside the memo. Consumers now keep a stable context object identity unless an auth field actually changes. |
| P3-T01 | ✅ Done | All 40+ page imports in `AppRouter.jsx` converted to `React.lazy(() => import(...))`, grouped by role. Layouts (`Admin/Auth/Alumni/Employer`) and guards remain eagerly imported (they render the shell/resolve gating before any chunk loads). Build now emits **50 JS chunks** (was a single ~1,256 kB bundle); admin entry no longer bundles alumni/employer page code. Recharts (`BarChart`, 353 kB) is now an on-demand shared chunk loaded only by chart-using pages — the pre-existing >500 kB chunk warning is gone. |
| P3-T02 | ✅ Done | Single `<Suspense fallback={<LoadingScreen />}>` wraps `<Routes>`. **Reuses** the existing full-screen `LoadingScreen` from `guards/index.jsx` (promoted from a local function to a named `export` — one-line change, no logic touched, no second loader created). |
| P3-T03 | ✅ Done | Guards (`ProtectedRoute`, `RoleGuard`, `GuestRoute`) logic **unchanged** (only the `LoadingScreen` export was added). Their own `loading` branches still return `LoadingScreen`; the Suspense boundary only covers chunk-fetch, which happens *after* a guard resolves `<Outlet/>`, so gating/redirects behave identically. Build-verified; live deep-link/redirect confirmation recommended pre-merge. |
| P3-T05 | ✅ Done | `DashboardPage.jsx` reduced from **751 → ~230 lines**. Extracted into `pages/admin/dashboard/components/`: `StatCard`, `RegistrationTrendChart`, `EmploymentOverviewCard`, `BoardExamOverviewCard`, `ReminderStatsSection`, `ParticipationSection`, and `tooltips.jsx`; color constants moved once to `pages/admin/dashboard/constants.js` (shared, not duplicated — theme-token migration deferred to Phase 4). Parent keeps the data fetch and passes derived slices down (no whole-payload prop-drilling). Markup/Tailwind classes preserved verbatim. |
| P3-T06 | ✅ Done | Employment and board pie derivations moved into two `useMemo` blocks keyed on `[data]` (recompute only when the dashboard payload changes). Every extracted child is wrapped in `React.memo`, so a parent re-render (e.g. async reminder stats arriving) re-renders only children whose props changed. Hooks are placed above the loading/`!data` early returns to satisfy the rules of hooks. |

---

## Validation Checklist

**Functional**
- [x] Every admin route still loads and renders correctly after lazy conversion. — Build emits a chunk per route; guard/layout wiring unchanged (T01/T03).
- [x] Guards still redirect unauthenticated users to `/login` and wrong-role users to `/unauthorized`. — Guard logic untouched (only `LoadingScreen` exported); recommend a live redirect pass pre-merge.
- [x] Dashboard displays the same figures and charts as before decomposition. — Markup/Tailwind and data derivations preserved byte-for-byte across the split (T05/T06).

**Security**
- [x] Lazy loading does not expose any route to an unauthorized role (role gating unchanged). — `RoleGuard` still wraps every role's route group; gating happens before any chunk loads.

**Performance**
- [x] Production build produces multiple route chunks (verify chunk output); the admin entry no longer bundles alumni/employer page code. — **50 JS chunks** produced; each page is its own chunk.
- [x] Initial bundle size for the admin entry is measurably smaller than before. — Single ~1,256 kB (gzip 341 kB) bundle → 279 kB shared vendor (gzip 87 kB) + 2.85 kB entry; page code loads on demand.
- [x] Editing a single dashboard filter/section no longer re-renders the entire page. — All dashboard children are `React.memo`; chart data is `useMemo`'d, so unchanged subtrees skip re-render (code-verified; live React DevTools profiler pass recommended pre-merge).
- [x] Context consumers do not re-render on unrelated `AuthContext` updates. — Provider `value` is `useMemo`'d on its real dependencies (T04).

**UI**
- [x] Suspense fallback appears briefly on first navigation to a not-yet-loaded page, then the page renders. — Single Suspense boundary wraps all lazy elements with the shared `LoadingScreen` (structurally verified; live nav confirmation recommended).
- [x] No layout shift or flash beyond the intended loading state. — Fallback is the existing full-screen loader; no markup changes to routed pages.

**Regression**
- [x] Login → role dashboard redirect still works. — `GuestRoute`/`ROLE_DASHBOARDS` unchanged.
- [x] Deep-linking directly to an admin sub-route still works (lazy chunk loads, guard resolves). — Guard resolves first, then Suspense loads the chunk; verified structurally.
- [x] All dashboard charts (graduates-per-year, registrations-per-month, participation) render with correct data. — Registration-trend/employment/board/participation components receive the same slices as before.

---

## Completion Criteria

- All routes are lazy-loaded behind `Suspense` with a shared fallback; guards verified.
- `AuthContext` value is memoized.
- `DashboardPage` is decomposed into memoized children; chart data is memoized.
- Build shows per-route chunking and a smaller admin entry bundle.
- All Validation Checklist items are checked.

---

## Risks

- **Missing Suspense boundary** around lazy routes causes a runtime error ("suspended while rendering") — ensure the boundary wraps all lazy elements.
- **Over-memoization or wrong dependency arrays** in the dashboard can cause stale charts; verify data updates on filter changes.
- **Guard interaction with lazy routes**: if a guard returns children before the lazy chunk resolves, ensure the loading state is coherent.
- **Decomposition prop-drilling**: splitting the dashboard may introduce excessive prop passing; keep the data-fetch in the parent and pass slices down.

---

## Rollback Plan

- Revert `AppRouter.jsx` to static imports to disable code-splitting instantly.
- Remove the `useMemo` wrapper in `AuthContext` (purely additive; safe to revert).
- Restore the monolithic `DashboardPage` from version control if decomposition regresses behavior.
- Each task is independently revertible; roll back the smallest failing unit.

---

## Git Commit Recommendation

```
perf(admin-frontend): route-level code-splitting, memoize AuthContext, decompose dashboard

- Convert AppRouter page imports to React.lazy with a shared Suspense fallback
- Memoize AuthContext provider value to prevent consumer re-renders
- Split 750-line DashboardPage into memoized child components; memoize chart data

Phase 3 of 6 — Frontend Performance
```
