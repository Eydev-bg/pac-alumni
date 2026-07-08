<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\EmployerStatusRequest;
use App\Http\Resources\Employer\EmployerResource;
use App\Services\Admin\AdminEmployerService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminEmployerController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AdminEmployerService $employerService,
    ) {}

    /**
     * GET /api/admin/employers
     */
    public function index(Request $request): JsonResponse
    {
        $employers = $this->employerService->list($request->only(['status', 'search', 'per_page']));

        return $this->paginated(
            $employers->through(fn ($employer) => new EmployerResource($employer)),
            'Employers retrieved.'
        );
    }

    /**
     * GET /api/admin/employers/{id}
     */
    public function show(int $id): JsonResponse
    {
        try {
            $employer = $this->employerService->find($id);
            return $this->success(new EmployerResource($employer), 'Employer retrieved.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PATCH /api/admin/employers/{id}/suspend
     */
    public function suspend(EmployerStatusRequest $request, int $id): JsonResponse
    {
        try {
            $employer = $this->employerService->suspend($id, $request->validated('admin_notes'));
            return $this->success(new EmployerResource($employer), 'Employer suspended.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PATCH /api/admin/employers/{id}/activate
     */
    public function activate(int $id): JsonResponse
    {
        try {
            $employer = $this->employerService->activate($id);
            return $this->success(new EmployerResource($employer), 'Employer activated.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * PATCH /api/admin/employers/{id}/deactivate
     */
    public function deactivate(EmployerStatusRequest $request, int $id): JsonResponse
    {
        try {
            $employer = $this->employerService->deactivate($id, $request->validated('admin_notes'));
            return $this->success(new EmployerResource($employer), 'Employer deactivated.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }

    /**
     * DELETE /api/admin/employers/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $this->employerService->destroy($id);
            return $this->success(null, 'Employer deleted.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 404);
        }
    }
}
