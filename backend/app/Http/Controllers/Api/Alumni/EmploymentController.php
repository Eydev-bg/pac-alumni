<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Http/Controllers/Api/Alumni/EmploymentController.php
//  Handles alumni employment endpoints (Features 13-18).
//  Protected by auth:api + account.status + role:alumni.
// ═══════════════════════════════════════════════════════════

namespace App\Http\Controllers\Api\Alumni;

use App\Http\Controllers\Controller;
use App\Http\Requests\Alumni\StoreEmploymentRequest;
use App\Services\Alumni\EmploymentService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class EmploymentController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected EmploymentService $employmentService,
    ) {}

    /**
     * GET /api/alumni/employment
     * Returns employment data: status, current job, history, industry options.
     */
    public function index(): JsonResponse
    {
        $user = auth('api')->user();
        $data = $this->employmentService->getEmploymentData($user);

        return $this->success($data, 'Employment data retrieved.');
    }

    /**
     * POST /api/alumni/employment
     * Submit employment update (employed with details, or unemployed).
     */
    public function store(StoreEmploymentRequest $request): JsonResponse
    {
        $user = auth('api')->user();
        $result = $this->employmentService->submitEmployment($user, $request->validated());

        return $this->created($result, 'Employment updated successfully.');
    }
}
