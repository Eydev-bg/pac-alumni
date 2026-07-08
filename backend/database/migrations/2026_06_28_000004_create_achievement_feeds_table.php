<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_06_28_000004_create_achievement_feeds_table.php
//  Phase 3.1 — Alumni Achievement Feed
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('achievement_feeds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alumni_profile_id')
                ->constrained('alumni_profiles')
                ->cascadeOnDelete();
            // employment_update, board_exam_passed, profile_completed, new_registration
            $table->string('type', 30);
            $table->string('title');
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(true); // alumni can opt out
            $table->timestamps();

            $table->index('alumni_profile_id');
            $table->index(['is_public', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('achievement_feeds');
    }
};
