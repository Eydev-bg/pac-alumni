<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_08_13_000002_add_source_and_posted_by_alumni_to_job_postings_table.php
//  Alumni can now post jobs to the Career Center themselves. `source`
//  distinguishes those from admin-posted jobs; `posted_by_alumni` records
//  the owning alumni so they can edit/delete only their own posts.
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            // 'admin' | 'alumni' — existing rows keep the admin default.
            $table->string('source', 10)->default('admin')->after('posted_by');

            $table->foreignId('posted_by_alumni')
                ->nullable()
                ->after('source')
                ->constrained('users')
                ->nullOnDelete();

            // Career Center list filters on source; "My Posts" filters on owner.
            $table->index('source');
        });
    }

    public function down(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            $table->dropForeign(['posted_by_alumni']);
            $table->dropIndex(['source']);
            $table->dropColumn(['source', 'posted_by_alumni']);
        });
    }
};
