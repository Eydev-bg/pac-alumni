<?php

namespace App\Http\Controllers\Api\Alumni\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Alumni\Settings\ChangePasswordRequest;
use App\Services\Alumni\Settings\SecuritySettingsService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class SecuritySettingsController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected SecuritySettingsService $securityService,
    ) {}

    /**
     * PUT /api/alumni/settings/security/password
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $result = $this->securityService->changePassword(
            auth('api')->user(),
            $request->validated('current_password'),
            $request->validated('password'),
        );

        return $this->success($result, 'Password changed successfully.');
    }
}
