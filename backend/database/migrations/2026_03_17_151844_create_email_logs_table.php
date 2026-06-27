<?php
// FILE: backend/database/migrations/0001_01_01_000015_create_email_logs_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('to_email', 255);
            $table->string('type', 100);
            $table->string('subject', 300);
            $table->string('status', 20)->default('queued');
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            $table->index(['type', 'status']);
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('email_logs');
    }
};
