<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_06_28_000001_restructure_job_posts_table.php
//  Converts the legacy (user-posted) job_posts table to the
//  employer-centric Phase 1 schema. The original create_job_posts_table
//  migration was already applied with the legacy shape, so this ALTER
//  brings an existing database in line with the rewritten schema.
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The legacy user-posted job board is retired (Task 1.1). Its rows have
        // no owning employer and cannot map to the new schema, so clear them
        // before adding the NOT NULL employer_id column.
        DB::table('job_posts')->delete();

        // Drop legacy foreign keys before their columns.
        Schema::table('job_posts', function (Blueprint $table) {
            $table->dropForeign(['posted_by']);
            $table->dropForeign(['department_id']);
        });

        // Drop legacy columns (single-column indexes on these are removed
        // automatically by MySQL when the columns are dropped).
        Schema::table('job_posts', function (Blueprint $table) {
            $table->dropColumn([
                'posted_by',
                'job_title',
                'industry',
                'location_type',
                'location_detail',
                'how_to_apply',
                'department_id',
            ]);
        });

        // Add the employer-centric columns.
        Schema::table('job_posts', function (Blueprint $table) {
            $table->foreignId('employer_id')->after('id')->constrained('employers')->cascadeOnDelete();
            $table->string('title', 200)->after('employer_id');
            $table->string('location', 300)->after('company_name');
            $table->decimal('salary_range_min', 12, 2)->nullable()->after('job_type');
            $table->decimal('salary_range_max', 12, 2)->nullable()->after('salary_range_min');
            $table->text('qualifications')->nullable()->after('description');
            $table->boolean('is_open')->default(true)->after('qualifications');
            $table->text('admin_notes')->nullable()->after('status');
            $table->dateTime('expires_at')->nullable()->after('admin_notes');
            $table->softDeletes();

            $table->index('is_open');
            // constrained() already indexes employer_id; ['status','job_type']
            // index carries over from the legacy schema.
        });
    }

    public function down(): void
    {
        DB::table('job_posts')->delete();

        Schema::table('job_posts', function (Blueprint $table) {
            $table->dropForeign(['employer_id']);
            $table->dropIndex(['is_open']);
            $table->dropSoftDeletes();
            $table->dropColumn([
                'employer_id',
                'title',
                'location',
                'salary_range_min',
                'salary_range_max',
                'qualifications',
                'is_open',
                'admin_notes',
                'expires_at',
            ]);
        });

        // Restore legacy columns (nullable to avoid issues on an empty table).
        Schema::table('job_posts', function (Blueprint $table) {
            $table->foreignId('posted_by')->nullable()->after('id')->constrained('users');
            $table->string('job_title', 200)->nullable()->after('posted_by');
            $table->string('industry', 200)->nullable()->after('company_name');
            $table->string('location_type', 20)->nullable()->after('industry');
            $table->string('location_detail', 300)->nullable()->after('location_type');
            $table->text('how_to_apply')->nullable()->after('description');
            $table->foreignId('department_id')->nullable()->after('how_to_apply')->constrained('departments')->nullOnDelete();
        });
    }
};
