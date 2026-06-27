<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/0001_01_01_000013_create_employment_records_table.php
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employment_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('graduate_id')->constrained('graduates')->cascadeOnDelete();
            $table->string('company_name', 300);
            $table->string('job_title', 200);
            $table->string('industry', 200);
            $table->string('employment_type', 20);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('is_current')->default(true);
            $table->timestamps();

            $table->index('graduate_id');
            $table->index(['is_current', 'employment_type']);
            $table->index('industry');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employment_records');
    }
};
