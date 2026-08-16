<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_08_16_000002_add_attachment_to_messages_table.php
//  Message attachments — one optional image or PDF per message.
//  Raw storage path is persisted; URL is resolved at read time.
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('attachment_path')->nullable()->after('reply_to_id');
            $table->string('attachment_type')->nullable()->after('attachment_path'); // 'image' | 'pdf'
            $table->string('attachment_name')->nullable()->after('attachment_type');  // original filename for display
            $table->unsignedInteger('attachment_size')->nullable()->after('attachment_name'); // bytes

            // An attachment-only message carries no text, so `content` can no
            // longer be NOT NULL. Validation still guarantees at least one of
            // the two is present (see SendMessageRequest).
            $table->text('content')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Restoring the NOT NULL constraint requires the attachment-only rows
        // to have some text; blank them out rather than fail the rollback.
        DB::table('messages')->whereNull('content')->update(['content' => '']);

        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['attachment_path', 'attachment_type', 'attachment_name', 'attachment_size']);
            $table->text('content')->nullable(false)->change();
        });
    }
};
