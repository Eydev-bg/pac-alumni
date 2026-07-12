<?php
// ═══════════════════════════════════════════════════════════
//  Bulk email-on-publish — idempotency log.
//  Records that a specific event / announcement / job posting
//  was already emailed to a specific user, so the publish-time
//  bulk send can be safely retried without duplicate emails.
//  Deliberately separate from email_reminders_log: reminders are
//  deduped by (user, type) within a time window, whereas this
//  table dedupes by (user, type, content id) with no window —
//  a brand-new announcement must always send.
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_email_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            // event | announcement | job_posting
            $table->string('content_type', 30);
            $table->unsignedBigInteger('content_id');
            $table->timestamp('sent_at');
            $table->timestamps();

            // Idempotency guard: one email per (user, content item).
            $table->unique(['user_id', 'content_type', 'content_id']);
            // "How many emails were sent for this item?"
            $table->index(['content_type', 'content_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_email_logs');
    }
};
