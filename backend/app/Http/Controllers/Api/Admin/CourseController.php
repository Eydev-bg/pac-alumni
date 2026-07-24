<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Http/Controllers/Api/Admin/CourseController.php
//  CRUD for courses under departments
// ═══════════════════════════════════════════════════════════

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Department;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/admin/courses
     */
    public function index(Request $request): JsonResponse
    {
        $courses = Course::with('department:id,name,code')
            ->withCount('graduates')
            ->when($request->department_id, fn($q) => $q->where('department_id', $request->department_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->search($request->search)
            ->orderBy('code')
            ->paginate(min($request->integer('per_page', 30), 100));

        $data = $courses->through(fn($c) => [
            'id' => $c->id,
            'name' => $c->name,
            'code' => $c->code,
            'department' => $c->department ? [
                'id' => $c->department->id,
                'name' => $c->department->name,
                'code' => $c->department->code,
            ] : null,
            'is_board_program' => $c->is_board_program,
            'board_exam_name' => $c->board_exam_name,
            'status' => $c->status,
            'graduates_count' => $c->graduates_count,
            'created_at' => $c->created_at?->toISOString(),
        ]);

        return $this->paginated($data, 'Courses retrieved.');
    }

    /**
     * GET /api/admin/courses/all
     * All active courses (for dropdowns)
     */
    public function all(Request $request): JsonResponse
    {
        $courses = Course::with('department:id,name,code')
            ->active()
            ->when($request->department_id, fn($q) => $q->where('department_id', $request->department_id))
            ->orderBy('code')
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'code' => $c->code,
                'department_id' => $c->department_id,
                'department_name' => $c->department?->name,
                'department_code' => $c->department?->code,
                'is_board_program' => $c->is_board_program,
                'board_exam_name' => $c->board_exam_name,
            ]);

        return $this->success($courses, 'Active courses retrieved.');
    }

    /**
     * POST /api/admin/courses
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:200',
            'code' => 'required|string|max:20|unique:courses,code',
            'department_id' => 'required|exists:departments,id',
            'is_board_program' => 'boolean',
            'board_exam_name' => 'nullable|required_if:is_board_program,true|string|max:200',
        ]);

        $course = Course::create($request->only(['name', 'code', 'department_id', 'is_board_program', 'board_exam_name']));

        return $this->created([
            'id' => $course->id,
            'name' => $course->name,
            'code' => $course->code,
            'department_id' => $course->department_id,
            'is_board_program' => $course->is_board_program,
        ], 'Course created.');
    }

    /**
     * PUT /api/admin/courses/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $course = Course::find($id);
        if (!$course) return $this->notFound('Course not found.');

        $request->validate([
            'name' => 'required|string|max:200',
            'code' => 'required|string|max:20|unique:courses,code,' . $id,
            'department_id' => 'required|exists:departments,id',
            'is_board_program' => 'boolean',
            'board_exam_name' => 'nullable|string|max:200',
        ]);

        $course->update($request->only(['name', 'code', 'department_id', 'is_board_program', 'board_exam_name']));

        return $this->success($course->fresh(), 'Course updated.');
    }

    /**
     * DELETE /api/admin/courses/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $course = Course::withCount('graduates')->find($id);
        if (!$course) return $this->notFound('Course not found.');

        if ($course->graduates_count > 0) {
            return $this->error('Cannot delete course with graduates. Deactivate instead.', 422);
        }

        $course->delete();
        return $this->success(null, 'Course deleted.');
    }

    /**
     * PATCH /api/admin/courses/{id}/status
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate(['status' => 'required|in:active,inactive']);
        $course = Course::find($id);
        if (!$course) return $this->notFound('Course not found.');

        $course->update(['status' => $request->status]);
        return $this->success($course, 'Course status updated.');
    }
}
