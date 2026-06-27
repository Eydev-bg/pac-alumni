<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Http/Controllers/Api/Admin/GraduateTracerController.php
//  Graduate Tracer Analytics — per course/batch analytics
//  with employment monitoring and export capabilities.
// ═══════════════════════════════════════════════════════════

namespace App\Http\Controllers\Api\Admin;

use App\Exports\GraduateTracerExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TracerExportRequest;
use App\Http\Requests\Admin\TracerSummaryRequest;
use App\Services\Admin\GraduateTracerService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class GraduateTracerController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected GraduateTracerService $tracerService,
    ) {}

    /**
     * GET /api/admin/tracer/summary?course_id=X&batch_year=Y
     *
     * The panelists' primary view:
     *   BSIT Batch 2026 → 50 graduates, 30 registered, 20 employed
     */
    public function summary(TracerSummaryRequest $request): JsonResponse
    {
        $data = $this->tracerService->getTracerSummary(
            $request->validated('course_id'),
            $request->validated('batch_year'),
        );

        return $this->success($data, 'Graduate tracer summary retrieved.');
    }

    /**
     * GET /api/admin/tracer/by-course?department_id=X&year_from=Y&year_to=Z
     *
     * Comparison table: tracer summaries across all courses.
     */
    public function byCourse(Request $request): JsonResponse
    {
        $request->validate([
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'course_id'     => ['nullable', 'integer', 'exists:courses,id'],
            'year_from'     => ['nullable', 'integer', 'digits:4'],
            'year_to'       => ['nullable', 'integer', 'digits:4'],
        ]);

        $data = $this->tracerService->getTracerByCourse(
            $request->integer('department_id') ?: null,
            $request->integer('course_id') ?: null,
            $request->integer('year_from') ?: null,
            $request->integer('year_to') ?: null,
        );

        return $this->success($data, 'Graduate tracer by course retrieved.');
    }

    /**
     * GET /api/admin/tracer/employment-trend?course_id=X&months=12
     *
     * Monthly employment status transitions for the trend chart.
     */
    public function employmentTrend(Request $request): JsonResponse
    {
        $request->validate([
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'months'    => ['nullable', 'integer', 'min:1', 'max:36'],
        ]);

        $data = $this->tracerService->getEmploymentTrend(
            $request->integer('course_id') ?: null,
            $request->integer('months') ?: 12,
        );

        return $this->success($data, 'Employment trend data retrieved.');
    }

    /**
     * GET /api/admin/tracer/export?format=xlsx&course_id=X&batch_year=Y
     *
     * Download filtered graduate tracer data as Excel, CSV, or PDF.
     */
    public function export(TracerExportRequest $request)
    {
        $format = $request->validated('format');
        $courseId = $request->integer('course_id') ?: null;
        $batchYear = $request->integer('batch_year') ?: null;
        $employmentStatus = $request->string('employment_status')->toString() ?: null;
        $departmentId = $request->integer('department_id') ?: null;

        $export = new GraduateTracerExport(
            $courseId,
            $batchYear,
            $employmentStatus,
            $departmentId,
        );

        // Build filename
        $parts = ['graduate-tracer'];
        if ($courseId) {
            $course = \App\Models\Course::find($courseId);
            $parts[] = $course ? strtolower($course->code) : "course-{$courseId}";
        }
        if ($batchYear) {
            $parts[] = "batch-{$batchYear}";
        }
        if ($employmentStatus) {
            $parts[] = $employmentStatus;
        }
        $parts[] = now()->format('Y-m-d');
        $filename = implode('-', $parts);

        $writerType = match ($format) {
            'xlsx' => \Maatwebsite\Excel\Excel::XLSX,
            'csv'  => \Maatwebsite\Excel\Excel::CSV,
            'pdf'  => \Maatwebsite\Excel\Excel::DOMPDF,
        };

        return Excel::download($export, "{$filename}.{$format}", $writerType);
    }
}
