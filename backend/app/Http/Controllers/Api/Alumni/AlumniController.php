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
use App\Services\Alumni\ProfileCompletionService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class AlumniController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AlumniService $alumniService,
        protected ProfileCompletionService $completionService,
    ) {}

    /**
     * GET /api/alumni/dashboard
     * Returns alumni dashboard summary data.
     */
    public function dashboard(): JsonResponse
    {
        $user = auth('api')->user();
        $data = $this->alumniService->getDashboardData($user);

        return $this->success($data, 'Dashboard data retrieved.');
    }

    /**
     * GET /api/alumni/profile
     * Returns full profile data for the edit page.
     */
    public function profile(): JsonResponse
    {
        $user = auth('api')->user();
        $data = $this->alumniService->getProfile($user);

        return $this->success($data, 'Profile data retrieved.');
    }

    /**
     * GET /api/alumni/profile/completion
     * Returns profile completion percentage + actionable missing items.
     */
    public function profileCompletion(): JsonResponse
    {
        $profile = auth('api')->user()->alumniProfile;
        if (!$profile) {
            return $this->forbidden('Alumni profile not found.');
        }

        return $this->success(
            $this->completionService->compute($profile),
            'Profile completion retrieved.'
        );
    }

    /**
     * PUT /api/alumni/profile
     * Update contact information and location.
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = auth('api')->user();
        $result = $this->alumniService->updateProfile($user, $request->validated());

        return $this->success($result, 'Profile updated successfully.');
    }

    /**
     * POST /api/alumni/profile/picture
     * Upload profile picture.
     */
    public function uploadPicture(UploadProfilePictureRequest $request): JsonResponse
    {
        $user = auth('api')->user();
        $result = $this->alumniService->uploadProfilePicture(
            $user,
            $request->file('profile_picture')
        );

        return $this->success($result, 'Profile picture uploaded successfully.');
    }

    /**
     * DELETE /api/alumni/profile/picture
     * Remove profile picture.
     */
    public function removePicture(): JsonResponse
    {
        $user = auth('api')->user();
        $this->alumniService->removeProfilePicture($user);

        return $this->success(null, 'Profile picture removed.');
    }
}
