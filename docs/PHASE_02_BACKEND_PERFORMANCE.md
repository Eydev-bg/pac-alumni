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

## Implementation Status

> Tasks are implemented one at a time in the approved execution order. Confirmed decisions: reuse `PROCESSING` (no `QUEUED` enum); make `DATE_FORMAT` driver-aware for SQLite tests; short cache TTL + explicit dashboard-cache invalidation after imports/relevant writes.

| Task ID | Status | Notes |
|---------|--------|-------|
| P2-T09 | ✅ Done | New additive migration `2026_07_08_000002_add_performance_indexes.php`. Idempotent (guards on exact column-set **and** index-name via `Schema::getIndexes`); safe to re-run. Added: `graduates(last_name)`, `graduates(education_level, graduation_year, department_id, course_id)`, `users(role, status, last_login_at)`, `board_exam_records(graduate_id, status)`, `alumni_profiles(employment_status, graduate_id)`. `login_activity_logs` left unchanged — brute-force lookups already covered by `(email_attempted, status)` and `(ip_address, created_at)`. Verified on **MySQL** (dev = production driver): migrate / rollback / re-migrate clean; `EXPLAIN` shows the optimizer selects `users_role_status_last_login_index` and `board_exam_records_graduate_status_index`, with the graduates composite listed in `possible_keys`. Explicit short index names keep composites within MySQL's 64-char limit. |
| P2-T01 | ✅ Done | `GraduateImportService::import()` split into `queue()` (stores the file to the default disk under `imports/`, creates the `ImportBatch` in `PROCESSING`, dispatches the job, returns the handle immediately) and `process(ImportBatch, storedPath)` (the heavy row work, now reading education level from the batch and deleting the stored file in a `finally`). New `App\Jobs\ProcessGraduateImport` (`ShouldQueue`) delegates to `process()`, with a `failed()` hook that marks the batch failed and removes the file. `GraduateController::import` now calls `queue()` and returns "Import queued…". No new enum state — reuses `PROCESSING` per decision. Verified end-to-end with a **real separate worker**: dispatch returns fast (`processing`, job enqueued); worker → `completed`, imported=4, errors=0; graduates inserted; stored file deleted. `Bus::fake` confirmed the endpoint dispatches without blocking. Storage dir is a named constant (no hardcoded path); default disk used via `Storage` facade (no hardcoded disk). |
| P2-T02 | ✅ Done | No new endpoint/route required — the existing admin-only `GET /graduates/import-history/{id}` (`GraduateController::importDetail` → `ImportBatchResource`) already returns `status`, `status_label`, `total_records`, `imported_count`, `duplicate_count`, `error_count`, `error_details`, and `completed_at`, which is exactly what the frontend needs to poll `processing → completed/failed`. Route stays behind `auth:api` + `account.status` + `role:admin`. |
| P2-T03 | ✅ Done | `GraduateImportService` now preloads courses + departments once into keyed collections via a new private `preloadReferenceData()` and resolves course/department **from memory** in the row loop (no per-row `Course::where` / `Department::where` / `$dept->courses()->first()`). Keys preserve original semantics: codes upper-cased/trimmed, `->map->first()` mirrors `->first()`, only active departments feed the education-level fallback. Verified end-to-end on MySQL with a generated `.xlsx`: course/department queries are a **constant 2** for both 3-row and 6-row imports (was per-row), with identical results (imported 3/6, 0 errors, status completed). Remaining per-row queries (duplicate checks, inserts) are addressed in T04. Test suite 2/2, no stray rows. |
| P2-T04 | ✅ Done | New private `preloadDuplicateKeys()` builds in-memory sets (keyed, `isset()` O(1)) of existing alumni-ids (`whereIn` the file's ids, system-wide) and existing name+year keys (scoped to level + the file's years). The row loop replaced both per-row `Graduate::where(...)->first()` duplicate queries with set lookups; sets are updated after each insert so **intra-file** duplicates are still caught (matches old in-transaction behaviour). Normalisation helpers `alumniIdKey()` (upper/trim) and `nameKey()` (lower/trim) mirror MySQL's case-insensitive collation. Verified: correctness exact (imported=1, duplicates=2, errors=2 across existing-DB **and** intra-file dups for both id and name); graduates `SELECT`s constant at **2** for 3-row and 6-row files (was per-row). Test suite 2/2. **Note:** `Graduate::generateAlumniId()` still issues one `MAX(...)` query per auto-generated college row (ID generation, not a duplicate check — outside T04) and uses MySQL-only `SUBSTRING_INDEX`/`CAST AS UNSIGNED` (flagged for Phase 6 SQLite compatibility alongside T10). |
| P2-T05 | ✅ Done | In the college course-resolution path, the branch where a code resolves to a **department with no course** now records a row error + `continue` instead of inserting a `course_id = null` graduate. (College rows always have a `course_code` — enforced by `validateRow` — so this was the only remaining path to a null-course college row.) Verified: dept-with-no-course row → error with a clear message; valid-course row still imports; unknown-code row still errors with the original message; **0** college rows inserted with null `course_id`. This removes the tracer-export disappearing-rows symptom at the source. Test suite 2/2. |
| P2-T06 | ✅ Done | New `DashboardCacheService` (single owner of key + TTL + invalidation) backed by `config/dashboard.php` (env-driven `DASHBOARD_CACHE_KEY` / `DASHBOARD_CACHE_TTL`, default 300s — no hardcoded values). `DashboardController::index()` now serves the payload via `->remember(...)`. Per decision #3, the cache is explicitly invalidated (`flush()`) on graduate **import** success (`GraduateImportService::process`) and admin graduate **update / delete / batch-update** (`GraduateService`). Verified on the database cache store: MISS = 20 aggregate queries, HIT = **0** (identical payload), and after `flush()` back to 20 (recompute). Alumni-side changes (registration/profile) surface within the short TTL — documented accepted staleness. DI resolves for all classes with new constructor deps. Test suite 2/2. |
| P2-T07 | ✅ Done | Added a private `distinctGraduateCount(Builder): int` helper using explicit `COUNT(DISTINCT graduate_id)` and replaced the three fragile `distinct('graduate_id')->count('graduate_id')` calls (board passers, board-failed, graduates-with-record). Hardcoded `'passer'`/`'failed'` strings replaced with `BoardExamStatus::PASSER/FAILED->value` (enum already existed; column is cast to it). |
| P2-T08 | ✅ Done | Board-failed metric now uses a correlated `whereNotExists` self-subquery (`board_exam_records as passers`) instead of `whereNotIn(..., ->pluck())`, so passer ids are never materialised into PHP. Verified equivalence: controller output matches the old query patterns on baseline **and** on an injected edge-case set (g1 passer×2 → distinct; g2 failed; g3 passer+failed → counts as passer only; g4 failed×2 → distinct): passers 2=2, failed 2=2, match=YES. Test suite 2/2. |
| Frontend | ✅ Done | `GraduateImportPage` now submits then **polls** `getImportDetail(batchId)` every `POLL_INTERVAL_MS` (named const, no magic number) until a final status, showing a spinner "Processing…" card meanwhile; action buttons appear only when done; counts null-coalesce to 0 during processing; polling is cleared on unmount/reset. `ImportHistoryPage` already maps the `processing` status color + `status_label`, so it reflects queued→processing→completed/failed without change. `npm run build` succeeds (the ~500 kB chunk warning is pre-existing / Phase 3). |
| P2-T10 | ✅ Done | New reusable `App\Support\SqlExpression::monthKey(column)` returns a driver-aware month expression (`DATE_FORMAT` on MySQL, `strftime` on SQLite, `to_char` on pgsql). Both `DATE_FORMAT` usages replaced: `DashboardController::getAlumniRegistrationsPerMonth` and `GraduateTracerService::getEmploymentTrend` (select + groupBy). Verified: MySQL emits `DATE_FORMAT(...)` and the dashboard still returns 12 months; an in-memory SQLite connection emits `strftime(...)` and groups correctly (2026-01=2, 2026-02=1). **Remaining for Phase 6 SQLite (out of T10's DATE_FORMAT scope, flagged for the test-DB effort):** the pre-existing MySQL-only migration `2026_06_28_000000_add_employer_to_users_role_enum.php` (`ALTER TABLE … MODIFY … ENUM`) and `Graduate::generateAlumniId()` (`SUBSTRING_INDEX`/`CAST … AS UNSIGNED`). These block a full SQLite `migrate:fresh`; Phase 6 can run backend tests on MySQL or address these two spots separately. |

---

## Validation Checklist

**Functional**
- [x] Uploading a large graduate file returns immediately with a batch handle; processing completes on the queue with correct imported/duplicate/error counts. — Verified end-to-end with a real worker (T01).
- [x] Import history/detail reflects queued → processing → completed/failed transitions. — `ImportBatchResource` exposes status/counts (T02); frontend polls it.
- [x] College rows with unresolvable course codes appear as import errors, not silently missing records. — Verified (T05): 0 null-course rows created.
- [x] Dashboard renders identical figures to pre-change (spot-check board passers/failed/not-taken, employment rate, growth %). — Board metrics proven equivalent old-vs-new incl. edge cases (T07/T08); other stats untouched.

**Security**
- [x] Import status endpoint is admin-only (behind existing `auth:api` + `account.status` + `role:admin`). — Reuses `importDetail` inside the admin route group; unchanged.
- [x] No change weakens the existing throttle on the export/import routes. — Route middleware untouched.

**Performance**
- [x] Import request response time is constant regardless of row count (heavy work offloaded). — `queue()` only stores the file, creates the batch, and dispatches (T01).
- [x] Import query count no longer scales linearly with rows (verify with query logging on a sample file). — Course/dept lookups constant at 2 (T03) and duplicate checks constant at 2 (T04) for 3-row vs 6-row files. *(Per-row inserts and `generateAlumniId` MAX remain inherent to insertion/id-generation, not lookups.)*
- [x] Dashboard repeat loads serve from cache with a large reduction in DB queries. — Verified MISS=20 → HIT=0 aggregate queries (T06).
- [x] Filtered graduate/user/alumni-search list queries use indexes (verify with `EXPLAIN`). — Indexes added (T09); `EXPLAIN` confirms optimizer picks the new user/board indexes and lists the graduates composite in `possible_keys` (full benefit realized at data volume).

**UI**
- [x] Import page shows a progress/queued state instead of blocking on a synchronous response. — Submit-then-poll with a "Processing…" card (frontend task).

**Regression**
- [x] Small-file imports still work exactly as before (counts, duplicates, errors). — Verified across T03/T04/T05 (imported/duplicate/error counts exact).
- [x] Tracer export still returns the correct rows (and no longer drops null-course college rows because they are now rejected at import). — Root cause removed at import (T05); export inner-join unchanged.
- [x] Dashboard participation, graduates-per-year, and registrations-per-month sections are unchanged in output. — Participation & graduates-per-year untouched; registrations-per-month verified identical on MySQL after the driver-aware change (T10).

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
