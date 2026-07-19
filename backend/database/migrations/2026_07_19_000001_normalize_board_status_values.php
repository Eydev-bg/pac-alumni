<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_07_19_000001_normalize_board_status_values.php
//  Data cleanup — normalize retired board-status values to the
//  canonical set: 'not_taken', 'passed', 'not_applicable'.
//  Retired values 'failed' and 'passer' are rewritten in place.
//  Columns are plain VARCHAR(20); no column type or constraint change.
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function () {
            // 'failed' is retired → collapse to the derived default 'not_taken'.
            DB::table('board_exam_records')->where('status', 'failed')->update(['status' => 'not_taken']);
            DB::table('alumni_profiles')->where('board_status', 'failed')->update(['board_status' => 'not_taken']);

            // 'passer' is retired → rename to canonical 'passed'.
            DB::table('board_exam_records')->where('status', 'passer')->update(['status' => 'passed']);
            DB::table('alumni_profiles')->where('board_status', 'passer')->update(['board_status' => 'passed']);
        });
    }

    public function down(): void
    {
        // Intentionally lossy. The original 'failed' vs 'not_taken' distinction
        // cannot be recovered: up() mapped failed → not_taken one-way, and rows
        // that were already 'not_taken' are indistinguishable from remapped ones.
        // We therefore reverse ONLY the reversible passer↔passed rename here.
        // failed → not_taken is NOT reconstructed.
        DB::transaction(function () {
            DB::table('board_exam_records')->where('status', 'passed')->update(['status' => 'passer']);
            DB::table('alumni_profiles')->where('board_status', 'passed')->update(['board_status' => 'passer']);
        });
    }
};
