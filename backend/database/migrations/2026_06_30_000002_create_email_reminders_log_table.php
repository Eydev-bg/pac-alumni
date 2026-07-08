<?php
// ═══════════════════════════════════════════════════════════
//  Phase 4.1 — Automated Reminder System.
//  Records every automated re-engagement email sent so the
//  scheduled commands can avoid re-sending within a window and
//  the admin dashboard can report reminder volume by type.
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_reminders_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            // login_reminder | employment_update | profile_completion | announcement
            $table->string('type', 40);
            $table->timestamp('sent_at');
            $table->timestamps();

            // Frequently queried: "has user X been sent type Y recently?"
            $table->index(['user_id', 'type', 'sent_at']);
            $table->index(['type', 'sent_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_reminders_log');
    }
};
