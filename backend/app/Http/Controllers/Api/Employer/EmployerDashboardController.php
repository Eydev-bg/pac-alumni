<?php

namespace App\Http\Controllers\Api\Employer;

use App\Http\Controllers\Controller;
use App\Http\Resources\Employer\JobApplicationResource;
use App\Http\Resources\Employer\JobPostResource;
use App\Services\Employer\EmployerService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployerDashboardController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected EmployerService $employerService,
    ) {}

    /**
     * GET /api/employer/dashboard
     */
    public function index(Request $request): JsonResponse
    {
        $employer = $request->user()->employer;

        if (!$employer) {
            return $this->forbidden('Employer profile not found.');
        }

        $data = $this->employerService->getDashboard($employer);

        return $this->success([
            'stats'               => $data['stats'],
            'recent_jobs'         => JobPostResource::collection($data['recent_jobs']),
            'recent_applications' => JobApplicationResource::collection($data['recent_applications']),
        ], 'Dashboard data retrieved.');
    }
}
