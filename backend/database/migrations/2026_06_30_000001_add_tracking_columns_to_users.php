<?php
// ═══════════════════════════════════════════════════════════
//  Phase 4.1 — Reminder system tracking columns.
//  `last_login_at` already exists on the users table (recorded
//  on every successful login). This migration only adds the
//  `last_profile_update_at` column used by the profile-completion
//  and employment-update reminder commands.
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'last_profile_update_at')) {
                $table->timestamp('last_profile_update_at')->nullable()->after('last_login_ip');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'last_profile_update_at')) {
                $table->dropColumn('last_profile_update_at');
            }
        });
    }
};
