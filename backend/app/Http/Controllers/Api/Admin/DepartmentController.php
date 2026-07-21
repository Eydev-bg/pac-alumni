<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDepartmentRequest;
use App\Http\Requests\Admin\UpdateDepartmentRequest;
use App\Http\Requests\Admin\UpdateUserStatusRequest;
use App\Http\Resources\Admin\DepartmentResource;
use App\Services\Admin\DepartmentService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected DepartmentService $deptService,
    ) {}

    /**
     * GET /api/admin/departments
     * List all departments with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $departments = $this->deptService->list(
            perPage: $request->integer('per_page', 15),
            search: $request->string('search')->toString() ?: null,
            status: $request->string('status')->toString() ?: null,
            isBoard: $request->has('is_board') ? $request->string('is_board')->toString() : null,
            sortBy: $request->string('sort_by', 'name')->toString(),
            sortDir: $request->string('sort_dir', 'asc')->toString(),
            educationLevel: $request->string('education_level')->toString() ?: null,
        );

        return $this->paginated(
            $departments->through(fn($dept) => new DepartmentResource($dept)),
            'Departments retrieved successfully.'
        );
    }

    /**
     * GET /api/admin/departments/all
     * Get all active departments (for dropdowns, no pagination).
     */
    public function all(Request $request): JsonResponse
    {
        $departments = $this->deptService->allActive(
            $request->string('education_level')->toString() ?: null
        );

        return $this->success(
            DepartmentResource::collection($departments),
            'Active departments retrieved.'
        );
    }

    /**
     * POST /api/admin/departments
     */
    public function store(StoreDepartmentRequest $request): JsonResponse
    {
        $department = $this->deptService->create($request->validated());

        return $this->created(
            new DepartmentResource($department),
            'Department created successfully.'
        );
    }

    /**
     * GET /api/admin/departments/{department}
     */
    public function show(int $id): JsonResponse
    {
        try {
            $department = $this->deptService->findById($id);
            return $this->success(new DepartmentResource($department), 'Department retrieved.');
        } catch (\Exception $e) {
            return $this->notFound($e->getMessage());
        }
    }

    /**
     * PUT /api/admin/departments/{department}
     */
    public function update(UpdateDepartmentRequest $request, int $id): JsonResponse
    {
        try {
            $department = $this->deptService->findById($id);
            $updated = $this->deptService->update($department, $request->validated());

            return $this->success(
                new DepartmentResource($updated),
                'Department updated successfully.'
            );
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * DELETE /api/admin/departments/{department}
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $department = $this->deptService->findById($id);
            $this->deptService->delete($department);

            return $this->success(null, 'Department deleted successfully.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * PATCH /api/admin/departments/{department}/status
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        try {
            $department = $this->deptService->findById($id);
            $updated = $this->deptService->updateStatus($department, $request->status);

            return $this->success(
                new DepartmentResource($updated),
                'Department status updated to ' . $updated->status->label() . '.'
            );
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * GET /api/admin/departments/{department}/stats
     */
    public function stats(int $id): JsonResponse
    {
        try {
            $department = $this->deptService->findById($id);
            $stats = $this->deptService->getStats($department);

            return $this->success($stats, 'Department stats retrieved.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 500);
        }
    }
}
