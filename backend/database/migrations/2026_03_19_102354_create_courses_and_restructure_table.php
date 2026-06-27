<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/database/migrations/0001_01_01_000018_create_courses_and_restructure.php
//  HYBRID RESTRUCTURE: Department → Course hierarchy
//
//  departments = parent grouping (e.g., Computer Department)
//  courses = actual programs (e.g., BSIT, BSCS under Computer Department)
//
//  graduates.course_id replaces graduates.department_id
//  Board/non-board is now per COURSE, not per department
// ═══════════════════════════════════════════════════════════

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ─── Step 1: Create courses table ────────────────
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200);             // e.g., "Bachelor of Science in Information Technology"
            $table->string('code', 20)->unique();     // e.g., "BSIT"
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->boolean('is_board_program')->default(false);
            $table->string('board_exam_name', 200)->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamps();

            $table->index('department_id');
            $table->index('status');
        });

        // ─── Step 2: Add course_id to graduates ─────────
        Schema::table('graduates', function (Blueprint $table) {
            $table->foreignId('course_id')->nullable()->after('department_id')
                ->constrained('courses')->nullOnDelete();
            $table->index('course_id');
        });

        // ─── Step 3: Migrate existing data ──────────────
        // For each existing department that has graduates,
        // create a course with the same name/code and link graduates
        $departments = DB::table('departments')->get();

        foreach ($departments as $dept) {
            // Create a course for each existing department
            $courseId = DB::table('courses')->insertGetId([
                'name' => $dept->name,
                'code' => $dept->code,
                'department_id' => $dept->id,
                'is_board_program' => $dept->is_board_program,
                'board_exam_name' => $dept->board_exam_name,
                'status' => $dept->status,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Link all graduates from this department to the new course
            DB::table('graduates')
                ->where('department_id', $dept->id)
                ->update(['course_id' => $courseId]);
        }
    }

    public function down(): void
    {
        Schema::table('graduates', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropColumn('course_id');
        });

        Schema::dropIfExists('courses');
    }
};
