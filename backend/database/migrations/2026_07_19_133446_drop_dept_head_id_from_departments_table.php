<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            // Drop the FK constraint first, then the column itself.
            $table->dropForeign(['dept_head_id']);
            $table->dropColumn('dept_head_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * NOTE: This restores the column and FK definition only. The original
     * dept_head_id values are NOT recoverable — the Department Head role has
     * been retired and the data is lost on the up() migration.
     */
    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->foreignId('dept_head_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
        });
    }
};
