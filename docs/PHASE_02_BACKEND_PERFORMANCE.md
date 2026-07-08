# Phase 02 — Backend Performance

> **Scope:** Admin Side. Derived strictly from the production audit.
> **Prerequisite:** Phase 1 complete.

---

## Phase Objective

Make the backend stable and fast under real data volumes: move the graduate import off the request thread and eliminate its N+1 queries, cache and correct the dashboard aggregates, and verify the database indexes that hot filters and login lookups depend on. This phase converts the backend from "works on small data" to "holds up under production load."

---

## Why this phase comes first (before frontend work)

The synchronous import can exceed the frontend's 30-second axios timeout and **silently fail**, and the dashboard issues ~20 uncached aggregate queries per load — both are correctness-and-stability problems that exist independently of the UI. The frontend performance and refactor phases optimize *against* the backend API; that API must be stable and correctly shaped first, or frontend work will be built on shifting behavior and re-done.

---

## Issues Included

From the audit's Database and Performance sections:

1. 🟠 **High** — Graduate import is fully synchronous inside the HTTP request; will time out at scale (`GraduateImportService::import`).
2. 🟠 **High** — N+1 in the import loop: per-row `Course::where`, `Department::where`, duplicate-check queries (~3–5N queries).
3. 🟡 **Medium** — Dashboard runs ~20 sequential uncached aggregate queries every load (`DashboardController`).
4. 🟡 **Medium** — `distinct()->count()` correctness risk and `whereNotIn(..., ->pluck())` materializing IDs in PHP (board metrics).
5. 🟡 **Medium** — Verify/add DB indexes on hot filter columns and brute-force lookup columns.
6. 🟢 **Low/Correctness** — `DATE_FORMAT` is MySQL-specific (acceptable for the stack; note for test DB compatibility).
7. **Correctness** — Import course/department resolution can leave a college graduate with `course_id = null`, causing rows to vanish from the tracer export inner join.

---

## Files or Modules Affected

**Backend:**
- `app/Services/Admin/GraduateImportService.php` (queue-ify, batch lookups, fix null-course edge case)
- `app/Http/Controllers/Api/Admin/GraduateController.php` (`import` returns a job/batch handle; add status polling endpoint if needed)
- `routes/api/admin.php` (optional import-status endpoint; note the existing `import` route)
- `app/Models/ImportBatch.php` (status lifecycle already present — confirm states cover queued/processing/completed/failed)
- New: a queued job class under `app/Jobs/` for import processing
- `app/Http/Controllers/Api/Admin/DashboardController.php` (`getStatsCards`, `getGraduatesPerYear`, `getAlumniRegistrationsPerMonth`, `getParticipationStats` — caching + query correctness)
- `app/Services/Admin/GraduateTracerService.php` (confirm inner-join behavior vs. null course_id rows)
- `database/migrations/*` (new index migrations; verify existing)
- `config/queue.php` (already `database`) and queue worker/runtime configuration

**Frontend:**
- `src/pages/admin/graduates/GraduateImportPage.jsx` (switch from synchronous result to job submission + progress/polling display — behavior described only)
- `src/pages/admin/graduates/ImportHistoryPage.jsx` (reflect queued/processing states)
- `src/pages/admin/dashboard/DashboardPage.jsx` (no change required for caching, but confirm it tolerates a cached payload)

---

## Dependencies

- **Phase 1 complete** (secure, stable backend baseline; audit-log substrate available if import completion should be audited).
- A running queue worker in the target environment (queue connection is already `database`).

---

## Detailed Implementation Tasks

| Task ID | Description | Expected Result | Risk | Complexity |
|---------|-------------|-----------------|------|------------|
| P2-T01 | Move import processing into a queued job. The `import` endpoint validates the file, creates the `ImportBatch` in a `queued`/`processing` state, dispatches the job, and returns the batch handle immediately. | Import request returns fast; heavy work runs on the queue. | High | High |
| P2-T02 | Add/confirm an import-status endpoint (or reuse import-history detail) so the frontend can poll batch progress and final counts. | Frontend can track queued → processing → completed/failed. | Medium | Medium |
| P2-T03 | Eliminate import N+1: preload courses and departments into keyed collections (e.g., by `code`) once before the row loop; resolve from memory instead of per-row queries. | Import issues a constant number of lookups regardless of row count. | Medium | Medium |
| P2-T04 | Batch the duplicate detection (alumni_id and name+year+level) rather than querying per row. | Duplicate checks no longer scale linearly in query count. | Medium | Medium |
| P2-T05 | Fix the null-course edge case: for college graduates where a course cannot be resolved, treat the row as an error (consistent with existing "not found" handling) rather than silently creating a row with `course_id = null` that later disappears from tracer exports. | No orphaned college rows; such rows are reported as import errors. | Medium | Medium |
| P2-T06 | Cache the dashboard payload with a short TTL (e.g., a few minutes) keyed appropriately; invalidate or accept staleness on relevant writes. | Dashboard serves from cache; underlying query count drops dramatically on repeat loads. | Low | Medium |
| P2-T07 | Replace fragile `distinct('graduate_id')->count('graduate_id')` with explicit `COUNT(DISTINCT graduate_id)` (or subquery) for board-passer/failed/record metrics. | Board metrics are correct across driver versions. | Medium | Medium |
| P2-T08 | Replace `whereNotIn(..., ->pluck())` in the board-failed metric with a `whereNotExists` correlated subquery to avoid materializing IDs in PHP. | No large ID array pulled into memory; query stays in SQL. | Low | Medium |
| P2-T09 | Audit and add indexes: `graduates(education_level, graduation_year, department_id, course_id)`, `graduates(last_name)`, `users(role, status, last_login_at)`, `board_exam_records(graduate_id, status)`, `alumni_profiles(employment_status, graduate_id)`, `login_activity_logs(email, ip, created_at)`. Verify against existing migrations before adding to avoid duplicates. | Hot filters and login brute-force lookups are index-backed. | Medium | Medium |
| P2-T10 | Note `DATE_FORMAT` MySQL-specificity for the test environment; ensure the Phase 6 test DB uses MySQL-compatible behavior or the query is abstracted. | Registration-per-month query is portable to the test setup. | Low | Low |

---

## Validation Checklist

**Functional**
- [ ] Uploading a large graduate file returns immediately with a batch handle; processing completes on the queue with correct imported/duplicate/error counts.
- [ ] Import history/detail reflects queued → processing → completed/failed transitions.
- [ ] College rows with unresolvable course codes appear as import errors, not silently missing records.
- [ ] Dashboard renders identical figures to pre-change (spot-check board passers/failed/not-taken, employment rate, growth %).

**Security**
- [ ] Import status endpoint is admin-only (behind existing `auth:api` + `account.status` + `role:admin`).
- [ ] No change weakens the existing throttle on the export/import routes.

**Performance**
- [ ] Import request response time is constant regardless of row count (heavy work offloaded).
- [ ] Import query count no longer scales linearly with rows (verify with query logging on a sample file).
- [ ] Dashboard repeat loads serve from cache with a large reduction in DB queries.
- [ ] Filtered graduate/user/alumni-search list queries use indexes (verify with `EXPLAIN`).

**UI**
- [ ] Import page shows a progress/queued state instead of blocking on a synchronous response.

**Regression**
- [ ] Small-file imports still work exactly as before (counts, duplicates, errors).
- [ ] Tracer export still returns the correct rows (and no longer drops null-course college rows because they are now rejected at import).
- [ ] Dashboard participation, graduates-per-year, and registrations-per-month sections are unchanged in output.

---

## Completion Criteria

- Import runs on the queue, is N+1-free, and rejects unresolvable college rows as errors.
- Dashboard is cached and its board metrics use correct `COUNT(DISTINCT ...)` / `whereNotExists` patterns.
- All required indexes are present and verified with `EXPLAIN`.
- A queue worker is running in the target environment.
- All Validation Checklist items are checked.

---

## Risks

- **Queue worker not running in production** → imports never complete. Deployment must include a supervised worker.
- **Incorrect cache invalidation** → dashboard shows stale figures after data changes; choose an acceptable TTL and document it.
- **Index migration on a large existing table** can lock/slow the table during creation; run during a maintenance window.
- **Changing `distinct()->count()` semantics** could shift a metric if the original (buggy) value was being relied upon downstream; validate figures against known-good data.
- **Rejecting previously-accepted null-course rows** changes import outcomes for malformed files; communicate the stricter behavior.

---

## Rollback Plan

- Revert the queued-job dispatch to restore synchronous import (keep the batch model changes if backward-compatible).
- Remove the dashboard cache wrapper to restore direct queries.
- Roll back the index migration batch (`migrate:rollback`) if an index causes issues.
- Because each task is independently revertible, roll back the smallest failing unit rather than the whole phase.
- Tag the pre-phase commit for a full-phase revert if necessary.

---

## Git Commit Recommendation

```
perf(admin-backend): queue graduate import, kill N+1, cache dashboard, add indexes

- Dispatch graduate import to a queued job; return batch handle immediately
- Preload courses/departments and batch duplicate checks (remove per-row N+1)
- Reject unresolvable college rows as import errors (fix disappearing tracer rows)
- Cache dashboard aggregate payload; use COUNT(DISTINCT) and whereNotExists
- Add indexes for hot filters and login brute-force lookups

Phase 2 of 6 — Backend Performance
```
