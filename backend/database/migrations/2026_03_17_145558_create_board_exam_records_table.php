<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/0001_01_01_000012_create_board_exam_records_table.php
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('board_exam_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('graduate_id')->constrained('graduates')->cascadeOnDelete();
            $table->string('exam_name', 200);
            $table->year('exam_year');
            $table->string('status', 20);
            $table->string('proof_file', 500)->nullable();
            $table->boolean('updated_by_alumni')->default(false);
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index('graduate_id');
            $table->index(['exam_name', 'exam_year']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('board_exam_records');
    }
};
