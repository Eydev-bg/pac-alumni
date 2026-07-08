<?php

namespace App\Http\Controllers\Api\Employer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\StoreJobPostRequest;
use App\Http\Requests\Employer\UpdateApplicationStatusRequest;
use App\Http\Requests\Employer\UpdateJobPostRequest;
use App\Http\Resources\Employer\JobApplicationResource;
use App\Http\Resources\Employer\JobPostResource;
use App\Services\Employer\EmployerJobService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployerJobController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected EmployerJobService $jobService,
    ) {}

    /**
     * GET /api/employer/jobs
     */
    public function index(Request $request): JsonResponse
    {
        $employer = $request->user()->employer;
        if (!$employer) {
            return $this->forbidden('Employer profile not found.');
        }

        $jobs = $this->jobService->listJobs($employer, $request->only(['status', 'is_open', 'search', 'per_page']));

        return $this->paginated(
            $jobs->through(fn ($job) => new JobPostResource($job)),
            'Job posts retrieved.'
        );
    }

    /**
     * POST /api/employer/jobs
     */
    public function store(StoreJobPostRequest $request): JsonResponse
    {
        $employer = $request->user()->employer;
        if (!$employer) {
            return $this->forbidden('Employer profile not found.');
        }

        $job = $this->jobService->createJob($employer, $request->validated());

        return $this->created(new JobPostResource($job), 'Job post created.');
    }

    /**
     * GET /api/employer/jobs/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $employer = $request->user()->employer;
        if (!$employer) {
            return $this->forbidden('Employer profile not found.');
        }

        try {
            $job = $this->jobService->showJob($employer, $id);
            return $this->success(new JobPostResource($job), 'Job post retrieved.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PUT /api/employer/jobs/{id}
     */
    public function update(UpdateJobPostRequest $request, int $id): JsonResponse
    {
        $employer = $request->user()->employer;
        if (!$employer) {
            return $this->forbidden('Employer profile not found.');
        }

        try {
            $job = $this->jobService->updateJob($employer, $id, $request->validated());
            return $this->success(new JobPostResource($job), 'Job post updated.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * DELETE /api/employer/jobs/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $employer = $request->user()->employer;
        if (!$employer) {
            return $this->forbidden('Employer profile not found.');
        }

        try {
            $this->jobService->deleteJob($employer, $id);
            return $this->success(null, 'Job post deleted.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PATCH /api/employer/jobs/{id}/close
     */
    public function close(Request $request, int $id): JsonResponse
    {
        $employer = $request->user()->employer;
        if (!$employer) {
            return $this->forbidden('Employer profile not found.');
        }

        try {
            $job = $this->jobService->closeJob($employer, $id);
            return $this->success(new JobPostResource($job), 'Job post closed.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * GET /api/employer/jobs/{id}/applicants
     */
    public function applicants(Request $request, int $id): JsonResponse
    {
        $employer = $request->user()->employer;
        if (!$employer) {
            return $this->forbidden('Employer profile not found.');
        }

        try {
            $applicants = $this->jobService->listApplicants($employer, $id, $request->only(['status', 'per_page']));
            return $this->paginated(
                $applicants->through(fn ($app) => new JobApplicationResource($app)),
                'Applicants retrieved.'
            );
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PATCH /api/employer/applications/{id}/status
     */
    public function updateApplicationStatus(UpdateApplicationStatusRequest $request, int $id): JsonResponse
    {
        $employer = $request->user()->employer;
        if (!$employer) {
            return $this->forbidden('Employer profile not found.');
        }

        try {
            $application = $this->jobService->updateApplicationStatus(
                $employer,
                $id,
                $request->validated('status'),
                $request->validated('employer_notes'),
            );
            return $this->success(new JobApplicationResource($application), 'Application status updated.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }
}
