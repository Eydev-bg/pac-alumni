<?php

namespace App\Services\Employer;

use App\Models\Employer;
use App\Models\JobApplication;
use App\Models\JobPost;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EmployerJobService
{
    /**
     * Paginated list of the employer's own job posts.
     */
    public function listJobs(Employer $employer, array $filters = []): LengthAwarePaginator
    {
        return $employer->jobPosts()
            ->withCount('applications')
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when(isset($filters['is_open']), fn ($q) => $q->where('is_open', (bool) $filters['is_open']))
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->search($search))
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Create a job post for the employer.
     *
     * company_name is denormalized from the employer for display. Since the
     * employer is verified, posts are auto-approved.
     */
    public function createJob(Employer $employer, array $data): JobPost
    {
        return $employer->jobPosts()->create([
            'title'            => $data['title'],
            'description'      => $data['description'],
            'company_name'     => $employer->company_name,
            'location'         => $data['location'],
            'job_type'         => $data['job_type'],
            'salary_range_min' => $data['salary_range_min'] ?? null,
            'salary_range_max' => $data['salary_range_max'] ?? null,
            'qualifications'   => $data['qualifications'] ?? null,
            'is_open'          => true,
            'status'           => 'approved',
            'expires_at'       => $data['expires_at'] ?? null,
        ]);
    }

    /**
     * Get a single job post owned by the employer.
     */
    public function showJob(Employer $employer, int $jobId): JobPost
    {
        return $this->findOwnedJob($employer, $jobId)->loadCount('applications');
    }

    /**
     * Update a job post owned by the employer.
     */
    public function updateJob(Employer $employer, int $jobId, array $data): JobPost
    {
        $job = $this->findOwnedJob($employer, $jobId);
        $job->update($data);

        return $job->fresh()->loadCount('applications');
    }

    /**
     * Soft-delete a job post owned by the employer.
     */
    public function deleteJob(Employer $employer, int $jobId): void
    {
        $this->findOwnedJob($employer, $jobId)->delete();
    }

    /**
     * Close a job post (stop accepting applications).
     */
    public function closeJob(Employer $employer, int $jobId): JobPost
    {
        $job = $this->findOwnedJob($employer, $jobId);
        $job->update(['is_open' => false]);

        return $job->fresh()->loadCount('applications');
    }

    /**
     * Paginated applicants for a job post owned by the employer.
     */
    public function listApplicants(Employer $employer, int $jobId, array $filters = []): LengthAwarePaginator
    {
        $job = $this->findOwnedJob($employer, $jobId);

        return $job->applications()
            ->with([
                'alumniProfile.user',
                'alumniProfile.graduate.course.department',
                'alumniProfile.graduate.employmentRecords',
            ])
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->latest('applied_at')
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Update the status of an application belonging to one of the employer's jobs.
     */
    public function updateApplicationStatus(Employer $employer, int $applicationId, string $status, ?string $notes = null): JobApplication
    {
        $application = $this->findOwnedApplication($employer, $applicationId);

        $application->update([
            'status'         => $status,
            'employer_notes' => $notes,
            'reviewed_at'    => now(),
        ]);

        return $application->fresh();
    }

    // ─── Private Helpers ─────────────────────────────────────

    /**
     * Resolve a job post that belongs to the employer or fail with 404.
     */
    private function findOwnedJob(Employer $employer, int $jobId): JobPost
    {
        $job = $employer->jobPosts()->find($jobId);

        if (!$job) {
            throw new \Exception('Job post not found.', 404);
        }

        return $job;
    }

    /**
     * Resolve an application on one of the employer's jobs or fail with 404.
     */
    private function findOwnedApplication(Employer $employer, int $applicationId): JobApplication
    {
        $application = JobApplication::where('id', $applicationId)
            ->whereHas('jobPost', fn ($q) => $q->where('employer_id', $employer->id))
            ->first();

        if (!$application) {
            throw new \Exception('Application not found.', 404);
        }

        return $application;
    }
}
