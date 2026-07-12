<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_06_28_000000_add_employer_to_users_role_enum.php
//  Adds the 'employer' value to the users.role enum (Phase 1).
//  Non-destructive ALTER — preserves existing rows.
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // MySQL/MariaDB-only syntax. On sqlite (test suite) the users table is
        // created from the current UserRole enum, so no ALTER is needed.
        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'])) {
            DB::statement("ALTER TABLE `users` MODIFY `role` ENUM('admin', 'alumni', 'employer') NOT NULL");
        }
    }

    public function down(): void
    {
        // Revert to the original two-value enum. Any 'employer' rows must be
        // removed/reassigned first or this will fail / truncate.
        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'])) {
            DB::statement("ALTER TABLE `users` MODIFY `role` ENUM('admin', 'alumni') NOT NULL");
        }
    }
};
