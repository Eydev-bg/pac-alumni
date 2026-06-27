<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Http/Controllers/Api/Admin/AlumniSearchController.php
// ═══════════════════════════════════════════════════════════

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\GraduateResource;
use App\Models\AlumniProfile;
use App\Models\BoardExamRecord;
use App\Models\EmploymentRecord;
use App\Models\Graduate;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlumniSearchController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/admin/alumni/search
     * Features 31-35: Search by name, year, department, board status, employment status
     */
    public function search(Request $request): JsonResponse
    {
        $query = Graduate::with('department:id,name,code')
            ->collegeOnly();
             

        // Search by name (Feature 31)
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        // Filter by graduation year (Feature 32)
        if ($request->filled('graduation_year')) {
            $query->byYear($request->integer('graduation_year'));
        }

        // Filter by department (Feature 33)
        if ($request->filled('department_id')) {
            $query->byDepartment($request->integer('department_id'));
        }

        // Advanced filter: Board Status (Feature 34)
        if ($request->filled('board_status')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->whereHas('alumniProfile', fn($ap) => $ap->where('board_status', $request->board_status));
            });
        }

        // Advanced filter: Employment Status (Feature 35)
        if ($request->filled('employment_status')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->whereHas('alumniProfile', fn($ap) => $ap->where('employment_status', $request->employment_status));
            });
        }

        $results = $query->orderBy('last_name')->paginate($request->integer('per_page', 15));

        return $this->paginated(
            $results->through(fn($g) => new GraduateResource($g)),
            'Alumni search results.'
        );
    }

    /**
     * GET /api/admin/alumni/{graduate_id}/profile
     * Full alumni profile with board + employment records
     */
    public function profile(int $graduateId): JsonResponse
    {
        $graduate = Graduate::with('department:id,name,code')->find($graduateId);

        if (!$graduate) {
            return $this->notFound('Graduate not found.');
        }

        $alumniProfile = AlumniProfile::where('graduate_id', $graduateId)->first();
        $boardRecords = BoardExamRecord::where('graduate_id', $graduateId)->orderBy('exam_year', 'desc')->get();
        $employmentRecords = EmploymentRecord::where('graduate_id', $graduateId)->orderBy('is_current', 'desc')->orderBy('start_date', 'desc')->get();

        return $this->success([
            'graduate' => new GraduateResource($graduate),
            'alumni_profile' => $alumniProfile ? [
                'current_location' => $alumniProfile->current_location,
                'employment_status' => $alumniProfile->employment_status?->value,
                'board_status' => $alumniProfile->board_status?->value,
            ] : null,
            'board_exam_records' => $boardRecords->map(fn($r) => [
                'id' => $r->id,
                'exam_name' => $r->exam_name,
                'exam_year' => $r->exam_year,
                'status' => $r->status?->value,
                'proof_file' => $r->proof_file,
            ]),
            'employment_records' => $employmentRecords->map(fn($r) => [
                'id' => $r->id,
                'company_name' => $r->company_name,
                'job_title' => $r->job_title,
                'industry' => $r->industry,
                'employment_type' => $r->employment_type?->value,
                'is_current' => $r->is_current,
                'start_date' => $r->start_date?->format('Y-m-d'),
                'end_date' => $r->end_date?->format('Y-m-d'),
            ]),
        ], 'Alumni profile retrieved.');
    }
}
