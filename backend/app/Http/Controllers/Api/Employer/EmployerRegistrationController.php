<?php

namespace App\Http\Controllers\Api\Employer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\EmployerRegisterRequest;
use App\Http\Resources\Admin\UserResource;
use App\Http\Resources\Employer\EmployerResource;
use App\Services\Employer\EmployerRegistrationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class EmployerRegistrationController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected EmployerRegistrationService $registrationService,
    ) {}

    /**
     * POST /api/employer/register
     * Public employer (HR) self-registration with auto-approval.
     */
    public function register(EmployerRegisterRequest $request): JsonResponse
    {
        try {
            $result = $this->registrationService->register(
                $request->validated(),
                $request->file('business_permit_document'),
                $request->file('company_logo'),
            );

            return $this->created([
                'token'      => $result['token'],
                'token_type' => $result['token_type'],
                'expires_in' => $result['expires_in'],
                'user'       => new UserResource($result['user']),
                'employer'   => new EmployerResource($result['employer']),
            ], 'Registration successful. Your HR account has been approved.');
        } catch (\Exception $e) {
            // Validation is already guaranteed by EmployerRegisterRequest, so any
            // exception here is a server-side failure. Only honour the exception's
            // code when it is a valid HTTP status; otherwise fall back to 500
            // (ApiResponse::error() also clamps, as defense in depth).
            $code = $e->getCode();
            $status = (is_int($code) && $code >= 100 && $code <= 599) ? $code : 500;

            return $this->error($e->getMessage(), $status);
        }
    }
}
