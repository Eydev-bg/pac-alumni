<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 2 (P2-T09) — Additive performance indexes for hot filter columns.
 *
 * Every index is created only when an index covering the exact same column set
 * does not already exist, so the migration is safe to run against schemas that
 * already carry some of these indexes (and safe to re-run). Explicit short
 * names keep composite indexes within MySQL's 64-character identifier limit.
 *
 * Brute-force login lookups (login_activity_logs) are intentionally untouched —
 * they are already backed by (email_attempted, status) and (ip_address, created_at).
 */
return new class extends Migration
{
    /**
     * Index definitions: table => [ [columns...] => index name ].
     */
    private function definitions(): array
    {
        return [
            'graduates' => [
                'graduates_last_name_index' => ['last_name'],
                'graduates_level_year_dept_course_index' => ['education_level', 'graduation_year', 'department_id', 'course_id'],
            ],
            'users' => [
                'users_role_status_last_login_index' => ['role', 'status', 'last_login_at'],
            ],
            'board_exam_records' => [
                'board_exam_records_graduate_status_index' => ['graduate_id', 'status'],
            ],
            'alumni_profiles' => [
                'alumni_profiles_employment_graduate_index' => ['employment_status', 'graduate_id'],
            ],
        ];
    }

    public function up(): void
    {
        foreach ($this->definitions() as $table => $indexes) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            foreach ($indexes as $name => $columns) {
                if ($this->indexExists($table, $columns) || $this->indexNameExists($table, $name)) {
                    continue;
                }

                Schema::table($table, function (Blueprint $t) use ($columns, $name) {
                    $t->index($columns, $name);
                });
            }
        }
    }

    public function down(): void
    {
        foreach ($this->definitions() as $table => $indexes) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            foreach ($indexes as $name => $columns) {
                if (!$this->indexNameExists($table, $name)) {
                    continue;
                }

                Schema::table($table, function (Blueprint $t) use ($name) {
                    $t->dropIndex($name);
                });
            }
        }
    }

    /**
     * True when an index covering exactly these columns (same order) exists.
     */
    private function indexExists(string $table, array $columns): bool
    {
        foreach (Schema::getIndexes($table) as $index) {
            if ($index['columns'] === $columns) {
                return true;
            }
        }

        return false;
    }

    private function indexNameExists(string $table, string $name): bool
    {
        foreach (Schema::getIndexes($table) as $index) {
            if ($index['name'] === $name) {
                return true;
            }
        }

        return false;
    }
};
