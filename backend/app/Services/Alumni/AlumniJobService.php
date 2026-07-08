<?php

namespace App\Services\Alumni;

use App\Models\AlumniProfile;
use App\Models\JobApplication;
use App\Models\JobPost;
use App\Models\Notification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class AlumniJobService
{
    /**
     * Browseable jobs: approved, from an active employer, and not expired.
     */
    private function visibleJobsQuery(): Builder
    {
        return JobPost::query()
            ->where('status', 'approved')
            ->whereHas('employer', fn ($q) => $q->where('status', 'active'))
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>=', now()));
    }

    /**
     * Paginated job board for alumni.
     */
    public function listJobs(int $profileId, array $filters = []): LengthAwarePaginator
    {
        return $this->visibleJobsQuery()
            ->where('is_open', true)
            ->with('employer:id,company_name,company_logo,company_website')
            ->withCount(['applications as has_applied' => fn ($q) => $q->where('alumni_profile_id', $profileId)])
            ->when($filters['job_type'] ?? null, fn ($q, $type) => $q->where('job_type', $type))
            ->when($filters['location'] ?? null, fn ($q, $loc) => $q->where('location', 'LIKE', "%{$loc}%"))
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->search($search))
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * View a single browseable job, annotated with the alumni's application state.
     */
    public function showJob(int $profileId, int $jobId): JobPost
    {
        $job = $this->visibleJobsQuery()
            ->with('employer:id,company_name,company_logo,company_website')
            ->withCount(['applications as has_applied' => fn ($q) => $q->where('alumni_profile_id', $profileId)])
            ->find($jobId);

        if (!$job) {
            throw new \Exception('Job post not found.', 404);
        }

        $job->my_application_status = JobApplication::where('job_post_id', $jobId)
            ->where('alumni_profile_id', $profileId)
            ->value('status');

        return $job;
    }

    /**
     * Apply to a job — the alumni's profile is the application (no resume).
     */
    public function apply(AlumniProfile $profile, int $jobId): JobApplication
    {
        $job = $this->visibleJobsQuery()->find($jobId);

        if (!$job) {
            throw new \Exception('Job post not found or no longer available.', 404);
        }

        if (!$job->is_open) {
            throw new \Exception('This job is no longer accepting applications.', 422);
        }

        $alreadyApplied = JobApplication::where('job_post_id', $jobId)
            ->where('alumni_profile_id', $profile->id)
            ->exists();

        if ($alreadyApplied) {
            throw new \Exception('You have already applied to this job.', 422);
        }

        $application = JobApplication::create([
            'job_post_id'      => $jobId,
            'alumni_profile_id' => $profile->id,
            'status'           => 'pending',
            'applied_at'       => now(),
        ]);

        $this->notifyEmployer($job, $profile);

        return $application;
    }

    /**
     * Paginated list of the alumni's own applications.
     */
    public function myApplications(int $profileId, array $filters = []): LengthAwarePaginator
    {
        return JobApplication::where('alumni_profile_id', $profileId)
            ->with('jobPost:id,title,company_name,location,job_type,is_open,status')
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->latest('applied_at')
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Notify the employer's user account of a new applicant.
     */
    private function notifyEmployer(JobPost $job, AlumniProfile $profile): void
    {
        $employer = $job->employer;
        if (!$employer || !$employer->user_id) {
            return;
        }

        $applicantName = $profile->graduate?->full_name ?? $profile->user?->full_name ?? 'An alumnus';

        Notification::create([
            'user_id' => $employer->user_id,
            'type'    => 'job_application',
            'title'   => 'New Job Applicant',
            'message' => "{$applicantName} applied to your job post \"{$job->title}\".",
            'data'    => [
                'job_post_id'       => $job->id,
                'job_title'         => $job->title,
                'alumni_profile_id' => $profile->id,
            ],
        ]);
    }
}
