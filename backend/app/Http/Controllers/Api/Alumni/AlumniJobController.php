<?php

namespace App\Http\Controllers\Api\Alumni;

use App\Http\Controllers\Controller;
use App\Http\Resources\Alumni\AlumniApplicationResource;
use App\Http\Resources\Alumni\AlumniJobResource;
use App\Services\Alumni\AlumniJobService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlumniJobController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AlumniJobService $jobService,
    ) {}

    /**
     * GET /api/alumni/jobs
     */
    public function index(Request $request): JsonResponse
    {
        $profile = auth('api')->user()->alumniProfile;
        if (!$profile) {
            return $this->forbidden('Alumni profile not found.');
        }

        $jobs = $this->jobService->listJobs($profile->id, $request->only(['job_type', 'location', 'search', 'per_page']));

        return $this->paginated(
            $jobs->through(fn ($job) => new AlumniJobResource($job)),
            'Jobs retrieved.'
        );
    }

    /**
     * GET /api/alumni/jobs/{id}
     */
    public function show(int $id): JsonResponse
    {
        $profile = auth('api')->user()->alumniProfile;
        if (!$profile) {
            return $this->forbidden('Alumni profile not found.');
        }

        try {
            $job = $this->jobService->showJob($profile->id, $id);
            return $this->success(new AlumniJobResource($job), 'Job retrieved.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * POST /api/alumni/jobs/{id}/apply
     */
    public function apply(int $id): JsonResponse
    {
        $profile = auth('api')->user()->alumniProfile;
        if (!$profile) {
            return $this->forbidden('Alumni profile not found.');
        }

        try {
            $application = $this->jobService->apply($profile, $id);
            return $this->created(new AlumniApplicationResource($application), 'Application submitted. The employer has been notified.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 422);
        }
    }

    /**
     * GET /api/alumni/my-applications
     */
    public function myApplications(Request $request): JsonResponse
    {
        $profile = auth('api')->user()->alumniProfile;
        if (!$profile) {
            return $this->forbidden('Alumni profile not found.');
        }

        $applications = $this->jobService->myApplications($profile->id, $request->only(['status', 'per_page']));

        return $this->paginated(
            $applications->through(fn ($app) => new AlumniApplicationResource($app)),
            'Applications retrieved.'
        );
    }
}
