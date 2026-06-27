<?php

use App\Enums\DepartmentStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200)->unique();
            $table->string('code', 20)->unique();
            $table->boolean('is_board_program')->default(false);
            $table->string('board_exam_name', 200)->nullable();
            $table->foreignId('dept_head_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete(); // If dept head user is deleted, set to null
            $table->string('status', 20)->default('active');
            $table->timestamps();

            // ─── Indexes ─────────────────────────────────────
            $table->index('status');
            $table->index('is_board_program');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
