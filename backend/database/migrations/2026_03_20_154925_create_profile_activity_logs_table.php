<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('graduate_id')->constrained('graduates')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 50);          // e.g., 'updated_employment', 'updated_profile', 'updated_board_exam'
            $table->string('description', 500);     // e.g., 'Updated employment status to Employed'
            $table->json('changes')->nullable();     // Optional: { field: { old: x, new: y } }
            $table->timestamp('created_at');

            $table->index(['graduate_id', 'created_at']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_activity_logs');
    }
};
