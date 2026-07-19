# PAC Alumni Tracking System — Remediation Implementation Plan

**Document type:** Production remediation plan (phase-by-phase)
**Audience:** Claude Code (local execution) + project owner (review-before-commit)
**Source:** Senior Software Architect production audit
**Stack:** Laravel 12 (backend) · React + Vite + Tailwind (frontend) · MySQL/MariaDB · database queue driver · Mailpit (local SMTP)
**Roles in system:** `admin`, `alumni` (exactly two — Employer and Department Head are retired)

---

## How to use this document

- Execute **one phase at a time, top to bottom**. Phases are ordered by dependency, not just severity — Phase 1 must land before Phase 2 because Phase 2's UI changes depend on the enum/status foundation being correct.
- Within a phase, follow the **plan → implement → verify → commit** loop already established for this project. Never commit without the verification checklist passing.
- Commit discipline: **small, scoped commits separated by concern** (backend / frontend / tests / docs). Backend and frontend changes go in separate commits.
- Before every commit run the standard gate: `php artisan route:list` (no errors), `php -l` on changed PHP files, `npm run build` (Vite build passes), and the targeted `grep` checks listed per issue.
- Review `git --no-pager diff` before approving any change.
- This document contains **no code**. It is a specification. Claude Code produces the code locally; the owner reviews the diff before it is committed.
- Treat this file as a **static reference**. Do not tick checkboxes inside it after completion — git history is the audit trail.

### Locked owner decisions (authoritative — no further sign-off required)

These six decisions are **final**. Every section below has been written to conform to them. Where the audit previously offered options, the chosen option is now the only path. Claude Code must not reintroduce alternatives.

1. **Failed is removed completely.** All existing `failed` records — in both `board_exam_records.status` and `alumni_profiles.board_status` — are migrated to `not_taken`. There is no `conditional` status (the previously-considered `conditional` value has been dropped and is not part of the system).
2. **"Not Yet Taken" is a default status only.** It is **not** selectable by alumni. The alumni submission UI offers only **Passed** — it is the single submittable status. `not_taken` is the initial/system-derived state and is never a submittable value.
3. **Reuse the existing notification logging mechanism** (`content_email_logs`) for in-app idempotency. **Do not create a new log table.** The existing table becomes the send-once guard for both email and in-app notifications.
4. **`passed` is the canonical database value.** `passer` is replaced everywhere — stored values, enum cases, queries, filters, and copy. This is a full value migration, not a relabel.
5. **Unified Notification Center.** Announcements, Events, and Job Postings all appear inside the notification bell. There is **no separate announcement unread badge**. The bell is the single unread surface for these three content types.
6. **Append-and-Supersede for board-exam history.** Every attempt is kept. The latest valid record determines the current profile `board_status`. No hard edits or deletes of prior attempts.

### Global conventions to adopt (referenced throughout)

- **Canonical board statuses (stored values):** `not_taken` → "Not Yet Taken", `passed` → "Passed", `not_applicable` → "Not Applicable". The value **`failed` is retired** (migrated to `not_taken`). The value **`passer` is replaced by `passed`** in the database and everywhere it is referenced. There is **no `conditional` status** — it was considered and dropped; it must appear nowhere except where explicitly noted as a removed legacy value.
- **Alumni-submittable statuses:** only `passed`. `not_taken` and `not_applicable` are system-derived, never user-selected. `not_applicable` is assigned automatically to courses/programs that have no board examination.
- **Notification idempotency:** the existing `content_email_logs` table is the single send-once guard for both email and in-app notifications across all three content types.
- **Canonical date locale:** `en-PH`, always through the shared formatter utility. No inline `toLocaleDateString` calls.
- **Canonical shared components:** `StatusBadge`, `EmptyState`, `SkeletonCard`, `Pagination` are the single source of truth for their concerns on **both** Admin and Alumni sides.

---

## Phase overview

| Phase | Theme | Release-blocking? |
|-------|-------|-------------------|
| Phase 1 | Critical Fixes (board-status foundation, Dept Head purge, notification gap) | **Yes** |
| Phase 2 | High Priority Fixes (surface the status change, terminology, enum consolidation) | **Yes** |
| Phase 3 | Medium Priority Fixes (dead schema, unread model, badge centralization) | Recommended pre-release |
| Phase 4 | Low Priority Fixes (locale drift, comment drift, minor mobile) | No |
| Phase 5 | UI/UX Improvements (empty/loading/state parity) | No |
| Phase 6 | Performance Improvements | No |
| Phase 7 | Accessibility Improvements | No |
| Phase 8 | Cleanup and Refactoring | No |

---

# Phase 1 — Critical Fixes

> These are the release blockers. Phase 1 establishes the corrected data foundation and closes the two user-trust gaps (privacy text, notification coverage). Nothing in later phases is safe to build until Phase 1's enum/status model is correct.

---

## 1.1 — Board-exam status model does not support the required statuses

**Problem**
The board-exam status set is still `passer` / `failed`. The final set is `not_taken` → "Not Yet Taken", `passed` → "Passed", and `not_applicable` → "Not Applicable" (auto-assigned to courses/programs without a board examination). Per decisions #1 and #4: `failed` is removed entirely and its rows migrated to `not_taken`; `passer` is renamed to the canonical value `passed`. Per decision #2: `passed` is the only alumni-submittable status — `not_taken` is the system-derived default and `not_applicable` is auto-assigned. There is no `conditional` status.

**Root Cause**
The status change was decided but only partially applied. The `BoardExamStatus` enum (`passer`, `failed`) and `BoardStatus` enum (`not_applicable`, `not_taken`, `passer`, `failed`) both still hard-code `FAILED`, use `passer` instead of `passed`, lack `CONDITIONAL`, and validation restricts input to the old two values.

**Why it should be fixed**
Everything downstream (UI, validation, analytics, exports, badges) inherits from these enums. This is the dependency root — no other board-status work can be correct until this is done. Leaving `failed` also means analytics and filters advertise a status that will never again occur.

**Files likely affected**
- `app/Enums/BoardStatus.php`
- `app/Enums/BoardExamStatus.php` (candidate for deletion — see 2.4)
- `app/Models/BoardExamRecord.php` (status cast)
- `app/Models/AlumniProfile.php` (board_status cast)

**Database changes**
- The `board_exam_records.status` and `alumni_profiles.board_status` columns are stored as `string`, so no column-type migration is required for the canonical value set.
- **Data-migration migration (required, single migration or two clearly-ordered statements):**
  - Migrate every existing `failed` row → `not_taken` in **both** `board_exam_records.status` and `alumni_profiles.board_status` (decision #1).
  - Migrate every existing `passer` row → `passed` in **both** columns (decision #4).
  - Order does not matter between the two, but both must run before the enum no longer accepts the old values. Document the `down()` as lossy (the original `failed` vs `not_taken` distinction is not recoverable — this is acceptable and intended).
- If any DB-level `ENUM()` or `CHECK` constraint exists on these columns, alter it to the new value set (`not_taken`, `passed`, `not_applicable`). Verify with a schema inspection before assuming plain string columns.

**Backend changes**
- Consolidate onto a single canonical enum (`BoardStatus`; see 2.4). Its cases become exactly: `NOT_TAKEN = 'not_taken'`, `PASSED = 'passed'`, `NOT_APPLICABLE = 'not_applicable'`. `FAILED`, `PASSER`, and any `CONDITIONAL` case are removed.
- Update `label()`: `not_taken` → "Not Yet Taken", `passed` → "Passed", `not_applicable` → "Not Applicable".
- Fix `BoardExamService::submitBoardExam()` status-derivation so it stores only `passed` from alumni input (decision #2) and never `failed`/`passer`. Profile `board_status` recomputation is governed by decision #6 (append-and-supersede — see 3.4); in Phase 1 ensure the derivation writes canonical values only.

**Frontend changes**
- None in this issue (surfaced in 1.2 and Phase 2). This issue is backend-model only.

**API changes**
- Response fields `status` / `board_status` emit only `not_taken`, `passed`, `not_applicable`. No consumer will ever again receive `failed` or `passer`.

**Testing checklist**
- [ ] Enum unit test: `values()` returns exactly `['not_taken','passed','not_applicable']`; `label()` returns the correct strings; `failed`, `passer`, and `conditional` are absent.
- [ ] Casting a `BoardExamRecord` and `AlumniProfile` with each canonical value round-trips without throwing.
- [ ] Data migration runs on a seeded DB and leaves zero `failed` rows and zero `passer` rows in both columns.
- [ ] `grep -rniE "failed|passer" app/Enums` returns nothing board-related.

**Acceptance Criteria**
- No board-exam enum, model cast, or label references `failed` or `passer`.
- The canonical statuses (`not_taken`, `passed`, `not_applicable`) are valid, persistable values.
- All existing `failed` rows are migrated to `not_taken` and all `passer` rows to `passed`, in both `board_exam_records.status` and `alumni_profiles.board_status`, with zero orphans.

**Estimated Risk:** High (touches persisted data + casts + a value rename; a mismatch can crash reads)
**Priority:** Critical

---

## 1.2 — Alumni board-exam submission UI forces the old binary choice

**Problem**
`AlumniBoardExamPage.jsx` renders a two-button **Passer / Failed** toggle. Per decision #2 the alumni submission UI must offer exactly one submittable status — **Passed**. "Failed" must be removed, "Passer" renamed to "Passed", and neither "Not Yet Taken" nor "Not Applicable" may be selectable (both are system-derived).

**Root Cause**
The submission UI predates the status-model decision and was never updated.

**Why it should be fixed**
This is the primary user-facing contradiction of the requirement. Until fixed, alumni physically cannot submit the correct statuses, and can still submit a retired one.

**Files likely affected**
- `pages/alumni/board-exam/AlumniBoardExamPage.jsx` (status selection block, success toast, badge color map, info text)
- Any shared board-status label/color helper the page imports.

**Database changes**
- None (consumes the 1.1 model).

**Backend changes**
- `app/Http/Requests/Alumni/StoreBoardExamRequest.php`: set `Rule::in(['passed'])` — `passed` is the only alumni-submittable value (decision #2). Do **not** allow `not_taken`, `not_applicable`, `failed`, or `passer`. Rewrite the `status.in` message to "Board exam status must be Passed." (replacing "Status must be either passer or failed."). Consider whether a `status` field is even needed on the request now that it is a single fixed value — if the UI always submits `passed`, validation still enforces it, but note the option to hardcode `passed` server-side and drop the field (confirm the simpler approach during implementation; default to keeping the validated field for explicitness).
- Confirm `BoardExamController@store` passes the validated values through unchanged.

**Frontend changes**
- Replace the binary toggle with a single confirmation of the **Passed** status (a single clearly-labeled action/affirmation, not a multi-option toggle). Do not add "Not Yet Taken", "Not Applicable", or any other option.
- Remove the "Failed" button, its red styling branch, and the "I did not pass" copy.
- Rename the "Passer" option/copy to "Passed".
- Update the local status→color map (line ~745) to the canonical set (`passed`, `not_taken`, `not_applicable`); delegate to the centralized badge where possible (see 3.3 / Phase 5).
- Update the success toast (see 1.3 for the Department Head part).

**API changes**
- Request body `status` accepts only `passed`; `422` returned for anything else (including `not_taken`, `not_applicable`, `failed`, `passer`).

**Testing checklist**
- [ ] Manual: submit Passed → persists as `passed`, badge/label correct.
- [ ] Manual: the UI presents only the Passed action — no "Not Yet Taken", "Not Applicable", or "Failed" option.
- [ ] Manual: attempt to submit `failed`, `passer`, `not_taken`, or `not_applicable` via API → `422` with the new message.
- [ ] `grep -rniE "failed|passer|conditional" pages/alumni/board-exam` returns no board-status references.
- [ ] Vite build passes.

**Acceptance Criteria**
- Alumni can submit only Passed; no other value is selectable or accepted.
- No "Failed"/"Passer"/"Conditional"/"Not Yet Taken"/"Not Applicable" option appears in the submission control.
- No "Failed"/"Passer" wording remains on the page.

**Estimated Risk:** Medium
**Priority:** Critical

---

## 1.3 — Alumni-facing text names a non-existent "Department Head"

**Problem**
Four+ live text blocks tell alumni their data is shared with / they will be notified to their "Department Head," a role that no longer exists. Locations: board-exam info box, board-exam "About" paragraph, board-exam success toast, and two employment-page passages.

**Root Cause**
Department Head was removed from the role system but the user-facing copy was never updated.

**Why it should be fixed**
This is a **factual misstatement to users about who can see their data** — a privacy/trust concern, not a cosmetic one. It must be corrected before any real users see it.

**Files likely affected**
- `pages/alumni/board-exam/AlumniBoardExamPage.jsx` (info box ~line 573, "About" ~line 721, success toast ~line 128, header comment ~line 5)
- `pages/alumni/employment/AlumniEmploymentPage.jsx` (toasts ~lines 142–143, info box ~line 681, "About" ~line 847)

**Database changes**
- None.

**Backend changes**
- None here (the notify-side Department Head code is 1.4).

**Frontend changes**
- Replace every "Admin and your Department Head" / "Department Head" mention with "Admin" (or the correct current recipient). Rewrite each sentence to read naturally after removal.
- Remove the stale header comment referencing Department Head.

**API changes**
- None.

**Testing checklist**
- [ ] `grep -rniE "department head|dept.head" frontend/src` returns zero matches.
- [ ] Visual check of both info boxes and both success toasts.
- [ ] Vite build passes.

**Acceptance Criteria**
- No alumni-facing string references "Department Head."
- Remaining copy accurately describes who is notified (Admin).

**Estimated Risk:** Low
**Priority:** Critical

---

## 1.4 — Backend still notifies a "Department Head" that cannot exist

**Problem**
`BoardExamService::notifyAdminAndDeptHead()` and `EmploymentService::notifyAdminAndDeptHead()` both branch on `$department->dept_head_id` to create a notification for a Department Head. No route assigns `dept_head_id`; the role is gone.

**Root Cause**
Incomplete removal — the notify methods and their names/comments were left behind.

**Why it should be fixed**
Dead branching tied to a retired concept; it perpetuates a stale model and would silently misfire if `dept_head_id` were ever repopulated. Renaming also prevents future contributors from reintroducing the concept.

**Files likely affected**
- `app/Services/Alumni/BoardExamService.php`
- `app/Services/Alumni/EmploymentService.php`

**Database changes**
- None in this issue (the column drop is deferred to 3.1).

**Backend changes**
- Remove the Department Head notification branch from both methods.
- Rename methods to `notifyAdmins` (or similar) and update call sites.
- Remove "Department Head" from method comments and class header comments.

**Frontend changes**
- None.

**API changes**
- None (admins still receive their notifications identically).

**Testing checklist**
- [ ] Submitting a board exam creates admin notifications only; no attempt to read `dept_head_id`.
- [ ] Employment update creates admin notifications only.
- [ ] `grep -rniE "deptHead|department head" app/Services` returns zero.
- [ ] `php -l` on both files; existing service tests still pass.

**Acceptance Criteria**
- Neither service references Department Head or `dept_head_id`.
- Admin notification behavior is unchanged.

**Estimated Risk:** Low
**Priority:** Critical

---

## 1.5 — In-app notifications only exist for Job Postings (Announcements & Events missing)

**Problem**
Only `AdminJobPostingService::notifyAlumni()` creates in-app `Notification` rows. Announcements and Events dispatch email (`SendContentPublishedEmails`) but create **no** in-app notification. The alumni bell only deep-links `job_posting_id`. Requirement #3: notifications must include Announcements, Events, and Job Posts.

**Root Cause**
The in-app notification feature was implemented for job postings only; the announcement/event publish paths were built for email delivery and never given an in-app equivalent.

**Why it should be fixed**
This is a stated core requirement and a real functional gap. Alumni currently miss in-app awareness of the two content types most relevant to engagement.

**Files likely affected**
- `app/Services/Admin/AnnouncementService.php`
- `app/Services/Admin/EventService.php`
- `app/Services/Admin/AdminJobPostingService.php` (reference implementation + 1.6 guard)
- Possibly `app/Services/ContentAudienceResolver.php` (announcements/events are audience-scoped; in-app recipients must mirror the email audience, not blanket all alumni)
- `components/layout/Header.jsx` (bell deep-link routing)
- `context/UnreadContext.jsx` (unified count model — see 3.2; the bell is the single unread surface for all three content types per decision #5)

**Database changes**
- None — the `notifications` table already stores arbitrary `type` + `data`. Confirm `data` JSON can hold `announcement_id` / `event_id`.
- Idempotency is enforced through the existing `content_email_logs` table (decision #3 — see 1.6). No new table.

**Backend changes**
- Add a `notifyAlumni`-equivalent to `AnnouncementService` and `EventService`, triggered on the **publish transition only**, guarded by the existing `content_email_logs` send-once check (see 1.6).
- **Critical detail:** announcement/event recipients must be resolved through `ContentAudienceResolver` so in-app notifications match visibility rules (department/course scoping), not a blanket all-alumni insert. Job postings notify all alumni; announcements/events do not — do not copy the job posting recipient logic blindly.
- Notification `type` values: `announcement`, `event`, `job_posting`. `data` carries the respective id for deep-linking.
- Use bulk insert (as job postings do) but remember bulk insert bypasses casts — encode `data` JSON manually and set timestamps.

**Frontend changes**
- Extend `Header.jsx` `openAlumniNotification` to deep-link by type: `announcement` → announcements page/detail, `event` → events page/detail, `job_posting` → existing career detail.
- Ensure the bell dropdown renders titles/messages for all three types.

**API changes**
- No new endpoints; `GET /api/alumni/notifications` now returns the additional types. Frontend must not assume `job_posting` shape.

**Testing checklist**
- [ ] Publishing an announcement creates in-app notifications for exactly the resolved audience (verify with a department-scoped announcement).
- [ ] Publishing an event does the same.
- [ ] Bell shows all three types and deep-links each correctly.
- [ ] Re-publishing an already-published announcement/event does **not** create duplicate in-app notifications (ties to 1.6).
- [ ] Unread count reflects the new notifications.
- [ ] Mailpit still receives the email (email path unbroken).

**Acceptance Criteria**
- Announcements, Events, and Job Posts all produce in-app notifications on first publish.
- In-app recipients for announcements/events match the email audience (visibility-correct).
- The bell deep-links all three types.

**Estimated Risk:** High (audience resolution correctness + bulk insert + potential double-notify)
**Priority:** Critical

---

## 1.6 — In-app notifications lack the first-publish idempotency guard the email has

**Problem**
Email dispatch is gated by `content_email_logs` (send-once). In-app `notifyAlumni()` has no equivalent guard, so republish / activate paths can re-notify alumni in-app even when email correctly suppresses.

**Root Cause**
The idempotency log was added for email only; the in-app path relies on ad-hoc `!$wasActive` / `$activate` checks that don't cover all transitions.

**Why it should be fixed**
Prevents duplicate/spam notifications and keeps in-app and email behavior symmetric. This must be solved as part of 1.5 (announcements/events) so the new code is correct from the start, not retrofitted.

**Files likely affected**
- `app/Services/Admin/AdminJobPostingService.php`
- `app/Services/Admin/AnnouncementService.php`
- `app/Services/Admin/EventService.php`
- `app/Models/ContentEmailLog.php` (reused as the single send-once guard)

**Database changes**
- **None.** Per decision #3, reuse the existing `content_email_logs` table as the single send-once guard for both email and in-app notifications. Do **not** create a `content_notification_logs` table. The existing `(type, content_id)` uniqueness already models "this content has been notified about"; the same log entry now gates both channels so they stay in lockstep.

**Backend changes**
- Before creating in-app notifications, check `content_email_logs` for `(type, content_id)`; skip the fan-out if already present; record the entry as part of the same first-publish transition.
- Apply the identical guard uniformly across all three content services so email and in-app are gated by the same record and can never diverge.

**Frontend changes**
- None.

**API changes**
- None.

**Testing checklist**
- [ ] Publish → unpublish → republish a job posting: alumni notified **once** in-app and **once** by email (same guard).
- [ ] Same for announcement and event.
- [ ] Exactly one `content_email_logs` row exists per `(type, content_id)` after repeated publish cycles.
- [ ] No `content_notification_logs` table is created (`grep -rn "content_notification_logs"` returns zero).

**Acceptance Criteria**
- A single `content_email_logs` entry per content item gates both email and in-app; no content type can double-notify across publish/unpublish/republish cycles.
- No new idempotency table is introduced.

**Estimated Risk:** Medium
**Priority:** Critical

---

# Phase 2 — High Priority Fixes

> Phase 2 makes the corrected status model visible everywhere and removes the now-dead "Failed" surface. It depends entirely on Phase 1.1 being complete.

---

## 2.1 — "Board Failed" filters and labels persist across Admin

**Problem**
`GraduatesListPage.jsx` (`BOARD_LABELS`, `BOARD_OPTIONS`) and `AlumniSearchPage.jsx` still offer a "Board Failed" filter/option; `AlumniProfilePage`/`GraduateDetailPage` branch on `board_status === "failed"`.

**Root Cause**
Filter/label maps were not updated with the status change.

**Why it should be fixed**
After Phase 1, "Board Failed" filters return empty forever and mislead admins; branching on `failed` is dead.

**Files likely affected**
- `pages/admin/graduates/GraduatesListPage.jsx`
- `pages/admin/alumni/AlumniSearchPage.jsx`
- `pages/admin/alumni/AlumniProfilePage.jsx`
- `pages/admin/graduates/GraduateDetailPage.jsx`

**Database changes**
- None.

**Backend changes**
- Confirm board-status filter query-parameter validation on the admin search/graduate endpoints accepts `passed`, `not_taken`, `not_applicable` and rejects `failed` and `passer`.

**Frontend changes**
- Replace `failed`/`passer` options/labels with `passed`; keep `not_taken`, `not_applicable`.
- Update all `=== "failed"` branches to the new statuses.

**API changes**
- Admin list/search filters now accept `passed` and no longer `failed`/`passer`.

**Testing checklist**
- [ ] Filtering by Passed / Not Yet Taken / Not Applicable returns correct rows.
- [ ] No "Board Failed" option renders anywhere in admin.
- [ ] `grep -rniE "failed" pages/admin | grep -i board` returns zero.

**Acceptance Criteria**
- Admin filters/labels reflect the canonical status set; no "Failed" anywhere.

**Estimated Risk:** Low
**Priority:** High

---

## 2.2 — Backend analytics still computes and returns a `failed` bucket

**Problem**
`AnalyticsService::boardExams()` computes `$failed` and both `by_department` and `by_year` SQL `SUM(CASE WHEN status = 'failed' ...)`. The admin dashboard already stopped consuming it, so the API returns a dead field.

**Root Cause**
Analytics aggregation was not updated when the status set changed.

**Why it should be fixed**
Dead payload misleads any future consumer and any export; keeps a retired status alive in the API contract.

**Files likely affected**
- `app/Services/Admin/AnalyticsService.php`
- `app/Http/Controllers/Api/Admin/AnalyticsController.php` (response shape)
- `app/Http/Controllers/Api/Admin/DashboardController.php` (if it references the field)
- `app/Exports/BoardPassingExport.php` (verify it never emits failed)
- Frontend consumers: `DashboardPage.jsx`, `CollegeAnalyticsTab.jsx`, `TracerBarChart.jsx`

**Database changes**
- None.

**Backend changes**
- Remove `failed` from the summary, `by_department`, and `by_year` aggregations. Do **not** introduce a `conditional` segment — there is no `conditional` status.
- **Metric semantics (locked):** with `failed` and `conditional` both retired, a `board_exam_records` row now exists essentially only for `passed` outcomes (alumni submit only `passed`; `not_taken`/`not_applicable` are profile-level derived states, not submitted records). A record-based "passing rate = passed / takers" is therefore no longer meaningful (it trends to 100%). Replace it with a **pass count** and a **board-passer rate measured against the eligible population**, i.e. `board_passer_rate = passed / (board-program registered alumni)`, using the registered-alumni denominator already available to the tracer/analytics layer. Compute this consistently in summary, `by_department`, and `by_year`. If the existing frontend only needs the raw passed count (see 2.3's dashboard "Passers" card), expose the count and drop the ratio rather than inventing one.
- Remove any `total_takers` field whose only remaining component would be `passed`; if retained for the UI, define it explicitly as "alumni with a recorded board pass" and document it.

**Frontend changes**
- Ensure no chart/legend expects `failed` or `conditional`. Segments are `passed` and `not_taken` (and `not_applicable` where relevant); there is no conditional segment.

**API changes**
- Analytics board-exam response no longer includes `failed` and never includes `conditional`. It exposes the passed count and, if kept, the population-based board-passer rate.

**Testing checklist**
- [ ] Analytics endpoints return no `failed` key and no `conditional` key.
- [ ] The passed count matches the number of `passed` records for the filter set.
- [ ] If a rate is exposed, it is defined against the registered-alumni population (not takers) and computed identically in summary, `by_department`, and `by_year`.
- [ ] Charts render without console errors.

**Acceptance Criteria**
- No analytics payload or export references `failed`, `passer`, or `conditional`.
- Board-exam analytics expose a passed count (and, if kept, a population-based board-passer rate) with a documented, consistent definition across summary, `by_department`, and `by_year`.

**Estimated Risk:** Medium (rate math semantics)
**Priority:** High

---

## 2.3 — Replace `passer` with the canonical value `passed` (full value migration)

**Problem**
The stack uses `passer` as the stored value and "Passer/Passers" in copy (enum case, dashboard "Passers" card, tracer "Board Passers", filters "Board Passer", query comparisons). Decision #4 makes `passed` the canonical database value.

**Root Cause**
Original terminology predates the spec; never reconciled.

**Why it should be fixed**
Decision #4 is authoritative: `passed` is the single canonical value in the database and everywhere it is referenced. This is a **full value migration**, not a relabel — stored values, enum case, every `where('status', ...)` comparison, filter params, and all copy move together.

> **Sequencing note:** the data portion of this migration is folded into the single Phase 1.1 data migration (which already rewrites `passer` → `passed` in both columns). Phase 2.3 covers the remaining *code* references (enum case name, query comparisons, filter params, copy). Do not write a second data migration.

**Files likely affected**
- `app/Enums/BoardStatus.php` (case `PASSER` → `PASSED`, value `'passer'` → `'passed'`, label "Passed")
- Backend query sites comparing to `passer`: `app/Services/Admin/AnalyticsService.php`, `GraduateTracerService.php`, `VerificationService.php`, `app/Services/Alumni/BoardExamService.php`, `app/Exports/BoardPassingExport.php`, `app/Http/Controllers/Api/Admin/DashboardController.php`
- `pages/admin/dashboard/DashboardPage.jsx`, `components/BoardExamOverviewCard.jsx`
- `pages/admin/analytics/TracerBarChart.jsx`, `CollegeAnalyticsTab.jsx`
- `pages/admin/graduates/GraduatesListPage.jsx`, `pages/admin/alumni/AlumniSearchPage.jsx`
- `pages/admin/alumni/AlumniProfilePage.jsx`, `pages/admin/graduates/GraduateDetailPage.jsx`
- `pages/alumni/board-exam/AlumniBoardExamPage.jsx`, `pages/alumni/dashboard/AlumniDashboardPage.jsx`, `pages/alumni/profile/AlumniProfilePage.jsx`

**Database changes**
- Handled by the Phase 1.1 data migration (`passer` → `passed` in `board_exam_records.status` and `alumni_profiles.board_status`). No additional migration here.

**Backend changes**
- Rename the enum case to `PASSED = 'passed'` with label "Passed".
- Update every `where('status', 'passer')` / `BoardStatus::PASSER` comparison to `passed` / `BoardStatus::PASSED`.

**Frontend changes**
- Replace every `=== "passer"` comparison with `=== "passed"`.
- Replace all user-facing "Passer/Passers" text with "Passed" (charts, cards, filters, banners, board-status filter options/labels).

**API changes**
- Filter params and response values use `passed`; `passer` is no longer accepted or emitted (internal consumers only).

**Testing checklist**
- [ ] `grep -rniE "passer" app` returns zero.
- [ ] `grep -rniE "passer" frontend/src` returns zero (including prop/comment usages — audit and rename any true `passer` references; "passed as a prop" phrasing that literally contains "passer" must be checked and cleared).
- [ ] Zero `passer` rows remain in either column (verified as part of 1.1).
- [ ] All board queries filter on `passed` and return correct rows.
- [ ] Charts/cards/filters display and filter by "Passed".

**Acceptance Criteria**
- `passed` is the only stored value and the only term shown to users on both sides.
- No `passer` value, enum case, query, filter param, or label remains anywhere.

**Estimated Risk:** High (value rename touches persisted data + every board query)
**Priority:** High

---

## 2.4 — Two overlapping board-status enums (`BoardExamStatus` + `BoardStatus`)

**Problem**
Two enums model the same concept at record vs profile layers with divergent case sets, used interchangeably against overlapping columns. Root cause of the latent cast mismatch (audit C3).

**Root Cause**
Enums grew independently for record and profile without consolidation.

**Why it should be fixed**
Single source of truth prevents cast crashes and divergence between the record and profile layers; simplifies every downstream reference.

**Files likely affected**
- `app/Enums/BoardStatus.php` (keep as canonical)
- `app/Enums/BoardExamStatus.php` (delete)
- `app/Models/BoardExamRecord.php`, `app/Models/AlumniProfile.php`
- `app/Services/Admin/AnalyticsService.php`, `GraduateTracerService.php`, `VerificationService.php`
- `app/Services/Alumni/BoardExamService.php`
- `app/Http/Requests/Alumni/StoreBoardExamRequest.php`
- `app/Http/Controllers/Api/Admin/DashboardController.php`
- `app/Exports/BoardPassingExport.php`

**Database changes**
- None beyond 1.1/2.3 (both columns are strings holding shared values).

**Backend changes**
- `BoardStatus` is canonical. Its final cases are exactly `NOT_TAKEN = 'not_taken'`, `PASSED = 'passed'`, `NOT_APPLICABLE = 'not_applicable'` (established in 1.1 and 2.3). `FAILED`, `PASSER`, and any `CONDITIONAL` case are gone.
- Replace all `BoardExamStatus` references with `BoardStatus`.
- Delete `BoardExamStatus`.
- Document record vs profile semantics: the only alumni-submittable record status is `passed` (decision #2); `not_taken` is the system-derived default; `not_applicable` is auto-assigned to courses/programs without a board examination. Profile `board_status` is recomputed by the append-and-supersede rule (decision #6, see 3.4).

**Frontend changes**
- None directly (frontend uses string values, already updated in 2.1/2.3).

**API changes**
- Response/filter values are the four canonical strings only. `failed` and `passer` are never emitted or accepted.

**Testing checklist**
- [ ] `grep -rn "BoardExamStatus" app` returns zero after deletion.
- [ ] All board tests pass against the single enum.
- [ ] Record and profile casts round-trip all valid values.

**Acceptance Criteria**
- Exactly one board-status enum exists and is used everywhere.
- Record/profile valid-value semantics are documented.

**Estimated Risk:** Medium
**Priority:** High

---

## 2.5 — Date formatting inconsistency (Admin `en-PH` vs Alumni `en-US`)

**Problem**
A central `formatDate`/`formatDateOnly` (`en-PH`) exists and is used by ~14 pages, but several pages inline `toLocaleDateString("en-US", ...)`.

**Root Cause**
Inline formatting was written before/around the central utility and never migrated.

**Why it should be fixed**
Users see mixed date formats across pages (requirement #4).

**Files likely affected**
- `utils/formatters.js` (canonical)
- `pages/alumni/board-exam/AlumniBoardExamPage.jsx`
- `pages/alumni/employment/AlumniEmploymentPage.jsx`
- `pages/alumni/dashboard/AlumniDashboardPage.jsx`
- `pages/admin/verification/VerificationLogsPage.jsx`

**Database changes / Backend changes / API changes**
- None.

**Frontend changes**
- Replace all inline `toLocaleDateString` calls with the shared formatter (`en-PH`).
- If a specific format variant is missing from the utility, extend the utility rather than inlining.

**Testing checklist**
- [ ] `grep -rn "toLocaleDateString" frontend/src/pages` returns zero (all via utility).
- [ ] Dates render identically formatted across admin and alumni.

**Acceptance Criteria**
- All dates flow through one utility with one locale.

**Estimated Risk:** Low
**Priority:** High

---

# Phase 3 — Medium Priority Fixes

---

## 3.1 — Dead `dept_head_id` schema and relation

**Problem**
`dept_head_id` column, `deptHead()` relation, and `hasDeptHead()` remain; the relation is eager-loaded on every department query in `DepartmentRepository`.

**Root Cause**
Deprecated by annotation only; never dropped.

**Why it should be fixed**
Live footgun (could be repopulated) and a wasted eager-load on every department read. Safe to remove now that 1.4 removed the last logic consumer.

**Files likely affected**
- `app/Models/Department.php`
- `app/Repositories/Eloquent/DepartmentRepository.php` (4 eager-load sites)
- New migration to drop the column + FK.

**Database changes**
- Migration to drop the `dept_head_id` foreign key and column. Must drop the FK constraint before the column. Provide a documented (if lossy) `down()`.

**Backend changes**
- Remove `dept_head_id` from `$fillable`, remove `deptHead()` and `hasDeptHead()`, remove all `deptHead` eager loads.

**Frontend changes**
- Verify no department UI reads a `dept_head` field (audit found none in frontend, but re-grep after change).

**API changes**
- Department payloads no longer include `dept_head`. Confirm no consumer expects it.

**Testing checklist**
- [ ] Migration up/down runs cleanly on a seeded DB.
- [ ] `grep -rniE "dept_head|deptHead" app` returns zero.
- [ ] Department CRUD and stats endpoints work post-drop.

**Acceptance Criteria**
- The Department Head concept is fully absent from schema and code.

**Estimated Risk:** Medium (schema migration + FK ordering)
**Priority:** Medium

---

## 3.2 — Unify unread counts into a single Notification Center

**Problem**
The alumni bell tracks `notifications` separately from `announcements` and `messages`. With announcements and events now flowing into the notification center (1.5), the separate announcement unread badge would double-count.

**Root Cause**
Unread badges were built per-feature before a unified notification center existed.

**Why it should be fixed**
Decision #5 is authoritative: Announcements, Events, and Job Postings all live inside the notification bell, and there is **no separate announcement unread badge**. The bell is the single unread surface for these three content types. (Messages remain their own inbox/badge — messaging is a distinct feature, not content notifications.)

**Files likely affected**
- `context/UnreadContext.jsx`
- `components/layout/AlumniLayout.jsx`
- `components/layout/Header.jsx`
- Backend unread-count endpoints: `AlumniNotificationController@unreadCount`, `AlumniAnnouncementController@unreadCount`, `MessageController@unreadCount`.

**Database changes**
- None.

**Backend changes**
- Announcements and events flow **through** the notification center. The bell's unread count (`AlumniNotificationController@unreadCount`) is the single source of unread for announcements, events, and job postings.
- Deprecate/remove the standalone `announcements/unread-count` usage as an unread *badge* source. If the announcements page still needs per-item read state, it reads it from the notification/announcement-read records without driving a separate badge. Confirm the `announcement_reads` table is still used for per-item read state on the announcements page, but not as a second unread badge.

**Frontend changes**
- `UnreadContext`: remove the separate `announcements` unread badge; the bell's `notifications` count is the only unread indicator for the three content types.
- `AlumniLayout`: remove the announcement unread badge from the sidebar/nav.
- `Header.jsx`: the bell count includes announcements, events, and job postings.
- Messages badge is unchanged.

**API changes**
- `announcements/unread-count` is no longer used to drive a badge (may be retired or repurposed for per-item read state only).

**Testing checklist**
- [ ] Publishing an announcement increments **only** the bell count — no separate announcement badge exists.
- [ ] Publishing an event and a job posting each increment the bell count.
- [ ] Marking a bell notification read decrements the bell count and reconciles the announcements page read state.
- [ ] No announcement unread badge renders anywhere in the alumni nav/sidebar.
- [ ] Messages badge continues to function independently.

**Acceptance Criteria**
- The notification bell is the single unread surface for Announcements, Events, and Job Postings.
- No separate announcement unread badge exists.
- No double-counting between the bell and any other badge.

**Estimated Risk:** Medium
**Priority:** Medium

---

## 3.3 — `StatusBadge` does not cover board statuses; pages hand-roll colors

**Problem**
Shared `StatusBadge` maps user/login/verification/role statuses but not board statuses; three+ pages define their own board color maps with slightly different shades.

**Root Cause**
Board statuses were added after the shared badge; never folded in.

**Why it should be fixed**
Badge-color consistency (requirement #4); removes duplicate color maps.

**Files likely affected**
- `components/common/StatusBadge.jsx`
- `pages/alumni/board-exam/AlumniBoardExamPage.jsx`
- `pages/alumni/profile/AlumniProfilePage.jsx`
- `pages/alumni/dashboard/AlumniDashboardPage.jsx`
- Admin board displays (`AlumniProfilePage`, `GraduateDetailPage`).

**Database / Backend / API changes**
- None.

**Frontend changes**
- Add canonical board-status variants to `StatusBadge` (`passed`, `not_taken`, `not_applicable`) with agreed colors.
- Replace local color maps with `StatusBadge`.

**Testing checklist**
- [ ] Board badges render identical colors on admin and alumni.
- [ ] No page defines its own board color map.

**Acceptance Criteria**
- One badge component owns all board-status colors, used on both sides.

**Estimated Risk:** Low
**Priority:** Medium

---

## 3.4 — Board-exam history: Append-and-Supersede

**Problem**
Board-exam records stack without a defined "current" semantics. Decision #6 requires: every attempt is kept, and the latest valid record determines the current profile `board_status`.

**Root Cause**
The feature was append-only without a supersede rule tying the latest attempt to the profile status.

**Why it should be fixed**
Decision #6 is authoritative. Board history must be immutable-by-default (append), while the profile always reflects the most recent valid attempt. No hard edits or deletes of prior attempts.

**Files likely affected**
- `app/Services/Alumni/BoardExamService.php`
- `app/Models/BoardExamRecord.php`, `app/Models/AlumniProfile.php`
- `app/Http/Controllers/Api/Alumni/BoardExamController.php`
- `pages/alumni/board-exam/AlumniBoardExamPage.jsx` (history + current-status display)

**Database changes**
- Add an `is_current` boolean (default `false`) to `board_exam_records` to mark the record that currently drives the profile status. (A single boolean is sufficient; `superseded_at` is optional and not required.) On each new submission, the newly created record is set `is_current = true` and any prior `is_current` record for that graduate is set to `false` within the same transaction. Migration is additive and reversible.
- Backfill: mark the latest record per graduate as `is_current = true` in the migration so existing data conforms.

**Backend changes**
- On submit (append): create the new record, flip prior `is_current` to `false`, set the new record `is_current = true`, and recompute `alumni_profiles.board_status` from the new current record — all inside one DB transaction.
- **Supersede rule:** the profile `board_status` always equals the status of the `is_current` record. Since alumni submit only `passed` (decision #2), every submitted record is `passed`; the append-and-supersede mechanism preserves the full attempt history (e.g. multiple exam years) while keeping exactly one `is_current` record, and the profile reflects that current `passed` record. `not_taken` remains the derived state for board-program graduates with no record; `not_applicable` is auto-assigned for non-board programs and is never produced by a submission.
- No update/delete endpoints for prior records — history is append-only.

**Frontend changes**
- Board-exam page displays full attempt history (all records) and shows the current status from the `is_current` record.
- Remove any UI implying edit/delete of past attempts; the only mutation is submitting a new attempt.

**API changes**
- No new mutation endpoints beyond the existing `POST`. Responses expose `is_current` on records so the UI can label the current attempt.

**Testing checklist**
- [ ] Submitting a second attempt keeps the first record and flips `is_current` to the new one.
- [ ] Profile `board_status` equals the `is_current` record's status (`passed`) after each submission.
- [ ] Exactly one `is_current = true` record exists per graduate at all times.
- [ ] A board-program graduate with zero records resolves to `not_taken`; a non-board program resolves to `not_applicable`.
- [ ] Migration backfills `is_current` correctly for existing multi-record graduates.
- [ ] No endpoint permits editing or deleting a prior attempt.

**Acceptance Criteria**
- Every attempt is preserved; exactly one record per graduate is `is_current`.
- Profile `board_status` always reflects the latest valid attempt.
- No hard edit/delete path for historical records exists.

**Estimated Risk:** Medium
**Priority:** Medium

---

## 3.5 — Verify employment enum set for orphans post-Employer-removal

**Problem**
`EmploymentStatus`, `EmploymentType` (local/international/self_employed), and `JobEmploymentType` (full_time/part_time/…) coexist; need to confirm none is orphaned and each is used by exactly the right feature.

**Root Cause**
Enum proliferation across the employment and (now-removed) employer/job features.

**Why it should be fixed**
Dead enums are confusing; a wrong enum on a form produces invalid options.

**Files likely affected**
- `app/Enums/EmploymentStatus.php`, `EmploymentType.php`, `JobEmploymentType.php`
- Employment + job-posting services, requests, and their frontend forms.

**Database / API changes**
- None expected; verification task.

**Backend changes**
- Map each enum to its consumer; delete any with zero references; document the survivors' purpose.

**Frontend changes**
- Confirm job-posting and employment forms use the correct enum's values.

**Testing checklist**
- [ ] Each surviving enum has ≥1 real consumer.
- [ ] Deleted enums have zero references.

**Acceptance Criteria**
- Every employment/job enum is justified and correctly wired.

**Estimated Risk:** Low
**Priority:** Medium

---

# Phase 4 — Low Priority Fixes

---

## 4.1 — Locale drift remains inside individual alumni pages

**Problem**
Even within alumni pages, some dates use the util (`en-PH`) and some inline `en-US`. (Overlaps 2.5; this catches residuals.)

**Root Cause**
Piecemeal formatting history.

**Why it should be fixed**
Final consistency sweep.

**Files likely affected**
- Any page still containing inline date formatting after Phase 2.5.

**Database / Backend / API changes:** None.

**Frontend changes**
- Grep-driven sweep to eliminate residual inline formatting.

**Testing checklist**
- [ ] Repo-wide `grep -rn "toLocaleDateString\|toLocaleString" frontend/src` returns only the utility file.

**Acceptance Criteria**
- Zero inline date/time formatting outside the utility.

**Estimated Risk:** Low
**Priority:** Low

---

## 4.2 — Shared status-label maps risk cross-wiring "failed"

**Problem**
`GraduateImportPage` legitimately uses `failed` for import-job status; ensure board "failed" removal did not accidentally leave a shared map coupling import and board labels.

**Root Cause**
Word overlap between unrelated domains.

**Why it should be fixed**
Prevents an import status accidentally rendering a board label or vice versa.

**Files likely affected**
- `pages/admin/graduates/GraduateImportPage.jsx`, `ImportHistoryPage.jsx`
- Any shared label constant.

**Database / Backend / API changes:** None.

**Frontend changes**
- Confirm import and board status label maps are independent; rename if a shared constant conflates them.

**Testing checklist**
- [ ] Import statuses (`completed`/`failed`) render correctly and independently of board statuses.

**Acceptance Criteria**
- Import and board status vocabularies are fully decoupled.

**Estimated Risk:** Low
**Priority:** Low

---

## 4.3 — Comment drift referencing retired concepts

**Problem**
Comments across backend reference "Employer," "Feature N," "Department Head."

**Root Cause**
Comments not maintained through refactors.

**Why it should be fixed**
Comment accuracy; onboarding clarity.

**Files likely affected**
- Services and models with stale headers (broad, grep-driven).

**Database / Backend / API / Frontend behavior changes:** None (comments only).

**Testing checklist**
- [ ] `grep -rniE "employer|department head" app` returns only intentional references (e.g., migration history notes).

**Acceptance Criteria**
- Comments reflect the current two-role, no-Department-Head model.

**Estimated Risk:** Low
**Priority:** Low

---

# Phase 5 — UI/UX Improvements

---

## 5.1 — Empty-state and loading-state parity between Admin and Alumni

**Problem**
`EmptyState` and `SkeletonCard` are used almost exclusively on the alumni side. Admin list pages roll their own or lack skeletons.

**Root Cause**
Shared components were adopted on the alumni side only.

**Why it should be fixed**
Consistent loading/empty UX across both sides (requirement #4).

**Files likely affected**
- Admin list pages: `GraduatesListPage`, `DepartmentsListPage`, `EventListPage`, `AnnouncementListPage`, `JobPostingListPage`, `VerificationLogsPage`, users list.
- `components/common/EmptyState.jsx`, `SkeletonCard.jsx`.

**Database / Backend / API changes:** None.

**Frontend changes**
- Adopt `EmptyState` and `SkeletonCard` on every admin list page; remove ad-hoc equivalents.
- Ensure consistent copy/iconography for empty states.

**Testing checklist**
- [ ] Every list page shows a skeleton while loading and a shared empty state when empty.
- [ ] No page defines a bespoke empty/loading block that duplicates the shared one.

**Acceptance Criteria**
- Loading and empty states are visually consistent across both sides.

**Estimated Risk:** Low
**Priority:** Medium (UX)

---

## 5.2 — Success/error message and toast consistency

**Problem**
Toasts and inline messages differ in tone/wording between sides (and some still carry stale content per Phase 1.3).

**Root Cause**
Per-page authoring without a shared vocabulary.

**Why it should be fixed**
Consistent, professional messaging (requirement #4).

**Files likely affected**
- All pages using `Toast`/`showToast`; consider a shared message-constants module.

**Database / Backend / API changes:** None.

**Frontend changes**
- Standardize success/error phrasing; centralize common messages; ensure error fallbacks are uniform (`err.response?.data?.message || "…"`).

**Testing checklist**
- [ ] Sample CRUD flows on both sides show consistently phrased success/error toasts.

**Acceptance Criteria**
- Messaging tone and structure are consistent across the app.

**Estimated Risk:** Low
**Priority:** Low (UX)

---

## 5.3 — Table / card / pagination parity

**Problem**
`Pagination`, `DataTable`, and card patterns are used unevenly; some admin lists don't use the shared `Pagination`.

**Root Cause**
Incremental page authoring.

**Why it should be fixed**
Consistent tables, cards, pagination (requirement #4).

**Files likely affected**
- Admin/alumni list pages; `ui/DataTable.jsx`, `components/common/Pagination.jsx`.

**Database / Backend / API changes:** None.

**Frontend changes**
- Route all paginated lists through the shared `Pagination`; align table/card styling.

**Testing checklist**
- [ ] Every paginated list uses the shared component with consistent controls.

**Acceptance Criteria**
- Uniform table/card/pagination presentation across both sides.

**Estimated Risk:** Low
**Priority:** Low (UX)

---

# Phase 6 — Performance Improvements

---

## 6.1 — Remove now-redundant `deptHead` eager loads

**Problem**
Every department query eager-loads `deptHead` (4 sites) for a retired relation.

**Root Cause**
Left from the Department Head feature.

**Why it should be fixed**
Removes an unnecessary join/load on a common query. (Executed as part of 3.1; tracked here for the performance rationale.)

**Files likely affected**
- `app/Repositories/Eloquent/DepartmentRepository.php`

**Database / API changes:** None.

**Backend changes**
- Remove `deptHead` from all `with(...)` calls (covered by 3.1).

**Testing checklist**
- [ ] Department queries no longer load the relation; response times unaffected or improved.

**Acceptance Criteria**
- No department query loads a retired relation.

**Estimated Risk:** Low
**Priority:** Low

---

## 6.2 — Bulk-insert correctness for new notification paths

**Problem**
Announcement/event notifications (1.5) will use bulk insert; bulk insert bypasses casts and can be a large single query for broad audiences.

**Root Cause**
Performance pattern inherited from job postings.

**Why it should be fixed**
Ensure large audiences don't create oversized single inserts and that timestamps/`data` JSON are correct.

**Files likely affected**
- `AnnouncementService`, `EventService`, `AdminJobPostingService`.

**Database changes**
- Verify indexes on `notifications(user_id, is_read, created_at)` support the alumni bell queries (audit noted performance indexes migration exists — confirm coverage).

**Backend changes**
- Chunk bulk inserts for very large audiences; confirm `data` JSON and timestamps set manually.

**Testing checklist**
- [ ] Publishing to a large audience inserts in chunks without timeout.
- [ ] Bell unread-count query uses an index (EXPLAIN).

**Acceptance Criteria**
- Notification fan-out scales and uses appropriate indexes.

**Estimated Risk:** Medium
**Priority:** Low

---

## 6.3 — Confirm dashboard/analytics query efficiency after status changes

**Problem**
Analytics board aggregations change (2.2); ensure the revised SUM/CASE queries remain single-pass and indexed.

**Root Cause**
Aggregation edits can regress query shape.

**Why it should be fixed**
Keep analytics performant on ~20k-graduate data.

**Files likely affected**
- `app/Services/Admin/AnalyticsService.php`, `GraduateTracerService.php`.

**Database changes**
- Verify `board_exam_records(status)` and join columns are indexed (migration exists — confirm).

**Backend changes**
- Keep conditional aggregation in a single query; avoid N+1.

**Testing checklist**
- [ ] EXPLAIN shows index usage on board/graduate joins.
- [ ] Analytics endpoints respond within target latency on seeded large data.

**Acceptance Criteria**
- Analytics remain single-query and indexed after status changes.

**Estimated Risk:** Low
**Priority:** Low

---

# Phase 7 — Accessibility Improvements

> Phase 2 accessibility work (`useModalA11y`, label associations, `htmlFor`/`id`, `autoComplete`, `role=group`) is already complete per project history. This phase extends coverage to the newly changed and previously unaddressed surfaces.

---

## 7.1 — New status controls and notification bell keyboard/ARIA support

**Problem**
The rebuilt board-status selector (1.2) and extended notification bell (1.5) are new interactive elements that must meet the established a11y bar.

**Root Cause**
New/changed UI introduced after the Phase 2 a11y pass.

**Why it should be fixed**
Maintain WCAG parity across the app; these are primary interactions.

**Files likely affected**
- `pages/alumni/board-exam/AlumniBoardExamPage.jsx`
- `components/layout/Header.jsx` (bell dropdown)

**Database / Backend / API changes:** None.

**Frontend changes**
- Status options as a proper radio group (`role="radiogroup"`/`radio`, keyboard arrow navigation, focus states).
- Bell dropdown: focus trap/return, `aria-expanded`, keyboard dismissal, accessible unread count labeling.

**Testing checklist**
- [ ] Keyboard-only selection of every board status.
- [ ] Screen reader announces status options and selection.
- [ ] Bell operable and announced via keyboard/SR.

**Acceptance Criteria**
- New status selector and bell meet the project's existing a11y standard.

**Estimated Risk:** Low
**Priority:** Medium

---

## 7.2 — Badge color-contrast verification for new board variants

**Problem**
New `StatusBadge` board variants (3.3) must meet contrast requirements.

**Root Cause**
New color variants introduced.

**Why it should be fixed**
Ensure status is distinguishable and readable (WCAG AA).

**Files likely affected**
- `components/common/StatusBadge.jsx`.

**Database / Backend / API changes:** None.

**Frontend changes**
- Verify text/background contrast for each new variant; adjust shades if failing AA.

**Testing checklist**
- [ ] Each board badge passes AA contrast.

**Acceptance Criteria**
- All board badges meet AA contrast.

**Estimated Risk:** Low
**Priority:** Low

---

## 7.3 — Responsive/mobile audit of wide admin tables

**Problem**
Only a minority of pages show explicit responsive table handling; wide admin tables (graduates, verification logs) need a mobile check.

**Root Cause**
Responsive handling applied unevenly.

**Why it should be fixed**
Mobile usability of admin tables (requirement #5).

**Files likely affected**
- Admin list pages with wide tables; shared `DataTable`.

**Database / Backend / API changes:** None.

**Frontend changes**
- Add horizontal scroll containers or responsive column collapsing where tables overflow on small screens.

**Testing checklist**
- [ ] Wide tables are usable at mobile widths (no clipped content, no layout break).

**Acceptance Criteria**
- Admin tables are usable on mobile.

**Estimated Risk:** Low
**Priority:** Low

---

# Phase 8 — Cleanup and Refactoring

---

## 8.1 — Delete retired enum and dead branches

**Problem**
`BoardExamStatus` enum and Department Head branches should be gone after Phases 1–2.

**Root Cause**
Consolidation and purge tasks.

**Why it should be fixed**
Remove dead code so the retired concepts cannot resurface.

**Files likely affected**
- `app/Enums/BoardExamStatus.php` (delete), services touched in 1.4/2.4.

**Database / API changes:** None.

**Backend changes**
- Final deletion pass; confirm zero references.

**Testing checklist**
- [ ] `grep -rn "BoardExamStatus\|deptHead\|dept_head" app` returns zero.
- [ ] Full backend test suite passes.

**Acceptance Criteria**
- No retired enum or Department Head code remains.

**Estimated Risk:** Low
**Priority:** Low

---

## 8.2 — Consolidate duplicated frontend helpers

**Problem**
Duplicated `stripHtml`, debounce, status/color maps, and unused imports across pages (noted in prior roadmap Phase 6 scope).

**Root Cause**
Copy-paste during rapid development.

**Why it should be fixed**
Maintainability; smaller bundle; single source of truth.

**Files likely affected**
- `utils/formatters.js` (canonical `stripHtml`), various pages importing local copies; a shared debounce hook/util.

**Database / Backend / API changes:** None.

**Frontend changes**
- Deduplicate `stripHtml` and debounce into shared utils; remove unused imports; centralize any remaining status/color maps.

**Testing checklist**
- [ ] Single `stripHtml` and single debounce source; no local copies.
- [ ] Lint shows no unused imports; Vite build passes.

**Acceptance Criteria**
- No duplicated helpers; clean imports.

**Estimated Risk:** Low
**Priority:** Low

---

## 8.3 — Documentation and comment reconciliation

**Problem**
Class/method comments and any in-repo docs still reference retired features and the old status set.

**Root Cause**
Docs/comments lag refactors.

**Why it should be fixed**
Accurate documentation for maintainers and future phases.

**Files likely affected**
- Service/model headers; `/docs` files; this plan's companion audit.

**Database / Backend / API / Frontend behavior changes:** None.

**Testing checklist**
- [ ] Docs and comments reflect two-role model, canonical statuses, and unified notifications.

**Acceptance Criteria**
- Documentation matches the shipped system.

**Estimated Risk:** Low
**Priority:** Low

---

## Cross-cutting testing gate (run at the end of each phase)

- `php artisan route:list` — no errors.
- `php -l` on every changed PHP file.
- Backend test suite green (add tests where a phase introduces new behavior).
- `npm run build` — Vite build passes with no new warnings.
- Targeted `grep` checks named in each issue return the expected (usually zero) matches.
- Mailpit end-to-end check for any phase touching notifications/email.
- `git --no-pager diff` reviewed and approved before commit.
- Commits scoped by concern (backend / frontend / tests / docs), backend and frontend separated.

## Release gate

Phases **1 and 2 are release-blocking**. Do not ship until every acceptance criterion in Phases 1–2 is met and a full regression of (a) board-exam submission across all statuses and (b) notification delivery (in-app + email) for announcements, events, and job posts passes end-to-end. Phases 3–8 are quality hardening and may follow in subsequent releases.

## Resolved decisions (no sign-off outstanding)

All prior open questions are closed. Recorded here for traceability:

1. **1.1** — Existing `failed` rows migrate to `not_taken`. **Resolved.**
2. **1.2** — "Not Yet Taken" is a default/derived status only; not alumni-submittable. Alumni submit only `passed`. The `conditional` status was considered and dropped — it is not part of the system. **Resolved.**
3. **1.6** — Reuse the existing `content_email_logs` table as the single send-once guard for both email and in-app. No new table. **Resolved.**
4. **2.3** — Full value migration: stored value `passer` → `passed` everywhere. **Resolved.**
5. **3.2** — Unified Notification Center: Announcements, Events, and Job Postings all appear in the bell; no separate announcement unread badge. **Resolved.**
6. **3.4** — Append-and-Supersede: every attempt kept; latest valid record drives the current profile status via an `is_current` flag. **Resolved.**

There are no remaining decision points. Claude Code may execute Phase 1 through Phase 8 in order without further input.
