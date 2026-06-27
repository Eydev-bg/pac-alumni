<?php
// FILE: backend/database/migrations/0001_01_01_000016_create_job_posts_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('posted_by')->constrained('users');
            $table->string('job_title', 200);
            $table->string('company_name', 300);
            $table->string('job_type', 20);
            $table->string('industry', 200);
            $table->string('location_type', 20);
            $table->string('location_detail', 300)->nullable();
            $table->text('description');
            $table->text('how_to_apply');
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->string('status', 20)->default('active');
            $table->timestamps();
            $table->index(['status', 'job_type']);
            $table->index('industry');
            $table->index('department_id');
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('job_posts');
    }
};
