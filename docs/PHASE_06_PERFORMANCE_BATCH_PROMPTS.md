# Batch 2 — Phase 6: Performance Improvements

**Companion to:** `docs/PAC_REMEDIATION_IMPLEMENTATION_PLAN.md` (Phase 6, issues 6.1–6.3)
**Prerequisite:** Phases 1–4 and 8 fully landed and green.
**Execution model:** Investigation-first, then targeted fixes. Batch run — Claude Code executes all prompts continuously.

---

## Context

Phase 6 has three issues. One (6.1) is **already done** — the `deptHead` eager loads were removed in Phase 3.1. The remaining two (6.2 and 6.3) are investigation-heavy: verify correctness and performance, fix only if a real problem is found.

---

## Ground rules reminder

If starting a new Claude Code session, paste the ground rules from Phase 1 (rules 1–7) first. Add:

> 10. **Performance batch.** Focus on query efficiency, index coverage, and chunking correctness. Do NOT refactor code structure or naming — only fix actual performance problems found via EXPLAIN or profiling. If everything is already efficient, report "no change needed" and move on.

---

## Batch run instructions (paste this ONE message to Claude Code)

```
Read docs/PAC_REMEDIATION_IMPLEMENTATION_PLAN.md Phase 6 (issues 6.1–6.3) for context only.

Execute the three prompts below in order, continuously. Do not stop between them.

For EACH prompt:
1. Follow the TASK exactly.
2. Run its VERIFY block.
3. Commit changes separately (if any). If a prompt finds no issue, report "no change needed" and move on.

After ALL three prompts, run this final check:
- php artisan test
- npm run build

Show a summary table of all findings and commits at the end.

═══════════════════════════════════════════════════════════════════════

PROMPT 6.1 — Verify deptHead eager loads are gone (verification only)

This was already executed in Phase 3.1. Confirm it's still clean.

Task:
1. grep -rn "deptHead" backend/app   → should be zero
2. grep -rn "dept_head" backend/app   → should be zero (the column was dropped in 3.1)

If both are zero, report "6.1: confirmed clean, deptHead eager loads removed in Phase 3.1"
and move on. No commit.

If any hits appear, report them — do NOT fix (that would indicate a regression).

═══════════════════════════════════════════════════════════════════════

PROMPT 6.2 — Notification fan-out: chunking and index verification

CONTEXT:
In Phase 1.5, we moved in-app notification creation into SendContentPublishedEmails.
The job already chunks recipients via chunkById(500). Each chunk creates individual
Notification::create() calls per user (inside the sendTo loop). This needs verification.

Task (investigate and report — fix only if a problem is found):

PART A — Chunking verification:
1. Read backend/app/Jobs/SendContentPublishedEmails.php.
2. Confirm the job uses chunkById(500) for recipient processing.
3. Confirm Notification::create() is called per-user inside the chunk loop (not a bulk
   Notification::insert() of the entire audience at once).
4. Report: is the current per-user create() inside chunkById(500) sufficient for large
   audiences (e.g., 5000+ alumni), or does it risk timeout? Consider that each iteration
   of the chunk also queues an email — the per-user overhead is dominated by the email
   queue, not the notification insert.
5. If chunking is already correct, report "chunking is sufficient" and do NOT change it.

PART B — Index verification:
1. Read the notifications table migration and report what indexes exist.
2. The bell's unread-count query likely does:
   WHERE user_id = ? AND is_read = false
   Confirm this query is covered by the existing composite index.
3. Run EXPLAIN on the unread-count query for a sample user:
   php artisan tinker --execute="
     DB::enableQueryLog();
     \App\Models\Notification::where('user_id', 1)->where('is_read', false)->count();
     dd(DB::getQueryLog());
   "
   Report the query and whether it uses an index.
4. If the index covers the query, report "index coverage sufficient".
5. If the index is MISSING or the query does a full scan, ADD the index via a new migration:
   $table->index(['user_id', 'is_read', 'created_at']);

VERIFY:
- php -l on any changed files
- php artisan test   (all pass)
- Report: summary of chunking status + index coverage

Commit message (only if a migration was added): "perf: add composite index on notifications for bell query"

═══════════════════════════════════════════════════════════════════════

PROMPT 6.3 — Analytics/dashboard query efficiency after status changes

CONTEXT:
Phase 2.1 modified AnalyticsService::boardExams() (removed the failed bucket, renamed
passer→passed). Phase 3.6 rewrote the GraduateRepository board filter to use
whereDoesntHave instead of a simple column match. Both changes could affect query
efficiency. The board_exam_records table has indexes on graduate_id, status, and
(exam_name, exam_year).

Task (investigate and report — fix only if a problem is found):

PART A — AnalyticsService board queries:
1. Read backend/app/Services/Admin/AnalyticsService.php, specifically the boardExams() method.
2. Confirm the summary/by_department/by_year queries are each a SINGLE query (no N+1).
3. Run EXPLAIN on the summary query to verify index usage:
   php artisan tinker --execute="
     DB::enableQueryLog();
     \App\Services\Admin\AnalyticsService::boardExams();
     \$queries = DB::getQueryLog();
     foreach(\$queries as \$q) { echo \$q['query'] . ' [' . implode(',', \$q['bindings']) . '] ' . \$q['time'] . 'ms' . PHP_EOL; }
   "
   Report: how many queries run, do they use indexes, what are the execution times?
4. If queries are single-pass and indexed, report "analytics queries efficient".

PART B — GraduateRepository board filter:
1. Read backend/app/Repositories/Eloquent/GraduateRepository.php, the board_status
   filter block (the one rewritten in Phase 3.6).
2. The 'not_taken' filter now uses whereDoesntHave('boardExamRecords', ...) — this
   generates a NOT EXISTS subquery. Confirm this is acceptable for the data scale
   (~20k graduates).
3. Run EXPLAIN on the not_taken filter query:
   php artisan tinker --execute="
     DB::enableQueryLog();
     \App\Repositories\Eloquent\GraduateRepository::class;
     \$repo = app(\App\Repositories\Contracts\GraduateRepositoryInterface::class);
     \$repo->getPaginated(boardStatus: 'not_taken', perPage: 15);
     \$queries = DB::getQueryLog();
     foreach(\$queries as \$q) { echo \$q['query'] . ' [' . implode(',', \$q['bindings']) . '] ' . \$q['time'] . 'ms' . PHP_EOL; }
   "
   Report: does the NOT EXISTS subquery use the graduate_id index on board_exam_records?
4. If yes, report "filter query efficient". If it does a full scan on board_exam_records,
   consider adding an index on (graduate_id, status).

PART C — Dashboard queries:
1. Read backend/app/Http/Controllers/Api/Admin/DashboardController.php.
2. Confirm the board_passers and board_not_yet_taken computations are simple counts
   (not N+1 loops).
3. Check if the DashboardController still references BoardExamStatus anywhere
   (it should have been updated to BoardStatus in Phase 2.1 — verify).
4. Report findings.

VERIFY:
- php -l on any changed files
- php artisan test   (all pass)
- Report: summary table of query efficiency findings

Commit message (only if changes made): "perf: optimize analytics/dashboard queries"

═══════════════════════════════════════════════════════════════════════

END OF BATCH. Report final check block and commit/findings summary.
```

---

## Expected outcome

This batch is mostly **investigation and verification**. Expected commits: **0–2** (likely zero if everything is already efficient, or 1–2 if an index or a minor query fix is needed).

The key outcomes are the **investigation reports** — confirming that:
1. deptHead loads are gone (6.1 — already done)
2. Notification fan-out chunks correctly and bell queries are indexed (6.2)
3. Analytics and filter queries remain single-pass and indexed after Phases 2–3 changes (6.3)
