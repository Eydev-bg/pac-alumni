<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Http/Controllers/Api/Alumni/AlumniController.php
//  Handles alumni dashboard + profile management endpoints.
//  Protected by auth:api + account.status + role:alumni.
// ═══════════════════════════════════════════════════════════

namespace App\Http\Controllers\Api\Alumni;

use App\Http\Controllers\Controller;
use App\Http\Requests\Alumni\UpdateProfileRequest;
use App\Http\Requests\Alumni\UploadProfilePictureRequest;
use App\Services\Alumni\AlumniService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class AlumniController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AlumniService $alumniService,
    ) {}

    /**
     * GET /api/alumni/dashboard
     * Returns alumni dashboard summary data.
     */
    public function dashboard(): JsonResponse
    {
        try {
            $user = auth('api')->user();
            $data = $this->alumniService->getDashboardData($user);

            return $this->success($data, 'Dashboard data retrieved.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * GET /api/alumni/profile
     * Returns full profile data for the edit page.
     */
    public function profile(): JsonResponse
    {
        try {
            $user = auth('api')->user();
            $data = $this->alumniService->getProfile($user);

            return $this->success($data, 'Profile data retrieved.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * PUT /api/alumni/profile
     * Update contact information and location.
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        try {
            $user = auth('api')->user();
            $result = $this->alumniService->updateProfile($user, $request->validated());

            return $this->success($result, 'Profile updated successfully.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * POST /api/alumni/profile/picture
     * Upload profile picture.
     */
    public function uploadPicture(UploadProfilePictureRequest $request): JsonResponse
    {
        try {
            $user = auth('api')->user();
            $result = $this->alumniService->uploadProfilePicture(
                $user,
                $request->file('profile_picture')
            );

            return $this->success($result, 'Profile picture uploaded successfully.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 500);
        }
    }

    /**
     * DELETE /api/alumni/profile/picture
     * Remove profile picture.
     */
    public function removePicture(): JsonResponse
    {
        try {
            $user = auth('api')->user();
            $this->alumniService->removeProfilePicture($user);

            return $this->success(null, 'Profile picture removed.');
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), $e->getCode() ?: 500);
        }
    }
}
