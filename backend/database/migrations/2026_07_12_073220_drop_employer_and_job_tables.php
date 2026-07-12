<?php

//  FILE: backend/database/migrations/2026_07_12_073220_drop_employer_and_job_tables.php
//  Removes the retired Employer role and legacy Job/Job-Application system.
//  The system now has exactly two roles: admin and alumni. A new
//  admin-managed Job Postings module will get its own schema later.

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop in FK-safe order: reports/applications → posts → employers.
        // `job_reports` is an orphaned legacy table (no migration or code
        // references it) that still holds an FK to job_posts.
        // NOTE: the plain `jobs` table is Laravel's queue table — leave it alone.
        Schema::dropIfExists('job_reports');
        Schema::dropIfExists('job_applications');
        Schema::dropIfExists('job_posts');
        Schema::dropIfExists('employers');

        // Remove employer users before shrinking the enum so the ALTER
        // cannot fail on rows still holding the dropped value.
        DB::table('users')->where('role', 'employer')->delete();

        // MySQL/MariaDB-only syntax. On sqlite (test suite) the users table is
        // created from the current UserRole enum, so no ALTER is needed.
        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'])) {
            DB::statement("ALTER TABLE `users` MODIFY `role` ENUM('admin', 'alumni') NOT NULL DEFAULT 'alumni'");
        }
    }

    public function down(): void
    {
        // The dropped tables held test-only data and are not restorable here.
        // Re-allow the enum value only so historical migrations stay replayable.
        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'])) {
            DB::statement("ALTER TABLE `users` MODIFY `role` ENUM('admin', 'alumni', 'employer') NOT NULL");
        }
    }
};
