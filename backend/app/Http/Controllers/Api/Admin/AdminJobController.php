<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RejectJobRequest;
use App\Http\Resources\Employer\JobPostResource;
use App\Services\Admin\AdminJobService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminJobController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AdminJobService $jobService,
    ) {}

    /**
     * GET /api/admin/job-posts
     */
    public function index(Request $request): JsonResponse
    {
        $jobs = $this->jobService->list($request->only(['status', 'search', 'per_page']));

        return $this->paginated(
            $jobs->through(fn ($job) => new JobPostResource($job)),
            'Job posts retrieved.'
        );
    }

    /**
     * GET /api/admin/job-posts/{id}
     */
    public function show(int $id): JsonResponse
    {
        try {
            $job = $this->jobService->find($id);
            return $this->success(new JobPostResource($job), 'Job post retrieved.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PATCH /api/admin/job-posts/{id}/approve
     */
    public function approve(int $id): JsonResponse
    {
        try {
            $job = $this->jobService->approve($id);
            return $this->success(new JobPostResource($job), 'Job post approved.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PATCH /api/admin/job-posts/{id}/reject
     */
    public function reject(RejectJobRequest $request, int $id): JsonResponse
    {
        try {
            $job = $this->jobService->reject($id, $request->validated('admin_notes'));
            return $this->success(new JobPostResource($job), 'Job post rejected.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * DELETE /api/admin/job-posts/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->jobService->destroy($id);
            return $this->success(null, 'Job post deleted.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }
}
