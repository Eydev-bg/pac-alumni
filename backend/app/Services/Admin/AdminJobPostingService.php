<?php

namespace App\Services\Admin;

use App\Enums\JobStatus;
use App\Jobs\SendContentPublishedEmails;
use App\Models\ContentEmailLog;
use App\Models\JobPosting;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class AdminJobPostingService
{
    /**
     * Paginated list of all job postings for admin management.
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        return JobPosting::query()
            ->with('postedBy:id,uuid,first_name,middle_name,last_name,suffix')
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->search($search))
            ->orderByDesc('is_pinned')
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Find a single job posting or fail with 404.
     */
    public function find(int $id): JobPosting
    {
        $job = JobPosting::with('postedBy:id,uuid,first_name,middle_name,last_name,suffix')
            ->find($id);

        if (!$job) {
            throw new \Exception('Job posting not found.', 404);
        }

        return $job;
    }

    /**
     * Create a job posting authored by the given admin.
     */
    public function create(User $admin, array $data, ?UploadedFile $logo = null): JobPosting
    {
        $activate = ($data['status'] ?? null) === JobStatus::ACTIVE->value;

        $job = JobPosting::create([
            'posted_by'            => $admin->id,
            'company_name'         => $data['company_name'],
            'company_logo'         => $logo ? $this->storeFile($logo, 'job-logos', $admin->uuid) : null,
            'job_position'         => $data['job_position'],
            'location'             => $data['location'],
            'employment_type'      => $data['employment_type'],
            'salary'               => $data['salary'] ?? null,
            // benefits/requirements are plain text — strip any HTML outright.
            'benefits'             => isset($data['benefits']) ? trim(strip_tags($data['benefits'])) : null,
            'description'          => clean($data['description']),
            'requirements'         => isset($data['requirements']) ? trim(strip_tags($data['requirements'])) : null,
            'application_link'     => $data['application_link'],
            'company_email'        => $data['company_email'] ?? null,
            'application_deadline' => $data['application_deadline'] ?? null,
            'status'               => $data['status'],
            'is_pinned'            => (bool) ($data['is_pinned'] ?? false),
            'published_at'         => $activate ? now() : null,
        ]);

        // Created directly as active — alumni should hear about it just as
        // they would via publish(). Both channels (in-app bell + email) now
        // come from the dispatched job, guarded send-once by content_email_logs.
        if ($activate) {
            SendContentPublishedEmails::dispatch(ContentEmailLog::TYPE_JOB_POSTING, $job->id);
        }

        return $this->find($job->id);
    }

    /**
     * Update a job posting's editable fields.
     */
    public function update(int $id, array $data, ?UploadedFile $logo = null): JobPosting
    {
        $job = $this->find($id);

        // Description is rich text — sanitize it (defense in depth vs. stored
        // XSS). benefits/requirements are plain text — strip any HTML outright.
        if (isset($data['description'])) {
            $data['description'] = clean($data['description']);
        }
        foreach (['benefits', 'requirements'] as $field) {
            if (isset($data[$field])) {
                $data[$field] = trim(strip_tags($data[$field]));
            }
        }

        if ($logo) {
            $this->deleteFile($job->company_logo);
            $data['company_logo'] = $this->storeFile($logo, 'job-logos', $job->postedBy->uuid);
        }

        $job->update($data);

        return $this->find($job->id);
    }

    /**
     * Publish a job posting (make it visible to alumni) and notify them.
     * Idempotent: re-publishing an already-active posting does not
     * re-notify or reset published_at.
     */
    public function publish(int $id): JobPosting
    {
        $job = $this->find($id);

        $wasActive = $job->status === JobStatus::ACTIVE;

        $job->update([
            'status'       => JobStatus::ACTIVE->value,
            'published_at' => $job->published_at ?? now(),
        ]);

        if (!$wasActive) {
            SendContentPublishedEmails::dispatch(ContentEmailLog::TYPE_JOB_POSTING, $job->id);
        }

        return $this->find($job->id);
    }

    /**
     * Mark a job posting as expired (hide it from alumni without deleting).
     */
    public function markExpired(int $id): JobPosting
    {
        $job = $this->find($id);
        $job->update(['status' => JobStatus::EXPIRED->value]);

        return $this->find($job->id);
    }

    /**
     * Soft-delete a job posting and remove its company logo.
     */
    public function destroy(int $id): void
    {
        $job = $this->find($id);
        $this->deleteFile($job->company_logo);
        $job->delete();
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
