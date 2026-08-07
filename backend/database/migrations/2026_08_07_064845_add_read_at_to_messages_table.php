<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_08_07_000001_add_read_at_to_messages_table.php
//  Chat read receipts — "Read • 2:14 PM" label under a sent bubble needs
//  an actual timestamp, not just the existing `is_read` boolean.
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->timestamp('read_at')->nullable()->after('is_read');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn('read_at');
        });
    }
};
