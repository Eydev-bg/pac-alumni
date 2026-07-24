<?php
// ═══════════════════════════════════════════════════════════
//  Alumni Settings — per-user preferences.
//  Adds a nullable JSON `preferences` column to alumni_profiles.
//  A single JSON column (not one column per setting) means future
//  preferences need no further migrations. NULL means "no preference
//  set", which the service layer resolves to the SYSTEM default — so
//  no backfill is required.
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alumni_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('alumni_profiles', 'preferences')) {
                $table->json('preferences')->nullable()->after('is_directory_visible');
            }
        });
    }

    public function down(): void
    {
        Schema::table('alumni_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('alumni_profiles', 'preferences')) {
                $table->dropColumn('preferences');
            }
        });
    }
};
