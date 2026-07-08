<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Requests\Admin\UpdateUserStatusRequest;
use App\Http\Resources\Admin\UserResource;
use App\Services\Admin\UserService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected UserService $userService,
    ) {}

    /**
     * GET /api/admin/users
     * List all users with filters and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $users = $this->userService->list(
            perPage: $request->integer('per_page', 15),
            search: $request->string('search')->toString() ?: null,
            role: $request->string('role')->toString() ?: null,
            status: $request->string('status')->toString() ?: null,
            sortBy: $request->string('sort_by', 'created_at')->toString(),
            sortDir: $request->string('sort_dir', 'desc')->toString(),
        );

        return $this->paginated(
            $users->through(fn($user) => new UserResource($user)),
            'Users retrieved successfully.'
        );
    }

    /**
     * POST /api/admin/users
     * Create a new user.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->userService->create($request->validated());

        return $this->created(
            new UserResource($user),
            'User created successfully.'
        );
    }

    /**
     * GET /api/admin/users/{user}
     * View single user details.
     */
    public function show(string $uuid): JsonResponse
    {
        try {
            $user = $this->userService->findByUuid($uuid);
            return $this->success(new UserResource($user), 'User retrieved.');
        } catch (\Exception $e) {
            return $this->notFound($e->getMessage());
        }
    }

    /**
     * PUT /api/admin/users/{user}
     * Update user info.
     */
    public function update(UpdateUserRequest $request, string $uuid): JsonResponse
    {
        try {
            $user = $this->userService->findByUuid($uuid);
            $updated = $this->userService->update($user, $request->validated());

            return $this->success(
                new UserResource($updated),
                'User updated successfully.'
            );
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * PATCH /api/admin/users/{user}/status
     * Suspend / Activate / Deactivate account.
     */
    public function updateStatus(UpdateUserStatusRequest $request, string $uuid): JsonResponse
    {
        try {
            $user = $this->userService->findByUuid($uuid);
            $updated = $this->userService->updateStatus(
                $user,
                $request->validated('status')
            );

            return $this->success(
                new UserResource($updated),
                'User status updated to ' . $updated->status->label() . '.'
            );
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * POST /api/admin/users/{user}/reset-password
     * Admin-initiated password reset.
     */
    public function resetPassword(string $uuid): JsonResponse
    {
        try {
            $user = $this->userService->findByUuid($uuid);
            $this->userService->resetPassword($user);

            return $this->success(
                null,
                'A password reset link has been emailed to the user.'
            );
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 500);
        }
    }
}
