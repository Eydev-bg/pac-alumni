<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\AlumniRegisterRequest;
use App\Models\RegistrationSetting;
use App\Services\Admin\VerificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class RegistrationController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected VerificationService $verificationService,
    ) {}

    /**
     * GET /api/registration/status
     * Check if registration is currently open (public).
     */
    public function status(): JsonResponse
    {
        $settings = RegistrationSetting::getSettings();

        return $this->success([
            'is_open' => $settings->isCurrentlyOpen(),
            'open_from' => $settings->open_from?->toISOString(),
            'open_until' => $settings->open_until?->toISOString(),
        ], 'Registration status retrieved.');
    }

    /**
     * POST /api/registration/verify
     * Alumni registration — auto-verify against graduate master list.
     * SECURITY: Rate limited, blacklist checked, all attempts logged.
     */
    public function verify(AlumniRegisterRequest $request): JsonResponse
    {
        $result = $this->verificationService->verifyAndRegister(
            $request->validated(),
            $request->ip()
        );

        return $this->created([
            'alumni_id' => $result['alumni_id'],
            'message' => 'Registration successful! Your alumni account has been created.',
        ], 'Verification successful. Account created.');
    }
}
