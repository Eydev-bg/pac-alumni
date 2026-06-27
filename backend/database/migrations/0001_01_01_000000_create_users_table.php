<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('role', UserRole::values());
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->string('suffix', 20)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('profile_picture', 500)->nullable();
            $table->enum('status', UserStatus::values())->default(UserStatus::ACTIVE->value);
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->string('last_login_ip', 45)->nullable(); // IPv6 ready
            $table->rememberToken();
            $table->timestamps();

            // ─── Indexes for frequent queries ────────────────
            $table->index('role');
            $table->index('status');
            $table->index(['role', 'status']); // Filter users by role + status
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
