<?php

namespace App\Services\Admin;

use App\Enums\RsvpStatus;
use App\Jobs\SendContentPublishedEmails;
use App\Models\ContentEmailLog;
use App\Models\Event;
use App\Models\User;
use App\Services\StorageService;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;

class EventService
{
    /** Extensions an event image may be stored under (matches the `mimes:` rule). */
    private const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

    /**
     * Paginated list of all events for admin management, with RSVP tallies.
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        return Event::query()
            ->with('admin:id,uuid,first_name,middle_name,last_name,suffix')
            ->withCount([
                'rsvps as going_count'      => fn($q) => $q->where('status', RsvpStatus::GOING->value),
                'rsvps as interested_count' => fn($q) => $q->where('status', RsvpStatus::INTERESTED->value),
            ])
            ->when($filters['target_type'] ?? null, fn($q, $type) => $q->where('target_type', $type))
            ->when(isset($filters['is_published']), fn($q) => $q->where('is_published', (bool) $filters['is_published']))
            ->when($filters['search'] ?? null, fn($q, $search) => $q->search($search))
            ->orderByDesc('is_pinned')
            ->latest()
            ->paginate(min((int) ($filters['per_page'] ?? 15), 100));
    }

    /**
     * Find a single event or fail with 404.
     */
    public function find(int $id): Event
    {
        $event = Event::with('admin:id,uuid,first_name,middle_name,last_name,suffix')
            ->withCount([
                'rsvps as going_count'      => fn($q) => $q->where('status', RsvpStatus::GOING->value),
                'rsvps as interested_count' => fn($q) => $q->where('status', RsvpStatus::INTERESTED->value),
            ])
            ->find($id);

        if (!$event) {
            throw \App\Exceptions\DomainException::notFound('Event not found.');
        }

        return $event;
    }

    /**
     * The admin form sends naive local wall-clock strings (e.g. "2026-07-31T08:30")
     * meant as Asia/Manila time, but the app timezone is UTC — so without this
     * conversion, Eloquent's `datetime` cast would store 08:30 as if it were
     * already UTC, shifting the displayed time by +8 hours. Convert explicitly
     * before it ever reaches the model/cast.
     */
    private function toUtc(string $localDatetime): string
    {
        return Carbon::parse($localDatetime, 'Asia/Manila')->utc()->format('Y-m-d H:i:s');
    }

    /**
     * Create an event authored by the given admin.
     */
    public function create(User $admin, array $data, ?UploadedFile $image = null): Event
    {
        $publish = (bool) ($data['is_published'] ?? false);

        $event = Event::create([
            'admin_id'       => $admin->id,
            'title'          => $data['title'],
            'content'        => clean($data['content']),
            'image'          => $image ? $this->storeFile($image, 'events', $admin->uuid) : null,
            'target_type'    => $data['target_type'],
            'target_value'   => $data['target_type'] === 'all' ? null : ($data['target_value'] ?? null),
            'start_datetime' => $this->toUtc($data['start_datetime']),
            'end_datetime'   => $this->toUtc($data['end_datetime']),
            'location'       => $data['location'],
            'is_pinned'      => (bool) ($data['is_pinned'] ?? false),
            'is_published'   => $publish,
            'published_at'   => $publish ? now() : null,
        ]);

        // Created directly as published — email the target audience. The
        // job's content_email_logs check keeps it send-once per user.
        if ($publish) {
            SendContentPublishedEmails::dispatch(ContentEmailLog::TYPE_EVENT, $event->id);
        }

        return $this->find($event->id);
    }

    /**
     * Update an event's editable fields.
     */
    public function update(int $id, array $data, ?UploadedFile $image = null): Event
    {
        $event = $this->find($id);

        // Sanitize rich-text content before persisting (defense in depth vs. stored XSS).
        if (isset($data['content'])) {
            $data['content'] = clean($data['content']);
        }

        if ($image) {
            $this->deleteFile($event->getRawOriginal('image'));
            $data['image'] = $this->storeFile($image, 'events', $event->admin->uuid);
        }

        // Clear the target value when switching back to "all".
        if (($data['target_type'] ?? $event->target_type) === 'all') {
            $data['target_value'] = null;
        }

        // Same Manila → UTC conversion as create() — only when the field is
        // actually being changed in this request.
        if (isset($data['start_datetime'])) {
            $data['start_datetime'] = $this->toUtc($data['start_datetime']);
        }
        if (isset($data['end_datetime'])) {
            $data['end_datetime'] = $this->toUtc($data['end_datetime']);
        }

        $event->update($data);

        return $this->find($event->id);
    }

    /**
     * Publish an event (make it visible to targeted alumni).
     */
    public function publish(int $id): Event
    {
        $event = $this->find($id);

        // Email only on the transition into the published state — never on
        // re-publishing something already live (mirrors published_at's
        // "only first time" intent via the ?? now() below).
        $wasPublished = $event->is_published;

        $event->update([
            'is_published' => true,
            'archived_at'  => null,
            'published_at' => $event->published_at ?? now(),
        ]);

        if (!$wasPublished) {
            SendContentPublishedEmails::dispatch(ContentEmailLog::TYPE_EVENT, $event->id);
        }

        return $this->find($event->id);
    }

    /**
     * Archive an event (hide it from alumni without deleting).
     */
    public function archive(int $id): Event
    {
        $event = $this->find($id);
        $event->update(['archived_at' => now()]);

        return $this->find($event->id);
    }

    /**
     * Toggle the pinned state of an event.
     */
    public function togglePin(int $id): Event
    {
        $event = $this->find($id);
        $event->update(['is_pinned' => !$event->is_pinned]);

        return $this->find($event->id);
    }

    /**
     * Soft-delete an event and remove its banner image.
     */
    public function destroy(int $id): void
    {
        $event = $this->find($id);
        $this->deleteFile($event->getRawOriginal('image'));
        $event->delete();
    }

    /**
     * Store an uploaded file on the configured upload disk (local 'public'
     * or cloud 'supabase') and return its RAW storage path. The URL is
     * resolved at read time by the Event model's `image` accessor.
     */
    private function storeFile(UploadedFile $file, string $folder, string $uuid): string
    {
        // Extension comes from the sniffed content type, not the uploaded
        // filename — see StorageService::safeExtension().
        $extension = StorageService::safeExtension($file, self::IMAGE_EXTENSIONS);
        $filename = $folder . '/' . $uuid . '_' . time() . '.' . $extension;

        return StorageService::store($file, $filename);
    }

    /**
     * Delete a previously stored file. Handles both legacy "/storage/..."
     * values and new raw paths — StorageService::delete() figures out which.
     */
    private function deleteFile(?string $storedPath): void
    {
        if (!$storedPath) {
            return;
        }

        StorageService::delete($storedPath);
    }
}
