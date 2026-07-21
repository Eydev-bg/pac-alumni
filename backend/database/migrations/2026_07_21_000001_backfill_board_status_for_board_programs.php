<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_07_21_000001_backfill_board_status_for_board_programs.php
//  Data correction — board-program graduates were created with the wrong
//  default board status. VerificationService previously read the (stale)
//  department.is_board_program flag instead of the authoritative
//  course.is_board_program, so board-program grads defaulted to
//  'not_applicable' instead of 'not_taken'. That one-line source bug is now
//  fixed; this migration corrects the profiles already persisted with the
//  wrong value.
//
//  Precise + idempotent: only rows whose COURSE is genuinely a board program,
//  whose board_status is STILL 'not_applicable', AND who have NO board exam
//  record are moved to 'not_taken'. Anyone already 'passed', already
//  'not_taken', or holding a board exam record is left untouched. Re-running
//  matches nothing further.
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function () {
            // Identify affected profiles: board-program course, still stuck at
            // not_applicable, and no board exam record on file yet.
            $ids = DB::table('alumni_profiles as ap')
                ->join('graduates as g', 'g.id', '=', 'ap.graduate_id')
                ->join('courses as c', 'c.id', '=', 'g.course_id')
                ->where('c.is_board_program', true)
                ->where('ap.board_status', 'not_applicable')
                ->whereNotExists(function ($q) {
                    $q->select(DB::raw(1))
                        ->from('board_exam_records as ber')
                        ->whereColumn('ber.graduate_id', 'ap.graduate_id');
                })
                ->pluck('ap.id');

            if ($ids->isNotEmpty()) {
                DB::table('alumni_profiles')
                    ->whereIn('id', $ids)
                    ->update([
                        'board_status' => 'not_taken',
                        'updated_at'   => now(),
                    ]);
            }
        });
    }

    public function down(): void
    {
        // Intentionally irreversible. 'not_taken' is the CORRECT default for a
        // board-program graduate without a record, so blindly reverting
        // board-program not_taken rows back to not_applicable would simply
        // re-introduce the very bug this migration fixes — and rows that were
        // already legitimately 'not_taken' are indistinguishable from the ones
        // corrected here. No-op.
    }
};
