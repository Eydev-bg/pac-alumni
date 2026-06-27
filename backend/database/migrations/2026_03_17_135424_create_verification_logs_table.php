<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/0001_01_01_000008_create_verification_logs_table.php
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verification_logs', function (Blueprint $table) {
            $table->id();
            $table->string('alumni_id_input', 50);
            $table->string('name_input', 300);
            $table->string('email_input', 255);
            $table->string('ip_address', 45);
            $table->string('status', 20);
            $table->foreignId('matched_graduate_id')->nullable()->constrained('graduates')->nullOnDelete();
            $table->string('rejection_reason', 500)->nullable();
            $table->timestamp('created_at');

            $table->index(['status', 'created_at']);
            $table->index('email_input');
            $table->index('ip_address');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verification_logs');
    }
};
