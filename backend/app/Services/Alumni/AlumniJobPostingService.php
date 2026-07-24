<?php

namespace App\Services\Alumni;

use App\Models\JobPosting;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AlumniJobPostingService
{
    /**
     * Paginated job postings visible to alumni — pinned first, then most
     * recently published. Read-only: applying happens on the external link.
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        return JobPosting::query()
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
        $job = JobPosting::query()->visibleToAlumni()->find($id);

        if (!$job) {
            throw \App\Exceptions\DomainException::notFound('Job posting not found.');
        }

        return $job;
    }
}
