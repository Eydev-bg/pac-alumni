# Batch 1 — Phases 4 + 8: Low-Priority Cleanup + Refactoring

**Companion to:** `docs/PAC_REMEDIATION_IMPLEMENTATION_PLAN.md` (Phases 4 and 8)
**Prerequisite:** Phases 1–3 fully landed and green.
**Execution model:** Batch run — Claude Code executes all prompts continuously, committing each separately, and reports a final summary. Same pattern as Phase 3.4–3.7.

---

## What's in this batch

All grep-driven, low-risk cleanup work. No feature changes, no user-facing behavior changes beyond removing dead code and outdated comments.

- **4.1** — Residual inline date-formatting sweep (any `toLocaleDateString` left in pages)
- **4.2** — Verify import-status "failed" doesn't cross-wire with board vocabulary
- **4.3** — Comment drift: retired concepts ("Feature N", "Department Head", "Employer") in backend comments/docblocks
- **8.1** — Final cleanup: verify no retired code (BoardExamStatus, dept_head, etc.) resurfaced
- **8.2** — Consolidate duplicated frontend helpers (stripHtml, debounce, unused imports)
- **8.3** — Documentation/comment reconciliation (broad final sweep)

---

## Ground rules reminder

If starting a new Claude Code session, paste the ground rules from Phase 1 first (rules 1–7 plus rule 8 from Phase 2). One additional rule for this batch:

> 9. **This is a cleanup batch.** No user-facing behavior changes. If a proposed change would alter what a user sees or does, STOP and report — do not proceed. The only user-visible acceptable change is dates now rendering through the shared en-PH formatter.

---

## Batch run instructions (paste this ONE message to Claude Code)

```
Read docs/PAC_REMEDIATION_IMPLEMENTATION_PLAN.md sections 4.1–4.3 and 8.1–8.3 for context
(rationale only — the exact tasks below are authoritative).

Execute the six prompts below in order, continuously — do not stop between them.

For EACH prompt:
1. Follow the TASK exactly.
2. Run its VERIFY block. If verification fails, fix and re-verify before moving on.
3. Commit that prompt's changes separately with a clear commit message.
4. If a prompt finds NOTHING to clean, that's a valid outcome — skip the commit and report "nothing to change" for that prompt.

After ALL six prompts are done, run this final check block and report:
- php artisan test
- npm run build
- grep -rniE "BoardExamStatus|dept_head|deptHead" backend/app
- grep -rn "toLocaleDateString" frontend/src/pages
- grep -rniE "Feature [0-9]+|department head|dept.?head" backend/app --include="*.php"

Show a summary table of all commits at the end (or "no commit" per prompt if nothing was needed).

Do not ask for approval between prompts — commit and continue. This is a cleanup batch;
no user-facing behavior changes are expected.

═══════════════════════════════════════════════════════════════════════

PROMPT 4.1 — Residual inline date formatting sweep

Search for any inline toLocaleDateString call in frontend/src that was missed by
Phase 2.3. IMPORTANT DISTINCTION:
- toLocaleDateString  → DATE formatting → must be replaced with the shared formatter
- toLocaleString      → typically NUMBER formatting (e.g., 1000 → "1,000") → LEAVE ALONE
- toLocaleTimeString  → time formatting → leave alone (not covered in this cleanup)

Task:
1. Run: grep -rn "toLocaleDateString" frontend/src --include="*.jsx" --include="*.js"
2. For each hit (excluding utils/formatters.js itself, which is the canonical source):
   - Determine what date part is being formatted.
   - Replace with formatDateOnly (date-only) or formatDate (date + time) from utils/formatters.
   - Add the import if missing (relative path from the file's location).
3. Do NOT touch toLocaleString on number values. If a hit is calling toLocaleString on a
   number variable (like stats.count?.toLocaleString()), skip it — that's correct usage.

If grep returns zero hits, commit nothing and report "4.1: no residual toLocaleDateString hits".

VERIFY:
- npm run build   (passes)
- grep -rn "toLocaleDateString" frontend/src/pages   → zero

Commit message: "cleanup: sweep residual inline date formatting to shared en-PH formatter"

═══════════════════════════════════════════════════════════════════════

PROMPT 4.2 — Import-status "failed" boundary check

The GraduateImportPage uses FINAL_STATUSES = ["completed", "failed"] for import-job
status. This is correct and unrelated to the retired board-status "failed". Verify that
no shared label/color map accidentally couples them.

Task (investigation + fix if needed):
1. Read pages/admin/graduates/GraduateImportPage.jsx and pages/admin/graduates/ImportHistoryPage.jsx.
2. Confirm the "failed" import status is styled/labeled by import-specific code, NOT by
   any shared BOARD_LABELS or board-status color map.
3. If you find a shared map that conflates import "failed" with board "failed" (e.g., a
   status→color helper used by BOTH import and board contexts), rename the import-specific
   constants so they cannot be confused (e.g., IMPORT_FINAL_STATUSES, IMPORT_STATUS_LABELS).
4. If everything is already independent, commit nothing.

VERIFY:
- npm run build   (passes)
- Report: are the import "failed" status and any board status vocabulary fully independent?

Commit message (only if a rename was needed): "cleanup: rename import-status constants to
prevent confusion with retired board vocabulary"

═══════════════════════════════════════════════════════════════════════

PROMPT 4.3 — Comment drift: retired concepts

Update backend PHP comments and docblocks that reference retired concepts. These are
COMMENT-ONLY changes — do NOT change any code logic, method behavior, or return values.

Task:
1. Run: grep -rniE "Department Head|dept.?head" backend/app --include="*.php"
   For every hit in a COMMENT or DOCBLOCK, rewrite the comment to reflect the current
   design (Admin-only notifications, no Department Head).

2. Run: grep -rniE "Feature [0-9]+" backend/app --include="*.php"
   For every hit in a COMMENT or DOCBLOCK, remove the "Feature N" reference. Keep the
   surrounding comment content that describes what the code does; just drop the stale
   feature-number tag. Example:
     "// Feature 18: Auto-trigger notifications" → "// Auto-trigger notifications"
     "* Feature 12: Notify Admin and Department Head about board exam update."
       → "* Notify Admin about board exam update."

3. Run: grep -rniE "Employer" backend/app --include="*.php"
   For each hit in a comment, evaluate:
   - If it's historical context (e.g., "no employer accounts" explaining why admin owns
     job postings), KEEP it — it's still accurate.
   - If it references the retired Employer role as if active, remove/rewrite.

Rules:
- NEVER change code — only comments and docblocks.
- If a "Feature N" tag appears in a git commit message or migration file that already ran,
  leave it (it's historical).
- Preserve the structure and formatting of docblocks; only rewrite text content.

VERIFY:
- php -l on every changed file
- grep -rniE "Feature [0-9]+" backend/app --include="*.php"   → zero (or only in migrations)
- grep -rniE "department head|dept.?head" backend/app --include="*.php"   → zero
- php artisan test   (all pass — proof no code was touched)

Commit message: "cleanup: remove retired concept references from backend comments"

═══════════════════════════════════════════════════════════════════════

PROMPT 8.1 — Retired code final sweep

Confirm no dead code from Phases 1–3 resurfaced. This is a pure verification prompt —
if the greps return zero, commit nothing.

Task:
1. grep -rn "BoardExamStatus" backend/app backend/tests   → should be zero
2. grep -rniE "dept_head|deptHead|hasDeptHead" backend/app backend/tests   → should be zero
3. grep -rn "notifyAdminAndDeptHead\|notifyDeptHead" backend/app   → should be zero
4. ls backend/app/Enums/BoardExamStatus.php   → should be "No such file"

If ANY of these return non-zero, report the exact hits — do not fix (that indicates a
regression that needs discussion). If all zero, report "8.1: clean, no regressions".

Commit: none expected (verification only).

═══════════════════════════════════════════════════════════════════════

PROMPT 8.2 — Consolidate duplicated frontend helpers

Look for helpers duplicated across page files that should be in utils/formatters.js or
a shared hook.

Task:
1. Read frontend/src/utils/formatters.js — note what's already exported (stripHtml, cn,
   storageUrl, formatDate, formatDateOnly, timeAgo, truncate).

2. Search for local re-implementations across pages:
   grep -rnE "function stripHtml|const stripHtml =" frontend/src/pages
   → for each hit, replace with an import from utils/formatters.

3. Search for local debounce implementations:
   grep -rnE "function debounce|const debounce =|setTimeout.*debounce" frontend/src/pages
   → if multiple pages define their own debounce, create a shared useDebounce hook in
     frontend/src/hooks/ (or add to an existing hooks folder if present) and consolidate.
     If only one page has it, LEAVE it (single-use isn't duplication).

4. Search for unused imports across changed files:
   In every file you edit for this prompt, remove imports that become orphaned.

Rules:
- Do NOT create new abstractions preemptively. Only consolidate what is ACTUALLY duplicated.
- If a "duplicated" function has subtly different behavior between files, do NOT consolidate —
  report the difference and skip.

VERIFY:
- npm run build   (passes)
- grep -rnE "function stripHtml|const stripHtml =" frontend/src/pages   → zero
- Report: how many files had duplicate helpers; how many were consolidated vs. left in place.

Commit message: "refactor: consolidate duplicated frontend helpers into shared utils/hooks"
(only if changes were made)

═══════════════════════════════════════════════════════════════════════

PROMPT 8.3 — Documentation reconciliation (final sweep)

Broad final sweep of any remaining outdated documentation or comments across the repo,
not caught by 4.3 or 8.2.

Task:
1. Read the top-level README.md (if it exists) — does it still describe retired roles
   (Department Head, Employer) or old board statuses (passer/failed)?
2. Read any file in docs/ that isn't the remediation plan or phase prompts —
   are its statements still accurate?
3. Read the docblocks of the three main service classes (BoardExamService,
   EmploymentService, AdminJobPostingService) — do their class-level comments accurately
   describe the current behavior?

Rules:
- COMMENT/DOC-ONLY changes.
- Do NOT delete files or rewrite content beyond removing outdated statements.
- If you find a doc that is FULLY outdated (e.g., an old feature spec that no longer
  reflects reality), do NOT delete it — report it and let me decide.

VERIFY:
- grep -rniE "passer|failed|department head" README.md docs/*.md 2>/dev/null   →
  only intentional references (removed-legacy notes) remain
- php artisan test   (all pass — proof no code touched)

Commit message: "docs: reconcile outdated documentation with current implementation"
(only if changes were made)

═══════════════════════════════════════════════════════════════════════

END OF BATCH. Report final check block and commit summary.
```

---

## Expected outcome

A small number of commits (probably 3–5 total), mostly comment/documentation changes.
Some prompts may report "nothing to change" — that's expected and correct.

Zero user-facing behavior changes. Zero test failures. Zero build errors.
