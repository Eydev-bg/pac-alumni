<?php

namespace App\Services\Alumni;

use App\Enums\JobSource;
use App\Enums\JobStatus;
use App\Exceptions\DomainException;
use App\Models\JobPosting;
use App\Models\User;
use App\Services\StorageService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;

class AlumniJobPostingService
{
    /**
     * Eager-load set for poster attribution on alumni-sourced postings.
     * The Career Center card shows "Posted by [name] · [course], [year]".
     */
    /** Extensions a company logo may be stored under (matches the `mimes:` rule). */
    private const LOGO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

    private const POSTER_RELATIONS = [
        'postedByAlumni:id,uuid,first_name,middle_name,last_name,suffix',
        'postedByAlumni.alumniProfile:id,user_id,graduate_id',
        'postedByAlumni.alumniProfile.graduate:id,course_id,graduation_year',
        'postedByAlumni.alumniProfile.graduate.course:id,code,name',
    ];

    /**
     * Paginated job postings visible to alumni — pinned first, then most
     * recently published. Includes both admin- and alumni-posted jobs.
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        return JobPosting::query()
            ->with(self::POSTER_RELATIONS)
            ->visibleToAlumni()
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->search($search))
            ->orderByDesc('is_pinned')
            ->orderByDesc('published_at')
            ->paginate(min((int) ($filters['per_page'] ?? 15), 100));
    }

    /**
     * Show a single job posting visible to alumni or fail with 404.
     */
    public function find(int $id): JobPosting
    {
        $job = JobPosting::query()
            ->with(self::POSTER_RELATIONS)
            ->visibleToAlumni()
            ->find($id);

        if (!$job) {
            throw DomainException::notFound('Job posting not found.');
        }

        return $job;
    }

    /**
     * The authenticated alumni's own postings — every status, including ones
     * that have passed their deadline, so they can still edit or delete them.
     */
    public function myPosts(User $alumni, array $filters = []): LengthAwarePaginator
    {
        return JobPosting::query()
            ->with(self::POSTER_RELATIONS)
            ->where('posted_by_alumni', $alumni->id)
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->search($search))
            ->latest()
            ->paginate(min((int) ($filters['per_page'] ?? 15), 100));
    }

    /**
     * A single posting owned by the alumni, whatever its status — the edit
     * form needs to load posts the public {@see find()} scope hides (past
     * deadline / expired). 403s when it isn't theirs.
     */
    public function myPost(User $alumni, int $id): JobPosting
    {
        return $this->findOwned($alumni, $id);
    }

    /**
     * Create a posting authored by an alumni. Goes live immediately —
     * alumni accounts are verified against the master graduate list at
     * registration, so no admin approval step is required.
     */
    public function createByAlumni(User $alumni, array $data, ?UploadedFile $logo = null): JobPosting
    {
        $this->assertUnderActiveLimit($alumni);

        $job = JobPosting::create([
            // posted_by keeps its NOT NULL "author" meaning; posted_by_alumni
            // is what ownership checks and attribution read.
            'posted_by'            => $alumni->id,
            'source'               => JobSource::ALUMNI->value,
            'posted_by_alumni'     => $alumni->id,
            'company_name'         => $data['company_name'],
            'company_logo'         => $logo ? $this->storeFile($logo, 'job-logos', $alumni->uuid) : null,
            'job_position'         => $data['job_position'],
            'location'             => $data['location'],
            'employment_type'      => $data['employment_type'],
            'salary'               => $data['salary'] ?? null,
            // benefits/requirements are plain text — strip any HTML outright.
            'benefits'             => isset($data['benefits']) ? trim(strip_tags($data['benefits'])) : null,
            'description'          => clean($data['description']),
            'requirements'         => isset($data['requirements']) ? trim(strip_tags($data['requirements'])) : null,
            'application_link'     => $data['application_link'] ?? null,
            'company_email'        => $data['company_email'] ?? null,
            'application_deadline' => $data['application_deadline'] ?? null,
            // Not settable by alumni — forced here, never read from input.
            'status'               => JobStatus::ACTIVE->value,
            'is_pinned'            => false,
            'published_at'         => now(),
        ]);

        return $this->findOwned($alumni, $job->id);
    }

    /**
     * Update one of the alumni's own postings. Status and pin state are not
     * touched — those fields are absent from the alumni form request.
     */
    public function updateByAlumni(User $alumni, int $id, array $data, ?UploadedFile $logo = null): JobPosting
    {
        $job = $this->findOwned($alumni, $id);

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

        // Guard against a crafted payload smuggling privileged fields through
        // mass assignment — the form request drops them, this is belt-and-braces.
        unset($data['status'], $data['is_pinned'], $data['source'],
            $data['posted_by'], $data['posted_by_alumni'], $data['published_at']);

        if ($logo) {
            $this->deleteFile($job->getRawOriginal('company_logo'));
            $data['company_logo'] = $this->storeFile($logo, 'job-logos', $alumni->uuid);
        }

        $job->update($data);

        return $this->findOwned($alumni, $job->id);
    }

    /**
     * Soft-delete one of the alumni's own postings and remove its logo.
     */
    public function destroyByAlumni(User $alumni, int $id): void
    {
        $job = $this->findOwned($alumni, $id);

        $this->deleteFile($job->getRawOriginal('company_logo'));
        $job->delete();
    }

    /**
     * Load a posting and assert the given alumni owns it.
     * 404 when it does not exist, 403 when it belongs to someone else
     * (or to an admin).
     */
    private function findOwned(User $alumni, int $id): JobPosting
    {
        $job = JobPosting::with(self::POSTER_RELATIONS)->find($id);

        if (!$job) {
            throw DomainException::notFound('Job posting not found.');
        }

        if ($job->posted_by_alumni !== $alumni->id) {
            throw DomainException::forbidden('You can only manage job postings you created.');
        }

        return $job;
    }

    /**
     * Cap how many live postings one alumni can hold, so the Career Center
     * cannot be flooded by a single account.
     */
    private function assertUnderActiveLimit(User $alumni): void
    {
        $activeCount = JobPosting::query()
            ->where('posted_by_alumni', $alumni->id)
            ->where('status', JobStatus::ACTIVE->value)
            ->count();

        if ($activeCount >= JobSource::ALUMNI_MAX_ACTIVE_POSTS) {
            throw DomainException::unprocessable(
                'You can have at most ' . JobSource::ALUMNI_MAX_ACTIVE_POSTS . ' active job postings at a time.'
            );
        }
    }

    /**
     * Store an uploaded file on the configured upload disk (local 'public'
     * or cloud 'supabase') and return its RAW storage path. The URL is
     * resolved at read time by the JobPosting model's `company_logo` accessor.
     */
    private function storeFile(UploadedFile $file, string $folder, string $uuid): string
    {
        // Extension comes from the sniffed content type, not the uploaded
        // filename — see StorageService::safeExtension().
        $extension = StorageService::safeExtension($file, self::LOGO_EXTENSIONS);
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
