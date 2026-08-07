<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_08_07_000002_add_last_active_at_to_users_table.php
//  Simple "online status" — no presence channel. Updated on authenticated
//  requests (throttled) and read to show "🟢 Available" / "Active X ago"
//  in the chat header.
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('last_active_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('last_active_at');
        });
    }
};
