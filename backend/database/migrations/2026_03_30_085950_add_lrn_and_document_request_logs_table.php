<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_03_30_000001_add_lrn_and_document_request_logs.php
//  Adds LRN column to graduates table
//  Creates document_request_logs table for tracking document requests
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add LRN (Learner Reference Number) to graduates
        Schema::table('graduates', function (Blueprint $table) {
            $table->string('lrn', 30)->nullable()->after('student_id');
            $table->index('lrn');
        });

        // Document request logs — tracks when Principal processes LRN/Good Moral requests
        Schema::create('document_request_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('graduate_id')->constrained('graduates')->cascadeOnDelete();
            $table->foreignId('processed_by')->constrained('users')->cascadeOnDelete();
            $table->string('document_type', 30); // 'lrn' or 'good_moral'
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['graduate_id', 'document_type']);
            $table->index('processed_by');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_request_logs');

        Schema::table('graduates', function (Blueprint $table) {
            $table->dropIndex(['lrn']);
            $table->dropColumn('lrn');
        });
    }
};
