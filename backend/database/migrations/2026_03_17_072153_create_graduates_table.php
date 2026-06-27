<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('graduates', function (Blueprint $table) {
            $table->id();
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->string('suffix', 20)->nullable();
            $table->string('education_level', 20);
            $table->year('graduation_year');
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->string('alumni_id_number', 30)->unique()->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['education_level', 'graduation_year']);
            $table->index('department_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('graduates');
    }
};
