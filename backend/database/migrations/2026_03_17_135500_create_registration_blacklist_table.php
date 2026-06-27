<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/0001_01_01_000009_create_registration_blacklist_table.php
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registration_blacklist', function (Blueprint $table) {
            $table->id();
            $table->string('identifier', 255);
            $table->string('identifier_type', 20);
            $table->string('reason', 500)->nullable();
            $table->foreignId('blacklisted_by')->constrained('users');
            $table->timestamp('created_at');

            $table->index(['identifier', 'identifier_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registration_blacklist');
    }
};
