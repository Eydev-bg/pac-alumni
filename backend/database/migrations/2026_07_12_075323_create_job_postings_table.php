<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_07_12_075323_create_job_postings_table.php
//  Phase 3 — Job Postings Module (admin-managed, no employer accounts)
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_postings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('posted_by')->constrained('users')->cascadeOnDelete(); // admin who created it
            $table->string('company_name', 200);
            $table->string('company_logo', 500)->nullable(); // optional logo image path
            $table->string('job_position', 200);
            $table->string('location', 200);
            $table->string('employment_type', 20); // full_time, part_time, contract, internship, remote
            $table->string('salary', 100)->nullable(); // free-text range e.g. "₱35,000–45,000"
            $table->text('benefits')->nullable();
            $table->text('description');
            $table->text('requirements')->nullable();
            $table->string('application_link', 500); // Apply button redirects here (external)
            $table->string('company_email', 200)->nullable();
            $table->date('application_deadline')->nullable();
            $table->string('status', 20)->default('draft'); // draft, active, expired
            $table->boolean('is_pinned')->default(false);
            $table->timestamp('published_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('application_deadline');
            $table->index(['status', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_postings');
    }
};
