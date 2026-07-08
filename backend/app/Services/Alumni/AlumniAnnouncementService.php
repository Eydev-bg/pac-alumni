<?php

namespace App\Services\Alumni;

use App\Models\Announcement;
use App\Models\AnnouncementRead;
use App\Models\AlumniProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class AlumniAnnouncementService
{
    /**
     * Build the base query of published announcements targeted at this alumni,
     * annotated with whether the alumni has read each one.
     */
    private function visibleQuery(AlumniProfile $profile): Builder
    {
        return Announcement::query()
            ->published()
            ->targetedTo($this->contextFor($profile))
            ->with('admin:id,first_name,middle_name,last_name,suffix')
            ->withCount(['reads as is_read' => fn ($q) => $q->where('user_id', $profile->user_id)]);
    }

    /**
     * Paginated announcements for the alumni — pinned first, then newest.
     */
    public function list(AlumniProfile $profile, array $filters = []): LengthAwarePaginator
    {
        return $this->visibleQuery($profile)
            ->orderByDesc('is_pinned')
            ->orderByDesc('published_at')
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Show a single announcement visible to the alumni or fail with 404.
     */
    public function show(AlumniProfile $profile, int $id): Announcement
    {
        $announcement = $this->visibleQuery($profile)->find($id);

        if (!$announcement) {
            throw new \Exception('Announcement not found.', 404);
        }

        return $announcement;
    }

    /**
     * Mark an announcement as read by the alumni (idempotent).
     */
    public function markAsRead(AlumniProfile $profile, int $id): void
    {
        // Ensure the announcement is actually visible to this alumni.
        $this->show($profile, $id);

        AnnouncementRead::firstOrCreate(
            ['announcement_id' => $id, 'user_id' => $profile->user_id],
            ['read_at' => now()],
        );
    }

    /**
     * Count published, targeted announcements the alumni has not yet read.
     */
    public function unreadCount(AlumniProfile $profile): int
    {
        return Announcement::query()
            ->published()
            ->targetedTo($this->contextFor($profile))
            ->whereDoesntHave('reads', fn ($q) => $q->where('user_id', $profile->user_id))
            ->count();
    }

    /**
     * Resolve the targeting context (education level, department, course,
     * batch) from the alumni's graduate record.
     */
    private function contextFor(AlumniProfile $profile): array
    {
        $graduate = $profile->graduate;

        if (!$graduate) {
            return [];
        }

        return [
            'education_level' => $graduate->education_level?->value,
            'department_id'   => $graduate->course?->department_id ?? $graduate->department_id,
            'course_id'       => $graduate->course_id,
            'graduation_year' => $graduate->graduation_year,
        ];
    }
}
