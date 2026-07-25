<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('board_exam_records', function (Blueprint $table) {
            $table->boolean('is_current')->default(false)->after('status');
        });

        // Backfill: mark the latest record (highest id) per graduate as current.
        // Single UPDATE with a derived-table subquery (MySQL cannot reference the
        // updated table directly in an uncorrelated subquery without wrapping it).
        DB::statement(<<<'SQL'
            UPDATE board_exam_records
            SET is_current = true
            WHERE id IN (
                SELECT max_id FROM (
                    SELECT MAX(id) AS max_id
                    FROM board_exam_records
                    GROUP BY graduate_id
                ) AS latest
            )
        SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('board_exam_records', function (Blueprint $table) {
            $table->dropColumn('is_current');
        });
    }
};
