<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Http/Controllers/Api/Alumni/BoardExamController.php
//  Handles alumni board exam endpoints (Features 9-12).
//  Protected by auth:api + account.status + role:alumni.
// ═══════════════════════════════════════════════════════════

namespace App\Http\Controllers\Api\Alumni;

use App\Http\Controllers\Controller;
use App\Http\Requests\Alumni\StoreBoardExamRequest;
use App\Services\Alumni\BoardExamService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class BoardExamController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected BoardExamService $boardExamService,
    ) {}

    /**
     * GET /api/alumni/board-exam
     * Returns board exam data: course info, status, records.
     */
    public function index(): JsonResponse
    {
        try {
            $user = auth('api')->user();
            $data = $this->boardExamService->getBoardExamData($user);

            return $this->success($data, 'Board exam data retrieved.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * POST /api/alumni/board-exam
     * Submit board exam result with optional proof.
     */
    public function store(StoreBoardExamRequest $request): JsonResponse
    {
        try {
            $user = auth('api')->user();
            $result = $this->boardExamService->submitBoardExam(
                $user,
                $request->validated(),
                $request->file('proof_file')
            );

            return $this->created($result, 'Board exam result submitted successfully.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 500);
        }
    }
}
