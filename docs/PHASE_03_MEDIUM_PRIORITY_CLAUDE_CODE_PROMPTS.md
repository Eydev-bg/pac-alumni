# Phase 3 — Medium Priority Fixes · Claude Code Prompts

**Companion to:** `docs/PAC_REMEDIATION_IMPLEMENTATION_PLAN.md` (issues 3.1–3.5 + new issues 3.6–3.7)
**Prerequisite:** Phase 2 fully landed and exit checklist passed.
**Execution model:** Same as Phases 1–2 — one prompt at a time, verify, review diff, commit.

---

## Ground rules reminder

The Phase 1 ground rules (1–7) and Phase 2 addition (rule 8) are still in effect. If starting a new Claude Code session, paste all ground rules first.

---

## New issues added post-Phase 2

Two issues were discovered during Phase 2 manual testing and added to Phase 3:

- **3.6** — "Not Yet Taken" board filter on Graduates page returns zero results (the filter queries `alumni_profiles.board_status` but `not_taken` is never persisted there — graduates without a board exam record have no matching profile row or have `not_applicable`).
- **3.7** — Restore the population-based board passing rate to the dashboard and analytics (the backend DashboardController already computes `board_passing_rate = board_passers / board_program_total`, but Phase 2.2 removed the frontend display because the AnalyticsService rate was meaningless at 100%; the dashboard rate is population-based and meaningful).

---

## Prompt order

1. **3.1** — Drop `dept_head_id` column + relation (migration + backend)
2. **3.2** — Unified Notification Center (backend + frontend)
3. **3.3** — StatusBadge board-status variants (frontend)
4. **3.4** — Append-and-Supersede `is_current` (migration + backend + frontend)
5. **3.5** — Employment enum verification (read-only investigation)
6. **3.6** — Fix "Not Yet Taken" board filter on Graduates page (backend)
7. **3.7** — Restore population-based board passing rate to dashboard (frontend)

---

# Prompt 3.1 — Drop `dept_head_id` column and relation

**Concern:** migration + backend · **Commit:** one migration commit, then one backend commit

```
TASK: Remove the retired dept_head_id column, the deptHead() relation, hasDeptHead(),
and all eager loads of deptHead from the codebase.

REQUIRED CHANGES:

1. New migration: drop the dept_head_id foreign key and column from the departments table.
   - Drop the FK constraint FIRST, then the column. Use Schema::table with
     $table->dropForeign() then $table->dropColumn().
   - down(): re-add the column as nullable unsignedBigInteger + FK to users (lossy —
     original values are not recoverable; document this in a comment).

2. app/Models/Department.php:
   - Remove 'dept_head_id' from $fillable.
   - Delete the deptHead() BelongsTo relation method.
   - Delete hasDeptHead() if it exists.
   - Remove any 'use' import that becomes orphaned.

3. app/Repositories/Eloquent/DepartmentRepository.php:
   - Remove 'deptHead' from every with([...]) / load([...]) call (the audit found 4 sites).

DO NOT:
- Do not touch frontend (audit confirmed no frontend reads dept_head).
- Do not change any other model or controller.

VERIFY (paste output):
- php -l on all changed PHP files
- php artisan migrate (migration runs clean)
- grep -rniE "dept_head|deptHead|hasDeptHead" backend/app   → zero
- php artisan test   (all pass)
```

---

# Prompt 3.2 — Unified Notification Center

**Concern:** backend + frontend · **Commit:** backend first, then frontend
   
```
TASK: Unify the alumni unread counts so that the notification bell is the single unread
surface for Announcements, Events, and Job Postings. Remove the separate announcement
unread badge. Messages badge is unchanged.

CONTEXT (decision #5):
Announcements, Events, and Job Postings now all create in-app Notification rows (done
in Phase 1.5). The bell already shows all three types. But the sidebar/nav still has a
SEPARATE announcement unread badge driven by a different count endpoint, which risks
double-counting.

STEP 1 — INVESTIGATE FIRST (read-only, do NOT change code yet):
Before making changes, I need you to investigate and report:
a) Read context/UnreadContext.jsx — what unread counts does it track? How are they fetched?
b) Read components/layout/AlumniLayout.jsx — where are unread badges shown? Is there a
   separate announcement badge on the sidebar nav item?
c) Read the backend AlumniAnnouncementController — does it have an unread-count endpoint?
   How does it determine "unread" (announcement_reads table? or something else)?
d) Report: will removing the announcement badge break anything else (e.g., does the
   announcements page itself rely on the unread count for its own display)?

Report all findings. I will give you the go-ahead for the actual changes after reviewing.
```

> **Note to owner:** This prompt intentionally stops at investigation. The unread model is
> the most architecturally sensitive change in Phase 3 — we need to see the current wiring
> before writing the fix. After Claude Code reports, you paste the findings here and I'll
> draft the implementation prompt.

---

# Prompt 3.3 — StatusBadge board-status variants

**Concern:** frontend · **Commit:** one frontend commit

```
TASK: Add canonical board-status variants to the shared StatusBadge component and replace
all local board-status color maps across admin and alumni pages.

STEP 1 — Read components/common/StatusBadge.jsx and report its current variant/status
mapping (what keys does it handle, what colors does each map to). Do NOT change anything
yet — just report.

STEP 2 — After reporting, make these changes:

1. components/common/StatusBadge.jsx:
   Add three new status keys to the variant/color map:
     passed:         emerald (bg-emerald-50 text-emerald-700 border-emerald-200)
     not_taken:      slate   (bg-slate-50 text-slate-600 border-slate-200)
     not_applicable: slate   (bg-slate-50 text-slate-500 border-slate-200)

2. Find every page that defines its OWN board-status color map (the StatusChip function
   in AlumniBoardExamPage, the inline color objects in AlumniDashboardPage,
   AlumniProfilePage, admin AlumniProfilePage, GraduateDetailPage) and replace them
   with the shared StatusBadge component.

   Where a page currently does something like:
     <span className={statusColors[record.status]}>...</span>
   Replace with:
     <StatusBadge status={record.status} label={statusLabel} />

3. If the StatusChip component in AlumniBoardExamPage.jsx becomes fully replaced by
   StatusBadge, delete StatusChip.

DO NOT:
- Do not change StatusBadge behavior for existing (non-board) statuses.
- Do not touch backend.

VERIFY (paste output):
- npm run build   (passes)
- grep -rniE "StatusChip|statusColors|boardStatusColor|board.*color.*map" frontend/src/pages
  → zero (no local board color maps remain)
- Manual: board badges render with consistent emerald/slate colors across admin and alumni.
```

---

# Prompt 3.4 — Append-and-Supersede `is_current` for board exam records

**Concern:** migration + backend + frontend · **Commit:** migration, then backend, then frontend

```
TASK: Add append-and-supersede semantics to board exam records. Every attempt is kept;
the latest record is marked is_current and drives the profile board_status.

PART A — Migration:

1. New migration: add is_current boolean (default false) to board_exam_records.
   - After adding the column, backfill: for each graduate_id that has records, set
     is_current = true on the record with the highest id (latest). Use a single UPDATE
     with a subquery, not a PHP loop.
   - down(): drop the column.

PART B — Backend:

2. app/Models/BoardExamRecord.php:
   - Add 'is_current' to $fillable and casts (boolean).

3. app/Services/Alumni/BoardExamService.php — submitBoardExam():
   Inside a DB::transaction:
   a) Set all existing is_current = false for this graduate:
      BoardExamRecord::where('graduate_id', $graduate->id)->update(['is_current' => false]);
   b) Create the new record with is_current = true.
   c) Recompute alumni_profiles.board_status from the new current record's status
      (always 'passed' since that's the only submittable value).
   d) Keep the rest of the method (activity log, notification, achievement feed) as-is.

4. app/Http/Controllers/Api/Alumni/BoardExamController.php — index response:
   Ensure is_current is included in the records returned to the frontend.

PART C — Frontend:

5. pages/alumni/board-exam/AlumniBoardExamPage.jsx:
   - In the records list, visually distinguish the is_current record (e.g., a small
     "Current" badge or a subtle border highlight).
   - Ensure no edit/delete UI exists for any record (history is append-only).

DO NOT:
- Do not add update/delete endpoints for board exam records.
- Do not change the submission flow (single "Passed" control stays as-is).

VERIFY (paste output):
- php artisan migrate   (clean)
- php -l on changed PHP files
- php artisan test   (all pass)
- npm run build   (passes)
- Manual (rolled-back tinker): submit two board exams for the same graduate → first record
  is_current = false, second is_current = true, profile board_status = 'passed'.
  Exactly one is_current = true per graduate.
```

---

# Prompt 3.5 — Employment enum verification (read-only)

**Concern:** investigation · **Commit:** none (or cleanup if orphans found)

```
TASK: Verify that no employment/job enum is orphaned after the Employer role removal.
This is a read-only investigation — report findings, do NOT change code unless you find
a clearly dead enum file with zero references.

CHECK EACH:
1. app/Enums/EmploymentStatus.php — grep for all usages in app/ and frontend/src/.
   Report: which files use it, for what purpose.
2. app/Enums/EmploymentType.php — same.
3. app/Enums/JobEmploymentType.php — same.

For each enum, report:
- Number of references in backend (models, services, requests, controllers)
- Number of references in frontend
- Whether it is used by the employment feature, the job-posting feature, or both
- Whether it should be kept or is dead

If any enum has ZERO references anywhere, delete it and report the deletion.

VERIFY (if any deletion):
- php -l on any changed files
- php artisan about   (boots clean)
```

---

# Prompt 3.6 — Fix "Not Yet Taken" board filter on Graduates page

**Concern:** backend · **Commit:** one backend commit

```
TASK: Fix the "Not Yet Taken" board-status filter on the admin Graduates page so it
returns graduates in board programs who have NOT passed the board exam.

CONTEXT (from investigation):
- The filter currently does: whereHas('user' → 'alumniProfile', board_status = 'not_taken')
  (GraduateRepository.php ~line 157-163).
- This returns zero results because 'not_taken' is never persisted in alumni_profiles.board_status.
  The column holds only 'not_applicable', 'passed', or NULL — never 'not_taken'.
- The correct population for "Not Yet Taken" is: graduates enrolled in a board-program course
  (courses.is_board_program = true) who do NOT have a board_exam_records row with
  status = 'passed'. This includes:
    * Registered alumni with no board exam record
    * Unregistered graduates (no user account at all)
- The DashboardController already computes this population correctly (lines ~79-82):
    $boardProgramCourseIds = Course::boardPrograms()->pluck('id');
    $graduatesInBoardPrograms = Graduate::whereIn('course_id', $boardProgramCourseIds)->count();
    $graduatesWithBoardRecord = distinctGraduateCount(BoardExamRecord::query());
    $boardNotYetTaken = $graduatesInBoardPrograms - $graduatesWithBoardRecord;

REQUIRED CHANGE:
In app/Repositories/Eloquent/GraduateRepository.php, the ->when($boardStatus, ...) block:

- When $boardStatus === 'not_taken':
    Filter to graduates WHERE course.is_board_program = true AND the graduate does NOT have
    any board_exam_record with status = 'passed'. Use whereHas on the course relation to
    check is_board_program, and whereDoesntHave on boardExamRecords (or a manual NOT EXISTS
    subquery) to exclude those who have passed.

- When $boardStatus === 'passed':
    Keep the existing approach but query board_exam_records directly:
    whereHas('boardExamRecords', fn($q) => $q->where('status', 'passed')).
    This is more correct than going through alumni_profiles since the record is the
    source of truth.

- When $boardStatus === 'not_applicable':
    Filter to graduates where course.is_board_program = false.

This way all three filter values query the actual source of truth (course board-program
flag + board_exam_records) instead of the derived alumni_profiles.board_status column.

IMPORTANT: Check that the Graduate model has the necessary relations:
- course() → BelongsTo Course (should exist)
- boardExamRecords() → HasMany BoardExamRecord (may or may not exist — if not, add it)
Report whether you need to add any relation.

DO NOT:
- Do not change the frontend (the filter dropdown already sends the correct values from Phase 2.2).
- Do not change the DashboardController or AnalyticsService.

VERIFY (paste output):
- php -l on changed files
- php artisan test   (all pass)
- Manual tinker verification:
    * Count graduates where course is_board_program = true → report the number
    * Run the repository query with boardStatus = 'not_taken' → report count (should be > 0
      if there are board-program graduates without a passed record)
    * Run with boardStatus = 'passed' → report count (should match board_exam_records passed)
    * Run with boardStatus = 'not_applicable' → report count (non-board programs)
```

---

# Prompt 3.7 — Restore population-based board passing rate to dashboard

**Concern:** frontend · **Commit:** one frontend commit

```
TASK: Restore the board passing rate display on the admin dashboard, now that the backend
already returns a meaningful population-based rate.

CONTEXT:
The backend DashboardController already returns these fields (confirmed in investigation):
  - board_passers: count of graduates who passed
  - board_program_total: total graduates in board programs
  - board_passing_rate: board_passers / board_program_total × 100 (population-based)
  - board_not_yet_taken: board_program_total - graduates with any board record

Phase 2.2 removed the passing rate from the frontend because the AnalyticsService rate
was always 100% (record-based). But the DashboardController rate is POPULATION-based
(passed / total board-program graduates) and IS meaningful. Restore it.

REQUIRED CHANGES:

1. pages/admin/dashboard/DashboardPage.jsx:
   - Re-add the passingRate to the boardChart object:
     passingRate: stats.board_passing_rate || 0
   - Pass it to BoardExamOverviewCard as a prop.

2. pages/admin/dashboard/components/BoardExamOverviewCard.jsx:
   - Re-add the passingRate prop.
   - Display it with a label like "Board Passing Rate" or "Pass Rate" — make clear this
     is "% of board-program graduates who have passed", not a per-exam rate.
   - Restore the grid layout to accommodate the rate display (grid-cols-2 if it was
     changed to grid-cols-1 in Phase 2.2).

3. Update the subtitle from "Passed · Not Yet Taken breakdown" (or whatever it currently
   says) to something like "Passed · Not Yet Taken · Pass Rate" to reflect the restored metric.

DO NOT:
- Do not change the backend (it already returns the correct data).
- Do not touch AnalyticsService or the analytics pages (their rate is different and was
  correctly removed).

VERIFY (paste output):
- npm run build   (passes)
- Manual: the dashboard Board Exam Overview card shows the pie chart, the Passed count,
  and the population-based passing rate percentage.
```

---

## Phase 3 exit checklist (run after all prompts are committed)

```
Run these checks and report all results. Do not fix anything — just report.

1. grep -rniE "dept_head|deptHead|hasDeptHead" backend/app
2. ls backend/app/Enums/BoardExamStatus.php
3. php artisan test
4. npm run build
5. grep -rniE "StatusChip|boardStatusColor" frontend/src/pages
6. php artisan tinker --execute="echo 'is_current records: ' . DB::table('board_exam_records')->where('is_current', true)->count();"
7. Manual: on the Graduates page, select a board-program department, filter by "Not Yet Taken"
   → graduates without a passed board exam should appear.
8. Manual: dashboard Board Exam Overview shows passed count AND population-based passing rate.
```

Expected results:
1. Zero (dept_head fully gone).
2. "No such file" (still deleted from Phase 2).
3. All pass (1 pre-existing incomplete ok).
4. Build passes.
5. Zero (no local board color maps).
6. Matches the number of graduates with board exam records (one is_current per graduate).
7. Not Yet Taken filter returns board-program graduates without passed records.
8. Dashboard shows both metrics.
