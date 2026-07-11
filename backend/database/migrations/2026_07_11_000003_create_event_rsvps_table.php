<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_07_11_000003_create_event_rsvps_table.php
//  Phase 2.2 — Event Module
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_rsvps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('status', 20); // going, interested
            $table->timestamps();

            // One RSVP record per user per event
            $table->unique(['event_id', 'user_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_rsvps');
    }
};
