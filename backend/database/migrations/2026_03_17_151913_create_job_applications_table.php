<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_03_17_151913_create_job_applications_table.php
//  Phase 1.1 — HR / Employer Account Module
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_post_id')->constrained('job_posts')->cascadeOnDelete();
            $table->foreignId('alumni_profile_id')->constrained('alumni_profiles')->cascadeOnDelete();
            $table->string('status', 20)->default('pending'); // pending, reviewed, accepted, rejected
            $table->text('employer_notes')->nullable();
            $table->timestamp('applied_at');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            // One application per alumni per job
            $table->unique(['job_post_id', 'alumni_profile_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_applications');
    }
};
