<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_09_08_000001_add_unsent_at_to_messages_table.php
//  "Unsend for everyone" — the row is kept (so replies quoting it and
//  cursor pagination stay intact) but its content and attachment are
//  stripped at the API boundary once this is set. See MessageResource.
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->timestamp('unsent_at')->nullable()->after('read_at');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn('unsent_at');
        });
    }
};
