<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreJobPostingRequest;
use App\Http\Requests\Admin\UpdateJobPostingRequest;
use App\Http\Resources\Admin\JobPostingResource;
use App\Services\Admin\AdminJobPostingService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminJobPostingController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AdminJobPostingService $jobPostingService,
    ) {}

    /**
     * GET /api/admin/job-postings
     */
    public function index(Request $request): JsonResponse
    {
        $jobs = $this->jobPostingService->list(
            $request->only(['status', 'search', 'per_page'])
        );

        return $this->paginated(
            $jobs->through(fn ($j) => new JobPostingResource($j)),
            'Job postings retrieved.'
        );
    }

    /**
     * POST /api/admin/job-postings
     */
    public function store(StoreJobPostingRequest $request): JsonResponse
    {
        $job = $this->jobPostingService->create(
            $request->user(),
            $request->validated(),
            $request->file('company_logo'),
        );

        return $this->created(new JobPostingResource($job), 'Job posting created.');
    }

    /**
     * GET /api/admin/job-postings/{id}
     */
    public function show(int $id): JsonResponse
    {
        try {
            $job = $this->jobPostingService->find($id);
            return $this->success(new JobPostingResource($job), 'Job posting retrieved.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PUT|PATCH /api/admin/job-postings/{id}
     */
    public function update(UpdateJobPostingRequest $request, int $id): JsonResponse
    {
        try {
            $job = $this->jobPostingService->update($id, $request->validated(), $request->file('company_logo'));
            return $this->success(new JobPostingResource($job), 'Job posting updated.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * DELETE /api/admin/job-postings/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->jobPostingService->destroy($id);
            return $this->success(null, 'Job posting deleted.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PATCH /api/admin/job-postings/{id}/publish
     */
    public function publish(int $id): JsonResponse
    {
        try {
            $job = $this->jobPostingService->publish($id);
            return $this->success(new JobPostingResource($job), 'Job posting published.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PATCH /api/admin/job-postings/{id}/mark-expired
     */
    public function markExpired(int $id): JsonResponse
    {
        try {
            $job = $this->jobPostingService->markExpired($id);
            return $this->success(new JobPostingResource($job), 'Job posting marked as expired.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }
}
