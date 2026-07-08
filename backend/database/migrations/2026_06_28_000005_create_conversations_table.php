<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_06_28_000005_create_conversations_table.php
//  Phase 3.3 — Async Alumni Messaging
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            // Participants are always stored with the smaller user id first so
            // that a pair has exactly one conversation regardless of who starts it.
            $table->foreignId('participant_one_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('participant_two_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            // One conversation per pair (order normalized in the model).
            $table->unique(['participant_one_id', 'participant_two_id']);
            $table->index('participant_one_id');
            $table->index('participant_two_id');
            $table->index('last_message_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
