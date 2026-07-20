# Phase 2 — High Priority Fixes · Claude Code Prompts

**Companion to:** `docs/PAC_REMEDIATION_IMPLEMENTATION_PLAN.md` (issues 2.1–2.5)
**Prerequisite:** Phase 1 fully landed and exit checklist passed.
**Execution model:** Same as Phase 1 — one prompt at a time, verify, review diff, commit.

---

## Ground rules reminder

The Phase 1 ground rules are still in effect. If starting a new Claude Code session, paste the ground rules block from `docs/PHASE_01_CRITICAL_CLAUDE_CODE_PROMPTS.md` first.

One addition for Phase 2:

> 8. **BoardExamStatus is being deleted this phase.** Every `BoardExamStatus::PASSER` reference becomes `BoardStatus::PASSED`, every `BoardExamStatus::FAILED` reference is removed (the failed bucket no longer exists). After Prompt 2.1, the file `app/Enums/BoardExamStatus.php` must no longer exist.

---

## Prompt order

1. **2.1** — Enum consolidation + analytics cleanup (backend) — deletes BoardExamStatus, fixes all references, removes failed analytics bucket
2. **2.2** — Admin frontend filters, labels, and status displays (frontend) — removes passer/failed from UI
3. **2.3** — Date formatting consistency (frontend) — replaces inline toLocaleDateString with shared formatter

---

# Prompt 2.1 — Enum consolidation + analytics cleanup (backend)

**Concern:** backend · **Commit:** one backend commit

```
TASK: Delete the BoardExamStatus enum, replace every reference with BoardStatus, and
clean up the analytics board-exam aggregation to remove the retired "failed" bucket.

This task covers plan issues 2.2, 2.3, and 2.4 on the backend side.

CONTEXT:
- Phase 1.1a already migrated all DB rows: 'failed'→'not_taken', 'passer'→'passed'.
- Phase 1.1b already made BoardStatus the canonical enum with 3 cases:
    NOT_TAKEN='not_taken', PASSED='passed', NOT_APPLICABLE='not_applicable'.
- BoardExamStatus still exists with its old PASSER/FAILED cases. It is referenced by
  exactly these files (confirmed in Phase 1.1b report):

  ┌──────────────────────────────────────────────────────────┬──────┬─────────────────────┐
  │ File                                                     │ Line │ Reference           │
  ├──────────────────────────────────────────────────────────┼──────┼─────────────────────┤
  │ app/Services/Admin/AnalyticsService.php                  │ 123  │ ::PASSER            │
  │ app/Services/Admin/AnalyticsService.php                  │ 124  │ ::FAILED            │
  │ app/Services/Admin/AnalyticsService.php                  │ 139  │ ::PASSER, ::FAILED  │
  │ app/Services/Admin/AnalyticsService.php                  │ 164  │ ::PASSER, ::FAILED  │
  │ app/Services/Admin/GraduateTracerService.php             │  38  │ ::PASSER            │
  │ app/Services/Admin/GraduateTracerService.php             │ 109  │ ::PASSER            │
  │ app/Http/Controllers/Api/Admin/DashboardController.php   │  75  │ ::PASSER            │
  │ app/Exports/BoardPassingExport.php                       │  36  │ ::PASSER            │
  └──────────────────────────────────────────────────────────┴──────┴─────────────────────┘

REQUIRED CHANGES:

1. PASSER→PASSED swap (GraduateTracerService, DashboardController, BoardPassingExport):
   - Replace every BoardExamStatus::PASSER with BoardStatus::PASSED.
   - Replace every BoardExamStatus::PASSER->value with BoardStatus::PASSED->value.
   - Update the import: remove `use App\Enums\BoardExamStatus`, add `use App\Enums\BoardStatus`
     (if not already imported).
   - These files have NO ::FAILED references, so this is a pure swap.

2. AnalyticsService.php — boardExams() method (the complex one):
   The current code computes $totalTakers, $passers, $failed, $passingRate, and returns
   all of them plus by_department and by_year breakdowns that each include a 'failed' column.

   REQUIRED rewrite:
   a) Summary section:
      - Keep $totalTakers (count of all board_exam_records matching the filters — these are
        now all 'passed' records since alumni can only submit 'passed', but the count is still
        meaningful as "number of board exam records").
      - Rename $passers → $passed and query with BoardStatus::PASSED->value.
      - REMOVE $failed entirely (no query, no variable).
      - Rename the metric: passingRate is no longer meaningful as passed/takers (it would
        always be 100% since all records are now 'passed'). Replace it with a simple count.
        Return 'passed' and 'total_records' instead of 'passers', 'failed', 'passing_rate'.

   b) by_department section:
      - Keep the SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) for passed (using
        BoardStatus::PASSED->value as the bind).
      - REMOVE the failed SUM entirely — drop the SQL column AND its bind parameter.
      - In the ->map() callback: remove 'failed', rename 'passers' → 'passed'.
      - Remove the per-department 'passing_rate' calculation (same reason: always 100%).
        Keep 'total_takers' and 'passed' counts.

   c) by_year section:
      - Same treatment: keep passed SUM, remove failed SUM and its bind, remove from output.

   d) Return array:
      - Final shape: ['total_records' => ..., 'passed' => ..., 'by_department' => [...],
        'by_year' => [...]]. No 'failed', no 'passing_rate'.

   e) Update the import: remove BoardExamStatus, ensure BoardStatus is imported.

3. DELETE app/Enums/BoardExamStatus.php — the file itself. All references are now gone.

DO NOT:
- Do not touch frontend (that is Prompt 2.2).
- Do not change any other analytics method (employment, registration, etc.).
- Do not change ContentAudienceResolver or notification logic.

VERIFY (paste output):
- php -l on every changed PHP file
- grep -rn "BoardExamStatus" backend/app backend/tests   → zero (the enum is fully gone)
- php artisan about   (boots clean)
- php artisan test   (full suite — the analytics and dashboard tests must still pass; report
  any failures with file and line)
- Confirm BoardExamStatus.php no longer exists: ls backend/app/Enums/BoardExamStatus.php
  should error "No such file"
```

**Owner acceptance for 2.1**
- `BoardExamStatus.php` deleted; zero references remain anywhere in `app/` and `tests/`.
- `AnalyticsService::boardExams()` returns no `failed` field and no `passing_rate` field.
- All PASSER references now use `BoardStatus::PASSED`.
- App boots, full test suite passes.

---

# Prompt 2.2 — Admin frontend filters, labels, and status displays

**Concern:** frontend · **Commit:** one frontend commit

```
TASK: Update every admin page that still references the retired "passer" or "failed"
board-status values. Replace with the canonical value "passed" and remove "failed" options.

FILES AND SPECIFIC CHANGES:

1. pages/admin/graduates/GraduatesListPage.jsx
   - BOARD_LABELS: replace { passer: "Board Passers", failed: "Board Failed" }
     with { passed: "Passed", not_taken: "Not Yet Taken" }.
   - BOARD_OPTIONS: replace the array with
     [{ value: "passed", label: "Passed" }, { value: "not_taken", label: "Not Yet Taken" }].
   - Anywhere the code reads boardFilter or BOARD_LABELS[boardFilter], it will now match
     the canonical values. No other logic change needed.

2. pages/admin/alumni/AlumniSearchPage.jsx
   - The <select> for board_status filter has <option value="passer">Board Passer</option>
     and <option value="failed">Board Failed</option>.
   - Replace with: <option value="passed">Passed</option> and
     <option value="not_taken">Not Yet Taken</option>.

3. pages/admin/alumni/AlumniProfilePage.jsx
   - Status derivation (~line 106-116): replace every === "passer" with === "passed"
     and every === "failed" check — remove it or map to the equivalent canonical check.
     The canonical statuses are: "passed" (success/green), "not_taken" (neutral/slate),
     "not_applicable" (neutral/slate). There is no "failed" branch.
   - Records list (~line 152): rec.status === "passer" ? "success" : "failed"
     → rec.status === "passed" ? "success" : "default" (all records are now 'passed',
     but keep a defensive fallback).

4. pages/admin/graduates/GraduateDetailPage.jsx
   - Same pattern as AlumniProfilePage: replace "passer" → "passed", remove "failed"
     branches, update the StatusBadge status mapping.
   - Records list (~line 299): rec.status === "passer" ? "success" : "failed"
     → rec.status === "passed" ? "success" : "default".

5. pages/admin/dashboard/DashboardPage.jsx
   - The board stats card shows "Passers" as the label (~line 85). Change to "Passed".
   - The boardChart object uses "passers" key (~line 93). Rename to "passed" to match
     the new API response from Prompt 2.1.
   - The passingRate prop (~line 94, 204) — the API no longer returns this. Remove
     passingRate from the chart data and from the BoardExamOverviewCard prop.

6. pages/admin/dashboard/components/BoardExamOverviewCard.jsx
   - Remove the passingRate prop and its display.
   - Rename "passers" prop to "passed" if used.

7. pages/admin/analytics/TracerBarChart.jsx
   - The COLORS object has boardPassers key (~line 29). Rename to boardPassed.
   - The data mapping uses "Board Passers" as the bar label (~line 99). Change to
     "Board Passed".
   - The Bar component uses COLORS.boardPassers (~line 169). Update to COLORS.boardPassed.

GENERAL RULES:
- "Passer/Passers" in user-facing labels → "Passed".
- "Board Passer" in filter labels → "Passed".
- "Board Failed" → removed entirely (no filter option for it).
- Error toast messages that say "Failed to load..." are UNRELATED — do NOT touch those.

DO NOT:
- Do not touch alumni pages (already done in Phase 1).
- Do not touch backend.
- Do not change date formatting (Prompt 2.3).

VERIFY (paste output):
- npm run build   (passes)
- grep -rniE "passer" frontend/src/pages/admin   → zero (excluding unrelated words like
  "passengers" if any — report all hits)
- grep -rniE '"failed"' frontend/src/pages/admin   → only error-toast "Failed to..."
  messages remain; NO board-status "failed" references. Report all hits so I can confirm.
```

**Owner acceptance for 2.2**
- No admin filter/label/status-display references "passer" or "Board Failed".
- Filter options are "Passed" and "Not Yet Taken".
- Dashboard shows "Passed" not "Passers"; no passingRate displayed.
- Error toasts ("Failed to load...") are untouched.

---

# Prompt 2.3 — Date formatting consistency

**Concern:** frontend · **Commit:** one frontend commit

```
TASK: Replace all inline toLocaleDateString calls in page components with the shared
formatter from utils/formatters.js. The canonical locale is 'en-PH'.

CONTEXT:
The shared formatters are:
- formatDate(isoString, options?) — date + time, en-PH locale (default: short month, numeric day/year, 2-digit hour/minute)
- formatDateOnly(isoString) — date only, en-PH locale (long month, numeric day/year)

Both return '—' for falsy input.

FILES WITH INLINE toLocaleDateString (exhaustive list from audit):

1. pages/alumni/board-exam/AlumniBoardExamPage.jsx (~line 676)
   - new Date(rec.created_at).toLocaleDateString("en-US", {...})
   - Replace with formatDateOnly(rec.created_at) — or formatDate if the original included time.
   - Add the import: import { formatDateOnly } from "../../utils/formatters";
     (adjust relative path to match the file's location).

2. pages/alumni/employment/AlumniEmploymentPage.jsx (~lines 300, 804, 812)
   - Three inline calls for start_date and end_date.
   - Replace all with formatDateOnly(...).
   - Add the import.

3. pages/alumni/dashboard/AlumniDashboardPage.jsx (~line 99)
   - A local helper: return new Date(iso).toLocaleDateString("en-US", {...})
   - Replace the body with: return formatDateOnly(iso);
   - Or remove the local helper entirely and import/use formatDateOnly at the call sites.
   - Add the import.

4. pages/admin/verification/VerificationLogsPage.jsx (~lines 48, 302)
   - Two inline calls using "en-PH" (correct locale, but still inline).
   - Replace with formatDateOnly(...) for consistency.
   - Add the import.

FOR EACH FILE:
- Import the needed formatter(s) from the utils path.
- Replace the inline call with the shared function.
- If the inline call used options that differ from the shared defaults (e.g., it showed time
  but formatDateOnly doesn't), use formatDate(iso) instead (which includes time).
- If a file has a local date-formatting helper that just wraps toLocaleDateString, remove
  the local helper and use the shared one directly.

DO NOT:
- Do not change any other logic, styling, or behavior.
- Do not modify utils/formatters.js itself.
- Do not touch backend.

VERIFY (paste output):
- npm run build   (passes)
- grep -rn "toLocaleDateString" frontend/src/pages   → zero (all calls now go through
  the shared utility). Report any remaining hits.
```

**Owner acceptance for 2.3**
- Zero inline `toLocaleDateString` calls in any page component.
- All dates go through the shared `en-PH` formatter.
- No visual behavior change beyond locale normalization.

---

## Phase 2 exit checklist (run after all prompts are committed)

```
Run these checks and report all results. Do not fix anything — just report.

1. ls backend/app/Enums/BoardExamStatus.php
2. grep -rn "BoardExamStatus" backend/app backend/tests
3. grep -rniE "passer" frontend/src/pages
4. grep -rniE '"failed"' frontend/src/pages/admin | grep -v "toast\|catch\|error\|response"
5. grep -rn "toLocaleDateString" frontend/src/pages
6. php artisan test
7. npm run build
```

Expected results:
1. "No such file" (deleted).
2. Zero (fully removed).
3. Zero (all renamed to passed).
4. Zero (all board-status failed removed; only error toasts remain, filtered out).
5. Zero (all using shared formatter).
6. All pass (1 pre-existing incomplete ok).
7. Build passes.
