<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/2026_03_17_151911_create_employers_table.php
//  Phase 1.1 — HR / Employer Account Module
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('company_name', 300);
            $table->string('company_email', 255);
            $table->text('company_address');
            $table->string('company_contact_number', 50);
            $table->string('company_website', 300)->nullable();
            $table->string('company_logo', 500)->nullable();
            $table->string('business_permit_document', 500);
            $table->string('hr_full_name', 200);
            $table->string('hr_position', 200);
            $table->boolean('is_verified')->default(true);
            $table->string('status', 20)->default('active');
            $table->text('admin_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('is_verified');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employers');
    }
};
