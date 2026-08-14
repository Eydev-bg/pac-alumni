<?php

namespace App\Http\Controllers\Api\Alumni;

use App\Http\Controllers\Controller;
use App\Http\Requests\Alumni\AlumniStoreJobPostingRequest;
use App\Http\Requests\Alumni\AlumniUpdateJobPostingRequest;
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
        $job = $this->jobPostingService->find($id);
        return $this->success(new AlumniJobPostingResource($job), 'Job posting retrieved.');
    }

    /**
     * GET /api/alumni/careers/my-posts
     * The authenticated alumni's own postings, whatever their status.
     */
    public function myPosts(Request $request): JsonResponse
    {
        $jobs = $this->jobPostingService->myPosts(
            $request->user('api'),
            $request->only(['search', 'per_page']),
        );

        return $this->paginated(
            $jobs->through(fn ($j) => new AlumniJobPostingResource($j)),
            'Your job postings retrieved.'
        );
    }

    /**
     * GET /api/alumni/careers/my-posts/{id}
     * Backs the edit form — unlike the public show endpoint this also
     * returns the alumni's expired / past-deadline posts.
     */
    public function showMyPost(Request $request, int $id): JsonResponse
    {
        $job = $this->jobPostingService->myPost($request->user('api'), $id);

        return $this->success(new AlumniJobPostingResource($job), 'Job posting retrieved.');
    }

    /**
     * POST /api/alumni/careers/my-posts
     * Goes live immediately — no admin approval step.
     */
    public function store(AlumniStoreJobPostingRequest $request): JsonResponse
    {
        $job = $this->jobPostingService->createByAlumni(
            $request->user('api'),
            $request->validated(),
            $request->file('company_logo'),
        );

        return $this->created(new AlumniJobPostingResource($job), 'Job posting published.');
    }

    /**
     * PUT /api/alumni/careers/my-posts/{id}
     * Ownership is enforced in the service (403 when it isn't theirs).
     */
    public function update(AlumniUpdateJobPostingRequest $request, int $id): JsonResponse
    {
        $job = $this->jobPostingService->updateByAlumni(
            $request->user('api'),
            $id,
            $request->validated(),
            $request->file('company_logo'),
        );

        return $this->success(new AlumniJobPostingResource($job), 'Job posting updated.');
    }

    /**
     * DELETE /api/alumni/careers/my-posts/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->jobPostingService->destroyByAlumni($request->user('api'), $id);

        return $this->success(null, 'Job posting deleted.');
    }
}
