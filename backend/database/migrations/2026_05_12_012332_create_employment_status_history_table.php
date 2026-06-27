<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employment_status_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('graduate_id')->constrained('graduates')->cascadeOnDelete();
            $table->string('old_status', 20)->nullable();   // NULL = first entry (initial registration)
            $table->string('new_status', 20);               // employed | unemployed | unknown
            $table->timestamp('changed_at');
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();

            // ─── Indexes for analytics queries ───────────
            $table->index(['graduate_id', 'changed_at']);    // Monthly trend aggregation
            $table->index(['new_status', 'changed_at']);     // Count transitions per month
            $table->index('changed_at');                     // Date-range filtering
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employment_status_history');
    }
};
