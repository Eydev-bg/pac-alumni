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
                // Public achievements, but only from alumni who are directory-visible.
                $q->where(function ($inner) {
                    $inner->where('is_public', true)
                        ->whereHas('alumniProfile', fn ($ap) => $ap->where('is_directory_visible', true));
                })
                    // The requesting alumni ALWAYS sees their own entries, regardless
                    // of their own visibility setting.
                    ->orWhere('alumni_profile_id', $profile->id);
            })
            ->latest()
            ->paginate(min((int) ($filters['per_page'] ?? 15), 100));
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
            throw \App\Exceptions\DomainException::notFound('Achievement not found.');
        }

        if ($achievement->alumni_profile_id !== $profile->id) {
            throw \App\Exceptions\DomainException::forbidden('You can only change the visibility of your own achievements.');
        }

        $achievement->update(['is_public' => !$achievement->is_public]);

        return $achievement;
    }
}
