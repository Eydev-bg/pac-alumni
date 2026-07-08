<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Http/Controllers/Api/Admin/ReportController.php
//  Consolidated report exports (xlsx/csv/pdf) for the Analytics
//  Dashboard header. See app/Exports/*Export.php for the queries.
// ═══════════════════════════════════════════════════════════

namespace App\Http\Controllers\Api\Admin;

use App\Exports\AlumniIdListExport;
use App\Exports\BoardPassingExport;
use App\Exports\EmploymentExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReportExportRequest;
use App\Models\Course;
use App\Models\Department;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    /**
     * GET /api/admin/reports/board-passing/export
     * Download the board passing report as Excel, CSV, or PDF.
     */
    public function exportBoardPassing(ReportExportRequest $request)
    {
        [$departmentId, $courseId, $batchYear] = $this->exportFilters($request);

        $export = new BoardPassingExport($departmentId, $courseId, $batchYear);
        $filename = $this->buildFilename('board-passing', $departmentId, $courseId, $batchYear);

        return $this->downloadExport($export, $filename, $request->validated('format'));
    }

    /**
     * GET /api/admin/reports/employment/export
     * Download the employment report as Excel, CSV, or PDF.
     */
    public function exportEmployment(ReportExportRequest $request)
    {
        [$departmentId, $courseId, $batchYear] = $this->exportFilters($request);

        $export = new EmploymentExport($departmentId, $courseId, $batchYear);
        $filename = $this->buildFilename('employment', $departmentId, $courseId, $batchYear);

        return $this->downloadExport($export, $filename, $request->validated('format'));
    }

    /**
     * GET /api/admin/reports/alumni-id-list/export
     * Download the alumni ID list as Excel, CSV, or PDF.
     */
    public function exportAlumniIdList(ReportExportRequest $request)
    {
        [$departmentId, $courseId, $batchYear] = $this->exportFilters($request);

        $export = new AlumniIdListExport($departmentId, $courseId, $batchYear);
        $filename = $this->buildFilename('alumni-id-list', $departmentId, $courseId, $batchYear);

        return $this->downloadExport($export, $filename, $request->validated('format'));
    }

    /**
     * Normalize the nullable export filters from the request.
     *
     * @return array{0: ?int, 1: ?int, 2: ?int} [departmentId, courseId, batchYear]
     */
    private function exportFilters(ReportExportRequest $request): array
    {
        return [
            $request->integer('department_id') ?: null,
            $request->integer('course_id') ?: null,
            $request->integer('batch_year') ?: null,
        ];
    }

    /**
     * Build a descriptive filename from the active filters.
     * Pattern: {prefix}-{dept-code?}-{course-code?}-batch-{year?}-{Y-m-d}
     */
    private function buildFilename(string $prefix, ?int $departmentId, ?int $courseId, ?int $batchYear): string
    {
        $parts = [$prefix];

        if ($departmentId) {
            $dept = Department::find($departmentId);
            $parts[] = $dept ? strtolower($dept->code) : "dept-{$departmentId}";
        }
        if ($courseId) {
            $course = Course::find($courseId);
            $parts[] = $course ? strtolower($course->code) : "course-{$courseId}";
        }
        if ($batchYear) {
            $parts[] = "batch-{$batchYear}";
        }
        $parts[] = now()->format('Y-m-d');

        return implode('-', $parts);
    }

    /**
     * Stream the given export to the browser in the requested format.
     */
    private function downloadExport($export, string $filename, string $format)
    {
        $writerType = match ($format) {
            'xlsx' => \Maatwebsite\Excel\Excel::XLSX,
            'csv'  => \Maatwebsite\Excel\Excel::CSV,
            'pdf'  => \Maatwebsite\Excel\Excel::DOMPDF,
        };

        return Excel::download($export, "{$filename}.{$format}", $writerType);
    }
}
