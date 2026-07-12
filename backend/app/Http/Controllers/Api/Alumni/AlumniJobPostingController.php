<?php

namespace App\Http\Controllers\Api\Alumni;

use App\Http\Controllers\Controller;
use App\Http\Resources\Alumni\AlumniJobPostingResource;
use App\Services\Alumni\AlumniJobPostingService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlumniJobPostingController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AlumniJobPostingService $jobPostingService,
    ) {}

    /**
     * GET /api/alumni/job-postings
     */
    public function index(Request $request): JsonResponse
    {
        $jobs = $this->jobPostingService->list($request->only(['search', 'per_page']));

        return $this->paginated(
            $jobs->through(fn ($j) => new AlumniJobPostingResource($j)),
            'Job postings retrieved.'
        );
    }

    /**
     * GET /api/alumni/job-postings/{id}
     */
    public function show(int $id): JsonResponse
    {
        try {
            $job = $this->jobPostingService->find($id);
            return $this->success(new AlumniJobPostingResource($job), 'Job posting retrieved.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }
}
