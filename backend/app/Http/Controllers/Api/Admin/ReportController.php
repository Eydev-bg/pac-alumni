<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Http/Controllers/Api/Admin/ReportController.php
//  Features 40-46: All report exports
// ═══════════════════════════════════════════════════════════

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AlumniProfile;
use App\Models\BoardExamRecord;
use App\Models\Graduate;
use App\Models\VerificationLog;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/admin/reports/board-passing
     * Feature 41: Board passing report
     */
    public function boardPassing(Request $request): JsonResponse
    {
        $data = BoardExamRecord::with(['graduate:id,alumni_id_number,first_name,last_name,department_id', 'graduate.department:id,name,code'])
            ->when($request->department_id, fn($q) => $q->whereHas('graduate', fn($g) => $g->where('department_id', $request->department_id)))
            ->when($request->year, fn($q) => $q->where('exam_year', $request->year))
            ->orderBy('exam_year', 'desc')
            ->get()
            ->map(fn($r) => [
                'alumni_id' => $r->graduate?->alumni_id_number,
                'name' => $r->graduate?->full_name,
                'department' => $r->graduate?->department?->code,
                'exam_name' => $r->exam_name,
                'exam_year' => $r->exam_year,
                'status' => $r->status?->value,
            ]);

        return $this->success($data, 'Board passing report data.');
    }

    /**
     * GET /api/admin/reports/employment
     * Feature 42: Employment report
     */
    public function employment(Request $request): JsonResponse
    {
        $data = AlumniProfile::with(['graduate:id,alumni_id_number,first_name,last_name,department_id,graduation_year', 'graduate.department:id,name,code'])
            ->when($request->department_id, fn($q) => $q->whereHas('graduate', fn($g) => $g->where('department_id', $request->department_id)))
            ->get()
            ->map(fn($r) => [
                'alumni_id' => $r->graduate?->alumni_id_number,
                'name' => $r->graduate?->full_name,
                'department' => $r->graduate?->department?->code,
                'graduation_year' => $r->graduate?->graduation_year,
                'employment_status' => $r->employment_status?->value,
                'board_status' => $r->board_status?->value,
            ]);

        return $this->success($data, 'Employment report data.');
    }

    /**
     * GET /api/admin/reports/department-summary
     * Feature 43
     */
    public function departmentSummary(): JsonResponse
    {
        $departments = \App\Models\Department::withCount('graduates')->get();

        $data = $departments->map(function ($dept) {
            $boardPassers = BoardExamRecord::whereHas('graduate', fn($q) => $q->where('department_id', $dept->id))
                ->where('status', 'passer')->count();
            $employed = AlumniProfile::whereHas('graduate', fn($q) => $q->where('department_id', $dept->id))
                ->where('employment_status', 'employed')->count();

            return [
                'department' => $dept->name,
                'code' => $dept->code,
                'total_graduates' => $dept->graduates_count,
                'board_passers' => $boardPassers,
                'employed' => $employed,
                'is_board_program' => $dept->is_board_program,
            ];
        });

        return $this->success($data, 'Department summary report.');
    }

    /**
     * GET /api/admin/reports/alumni-master-list
     * Feature 44
     */
    public function alumniMasterList(Request $request): JsonResponse
    {
        $data = Graduate::with('department:id,name,code')
            ->collegeOnly()
            ->when($request->department_id, fn($q) => $q->where('department_id', $request->department_id))
            ->when($request->year, fn($q) => $q->where('graduation_year', $request->year))
            ->orderBy('last_name')
            ->get()
            ->map(fn($g) => [
                'alumni_id' => $g->alumni_id_number,
                'alumni_id' => $g->alumni_id_number,
                'name' => $g->full_name,
                'department' => $g->department?->code,
                'graduation_year' => $g->graduation_year,
                'has_account' => $g->user_id !== null,
            ]);

        return $this->success($data, 'Alumni master list.');
    }

    /**
     * GET /api/admin/reports/verification-logs
     * Feature 45
     */
    public function verificationLogs(): JsonResponse
    {
        $data = VerificationLog::orderBy('created_at', 'desc')
            ->get()
            ->map(fn($l) => [
                'alumni_id' => $l->alumni_id_input,
                'name' => $l->name_input,
                'email' => $l->email_input,
                'year' => $l->graduation_year_input,
                'status' => $l->status?->value,
                'rejection_reason' => $l->rejection_reason,
                'ip' => $l->ip_address,
                'date' => $l->created_at?->toISOString(),
            ]);

        return $this->success($data, 'Verification logs report.');
    }

    /**
     * GET /api/admin/reports/alumni-id-list
     * Feature 46
     */
    public function alumniIdList(): JsonResponse
    {
        $data = Graduate::collegeOnly()
            ->whereNotNull('alumni_id_number')
            ->with('department:id,name,code')
            ->orderBy('alumni_id_number')
            ->get()
            ->map(fn($g) => [
                'alumni_id' => $g->alumni_id_number,
                'name' => $g->full_name,
                'department' => $g->department?->code,
                'graduation_year' => $g->graduation_year,
            ]);

        return $this->success($data, 'Alumni ID list.');
    }
}
