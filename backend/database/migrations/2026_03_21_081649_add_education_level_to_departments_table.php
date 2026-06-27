<?php
// ═══════════════════════════════════════════════════════════
//  Adds education_level to departments table
//  Default 'college' for existing departments
//  Prepares for Elementary/JHS/SHS departments
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->string('education_level', 20)->default('college')->after('code');
            $table->index('education_level');
        });

        // Set all existing departments to 'college'
        DB::table('departments')->whereNull('education_level')
            ->orWhere('education_level', '')
            ->update(['education_level' => 'college']);
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->dropIndex(['education_level']);
            $table->dropColumn('education_level');
        });
    }
};
