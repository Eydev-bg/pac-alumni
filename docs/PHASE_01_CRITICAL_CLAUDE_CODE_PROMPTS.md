# Phase 1 — Critical Fixes · Claude Code Prompts

**Companion to:** `PAC_REMEDIATION_IMPLEMENTATION_PLAN.md`
**Scope:** Issues 1.1 – 1.6 only. Do not start Phase 2 until every prompt here is executed, verified, and committed.
**Execution model:** Each prompt is a self-contained unit of work. Run them **in order** — later prompts depend on earlier ones. After each prompt, the owner reviews `git --no-pager diff` before the commit is approved.

---

## Ground rules (paste this once at the start of the Claude Code session)

> You are working on the PAC Alumni Tracking System (Laravel 12 backend, React + Vite + Tailwind frontend). The system has exactly two roles: `admin` and `alumni`. There is no Department Head and no Employer role.
>
> Rules for this whole session:
> 1. **Plan before code.** For each task, first restate the plan and list the exact files you will touch. Wait for nothing — but keep the change scoped to only what the task names.
> 2. **Do not invent scope.** If a task says "backend only," touch no frontend, and vice versa.
> 3. **Verify before proposing a commit.** Run the verification block given in each task and paste the output.
> 4. **Separate commits by concern.** Backend, frontend, and migration changes are separate commits. Never mix backend and frontend in one commit.
> 5. **Canonical board statuses** are exactly: `not_taken` ("Not Yet Taken"), `passed` ("Passed"), `not_applicable` ("Not Applicable"). The values `failed` and `passer` are retired, and there is **no `conditional` status** (it was considered and dropped). Alumni may submit only `passed`. `not_taken` is the system-derived default; `not_applicable` is auto-assigned to courses/programs without a board examination.
> 6. **Show me the diff** (`git --no-pager diff`) before every commit. Do not commit until I approve.
> 7. Reference, don't pre-read. The full remediation plan lives at docs/PAC_REMEDIATION_IMPLEMENTATION_PLAN.md. Consult a specific issue there only if you need rationale for a task. Do not read it end-to-end or work ahead — follow the prompts I give you one at a time, in order.


---

## Prompt order (dependency chain)

1. **1.1a** — Data migration (`failed`→`not_taken`, `passer`→`passed`) — **run first, it rewrites data**
2. **1.1b** — Canonical `BoardStatus` enum + model casts (backend)
3. **1.2** — Board-exam validation + alumni submission UI (backend request, then frontend)
4. **1.3** — Remove "Department Head" from alumni-facing copy (frontend)
5. **1.4** — Remove Department Head notification branch from services (backend)
6. **1.5 + 1.6** — In-app notifications for Announcements & Events, reusing the existing send-once mechanism (backend), then bell deep-linking (frontend)

> **Note on 2.4 (enum consolidation) and 2.3 (passer rename):** the *value* rewrite for `passer`→`passed` is done in **1.1a** (this phase) so the data is correct once and only once. The *code* rename of the `PASSER` enum case and all `where('status','passer')` query sites is Phase 2.3/2.4 — do **not** do it here beyond what 1.1b requires for the enum to load. If a Phase 1 file breaks because it references `BoardExamStatus::PASSER`, note it and leave the query working (it will be cleaned in Phase 2). The 1.1b enum keeps the system loadable; Phase 2 removes the second enum.

---

# Prompt 1.1a — Board-status data migration

**Concern:** database migration · **Commit:** migration-only

```
TASK: Create one new Laravel migration that normalizes existing board-status data to the canonical value set. This migration only rewrites row values — it does not change any column type or enum definition.

CONTEXT:
- Two columns hold board statuses as plain strings:
  - board_exam_records.status
  - alumni_profiles.board_status
- Retired values still present in data: 'failed' and 'passer'.
- Canonical target values: 'not_taken', 'passed', 'not_applicable'. (There is no 'conditional' status.)

REQUIRED CHANGES (up):
1. In BOTH columns above, update every row where status = 'failed' → 'not_taken'.
2. In BOTH columns above, update every row where status = 'passer' → 'passed'.
   Use DB::table(...)->where(...)->update(...) — do NOT loop in PHP; these are bulk UPDATEs.
   Wrap the four updates in a DB transaction.

DOWN:
- Document in a comment that down() is intentionally lossy: the original 'failed' vs
  'not_taken' distinction cannot be recovered. For replayability only, down() may map
  'passed' → 'passer' (reversible) but must NOT attempt to reconstruct 'failed'.
- Implement down() to reverse only the passer↔passed rename; leave a clear comment that
  failed→not_taken is one-way.

DO NOT:
- Do not touch the enum classes in this task.
- Do not add or alter any column.
- Do not touch any DB-level ENUM()/CHECK constraint yet — first tell me whether the
  columns are plain strings or DB enums (inspect the create-table migrations for
  board_exam_records and alumni_profiles and report which). If either is a DB-level
  ENUM/CHECK that would reject the canonical values, STOP and report before writing the migration.

VERIFY (paste output):
- php artisan migrate --pretend   (show the SQL it will run)
- After I approve running it on the local DB: run a quick tinker/count query proving
  zero rows remain with status IN ('failed','passer') in both tables.
```

**Owner acceptance for 1.1a**
- Migration `--pretend` shows four scoped UPDATEs inside a transaction.
- Post-run counts: zero `failed` and zero `passer` rows in both columns.
- Claude reported whether the columns are plain strings or DB enums (must be confirmed before proceeding to 1.1b).

---

# Prompt 1.1b — Canonical `BoardStatus` enum + model casts

**Concern:** backend · **Commit:** backend-only (no data, no migration)

```
TASK: Make BoardStatus the single canonical board-status enum with exactly the four
canonical cases, and ensure the two models cast to it correctly. Keep the system
loadable — do NOT delete BoardExamStatus in this phase (that is Phase 2.4).

REQUIRED CHANGES:
1. app/Enums/BoardStatus.php — cases become EXACTLY:
     NOT_TAKEN      = 'not_taken'
     PASSED         = 'passed'
     NOT_APPLICABLE = 'not_applicable'
   Remove FAILED and PASSER. There is NO CONDITIONAL case. Update label():
     not_taken → "Not Yet Taken", passed → "Passed",
     not_applicable → "Not Applicable".
   Keep the values() helper.

2. app/Models/BoardExamRecord.php — the status column currently casts to
   BoardExamStatus (which only had passer/failed). Change the cast to BoardStatus.

3. app/Models/AlumniProfile.php — confirm board_status casts to BoardStatus
   (it already does). Leave as-is if correct.

4. BoardExamStatus.php — DO NOT delete yet. It is still referenced by AnalyticsService,
   GraduateTracerService, StoreBoardExamRequest, DashboardController, BoardPassingExport.
   To keep those loadable through Phase 1, TEMPORARILY align BoardExamStatus so it no
   longer references the retired 'failed' string in a way that breaks:
     - Report every file still referencing BoardExamStatus::PASSER or ::FAILED.
     - For any ::FAILED reference, tell me the file and line — I will decide per-site whether
       to neutralize it now or defer to Phase 2. Do NOT silently change analytics logic.
   The goal of this task is ONLY: BoardStatus is canonical, BoardExamRecord casts to it,
   and nothing fatally errors on boot.

DO NOT:
- Do not modify AnalyticsService/GraduateTracerService business logic (Phase 2.2).
- Do not delete BoardExamStatus (Phase 2.4).
- Do not touch any frontend file.
- Do not touch validation (Prompt 1.2).

VERIFY (paste output):
- php -l on every changed PHP file
- php artisan about   (boots without enum errors)
- grep -rn "BoardExamStatus::FAILED\|BoardExamStatus::PASSER\|BoardStatus::FAILED\|BoardStatus::PASSER" app   (report all hits)
- A tinker snippet casting a BoardExamRecord with each canonical value round-trips.
```

**Owner acceptance for 1.1b**
- `BoardStatus` has exactly the four canonical cases; `failed`/`passer` gone from it.
- `BoardExamRecord` casts `status` to `BoardStatus`.
- App boots; Claude has reported every remaining `BoardExamStatus::PASSER`/`::FAILED` site for Phase 2 planning.

---

# Prompt 1.2 — Board-exam validation + alumni submission UI

**Concern:** backend request first, then frontend · **Commit:** two commits (backend, then frontend)

### 1.2 — Part A (backend)

```
TASK: Restrict alumni board-exam submissions to the single submittable status: passed.

REQUIRED CHANGES:
- app/Http/Requests/Alumni/StoreBoardExamRequest.php:
    - status rule becomes: ['required','string', Rule::in(['passed'])].
      (passed is the only alumni-submittable status. not_taken and not_applicable are
      system-derived, never submitted. There is no 'conditional' status.)
    - Update messages(): status.in message → "Board exam status must be Passed."
    - Remove the import of BoardExamStatus if it is now unused; if StoreBoardExamRequest
      still imports it only for values(), replace with the literal ['passed'].
- Confirm BoardExamController@store passes the validated status through unchanged.
- In app/Services/Alumni/BoardExamService.php submitBoardExam(): the derivation that
  currently produces BoardStatus::FAILED / PASSER must be removed. The submitted status
  is always 'passed'; store it directly as the record status and set the record. Do NOT
  implement the append-and-supersede is_current logic here — that is Phase 3.4. For now,
  just ensure it writes the canonical value 'passed' and never 'failed'/'passer'/'conditional'.
  Leave the existing profile board_status update behavior intact except that it must map to
  the canonical value (passed→passed).

DO NOT:
- Do not add is_current or supersede logic (Phase 3.4).
- Do not add a 'conditional' status anywhere.
- Do not touch the frontend in this commit.

VERIFY (paste output):
- php -l on changed files
- A feature test or manual curl: POST /api/alumni/board-exam with status='failed' → 422
  with the new message; status='conditional' → 422; status='passed' → 201/persists as 'passed'.
- grep -rniE "passer|failed|conditional" app/Http/Requests/Alumni/StoreBoardExamRequest.php  → zero
```

### 1.2 — Part B (frontend)

```
TASK: Replace the alumni board-exam submission control so it offers a single submittable
status: "Passed". Remove "Failed" entirely. There is no "Conditional" option, and neither
"Not Yet Taken" nor "Not Applicable" is selectable (both are system-derived).

FILE: pages/alumni/board-exam/AlumniBoardExamPage.jsx

REQUIRED CHANGES:
- The status selector currently has two buttons: "Passer" and "Failed".
  Replace it with a single "Passed" affirmation (value 'passed') — e.g. a single
  clearly-labeled confirmation control or a read-only "Passed" indication the alumnus
  confirms before submitting. Keep the green/emerald success styling and check icon.
  Remove the old "Failed" button, its red styling branch, and the "I did not pass" copy.
  Rename any "Passer" label/heading to "Passed".
  Do NOT add a "Conditional", "Not Yet Taken", or "Not Applicable" option.
- Update the local status→color map (around line 745) to the canonical keys only:
    passed, not_taken, not_applicable.
  Use these Tailwind classes (match the shared badge to be added in Phase 3.3):
    passed:         emerald (bg-emerald-50 text-emerald-700 border-emerald-200)
    not_taken:      slate   (bg-slate-50 text-slate-600 border-slate-200)
    not_applicable: slate   (bg-slate-50 text-slate-500 border-slate-200)
  Remove any 'conditional' or 'failed' key from the map.
- Ensure formData.status is fixed to 'passed' for submission (it is the only value); never 'failed'/'conditional'.

DO NOT:
- Do not add a "Conditional", "Not Yet Taken", or "Not Applicable" option to the submit control.
- Do not touch the "Department Head" copy in this commit (that is Prompt 1.3).
- Do not change date formatting (Phase 2.5).

VERIFY (paste output):
- npm run build   (passes)
- grep -rniE "failed|passer|conditional" pages/alumni/board-exam/AlumniBoardExamPage.jsx
    → only the "Department Head"-adjacent or unrelated matches may remain; NO board-status
      'failed'/'passer'/'conditional' references. Report anything left.
- Manual: the submit control offers only Passed.
```

**Owner acceptance for 1.2**
- API rejects everything except `passed` with the new message.
- UI presents only Passed; no Failed, no Conditional, no Not Yet Taken, no red "did not pass" styling.
- `BoardExamService` writes only the canonical value `passed`.

---

# Prompt 1.3 — Remove "Department Head" from alumni-facing copy

**Concern:** frontend · **Commit:** frontend-only

```
TASK: Remove every user-facing mention of "Department Head" from the alumni board-exam
and employment pages, and rewrite each sentence to read naturally with Admin as the only
notified party.

FILES + KNOWN LOCATIONS:
- pages/alumni/board-exam/AlumniBoardExamPage.jsx
    - Header comment (~line 5) mentioning "Admin & Department Head"
    - Success toast (~line 128): "...Admin and Department Head have been notified."
    - Info box (~line 573): "...Admin and your Department Head will be automatically notified..."
    - "About Board Exam Records" paragraph (~line 721): "...shared with the Admin and your
      Department Head for institutional tracking."
- pages/alumni/employment/AlumniEmploymentPage.jsx
    - Toasts (~lines 142–143): "...Admin and Department Head have been notified."
    - Info box (~line 681): "...Admin and your Department Head will be automatically notified..."
    - "About" paragraph (~line 847): "...The Admin and your Department Head are notified..."

REQUIRED CHANGES:
- Replace each phrase so only "Admin" (or "the Admin team") is named. Examples:
    "Admin and your Department Head will be automatically notified"
      → "the Admin team will be automatically notified"
    "shared with the Admin and your Department Head for institutional tracking"
      → "shared with the Admin for institutional tracking"
- Remove the stale header comment's Department Head reference.
- Keep tone/formatting identical to the surrounding copy; only remove the retired role.

DO NOT:
- Do not change any logic, toast trigger, or styling — text only.
- Do not touch backend.

VERIFY (paste output):
- grep -rniE "department head|dept.?head" frontend/src   → zero
- npm run build   (passes)
```

**Owner acceptance for 1.3**
- Repo-wide frontend grep for "department head" returns zero.
- Both info boxes, both success toasts, and both "About" paragraphs read naturally with Admin only.

---

# Prompt 1.4 — Remove Department Head notification branch from services

**Concern:** backend · **Commit:** backend-only

```
TASK: Remove the retired Department Head notification path from the two alumni services
and rename the methods/comments to reflect that only admins are notified.

FILES:
- app/Services/Alumni/BoardExamService.php
- app/Services/Alumni/EmploymentService.php

REQUIRED CHANGES (both files):
- In notifyAdminAndDeptHead(...):
    - Delete the block that reads $department->dept_head_id and creates a Notification for it.
    - Keep the admin notification loop exactly as-is.
    - Rename the method to notifyAdmins(...) and update its call sites within the same file.
    - Remove "Department Head" from the method docblock and the class header comment.
- Do NOT remove the $course->department / $department lookups if they are still used for
  other data in the message; only remove the dept_head_id branch. If $department becomes
  entirely unused after removing the branch, remove the now-dead variable too and report it.

DO NOT:
- Do not drop the dept_head_id column or touch Department.php / DepartmentRepository
  (that is Phase 3.1).
- Do not change admin notification content or recipients.
- Do not touch frontend.

VERIFY (paste output):
- php -l on both files
- grep -rniE "deptHead|department head|dept_head_id" app/Services/Alumni   → zero
- Existing board-exam and employment service tests still pass (php artisan test --filter=BoardExam,
  and --filter=Employment if such tests exist; otherwise a manual submit proving admins still get notified).
```

**Owner acceptance for 1.4**
- Neither alumni service references Department Head or `dept_head_id`.
- Admin notifications on board-exam and employment submit are unchanged.
- Methods renamed to `notifyAdmins`.

---

# Prompt 1.5 + 1.6 — In-app notifications for Announcements & Events (reusing the existing send-once mechanism)

**Concern:** backend first, then frontend · **Commit:** two commits (backend, then frontend)

> **Design constraint from owner decision #3:** do NOT create a new notification-log table.
> Reuse the existing `content_email_logs` mechanism as the single send-once guard.
>
> **Important implementation detail to respect:** `content_email_logs` is keyed
> `(user_id, content_type, content_id)` and is currently written **per recipient** inside
> the email job (`SendContentPublishedEmails::sendTo()`), gated by
> `ContentEmailLog::alreadySent(...)`. The cleanest way to satisfy "one mechanism drives both
> email and in-app, no new table" is to **create the in-app Notification inside that same
> per-user loop, gated by the same `alreadySent` check**, so a user who has already been
> processed for this content item gets neither a duplicate email nor a duplicate in-app
> notification. This makes the email job the single fan-out for both channels.

### 1.5/1.6 — Part A (backend)

```
TASK: Make publishing an Announcement or Event create in-app notifications for the correct
audience, reusing the existing SendContentPublishedEmails job and its content_email_logs
send-once guard. Do not create any new table. Do not blanket-notify all alumni for
announcements/events — respect their target audience.

CONTEXT (confirmed current behavior):
- SendContentPublishedEmails(contentType, contentId) already:
    - resolves the audience via ContentAudienceResolver
      (query(target_type, target_value) for announcement/event; jobPostingQuery() for jobs),
    - chunks recipients, and for each user calls sendTo(), which checks
      ContentEmailLog::alreadySent() then queues the email and records ContentEmailLog.
- AdminJobPostingService already ALSO creates in-app notifications via its own notifyAlumni()
  (all alumni). Announcements/Events currently create NO in-app notifications.

REQUIRED CHANGES:
1. In SendContentPublishedEmails::sendTo() (app/Jobs/SendContentPublishedEmails.php):
   Inside the existing per-user block, AFTER the alreadySent() early-return and alongside the
   email queueing, ALSO create an in-app Notification row for that user, with:
     - type    = the contentType ('announcement' | 'event' | 'job_posting')
     - title   = a per-type title (e.g. "New Announcement", "New Event", "New Job Opportunity")
     - message = a short per-type summary (announcement/event title; job "position at company")
     - data    = JSON carrying the id under a per-type key:
                 announcement → {"announcement_id": id}
                 event        → {"event_id": id}
                 job_posting  → {"job_posting_id": id}
   The single ContentEmailLog::alreadySent()/record() guard now covers BOTH channels: because
   the notification is created inside the same guarded block, a re-dispatch or resumed chunk
   never double-creates the in-app notification either.
   NOTE: this means one ContentEmailLog row per (user, content) now represents "user has been
   notified about this item (email + in-app)". Add a clear comment saying so.

2. AdminJobPostingService: it currently creates in-app notifications separately via
   notifyAlumni() AND dispatches the email job. To avoid double in-app notifications once the
   job also creates them:
     - REMOVE the AdminJobPostingService::notifyAlumni() in-app creation and its call sites,
       so job in-app notifications now come solely from SendContentPublishedEmails (same as
       announcements/events). Keep the SendContentPublishedEmails::dispatch(...) calls.
     - Report the before/after so I can confirm jobs are notified exactly once.

3. AnnouncementService and EventService: they already dispatch SendContentPublishedEmails on
   the publish transition (create-with-publish and publish()). No change needed there beyond
   confirming both transitions dispatch. Because the job now also creates in-app notifications,
   announcements/events will get in-app coverage automatically. Confirm and report.

AUDIENCE CORRECTNESS:
- Because you are adding the in-app creation INSIDE the email job's already-resolved audience
  loop, announcement/event in-app recipients automatically match the email audience (target
  scoping), and jobs match jobPostingQuery(). Do NOT add a separate all-alumni insert for
  announcements/events.

DO NOT:
- Do not create a content_notification_logs table or any new table.
- Do not change ContentAudienceResolver.
- Do not touch frontend in this commit.

VERIFY (paste output):
- php -l on changed files
- grep -rn "content_notification_logs" .   → zero
- Manual (Mailpit + DB):
    * Publish a department-scoped announcement → in-app Notification rows exist for exactly
      the targeted alumni (spot-check one in-audience and one out-of-audience user), and
      Mailpit shows the matching emails.
    * Publish an event → same.
    * Publish a job → in-app notifications created exactly once (not twice).
    * Re-dispatch the same publish (unpublish→republish an announcement) → no duplicate
      in-app rows (ContentEmailLog guard held).
```

### 1.5/1.6 — Part B (frontend)

```
TASK: Make the alumni notification bell render and deep-link all three content types.

FILE: components/layout/Header.jsx (openAlumniNotification and the bell dropdown render)

CONTEXT (confirmed routes):
- Alumni SPA routes that exist:
    /alumni/announcements   (list page — NO detail route)
    /alumni/events          (list page — NO detail route)
    /alumni/careers/:id     (job detail route EXISTS)
    /alumni/notifications   (full list)

REQUIRED CHANGES:
- In openAlumniNotification(n): after marking read, deep-link by type using n.data:
    if n.data?.job_posting_id  → navigate(`/alumni/careers/${n.data.job_posting_id}`)
    else if n.data?.announcement_id → navigate('/alumni/announcements')
    else if n.data?.event_id        → navigate('/alumni/events')
  (Announcements/events have no detail route, so land on the list page — this mirrors the
  email links.)
- Ensure the bell dropdown renders title + message for all three types (it should already,
  since it reads generic notification fields — confirm no job-only assumption remains).

DO NOT:
- Do not build announcement/event detail routes (out of scope).
- Do not change unread-count wiring here (that is Phase 3.2).

VERIFY (paste output):
- npm run build   (passes)
- Manual: with seeded notifications of each type, clicking each in the bell marks it read
  and navigates to the correct destination (careers/:id for jobs, list pages for the others).
```

**Owner acceptance for 1.5 + 1.6**
- Publishing an announcement or event creates in-app notifications for exactly the targeted audience; jobs still notify their audience.
- Every content type is notified **once** across publish/unpublish/republish (single `content_email_logs` guard).
- No new table created.
- The bell deep-links all three types (jobs → detail, announcements/events → list).

---

## Phase 1 exit checklist (run before declaring Phase 1 done)

- [ ] `grep -rniE "failed|passer" backend/app/Enums/BoardStatus.php` → zero.
- [ ] Zero `failed`/`passer` rows in `board_exam_records.status` and `alumni_profiles.board_status`.
- [ ] Alumni board-exam API accepts only `passed`; UI offers only the Passed action.
- [ ] `grep -rniE "department head|dept.?head" frontend/src` → zero.
- [ ] `grep -rniE "deptHead|department head" backend/app/Services/Alumni` → zero.
- [ ] Publishing an announcement, event, and job each creates in-app notifications for the correct audience, exactly once, with email still delivered (Mailpit).
- [ ] Bell deep-links all three types.
- [ ] `grep -rn "content_notification_logs" .` → zero (no new table).
- [ ] `php artisan test` green (or manual proof where tests are absent); `npm run build` passes; `php artisan route:list` clean.
- [ ] Every change committed in scoped commits (migration / backend / frontend separated), each diff reviewed.

## Carried into later phases (do NOT do in Phase 1)

- **2.2** — Remove the `failed` bucket from `AnalyticsService` (there is no `conditional` bucket to add); expose a passed count and, if kept, a population-based board-passer rate (`passed / board-program registered alumni`).
- **2.3 / 2.4** — Rename the `PASSER` enum case and every `where('status','passer')` code site; delete `BoardExamStatus`.
- **3.1** — Drop `dept_head_id` column + `deptHead` relation.
- **3.2** — Collapse the separate announcement unread badge into the unified bell count.
- **3.4** — Append-and-Supersede `is_current` logic on `board_exam_records`.

## One caveat flagged for the owner (from decision #3 reuse)

Reusing `content_email_logs` as the single guard means a row in that table now means "this user was notified about this item (email **and** in-app)," not strictly "emailed." That is the correct outcome for keeping the two channels in lockstep with no new table, and it's what these prompts implement. The only edge case: if you ever want to send an in-app notification **without** an email (or vice versa) for the same item, this shared guard would suppress the second channel. No current requirement needs that split — noting it so the decision is deliberate.
