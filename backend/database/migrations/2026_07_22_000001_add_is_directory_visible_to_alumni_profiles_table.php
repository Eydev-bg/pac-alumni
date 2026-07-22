<?php
// ═══════════════════════════════════════════════════════════
//  Alumni Directory (Phase B) — visibility opt-out.
//  Adds `is_directory_visible` to alumni_profiles. Default true
//  means the directory is opt-OUT: every existing alumnus is
//  listed until they choose to hide, so no backfill is needed.
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alumni_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('alumni_profiles', 'is_directory_visible')) {
                $table->boolean('is_directory_visible')
                    ->default(true)
                    ->after('board_status');

                $table->index('is_directory_visible');
            }
        });
    }

    public function down(): void
    {
        Schema::table('alumni_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('alumni_profiles', 'is_directory_visible')) {
                $table->dropIndex(['is_directory_visible']);
                $table->dropColumn('is_directory_visible');
            }
        });
    }
};
