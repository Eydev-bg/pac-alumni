<?php

use App\Enums\LoginAttemptStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('login_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('email_attempted');
            $table->string('ip_address', 45); // IPv6 ready
            $table->string('user_agent', 500)->nullable();
            $table->enum('status', LoginAttemptStatus::values());
            $table->timestamp('created_at');

            // ─── Indexes ─────────────────────────────────────
            $table->index(['user_id', 'created_at']);
            $table->index(['email_attempted', 'status']); // Detect brute force
            $table->index(['ip_address', 'created_at']);   // IP-based rate limiting
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('login_activity_logs');
    }
};
