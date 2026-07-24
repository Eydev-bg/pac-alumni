# Production Readiness Audit
> Generated: 2026-07-24
> Scope: Full Admin + Alumni codebase review (Laravel 11 API backend + React 18 / Vite / Tailwind v4 SPA frontend)
> Reviewer: read-only audit — no code was modified.

## Executive Summary

This audit reviewed the entire application stack: 34 controllers, 28 service classes, 30 Eloquent models, 34 form requests, 5 middleware, 2 queue jobs, 4 console commands, the full route surface, and 136 frontend source files (114 `.jsx` + 22 `.js`). The codebase is, on the whole, **well-architected**: the DomainException migration is essentially complete, authorization is consistently enforced via middleware + per-record ownership checks, rich-text is sanitized server-side (HTMLPurifier `clean()`) *and* client-side (DOMPurify), SQL is parameterized, the bulk-email job is idempotent and chunked, and the graduate importer eliminated its per-row N+1. There are **no** open IDOR, SQL-injection, mass-assignment, or stored-XSS holes that I could substantiate.

The problems that matter are concentrated in **data-integrity of the admin dashboard aggregates** and **production-scaling assumptions**. I found **2 Critical**, **7 High**, **18 Medium**, and **13 Low** issues (40 total), plus four appendix inventories (dark-mode, indexes, dead code, Redis).

**Top 3 most critical items:**
1. **[C-001] The admin dashboard is served from a 5-minute cache that no alumni-side write ever invalidates.** This is the *exact* root cause of the reported "employment status not reflecting in admin dashboard counts" symptom — see the finding for the precise query and service method.
2. **[C-002] Dashboard board-passer and employment counts include soft-deleted graduates, while `total_graduates` excludes them** — the numerator and denominator of the dashboard rates are computed on inconsistent populations, so the percentages are wrong after any graduate is trashed.
3. **[H-001] No paginated endpoint clamps `per_page`** — any authenticated user can request `?per_page=1000000` on ~16 endpoints and force the server to hydrate arbitrarily large result sets (with eager loads), a trivial memory-exhaustion/DoS vector.

Overall assessment: **Not production-ready as-is, but close.** The Critical items are small, surgical fixes (cache invalidation + soft-delete scoping). The larger risk is operational: near-zero automated test coverage on the analytics/dashboard/employment surfaces (the very code with the integrity bugs), and local-disk file storage that breaks under horizontal scaling. Redis is **recommended but not strictly required** for launch (see Appendix D).

---

## Phase 1 — Critical (Must fix before production)

### [C-001] Admin dashboard cache is never invalidated by alumni-side writes (employment status sync bug — ROOT CAUSE)
> ✅ **FIXED** — 2026-07-24 — Injected `DashboardCacheService` into `EmploymentService`, `BoardExamService`, `VerificationService`, and `UserService::updateStatus`; each now calls `->flush()` immediately AFTER its transaction commits so alumni employment/board/registration/status changes invalidate the dashboard cache right away.
- **Category**: Data Integrity
- **Side**: Both (Alumni writes → Admin reads)
- **Files**:
  - `backend/app/Http/Controllers/Api/Admin/DashboardController.php:36-45` (reads from cache)
  - `backend/app/Services/Admin/DashboardCacheService.php:18-29` (`remember()` / `flush()`)
  - `backend/config/dashboard.php:22` (`ttl` default 300s)
  - `backend/app/Services/Alumni/EmploymentService.php:80-196` (`submitEmployment` — updates status, **never** flushes)
  - `backend/app/Services/Alumni/BoardExamService.php:88-180` (`submitBoardExam` — same)
  - `backend/app/Services/Admin/VerificationService.php:83-137` (registration creates alumni — same)
  - `backend/app/Services/Admin/UserService.php:120-143` (`updateStatus` — same)
- **Issue**: `DashboardController::index()` wraps the entire payload in `$this->dashboardCache->remember(...)`, a `Cache::remember()` with a 300-second TTL. The cache is flushed in **exactly five places, all inside admin graduate CRUD**: `GraduateService.php:96,118,135,155,179` and `GraduateImportService.php:233`. No alumni-facing write path calls `DashboardCacheService::flush()`. When an alumnus submits an employment update, `EmploymentService::submitEmployment()` correctly writes `alumni_profiles.employment_status` (line 118) and inserts/supersedes the `employment_records` row (lines 99-115) inside a DB transaction — but it does not touch the dashboard cache. The admin dashboard therefore keeps serving the **stale pre-update** `employed_count`, `employment_rate`, and `employment_type_breakdown` until the TTL lapses.
- **Impact**: Admin sees wrong employment/board/registration counts for up to `DASHBOARD_CACHE_TTL` seconds (300s by default; longer if tuned up in prod). To an operator watching the dashboard right after an alumnus updates their status, the number simply "doesn't change" — the reported bug. The config comment at `config/dashboard.php:18-20` even acknowledges this ("alumni-side changes surface within this window") — i.e. the staleness is a known trade-off that was never wired to explicit invalidation.
- **Evidence**:
  ```php
  // DashboardController.php:38-42 — every stat is behind the cache
  $data = $this->dashboardCache->remember(fn () => [
      'stats' => $this->getStatsCards(),
      'employment_type_breakdown' => $this->getEmploymentTypeBreakdown(),
      ...
  ]);
  // EmploymentService.php:117-118 — writes profile, but no flush anywhere in this file
  $profile->update(['employment_status' => EmploymentStatus::EMPLOYED]);
  // grep of flush() callers → only GraduateService + GraduateImportService
  ```

### [C-002] Dashboard board-passer & employment counts include soft-deleted graduates; `total_graduates` does not
> ✅ **FIXED** — 2026-07-24 — Added a private `excludeTrashedGraduates()` helper (`whereHas('graduate')`, which applies the Graduate SoftDeletes global scope) and applied it to all board-passer, board-record, employment-count, employment-total, and employment-type-breakdown queries in `DashboardController`, so trashed graduates now drop out of every numerator consistently with `total_graduates`.
- **Category**: Data Integrity
- **Side**: Admin
- **Files**: `backend/app/Http/Controllers/Api/Admin/DashboardController.php:52,74-87,116,173-178`; `backend/app/Models/Graduate.php:19` (`use SoftDeletes`)
- **Issue**: `Graduate` uses `SoftDeletes`, so `Graduate::count()` (line 52) and `Graduate::whereIn('course_id', …)->count()` (line 80) transparently exclude trashed graduates via the global scope. But the board-passer and employment numerators are computed off child tables that have **no** soft-delete scope and are **not** joined to `graduates` to filter `deleted_at`:
  - `board_passers` (line 74) = `distinctGraduateCount(BoardExamRecord::where('status','passed'))` — counts board records of trashed graduates.
  - `graduatesWithBoardRecord` (line 81) = `distinctGraduateCount(BoardExamRecord::query())` — same.
  - `employed` / `totalProfiles` (lines 85-86) = `AlumniProfile::where('employment_status', …)->count()` — `AlumniProfile` has no soft-delete and is not scoped to living graduates.
- **Impact**: After any graduate is soft-deleted (Trash feature, `GraduateService`), the dashboard's `total_graduates` drops but `board_passers` and `employed_count` do not, so `board_passing_rate` and `employment_rate` are computed on mismatched populations and can even exceed 100% or exceed `board_program_total`. Note this is *inconsistent with the rest of the app*: `AnalyticsService` (lines 116,129,178) and `GraduateTracerService` (lines 40,111) both correctly `whereNull('g.deleted_at')`. The dashboard is the outlier.
- **Evidence**:
  ```php
  // total EXCLUDES trashed (SoftDeletes global scope)
  $totalGraduates = Graduate::count();
  // numerator INCLUDES trashed graduates' records (no join to graduates.deleted_at)
  $boardPassers = $this->distinctGraduateCount(
      BoardExamRecord::where('status', BoardStatus::PASSED->value)
  );
  $employed = AlumniProfile::where('employment_status', 'employed')->count();
  ```

---

## Phase 2 — High (Should fix before production)

### [H-001] No paginated endpoint clamps `per_page` — unbounded page size (DoS / memory)
> ✅ **FIXED** — 2026-07-24 — Clamped every request-facing `per_page` read to a max of 100 via `min(...)` (default values unchanged). 24 sites total: 17 at the controller level for direct reads, and 7 at the service-level `paginate()` call for the filters-array pass-through pattern (`AdminJobPosting`, `Announcement`, `Event`, `AchievementFeed`, `AlumniAnnouncement`, `AlumniEvent`, `AlumniJobPosting`). Silent clamp, not a 422.
- **Category**: Security / Performance
- **Side**: Both
- **Files** (all read `per_page` with only a default, never a max): `AlumniSearchController.php:61`, `CourseController.php:31`, `DepartmentController.php:30`, `EmailLogController.php:25`, `GraduateController.php:33,92,170`, `LoginActivityLogController.php:27`, `NotificationController.php:25`, `UserController.php:30`, `VerificationController.php:89,106,123,152`, `Alumni/AlumniNotificationController.php:25`, `Alumni/DirectoryController.php:37`; service side `AchievementFeedService.php:25`, `AlumniAnnouncementService.php:34`.
- **Issue**: Every controller uses `$request->integer('per_page', 15)` (or 20/30) with no upper bound. A caller can pass `?per_page=1000000`.
- **Impact**: The directory/graduate/alumni-search endpoints eager-load nested relations per row (e.g. `DirectoryService::CARD_EAGER`), so a single large-page request hydrates hundreds of thousands of models + relations into memory and serializes them — trivial to exhaust PHP memory or wedge a worker. Authenticated but low-privilege (any alumnus) can trigger it on `/alumni/directory`.
- **Evidence**: `DirectoryController.php:37` `perPage: $request->integer('per_page', 15)` → `DirectoryService::list()` → `->paginate($perPage)` with no `min()/max()` anywhere in the chain.

### [H-002] Profile pictures & board-exam proofs are written to the local `public` disk — breaks horizontal scaling
- **Category**: Scalability
- **Side**: Alumni
- **Files**: `backend/app/Services/Alumni/AlumniService.php:216-253` (upload), `:280-288` (delete); `backend/app/Services/Alumni/BoardExamService.php:106-112`; import files `GraduateImportService.php:40` (`$file->store('imports')` on default disk).
- **Issue**: Uploads use `Storage::disk('public')` (local filesystem) and paths are stored as `/storage/...`. In a multi-server / autoscaled deployment each node has its own disk, so an image uploaded on node A 404s when served from node B, and the queued import file written on the web node is unreadable by a separate queue worker node.
- **Impact**: In any deployment with >1 app server (or separate queue workers), profile pictures, board-exam proofs, and graduate imports intermittently fail. Must move to S3/object storage (`filesystems.php` already scaffolds an `s3` disk) before scaling out.
- **Evidence**: `AlumniService.php:226` `$path = $file->storeAs('', $filename, 'public');` and `:230` `'profile_picture' => '/storage/' . $path`.

### [H-003] Near-zero automated test coverage on the analytics/dashboard/employment surfaces
- **Category**: Production readiness / Test coverage
- **Side**: Both
- **Files**: `backend/tests/` contains only 9 real test files (see Executive Summary). Controllers/services with **zero** coverage include: `DashboardController`, `AnalyticsController`/`AnalyticsService`, `GraduateTracerController`/`GraduateTracerService`, `EmploymentController`/`EmploymentService`, `BoardExamController`/`BoardExamService`, `DirectoryController`/`DirectoryService`, `AchievementFeedController`, `AlumniAnnouncementController`, `AlumniEventController`, `AlumniJobPostingController`, `AlumniNotificationController`, all admin CRUD (`Announcement`, `Event`, `AdminJobPosting`, `Department`, `Course`, `Graduate`, `Verification`, `Reminder`, `Report`, `EmailLog`, `LoginActivityLog`, `Settings`, `Notification`), `ProfileCompletionService`, `ReminderStatsService`, `GraduateImportService`.
- **Issue**: The exact modules carrying C-001/C-002 (dashboard aggregates, employment sync) have no regression tests, so the integrity bugs shipped undetected and future refactors are unguarded.
- **Impact**: High regression risk; the dashboard math can silently drift again.
- **Evidence**: `find tests -name '*Test.php'` → 9 substantive files vs. 28 services / 34 controllers.

### [H-004] `GraduateTracerService::clearCache()` is a no-op — tracer analytics stay stale 10-15 min with no invalidation
> ✅ **FIXED** — 2026-07-24 — Implemented `clearCache()` to drop the entire `tracer:*` namespace in a driver-aware sweep (DELETE by key prefix on the database store, `keys()`+`del()` on Redis, TTL fallback otherwise), and wired `clearCache()` into all write paths alongside the dashboard flush: `EmploymentService`, `BoardExamService`, `VerificationService`, `UserService::updateStatus`, all 5 `GraduateService` sites, and `GraduateImportService` (injected via constructor).
- **Category**: Data Integrity
- **Side**: Admin
- **Files**: `backend/app/Services/Admin/GraduateTracerService.php:29-33,100-102,306-316`
- **Issue**: `getTracerSummary` and `getTracerByCourse` cache under `tracer:*` keys for 10 and 15 minutes. `clearCache()` (lines 306-316) contains only comments — it does nothing. Worse, **nothing calls it** (grep found zero callers). So tracer employment/registration/board numbers only refresh on natural TTL expiry, and never react to a graduate import, registration, or employment change.
- **Impact**: Admin tracer tables can disagree with the live data (and with the dashboard) for up to 15 minutes; the method's existence implies an invalidation contract that is not honored.
- **Evidence**: method body is entirely commented-out guidance; `grep -rn clearCache app/` → no callers.

### [H-005] Frontend swallows API errors silently with empty `.catch(() => {})` — no error state shown to the user
> ✅ **FIXED** — 2026-07-24 — Replaced all 31 empty `.catch(() => {})` sites across 16 files with dev-visible `console.error` logging. All 31 turned out to be non-critical fetches (Category B): reference/filter-dropdown loads, background polls/unread-counts, secondary dashboard preview widgets (which already degrade to graceful empty states), and a fail-open registration pre-check. The primary user-blocking loads already had `setError`/`toast.error` handling, so there were no silent Category A/C sites to convert.
- **Category**: Error Handling
- **Side**: Both
- **Files** (representative, not exhaustive): `context/UnreadContext.jsx:28,35,39`; `components/layout/Header.jsx:147`; `context/MaintenanceContext.jsx:28`; `pages/admin/alumni/AlumniSearchPage.jsx:46,50,54`; `pages/admin/analytics/CollegeAnalyticsTab.jsx:56`; `pages/admin/analytics/LevelAnalyticsTab.jsx:56` (grep shows many more).
- **Issue**: Numerous data fetches end in `.catch(() => {})` / `.catch(() => {});`, discarding the error. On failure the component shows a permanent spinner or empty content with no message and no retry.
- **Impact**: When the API errors (500, network drop), the user sees blank/loading UI with no indication anything went wrong — poor production UX and hard to support.
- **Evidence**: `UnreadContext.jsx:28` `.catch(() => {});` around the unread-count poll.

### [H-006] N+1 in `AnalyticsService::collegeGraduates()` department breakdown
> ✅ **FIXED** — 2026-07-24 — Replaced the per-department loop (1 + 2N queries) with a single grouped query over college graduates keyed by (department_id, course_id) plus one courses lookup, then aggregated to department level in PHP. Same output shape, same OR-attribution semantics (direct department_id OR course-department, counted under both when they differ), same filters (college scope, year range, soft-delete exclusion). Query count for the breakdown is now constant (3) regardless of department count.
- **Category**: Performance
- **Side**: Admin
- **Files**: `backend/app/Services/Admin/AnalyticsService.php:74-99`
- **Issue**: After loading all college departments, the `->map()` runs, **per department**, one `$dept->courses()->pluck('id')` query (line 81) plus one `Graduate::...->count()` query (lines 82-91). With N college departments that is 2N extra queries on every College Analytics load.
- **Impact**: Scales linearly with department count on a hot analytics page; unnecessary DB load. A single grouped query (as `getTracerByCourse` already does) would replace it.
- **Evidence**: lines 80-91 issue queries inside the closure passed to `->map()`.

### [H-007] Dashboard employment-rate denominator can’t be trusted the moment C-001/C-002 apply, and `is_current` breakdown diverges from `employment_status`
- **Category**: Data Integrity
- **Side**: Admin
- **Files**: `DashboardController.php:85-87,150-166`
- **Issue**: `employment_rate` is derived from `alumni_profiles.employment_status` (lines 85-87) while `employment_type_breakdown` is derived from `employment_records.is_current` (lines 153-156). These two are written in the same transaction today, but there is no invariant/DB constraint keeping them in lock-step (e.g. a manually-inserted `employment_records` row, or a future code path that sets one but not the other, desynchronizes "X employed" from "sum of type breakdown"). Combined with C-002 (neither excludes trashed graduates), the two employment widgets on the same dashboard can show contradictory totals.
- **Impact**: Two dashboard cards that should reconcile can disagree; erodes trust in the analytics.
- **Evidence**: two different source tables for the same concept, no cross-check.

### [H-008] Privacy opt-out (`is_directory_visible`) not enforced in messaging and achievement feed
> ✅ **FIXED** — 2026-07-24 — Added visibility constraint to searchRecipients, startConversation, and achievement feed query
- **Category**: Privacy / Data Integrity
- **Side**: Alumni
- **Files**: `MessageService.php:127-139` (searchRecipients), `MessageService.php:41-66` (startConversation), `AchievementFeedService.php:18-25` (list)
- **Issue**: Alumni who set is_directory_visible=false are hidden from the directory but remain fully searchable and messageable via /messages/recipients, and their achievements appear in the community feed.
- **Impact**: Broken privacy promise — users who opted out are still exposed.
- **Evidence**: No reference to is_directory_visible in MessageService or AchievementFeedService queries.
- **Fix detail**: `searchRecipients` now filters `whereHas('alumniProfile', is_directory_visible=true)`; `startConversation` rejects a hidden recipient with the same 404 as a non-existent user, EXCEPT when a conversation already exists between the pair (existing threads keep working); the achievement feed constrains the public branch to visible authors while always keeping the requester's own entries. `DirectoryService::baseQuery()` was confirmed to already enforce visibility (unchanged).

---

## Phase 3 — Medium (Fix soon after launch)

### [M-001] Alumni-facing pages are not dark-mode aware (feature is half-shipped)
- **Category**: Frontend / Dark mode
- **Side**: Alumni
- **Files**: see **Appendix A** for the full inventory.
- **Issue**: Dark mode is deliberately scoped to the `/alumni` subtree (`context/ThemeContext.jsx:40-56` — admin is intentionally light-only, so admin pages are **not** gaps). But within `/alumni`, only the shell (`AlumniLayout`, `Header`, `MobileTabBar`), the dashboard, the settings tabs, and the shared `ui/*` primitives carry `dark:` variants. Every other alumni page (profile, employment, board-exam, directory, events, careers, messages, announcements, notifications) has zero `dark:` classes and hardcodes `bg-white`/`text-slate-*`, so they render as light panels with dark chrome around them when a user selects Dark.
- **Impact**: A user who enables Dark (a feature you ship in Settings → Appearance) gets a broken, half-dark experience on most pages.
- **Evidence**: 16 of 114 `.jsx` files use `dark:`; the alumni page gap list is in Appendix A.

### [M-002] `DirectoryController::show` catches every exception and reports 404 — masks real failures
- **Category**: Error Handling
- **Side**: Alumni
- **Files**: `backend/app/Http/Controllers/Api/Alumni/DirectoryController.php:73-85`; `DirectoryService.php:97-98` throws a raw `\Exception('Profile not available.', 404)`.
- **Issue**: The controller wraps the lookup in `catch (\Exception $e) { return $this->notFound(...) }`. A genuine DB error, serialization bug, or any unexpected throwable is reported to the client as "profile not available" (404), hiding server faults from logs/monitoring and from the caller.
- **Impact**: Real 500-class problems are silently disguised as 404s; harder to detect outages.
- **Evidence**: `DirectoryController.php:82` `catch (\Exception $e)` is unconditional.

### [M-003] Registration and user-status changes don’t invalidate the dashboard cache (same family as C-001)
- **Category**: Data Integrity
- **Side**: Both
- **Files**: `VerificationService.php:83-137`, `UserService.php:120-143`
- **Issue**: New alumni registration increments `registered_alumni`/`active_alumni`; suspending/deactivating a user changes `active_alumni`/`inactive_alumni`. Neither flushes `DashboardCacheService`.
- **Impact**: New-registration and account-status counts lag by the cache TTL.
- **Evidence**: no `dashboardCache->flush()` in either service.

### [M-004] `MaintenanceSetting::getSettings()` hit on every non-admin request without request-level memoization
- **Category**: Performance
- **Side**: Alumni
- **Files**: `backend/app/Http/Middleware/CheckMaintenanceMode.php:30`
- **Issue**: Every alumni-scoped request (the `maintenance` middleware is on the whole `/alumni` group) queries `MaintenanceSetting::getSettings()`. Confirm whether `getSettings()` caches; if it hits the DB each call, that is one extra query per alumni request.
- **Impact**: Constant per-request DB read on the busiest route group; a cached singleton (with invalidation on update) removes it.
- **Evidence**: middleware calls `getSettings()` unconditionally for non-admins.

### [M-005] Board-exam proof file is written before the transaction commits — orphaned file on rollback
- **Category**: Data Integrity / Storage
- **Side**: Alumni
- **Files**: `backend/app/Services/Alumni/BoardExamService.php:106-112` (inside `DB::transaction` at 90)
- **Issue**: `storeAs()` persists the proof to disk at line 110; if the surrounding transaction later throws and rolls back, the DB row is gone but the uploaded file remains on disk with no reference.
- **Impact**: Slow accumulation of orphaned proof files; storage leak. (`AlumniService::uploadProfilePicture` has the same shape but deletes the *old* file first, which is a separate risk: a rollback loses the old picture reference.)
- **Evidence**: file write occurs mid-transaction, no compensating delete on failure.

### [M-006] `generateAlumniId()` called row-by-row inside the import loop — race + per-row query
- **Category**: Data Integrity / Performance
- **Side**: Admin
- **Files**: `backend/app/Services/Admin/GraduateImportService.php:143`; `Graduate::generateAlumniId()`
- **Issue**: For college rows without a provided alumni ID, `generateAlumniId((int) year)` is invoked per row. If it derives the next sequence via a `MAX()+1`/count query, two concurrent imports (or two rows in the same batch before commit) can generate the same ID; it is also a query per generated row inside the loop, partially defeating the batch’s otherwise N+1-free design.
- **Impact**: Possible duplicate `alumni_id_number` under concurrency; extra queries at scale.
- **Evidence**: `$alumniIdNumber = Graduate::generateAlumniId(...)` inside `foreach ($rows …)`.

### [M-007] Employment/board-exam admin notifications are created synchronously, one INSERT per admin, inside the request transaction
- **Category**: Performance / Scalability
- **Side**: Alumni→Admin
- **Files**: `EmploymentService.php:201-239`, `BoardExamService.php:185-216`
- **Issue**: `notifyAdmins()` loops all active admins and `Notification::create()` per admin within the alumnus’ request-path transaction. Fine for a handful of admins, but it is synchronous work on the alumni write path and could be a queued fan-out.
- **Impact**: Alumni submit latency grows with admin count; notification writes share the alumnus’ transaction.
- **Evidence**: `foreach ($admins as $adminId) { Notification::create([...]); }`.

### [M-008] `CheckAccountStatus` performs `auth()->logout()` (a write/side-effect) inside middleware on a suspended token
- **Category**: Correctness
- **Side**: Both
- **Files**: `backend/app/Http/Middleware/CheckAccountStatus.php:23-34`
- **Issue**: On a suspended/deactivated account the middleware calls `auth()->logout()` and swallows any exception. For a stateless JWT guard `logout()` blacklists the token (requires the blacklist store); if blacklisting is disabled or misconfigured this is a silent no-op, and if enabled it adds a store write to every blocked request. The empty `catch` also hides misconfiguration.
- **Impact**: Behavior depends on JWT blacklist config; the swallowed exception can mask a broken blacklist store.
- **Evidence**: lines 25-29 `try { auth()->logout(); } catch (\Exception $e) { /* empty */ }`.

### [M-009] Catch-all route sends authenticated users to `/login`; `/unauthorized` block is unstyled/inline
- **Category**: Frontend / UX
- **Side**: Both
- **Files**: `frontend/src/routes/AppRouter.jsx:153-166`
- **Issue**: `<Route path="*" element={<Navigate to="/login" replace />} />` bounces *any* unknown path to login even for a logged-in user (should be a 404 within their shell). The `/unauthorized` element is inline JSX with hardcoded `bg-slate-50 text-slate-800` (no shared component, no dark handling).
- **Impact**: Logged-in users hitting a stale/mistyped link are ejected to the login screen; inconsistent 403/404 UX.
- **Evidence**: lines 153-166.

### [M-010] Import file lacks explicit max-row / size guard beyond the HTTP upload limit
- **Category**: Scalability
- **Side**: Admin
- **Files**: `GraduateImportService.php:61-247`, `Requests/Admin/ImportGraduatesRequest.php`
- **Issue**: `process()` loads the whole spreadsheet via `IOFactory::load()` and `toArray()` into memory (line 66-68) with no upper bound on row count. A very large XLSX can exhaust worker memory. (It is queued, which is good, but a single job still materializes all rows.)
- **Impact**: Large imports can OOM the queue worker; confirm `ImportGraduatesRequest` enforces a sane `max` file size and consider a row cap / streaming reader.
- **Evidence**: `$rows = $sheet->toArray(null, true, true, true);` with no cap.

### [M-011] `AlumniService::uploadProfilePicture` deletes the previous picture before the new write is durable
- **Category**: Data Integrity
- **Side**: Alumni
- **Files**: `backend/app/Services/Alumni/AlumniService.php:218-232`
- **Issue**: Inside the transaction, `deleteProfilePictureFile()` runs first (line 220), then the new file is stored (line 226) and the row updated. A failure between delete and commit loses the old image with no rollback of the filesystem delete.
- **Impact**: Edge-case loss of the existing avatar with nothing to restore.
- **Evidence**: delete-then-store ordering at lines 220-226.

### [M-012] Filename/extension trust on uploads (`getClientOriginalExtension`)
- **Category**: Security
- **Side**: Alumni
- **Files**: `AlumniService.php:223`, `BoardExamService.php:109`
- **Issue**: The stored filename’s extension is taken from `getClientOriginalExtension()` (client-controlled). MIME is validated in the FormRequests (`mimes:jpeg,jpg,png[,pdf]`), which mitigates content-type spoofing, but the persisted extension still trusts client input. Prefer deriving the extension from the validated MIME / `guessExtension()`.
- **Impact**: Low-to-medium; mainly a defense-in-depth gap since `mimes` validation is present.
- **Evidence**: `'…' . $file->getClientOriginalExtension()`.

### [M-013] Directory single-profile lookup and list re-run visibility subqueries per request without caching
- **Category**: Performance
- **Side**: Alumni
- **Files**: `DirectoryService.php:111-148` (`filterOptions`), `:59-73` (`list`)
- **Issue**: `filterOptions()` builds the years dropdown with a nested `whereHas` over users+profiles on every call, and departments/courses lists are re-queried each time. These reference lists change rarely and are ideal cache candidates.
- **Impact**: Repeated heavy `whereHas` on the directory filters endpoint; unnecessary load.
- **Evidence**: lines 113-141.

### [M-014] `distinctGraduateCount` and board math don’t exclude board records with `status != passed` from `board_not_yet_taken` denominator edge cases
- **Category**: Data Integrity
- **Side**: Admin
- **Files**: `DashboardController.php:79-82`
- **Issue**: `board_not_yet_taken = graduatesInBoardPrograms - graduatesWithBoardRecord`, where `graduatesWithBoardRecord` counts graduates with *any* board record. A graduate in a board program who has only a non-`passed` record is treated as "taken", but they are neither a passer nor "not yet taken" — the three buckets (`board_passers`, `board_not_yet_taken`, remainder) don’t sum cleanly. Combined with C-002 (records of trashed grads counted), this bucket is unreliable.
- **Impact**: Board-status breakdown numbers don’t reconcile to the program total.
- **Evidence**: lines 79-82.

### [M-015] Alumni pages: inconsistent/absent empty & error states
- **Category**: Frontend architecture
- **Side**: Alumni
- **Files**: alumni list pages in Appendix A (directory, events, careers, notifications, messages)
- **Issue**: Given the widespread empty `.catch(() => {})` (H-005), several list pages have loading states but no distinct **error** state and, in places, no **empty** state — the failure and empty cases render identically (blank).
- **Impact**: Users can’t tell "no data" from "load failed."
- **Evidence**: cross-reference H-005 catch sites with the list pages.

### [M-016] `LandingStatsController` (public, unauthenticated) — verify aggregation is cached
- **Category**: Performance / Security
- **Side**: Shared (public)
- **Files**: `routes/api/public.php:20-22`, `Api/Public/LandingStatsController.php`
- **Issue**: The only unauthenticated data endpoint is throttled (120/min per IP) which is good, but confirm the aggregate counts are cached; otherwise every anonymous landing hit runs COUNT queries against the main tables.
- **Impact**: Public endpoint can drive DB load under traffic spikes.
- **Evidence**: route is public + throttled; caching not confirmed in this pass.

### [M-017] Monolithic page components (>600 lines) mixing fetch, form, and presentation
- **Category**: Frontend architecture / Maintainability
- **Side**: Both
- **Files**: `AlumniProfilePage.jsx` (1472), `AlumniEmploymentPage.jsx` (843), `layout/Header.jsx` (719), `AlumniDashboardPage.jsx` (691), `AlumniBoardExamPage.jsx` (668), `admin/jobs/JobPostingFormPage.jsx` (597), `admin/events/EventFormPage.jsx` (568), `AlumniRegisterPage.jsx` (523).
- **Issue**: These single-file components combine data fetching, validation, local state, and large JSX trees, making them hard to test and prone to unnecessary re-renders.
- **Impact**: Maintenance/testing burden; render performance (see M-018).
- **Evidence**: line counts above.

### [M-018] Sparse memoization on large lists; effects depend on the full data-fetch surface
- **Category**: Frontend performance
- **Side**: Both
- **Files**: only 5 files use `React.memo`; 34 use `useMemo`/`useCallback` out of 114 components; 158 `useEffect` occurrences.
- **Issue**: Large list/table pages (graduates, directory, alumni-search) re-render children without `React.memo` and re-create handler closures each render, so row components re-render on every parent state change (search keystroke, poll tick).
- **Impact**: Jank on large lists, especially the directory/graduate tables.
- **Evidence**: `React.memo` count = 5 across 114 components.

---

## Phase 4 — Low (Nice to have / Tech debt)

### [L-001] DomainException migration verification — essentially clean (one intentional exclusion + one guard)
- **Category**: Code consistency
- **Side**: Both
- **Files**: `Services/Alumni/DirectoryService.php:98` (`throw new \Exception('Profile not available.', 404)`); `Services/ContentAudienceResolver.php:38,44` (`throw new InvalidArgumentException(...)`).
- **Finding**: **No residual raw `\Exception` throws in services other than the documented DirectoryService case** (which the task confirms is an intentional exclusion, caught by its controller). `ContentAudienceResolver` throws `InvalidArgumentException` for an unknown `target_type` — that is a programmer-error guard, not a domain error, and is acceptable. AuthService’s deliberate login `catch` is intact. **Verdict: the DomainException migration is complete.**

### [L-002] `AuthController::changePassword` hashes with `Hash::make()` while the model casts `password => 'hashed'`
- **Category**: Code consistency
- **Side**: Both
- **Files**: `AuthController.php:139` vs `User.php:54` and `SecuritySettingsService.php:41`
- **Issue**: `AuthController` passes `Hash::make($password)` to `update()`, while `SecuritySettingsService` passes the raw password and relies on the `hashed` cast. Both work (the `hashed` cast skips already-hashed values), but the two flows are inconsistent.
- **Impact**: None functionally; readability/consistency only.
- **Evidence**: two different conventions for the same operation.

### [L-003] Dead code: `GraduateTracerService::clearCache()` body is entirely commented out and uncalled
- **Category**: Dead code
- **Files**: `GraduateTracerService.php:306-316` — see Appendix C.

### [L-004] Dead code: default Laravel `ExampleTest` scaffolds still present
- **Category**: Dead code
- **Files**: `tests/Unit/ExampleTest.php`, `tests/Feature/ExampleTest.php` — see Appendix C.

### [L-005] `RoleMiddleware` has trailing blank lines / stray whitespace block
- **Category**: Dead code / style
- **Files**: `backend/app/Http/Middleware/RoleMiddleware.php:40` (empty body after method).

### [L-006] `console.warn`/`console` statements shipped in production bundle
- **Category**: Tech debt
- **Files**: `context/ThemeContext.jsx:124`, plus 2 others (3 total) — strip or gate behind `import.meta.env.DEV`.

### [L-007] `baseURL` falls back to a hardcoded `http://localhost:8000/api`
- **Category**: Environment
- **Files**: `frontend/src/api/axios.js:16`
- **Issue**: Fine as a dev default, but if `VITE_API_BASE_URL` is unset at build time the production bundle silently ships pointing at localhost. Consider failing the build when the env var is missing in `production` mode.

### [L-008] `overview()` runs one `COUNT` per education level in a loop
- **Category**: Performance (minor)
- **Files**: `AnalyticsService.php:231-243` — 4 separate `Graduate::where('education_level',…)->count()` could be a single `GROUP BY education_level`.

### [L-009] `AchievementFeedService::list` eager-loads `alumniProfile.user` for a public feed
- **Category**: Data exposure (minor)
- **Files**: `AchievementFeedService.php:19` — verify the `DirectoryCardResource`/feed resource does not leak `email`/`phone` via the loaded `user` (the `User` model hides `password`/`id`, but `email` is not in `$hidden`). Confirm the feed resource whitelists fields.

### [L-010] `EmploymentStatus::UNKNOWN` is the default profile state but not shown as a dashboard bucket
- **Category**: Consistency
- **Files**: migration `2026_03_17_135538_create_alumni_profiles_table.php:19` (default `'unknown'`); `DashboardController.php:85`.
- **Issue**: The dashboard reports `employment_known_count` and `employment_total_profiles` but never surfaces the "unknown" gap explicitly; the difference is left for the reader to infer. Minor.

### [L-011] `Notification` fan-out stores per-admin rows rather than a shared notification + read pivot
- **Category**: Tech debt / scale
- **Files**: `EmploymentService.php:230-238`, `BoardExamService.php:207-215` — duplicates the same message row per admin. Acceptable at small admin counts.

### [L-012] Duplicated name-search logic across `User::scopeSearch`, `DirectoryService::applyFilters`, and import name keys
- **Category**: Redundancy
- **Files**: `User.php:144-164`, `DirectoryService.php:182-191`, `GraduateImportService.php:353-356` — three near-identical multi-term LIKE builders; candidate for a shared trait/helper.

### [L-013] `AnalyticsController` level endpoints (`elementary/jhs/shs`) return identical shapes via three routes/methods
- **Category**: Redundancy
- **Files**: `AnalyticsService.php:22-41` — three one-line wrappers around `getSimpleLevelAnalytics`; could collapse to a single `/analytics/level/{level}` route.

---

## Appendix A — Dark Mode Gap Inventory

**Design intent (confirmed):** Dark mode is scoped to the `/alumni` subtree only. `context/ThemeContext.jsx:40-56` force-removes the `.dark` class off `/alumni`, so **all `/admin` and public pages are intentionally light-only and are NOT gaps.** Tailwind v4 class-based dark is correctly wired via `src/index.css:10` (`@custom-variant dark (&:where(.dark, .dark *))`).

**Already dark-aware (16 files):** `components/layout/AlumniLayout.jsx`, `components/layout/Header.jsx`, `components/alumni/MobileTabBar.jsx`, `components/settings/SettingsSection.jsx`, `pages/alumni/dashboard/AlumniDashboardPage.jsx`, `pages/alumni/dashboard/AchievementFeed.jsx`, `pages/alumni/settings/AlumniSettingsPage.jsx`, `pages/alumni/settings/tabs/AppearanceTab.jsx`, `pages/alumni/settings/tabs/SecurityTab.jsx`, and shared primitives `ui/Alert.jsx`, `ui/Button.jsx`, `ui/Card.jsx`, `ui/Input.jsx`, `ui/Select.jsx`, `ui/Toast.jsx`, plus `context/ThemeContext.jsx`.

**Alumni pages/components that need dark-mode work (real gaps — no `dark:` classes, hardcoded `bg-white`/`text-slate-*`):**
1. `pages/alumni/profile/AlumniProfilePage.jsx`
2. `pages/alumni/employment/AlumniEmploymentPage.jsx`
3. `pages/alumni/board-exam/AlumniBoardExamPage.jsx`
4. `pages/alumni/announcements/AlumniAnnouncementsPage.jsx`
5. `pages/alumni/notifications/AlumniNotificationsPage.jsx`
6. `pages/alumni/events/AlumniEventsPage.jsx`
7. `pages/alumni/jobs/AlumniCareerCenterPage.jsx`
8. `pages/alumni/jobs/AlumniJobDetailPage.jsx`
9. `pages/alumni/directory/AlumniDirectoryPage.jsx`
10. `pages/alumni/directory/AlumniPublicProfilePage.jsx`
11. `pages/alumni/messages/AlumniInboxPage.jsx`
12. `pages/alumni/messages/AlumniConversationPage.jsx` *(and `ConversationThread.jsx`)*
13. `pages/alumni/dashboard/ProfileCompletion.jsx` (dashboard child component)
14. Any components under `components/alumni/ui/` not on the dark-aware list above (audit each; the shared `ui/*` primitives are covered but alumni-specific UI wrappers may not be).

> Note: pages that compose the shared `ui/Card`/`ui/Button`/`ui/Input` primitives will partially theme (those primitives are dark-aware), but their own page-level containers, headers, section backgrounds, and slate text will not — so each still needs a pass.

---

## Appendix B — Missing / Recommended Index Inventory

Existing indexes are good (`2026_07_08_000002_add_performance_indexes.php` covers `graduates(education_level,graduation_year,department_id,course_id)`, `graduates(last_name)`, `users(role,status,last_login_at)`, `board_exam_records(graduate_id,status)`, `alumni_profiles(employment_status,graduate_id)`; base migration indexes `alumni_profiles.employment_status` and `board_status`). Recommended additions:

| Query site | Columns filtered/joined | Suggested index |
|---|---|---|
| `EmploymentRecord::where('is_current', true)` — dashboard breakdown, analytics, tracer export (`DashboardController.php:153`, `AnalyticsService.php:195,207`, `GraduateTracerService.php:257`) | `is_current`, `graduate_id`, `employment_type` | `employment_records (graduate_id, is_current)` and/or `(is_current, employment_type)` |
| `employment_status_history` trend (`GraduateTracerService.php:201-204`) | `changed_at`, `graduate_id`, `new_status` | `employment_status_history (changed_at)` and `(graduate_id, changed_at)` |
| `Conversation::forUser()` + `ORDER BY COALESCE(last_message_at, created_at)` (`MessageService.php:20-33`) | participant ids, `last_message_at` | `conversations (participant_one_id, last_message_at)`, `(participant_two_id, last_message_at)` |
| `messages` unread scans (`MessageService.php:75-78,117-121`) | `conversation_id`, `sender_id`, `is_read` | `messages (conversation_id, is_read, sender_id)` |
| `announcement_reads` existence checks (`AlumniAnnouncementService.php:23,73`) | `announcement_id`, `user_id` | unique `announcement_reads (announcement_id, user_id)` |
| `content_email_logs` idempotency (job `ContentEmailLog::alreadySent/record`) | `user_id`, `content_type`, `content_id` | unique `(user_id, content_type, content_id)` — verify it exists (the job relies on `UniqueConstraintViolationException`) |
| `notifications` list + unread-count (`NotificationController`, `AlumniNotificationController`) | `user_id`, `read_at`/`is_read`, `created_at` | `notifications (user_id, read_at, created_at)` |
| `verification_logs` daily trend (`VerificationService.php` `DATE(created_at), status`) | `created_at`, `status` | `verification_logs (created_at, status)` |

---

## Appendix C — Dead Code Inventory

| Item | Location | Notes |
|---|---|---|
| `GraduateTracerService::clearCache()` | `GraduateTracerService.php:306-316` | Body is 100% comments; **zero callers** (grep-confirmed). Either implement real invalidation (see H-004) or delete. |
| `tests/Unit/ExampleTest.php` | backend | Default Laravel scaffold; no value. |
| `tests/Feature/ExampleTest.php` | backend | Default Laravel scaffold. |
| Trailing empty block in `RoleMiddleware` | `RoleMiddleware.php:40` | Stray whitespace after method. |
| Inline `/unauthorized` markup | `AppRouter.jsx:154-165` | Should be a shared, themed 403 component. |
| Duplicated multi-term name-search builders | `User.php:144-164`, `DirectoryService.php:182-191`, `GraduateImportService.php:353-356` | Consolidate (L-012). |
| `console.*` calls in shipped code | `ThemeContext.jsx:124` (+2) | Strip for production. |

> No orphaned/never-imported page components were found — every `pages/**/*.jsx` in the router is reachable, and all 30 `<img>` tags carry `alt` attributes (accessibility spot-check passed on that axis).

---

## Appendix D — Redis Recommendation

**Recommendation: YES — adopt Redis before production, but it is a "should", not a hard blocker for a single-node pilot.**

Current defaults (`.env.example`): `CACHE_STORE=database`, `QUEUE_CONNECTION=database`, `SESSION_DRIVER=database`, `DB_CONNECTION=sqlite`. That trio works for a single small instance but hits real limits for this app’s specific workload:

**Concrete bottlenecks that Redis fixes:**
1. **Bulk email queue throughput.** `SendContentPublishedEmails` is designed for ~20k recipients, chunked at 500, queueing one mail per recipient. On the `database` queue driver each job pop is a `SELECT … FOR UPDATE` + `DELETE` against `jobs`, which serializes and lock-contends badly at tens of thousands of jobs. Redis queue (or Horizon) is materially faster and supports multiple workers cleanly.
2. **`ShouldBeUnique` job locks.** `SendContentPublishedEmails implements ShouldBeUnique` with `uniqueFor=600` relies on an atomic cache lock (`SendContentPublishedEmails.php:37,50,64`). Database cache locks are coarse; Redis locks are the intended, reliable backing store.
3. **Dashboard + tracer caches.** `DashboardCacheService` (300s) and `GraduateTracerService` tracer keys (10-15 min) are read on hot admin pages. Database cache means cache reads are DB reads — self-defeating under load. Redis makes these genuinely cheap and enables **tagged invalidation** (`Cache::tags`), which directly enables the surgical fixes for C-001/H-004 (invalidate `dashboard`/`tracer:*` on the exact writes instead of TTL-only).
4. **Throttling.** Login/registration/export/message rate-limiters (`throttle:5,1`, `throttle:20,60`, etc.) keep counters in the cache store; Redis is the standard, accurate backing for these.
5. **Sessions** matter less here (JWT stateless API), so `SESSION_DRIVER` is low priority — but move it too for consistency once Redis exists.

**Also required before multi-node regardless of Redis:** move file storage off the local `public` disk to S3/object storage (H-002) and switch `DB_CONNECTION` off SQLite to MySQL/Postgres for real concurrency.

**Migration plan if adopting Redis:**
1. Provision Redis; set `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`, `REDIS_CLIENT=phpredis` (already scaffolded in `.env.example`).
2. Introduce `Cache::tags(['dashboard'])` / `['tracer']` and replace the C-001/H-004 TTL-only staleness with explicit tag flushes on employment/board/registration/status writes.
3. Add a supervised queue worker (or Laravel Horizon) with retry/backoff dashboards for the email job.
4. Point rate-limiters at Redis; verify throttle behavior under load.
5. Move uploads to `s3` disk; keep a signed-URL accessor.

---

## Verification Report

- **Total issues by severity:** Critical **2** (C-001, C-002) · High **7** (H-001…H-007) · Medium **18** (M-001…M-018) · Low **13** (L-001…L-013) — **40 findings**, plus 4 appendix inventories.
- **Files reviewed:** Backend — all 34 controllers, 28 services, 30 models, 34 form requests, 5 middleware, 2 jobs, 4 console commands, routes (`api.php`, `admin.php`, `alumni.php`, `auth.php`, `public.php`), `bootstrap/app.php`, and `config/{auth,dashboard,cache,queue,session}.php`, plus the performance-index and alumni-profile migrations. Frontend — router, theme context, axios client, token storage, and a structural sweep of all 136 `src` files (dark-mode, error-handling, sanitization, alt-text, memoization, hardcoded URLs). ~90 files read in full; the remainder covered by targeted pattern sweeps.
- **DomainException verification:** COMPLETE. No residual raw `\Exception` throws in services except the intentionally-excluded `DirectoryService::findVisibleProfile` and the programmer-error `InvalidArgumentException` in `ContentAudienceResolver`. (L-001)
- **Root cause of the employment-status → admin-dashboard sync issue:** The admin dashboard payload is served from `DashboardCacheService::remember()` — a `Cache::remember('admin:dashboard', 300, …)` (`DashboardController.php:36-45`, `config/dashboard.php:22`). The cache is invalidated in only five places, all in admin graduate CRUD (`GraduateService.php:96,118,135,155,179`, `GraduateImportService.php:233`). The alumni write path `EmploymentService::submitEmployment()` (`EmploymentService.php:80-196`) correctly updates `alumni_profiles.employment_status` (line 118) and the `employment_records` table (lines 99-115) inside a transaction, **but never calls `DashboardCacheService::flush()`**. Therefore the dashboard’s `employed_count` / `employment_rate` (`DashboardController.php:85-87`) and `employment_type_breakdown` (`:150-166`) keep serving the pre-update cached values until the 300-second TTL expires. Secondary contributor: the same counts also include soft-deleted graduates (C-002), so even after the cache refreshes the numbers can still be wrong. **Fix direction:** call `DashboardCacheService::flush()` (or a tagged invalidation) from `EmploymentService`, `BoardExamService`, `VerificationService`, and `UserService::updateStatus`, and scope the dashboard board/employment counts to `whereNull('graduates.deleted_at')` to match `total_graduates`.

*No code was committed or modified during this audit.*
