<?php

namespace App\Http\Controllers\Api\Alumni\Settings;

use App\Enums\ThemePreference;
use App\Http\Controllers\Controller;
use App\Http\Requests\Alumni\Settings\UpdateAppearanceRequest;
use App\Services\Alumni\Settings\AppearanceSettingsService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class AppearanceSettingsController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AppearanceSettingsService $appearanceService,
    ) {}

    /**
     * GET /api/alumni/settings/appearance
     */
    public function show(): JsonResponse
    {
        $result = $this->appearanceService->get(auth('api')->user());

        return $this->success($result, 'Appearance settings retrieved.');
    }

    /**
     * PATCH /api/alumni/settings/appearance
     */
    public function update(UpdateAppearanceRequest $request): JsonResponse
    {
        $result = $this->appearanceService->update(
            auth('api')->user(),
            ThemePreference::from($request->validated('theme')),
        );

        return $this->success($result, 'Appearance updated.');
    }
}
