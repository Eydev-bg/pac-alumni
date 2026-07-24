<?php

namespace App\Http\Controllers\Api\Alumni;

use App\Http\Controllers\Controller;
use App\Http\Resources\Alumni\AchievementFeedResource;
use App\Services\Alumni\AchievementFeedService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AchievementFeedController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AchievementFeedService $achievementService,
    ) {}

    /**
     * GET /api/alumni/achievement-feed
     */
    public function index(Request $request): JsonResponse
    {
        $profile = auth('api')->user()->alumniProfile;
        if (!$profile) {
            return $this->forbidden('Alumni profile not found.');
        }

        // Expose the requester's profile id to the resource for ownership checks.
        $request->attributes->set('own_profile_id', $profile->id);

        $achievements = $this->achievementService->list($profile, $request->only(['per_page']));

        return $this->paginated(
            $achievements->through(fn ($a) => new AchievementFeedResource($a)),
            'Achievement feed retrieved.'
        );
    }

    /**
     * PATCH /api/alumni/achievement-feed/{id}/visibility
     */
    public function toggleVisibility(int $id): JsonResponse
    {
        $profile = auth('api')->user()->alumniProfile;
        if (!$profile) {
            return $this->forbidden('Alumni profile not found.');
        }

        $achievement = $this->achievementService->toggleVisibility($profile, $id);
        return $this->success(
            ['id' => $achievement->id, 'is_public' => $achievement->is_public],
            'Achievement visibility updated.'
        );
    }
}
