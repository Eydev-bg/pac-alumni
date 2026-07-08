<?php

namespace App\Services\Alumni;

use App\Models\AchievementFeed;
use App\Models\AlumniProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AchievementFeedService
{
    /**
     * Community feed: public achievements from all alumni, newest first.
     * The requesting alumni also sees their own hidden entries (flagged), so
     * they can re-enable visibility from the feed.
     */
    public function list(AlumniProfile $profile, array $filters = []): LengthAwarePaginator
    {
        return AchievementFeed::query()
            ->with(['alumniProfile.user', 'alumniProfile.graduate.course'])
            ->where(function ($q) use ($profile) {
                $q->where('is_public', true)
                    ->orWhere('alumni_profile_id', $profile->id);
            })
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Toggle the visibility of one of the alumni's OWN achievements.
     *
     * @throws \Exception 404 if not found, 403 if not the owner.
     */
    public function toggleVisibility(AlumniProfile $profile, int $id): AchievementFeed
    {
        $achievement = AchievementFeed::find($id);

        if (!$achievement) {
            throw new \Exception('Achievement not found.', 404);
        }

        if ($achievement->alumni_profile_id !== $profile->id) {
            throw new \Exception('You can only change the visibility of your own achievements.', 403);
        }

        $achievement->update(['is_public' => !$achievement->is_public]);

        return $achievement;
    }
}
