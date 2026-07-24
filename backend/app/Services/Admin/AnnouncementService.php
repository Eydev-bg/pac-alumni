<?php

namespace App\Services\Admin;

use App\Jobs\SendContentPublishedEmails;
use App\Models\Announcement;
use App\Models\ContentEmailLog;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class AnnouncementService
{
    /**
     * Paginated list of all announcements for admin management.
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        return Announcement::query()
            ->with('admin:id,uuid,first_name,middle_name,last_name,suffix')
            ->withCount('reads')
            ->when($filters['target_type'] ?? null, fn ($q, $type) => $q->where('target_type', $type))
            ->when(isset($filters['is_published']), fn ($q) => $q->where('is_published', (bool) $filters['is_published']))
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->search($search))
            ->orderByDesc('is_pinned')
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Find a single announcement or fail with 404.
     */
    public function find(int $id): Announcement
    {
        $announcement = Announcement::with('admin:id,uuid,first_name,middle_name,last_name,suffix')
            ->withCount('reads')
            ->find($id);

        if (!$announcement) {
            throw \App\Exceptions\DomainException::notFound('Announcement not found.');
        }

        return $announcement;
    }

    /**
     * Create an announcement authored by the given admin.
     */
    public function create(User $admin, array $data, ?UploadedFile $image = null): Announcement
    {
        $publish = (bool) ($data['is_published'] ?? false);

        $announcement = Announcement::create([
            'admin_id'     => $admin->id,
            'title'        => $data['title'],
            'content'      => clean($data['content']),
            'image'        => $image ? $this->storeFile($image, 'announcements', $admin->uuid) : null,
            'target_type'  => $data['target_type'],
            'target_value' => $data['target_type'] === 'all' ? null : ($data['target_value'] ?? null),
            'is_pinned'    => (bool) ($data['is_pinned'] ?? false),
            'is_published' => $publish,
            'published_at' => $publish ? now() : null,
        ]);

        // Created directly as published — email the target audience. The
        // job's content_email_logs check keeps it send-once per user.
        if ($publish) {
            SendContentPublishedEmails::dispatch(ContentEmailLog::TYPE_ANNOUNCEMENT, $announcement->id);
        }

        return $this->find($announcement->id);
    }

    /**
     * Update an announcement's editable fields.
     */
    public function update(int $id, array $data, ?UploadedFile $image = null): Announcement
    {
        $announcement = $this->find($id);

        // Sanitize rich-text content before persisting (defense in depth vs. stored XSS).
        if (isset($data['content'])) {
            $data['content'] = clean($data['content']);
        }

        if ($image) {
            $this->deleteFile($announcement->image);
            $data['image'] = $this->storeFile($image, 'announcements', $announcement->admin->uuid);
        }

        // Clear the target value when switching back to "all".
        if (($data['target_type'] ?? $announcement->target_type) === 'all') {
            $data['target_value'] = null;
        }

        $announcement->update($data);

        return $this->find($announcement->id);
    }

    /**
     * Publish an announcement (make it visible to targeted alumni).
     */
    public function publish(int $id): Announcement
    {
        $announcement = $this->find($id);

        // Email only on the transition into the published state — never on
        // re-publishing something already live (mirrors published_at's
        // "only first time" intent via the ?? now() below).
        $wasPublished = $announcement->is_published;

        $announcement->update([
            'is_published' => true,
            'archived_at'  => null,
            'published_at' => $announcement->published_at ?? now(),
        ]);

        if (!$wasPublished) {
            SendContentPublishedEmails::dispatch(ContentEmailLog::TYPE_ANNOUNCEMENT, $announcement->id);
        }

        return $this->find($announcement->id);
    }

    /**
     * Archive an announcement (hide it from alumni without deleting).
     */
    public function archive(int $id): Announcement
    {
        $announcement = $this->find($id);
        $announcement->update(['archived_at' => now()]);

        return $this->find($announcement->id);
    }

    /**
     * Toggle the pinned state of an announcement.
     */
    public function togglePin(int $id): Announcement
    {
        $announcement = $this->find($id);
        $announcement->update(['is_pinned' => !$announcement->is_pinned]);

        return $this->find($announcement->id);
    }

    /**
     * Soft-delete an announcement and remove its banner image.
     */
    public function destroy(int $id): void
    {
        $announcement = $this->find($id);
        $this->deleteFile($announcement->image);
        $announcement->delete();
    }

    /**
     * Store an uploaded file on the public disk and return its public path.
     */
    private function storeFile(UploadedFile $file, string $folder, string $uuid): string
    {
        $filename = $folder . '/' . $uuid . '_' . time() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('', $filename, 'public');

        return '/storage/' . $path;
    }

    /**
     * Delete a previously stored public file by its public path.
     */
    private function deleteFile(?string $publicPath): void
    {
        if (!$publicPath) {
            return;
        }

        $path = str_replace('/storage/', '', $publicPath);
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}
