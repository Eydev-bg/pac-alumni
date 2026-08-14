<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_08_13_000001_make_application_link_nullable_on_job_postings_table.php
//  Some partner companies have no website or careers page. Make the
//  application link optional — validation now requires either an
//  application_link OR a company_email so alumni always have a way to apply.
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            $table->string('application_link', 500)->nullable()->change();
        });
    }

    public function down(): void
    {
        // Rows created without a link cannot be made NOT NULL as-is — blank
        // them first so the column can be reverted.
        DB::table('job_postings')->whereNull('application_link')->update([
            'application_link' => '',
        ]);

        Schema::table('job_postings', function (Blueprint $table) {
            $table->string('application_link', 500)->nullable(false)->change();
        });
    }
};
