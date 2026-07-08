<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_03_17_151912_create_job_posts_table.php
//  Phase 1.1 — HR / Employer Account Module
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employer_id')->constrained('employers')->cascadeOnDelete();
            $table->string('title', 200);
            $table->text('description');
            $table->string('company_name', 300); // denormalized from employer for display
            $table->string('location', 300);
            $table->string('job_type', 20); // full_time, part_time, contract, freelance, internship
            $table->decimal('salary_range_min', 12, 2)->nullable();
            $table->decimal('salary_range_max', 12, 2)->nullable();
            $table->text('qualifications')->nullable();
            $table->boolean('is_open')->default(true);
            $table->string('status', 20)->default('approved'); // pending, approved, rejected
            $table->text('admin_notes')->nullable();
            $table->dateTime('expires_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('employer_id');
            $table->index(['status', 'job_type']);
            $table->index('is_open');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_posts');
    }
};
