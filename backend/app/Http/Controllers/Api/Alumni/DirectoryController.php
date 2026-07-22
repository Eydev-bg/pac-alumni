<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Http/Controllers/Api/Alumni/DirectoryController.php
//  Alumni Directory (Phase B). Mirrors the admin GraduateController
//  list shape (per_page / search / filters / sort → paginated
//  Resource), but alumni-facing and privacy-scrubbed. Protected by
//  auth:api + account.status + role:alumni + maintenance (the alumni
//  route group).
// ═══════════════════════════════════════════════════════════

namespace App\Http\Controllers\Api\Alumni;

use App\Http\Controllers\Controller;
use App\Http\Resources\Alumni\DirectoryCardResource;
use App\Http\Resources\Alumni\DirectoryProfileResource;
use App\Services\Alumni\DirectoryService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DirectoryController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected DirectoryService $directoryService,
    ) {}

    /**
     * GET /api/alumni/directory
     * Paginated, searchable, filterable list of fellow alumni.
     */
    public function index(Request $request): JsonResponse
    {
        $directory = $this->directoryService->list(
            excludeUserId: auth('api')->id(),
            perPage: $request->integer('per_page', 15),
            search: $request->string('search')->toString() ?: null,
            graduationYear: $request->integer('graduation_year') ?: null,
            departmentId: $request->integer('department_id') ?: null,
            courseId: $request->integer('course_id') ?: null,
            employmentStatus: $request->string('employment_status')->toString() ?: null,
            boardStatus: $request->string('board_status')->toString() ?: null,
            sortBy: $request->string('sort_by', 'name')->toString(),
            sortDir: $request->string('sort_dir', 'asc')->toString(),
        );

        return $this->paginated(
            $directory->through(fn ($user) => new DirectoryCardResource($user)),
            'Alumni directory retrieved.'
        );
    }

    /**
     * GET /api/alumni/directory/filters
     * Reference data (batch years, departments, courses) for the filter
     * dropdowns. Alumni-accessible counterpart to the admin reference lists.
     */
    public function filters(): JsonResponse
    {
        return $this->success(
            $this->directoryService->filterOptions(auth('api')->id()),
            'Directory filters retrieved.'
        );
    }

    /**
     * GET /api/alumni/directory/{uuid}
     * One alumni's PUBLIC profile (no email/phone). Hidden, inactive,
     * non-alumni, or unknown users all 404 identically so the endpoint
     * never confirms the existence of a profile the viewer may not see.
     */
    public function show(string $uuid): JsonResponse
    {
        try {
            $user = $this->directoryService->findVisibleProfile(auth('api')->id(), $uuid);

            return $this->success(
                new DirectoryProfileResource($user),
                'Alumni profile retrieved.'
            );
        } catch (\Exception $e) {
            return $this->notFound('This profile isn\'t available.');
        }
    }
}
