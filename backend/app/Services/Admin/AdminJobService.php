<?php

namespace App\Services\Admin;

use App\Models\JobPost;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AdminJobService
{
    /**
     * Paginated list of all job posts for moderation.
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        return JobPost::query()
            ->with('employer:id,company_name,status')
            ->withCount('applications')
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->search($search))
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Find a single job post with details or fail with 404.
     */
    public function find(int $id): JobPost
    {
        $job = JobPost::with('employer:id,company_name,status')
            ->withCount('applications')
            ->find($id);

        if (!$job) {
            throw new \Exception('Job post not found.', 404);
        }

        return $job;
    }

    /**
     * Approve a job post.
     */
    public function approve(int $id): JobPost
    {
        $job = $this->find($id);
        $job->update(['status' => 'approved', 'admin_notes' => null]);

        return $job->fresh(['employer'])->loadCount('applications');
    }

    /**
     * Reject a job post with a reason.
     */
    public function reject(int $id, string $notes): JobPost
    {
        $job = $this->find($id);
        $job->update(['status' => 'rejected', 'admin_notes' => $notes]);

        return $job->fresh(['employer'])->loadCount('applications');
    }

    /**
     * Soft-delete a job post.
     */
    public function destroy(int $id): void
    {
        $this->find($id)->delete();
    }
}
