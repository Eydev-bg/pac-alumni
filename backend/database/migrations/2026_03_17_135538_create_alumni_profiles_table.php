<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/0001_01_01_000010_create_alumni_profiles_table.php
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alumni_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->foreignId('graduate_id')->unique()->constrained('graduates')->cascadeOnDelete();
            $table->string('current_location', 300)->nullable();
            $table->string('employment_status', 20)->default('unknown');
            $table->string('board_status', 20)->default('not_applicable');
            $table->timestamps();

            $table->index('employment_status');
            $table->index('board_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alumni_profiles');
    }
};
