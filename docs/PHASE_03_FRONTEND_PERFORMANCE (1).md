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

## Validation Checklist

**Functional**
- [ ] Every admin route still loads and renders correctly after lazy conversion.
- [ ] Guards still redirect unauthenticated users to `/login` and wrong-role users to `/unauthorized`.
- [ ] Dashboard displays the same figures and charts as before decomposition.

**Security**
- [ ] Lazy loading does not expose any route to an unauthorized role (role gating unchanged).

**Performance**
- [ ] Production build produces multiple route chunks (verify chunk output); the admin entry no longer bundles alumni/employer page code.
- [ ] Initial bundle size for the admin entry is measurably smaller than before.
- [ ] Editing a single dashboard filter/section no longer re-renders the entire page (verify with React DevTools profiler).
- [ ] Context consumers do not re-render on unrelated `AuthContext` updates.

**UI**
- [ ] Suspense fallback appears briefly on first navigation to a not-yet-loaded page, then the page renders.
- [ ] No layout shift or flash beyond the intended loading state.

**Regression**
- [ ] Login → role dashboard redirect still works.
- [ ] Deep-linking directly to an admin sub-route still works (lazy chunk loads, guard resolves).
- [ ] All dashboard charts (graduates-per-year, registrations-per-month, participation) render with correct data.

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
