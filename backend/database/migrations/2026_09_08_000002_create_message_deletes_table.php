<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_09_08_000002_create_message_deletes_table.php
//  "Remove for you" — one row per (message, user) that has hidden the
//  message from their own view. The message itself is untouched, so the
//  other participant still sees it.
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_deletes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained('messages')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            // One hide per person per message; also the index the thread's
            // "not removed for me" NOT EXISTS filter probes on (message_id, user_id).
            $table->unique(['message_id', 'user_id']);
            // Reverse direction, for "everything this user has hidden".
            $table->index(['user_id', 'message_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_deletes');
    }
};
