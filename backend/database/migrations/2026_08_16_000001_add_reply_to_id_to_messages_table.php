<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_08_16_000001_add_reply_to_id_to_messages_table.php
//  Message reply/quote feature — a message may reference a parent
//  message it is replying to (nullable, self-referencing FK).
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Self-referencing FK. nullOnDelete so deleting a parent message
            // doesn't cascade-delete the replies — the reply survives, its
            // quote simply resolves to null (frontend shows "message unavailable").
            $table->foreignId('reply_to_id')
                ->nullable()
                ->after('content')
                ->constrained('messages')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reply_to_id');
        });
    }
};
