<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/0001_01_01_000011_create_continuation_tracking_table.php
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('continuation_tracking', function (Blueprint $table) {
            $table->id();
            $table->foreignId('graduate_id')->constrained('graduates')->cascadeOnDelete();
            $table->string('from_level', 20);
            $table->string('to_level', 20);
            $table->string('status', 20)->default('unknown');
            $table->foreignId('matched_graduate_id')->nullable()->constrained('graduates')->nullOnDelete();
            $table->boolean('is_auto_detected')->default(false);
            $table->foreignId('overridden_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('overridden_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('graduate_id');
            $table->index(['from_level', 'to_level', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('continuation_tracking');
    }
};
