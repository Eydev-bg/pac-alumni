<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Admin audit trail for privileged / destructive actions.
 *
 * Records WHO did WHAT to WHICH target, plus the request context (IP + agent)
 * and an optional metadata JSON payload (e.g. before/after diffs). This is the
 * substrate other phases build on when emitting audit events.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            // ─── Actor (who performed the action) ────────────
            // Kept nullable + nullOnDelete so the trail survives if the actor
            // account is later removed. The UUID is denormalised so the actor
            // stays identifiable even after the users row is gone.
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->uuid('actor_uuid')->nullable();

            // ─── Action + target ─────────────────────────────
            $table->string('action', 100);
            $table->string('target_type')->nullable(); // model class or logical type
            $table->string('target_id')->nullable();   // string to support int/uuid keys

            // ─── Context ─────────────────────────────────────
            $table->json('metadata')->nullable(); // before/after or extra details
            $table->string('ip_address', 45)->nullable(); // IPv6 ready
            $table->string('user_agent', 500)->nullable();

            $table->timestamp('created_at');

            // ─── Indexes ─────────────────────────────────────
            $table->index(['user_id', 'created_at']);
            $table->index(['action', 'created_at']);
            $table->index(['target_type', 'target_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
