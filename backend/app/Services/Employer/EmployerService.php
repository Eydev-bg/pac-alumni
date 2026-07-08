<?php

namespace App\Services\Employer;

use App\Models\Employer;
use App\Models\JobApplication;
use App\Models\JobPost;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class EmployerService
{
    /**
     * Aggregated dashboard data for an employer.
     */
    public function getDashboard(Employer $employer): array
    {
        $jobIds = $employer->jobPosts()->pluck('id');

        $applicationsQuery = JobApplication::whereIn('job_post_id', $jobIds);

        return [
            'stats' => [
                'total_jobs'           => $employer->jobPosts()->count(),
                'open_jobs'            => $employer->jobPosts()->where('is_open', true)->count(),
                'closed_jobs'          => $employer->jobPosts()->where('is_open', false)->count(),
                'total_applications'   => (clone $applicationsQuery)->count(),
                'pending_applications' => (clone $applicationsQuery)->where('status', 'pending')->count(),
            ],
            'recent_jobs' => $employer->jobPosts()
                ->withCount('applications')
                ->latest()
                ->take(5)
                ->get(),
            'recent_applications' => JobApplication::whereIn('job_post_id', $jobIds)
                ->with(['jobPost:id,title', 'alumniProfile.user:id,first_name,last_name', 'alumniProfile.graduate:id,first_name,last_name'])
                ->latest('applied_at')
                ->take(5)
                ->get(),
        ];
    }

    /**
     * Update the employer's company profile.
     */
    public function updateProfile(Employer $employer, array $data, ?UploadedFile $logo = null): Employer
    {
        if ($logo) {
            $this->deleteFile($employer->company_logo);
            $data['company_logo'] = $this->storeFile($logo, 'company_logos', $employer->user->uuid);
        }

        $employer->update($data);

        return $employer->fresh();
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
