<?php

namespace App\Services\Alumni;

use App\Enums\RsvpStatus;
use App\Models\Event;
use App\Models\EventRsvp;
use App\Models\AlumniProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class AlumniEventService
{
    /**
     * Build the base query of published events targeted at this alumni,
     * annotated with the caller's own RSVP status and the "going" tally.
     */
    private function visibleQuery(AlumniProfile $profile): Builder
    {
        return Event::query()
            ->published()
            ->targetedTo($this->contextFor($profile))
            ->with('admin:id,first_name,middle_name,last_name,suffix')
            ->withCount(['rsvps as going_count' => fn ($q) => $q->where('status', RsvpStatus::GOING->value)])
            // The requesting alumni's own RSVP status (null when they haven't responded).
            ->addSelect(['my_rsvp' => EventRsvp::select('status')
                ->whereColumn('event_id', 'events.id')
                ->where('user_id', $profile->user_id)
                ->limit(1)]);
    }

    /**
     * Paginated events for the alumni — pinned first, then upcoming (soonest start first).
     */
    public function list(AlumniProfile $profile, array $filters = []): LengthAwarePaginator
    {
        return $this->visibleQuery($profile)
            ->orderByDesc('is_pinned')
            ->orderBy('start_datetime')
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Show a single event visible to the alumni or fail with 404.
     */
    public function show(AlumniProfile $profile, int $id): Event
    {
        $event = $this->visibleQuery($profile)->find($id);

        if (!$event) {
            throw \App\Exceptions\DomainException::notFound('Event not found.');
        }

        return $event;
    }

    /**
     * Record (or update) the alumni's RSVP for an event — idempotent and
     * safe for double-tap. Keyed on (event_id, user_id).
     */
    public function rsvp(AlumniProfile $profile, int $id, string $status): Event
    {
        // Ensure the event is actually visible to this alumni.
        $this->show($profile, $id);

        EventRsvp::updateOrCreate(
            ['event_id' => $id, 'user_id' => $profile->user_id],
            ['status' => $status],
        );

        return $this->show($profile, $id);
    }

    /**
     * Cancel the alumni's RSVP for an event (idempotent).
     */
    public function cancelRsvp(AlumniProfile $profile, int $id): Event
    {
        // Ensure the event is actually visible to this alumni.
        $this->show($profile, $id);

        EventRsvp::where('event_id', $id)
            ->where('user_id', $profile->user_id)
            ->delete();

        return $this->show($profile, $id);
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
