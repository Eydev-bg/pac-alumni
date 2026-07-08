<?php

namespace App\Http\Controllers\Api\Employer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\UpdateEmployerProfileRequest;
use App\Http\Resources\Employer\EmployerResource;
use App\Services\Employer\EmployerService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployerController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected EmployerService $employerService,
    ) {}

    /**
     * GET /api/employer/profile
     */
    public function profile(Request $request): JsonResponse
    {
        $employer = $request->user()->employer;

        if (!$employer) {
            return $this->forbidden('Employer profile not found.');
        }

        return $this->success(new EmployerResource($employer), 'Employer profile retrieved.');
    }

    /**
     * PUT /api/employer/profile
     */
    public function updateProfile(UpdateEmployerProfileRequest $request): JsonResponse
    {
        $employer = $request->user()->employer;

        if (!$employer) {
            return $this->forbidden('Employer profile not found.');
        }

        $updated = $this->employerService->updateProfile(
            $employer,
            $request->safe()->except('company_logo'),
            $request->file('company_logo'),
        );

        return $this->success(new EmployerResource($updated), 'Employer profile updated.');
    }
}
