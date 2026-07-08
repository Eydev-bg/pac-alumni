<?php

namespace App\Services\Admin;

use App\Enums\UserStatus;
use App\Models\Employer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AdminEmployerService
{
    /**
     * Paginated list of employers for admin management.
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        return Employer::query()
            ->with('user:id,uuid,email,status')
            ->withCount('jobPosts')
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->search($search))
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    /**
     * Find a single employer with details or fail with 404.
     */
    public function find(int $id): Employer
    {
        $employer = Employer::with('user:id,uuid,email,status')
            ->withCount('jobPosts')
            ->find($id);

        if (!$employer) {
            throw new \Exception('Employer not found.', 404);
        }

        return $employer;
    }

    /**
     * Suspend an employer (and block their login).
     */
    public function suspend(int $id, ?string $notes = null): Employer
    {
        return $this->changeStatus($id, UserStatus::SUSPENDED, $notes);
    }

    /**
     * Reactivate an employer.
     */
    public function activate(int $id): Employer
    {
        return $this->changeStatus($id, UserStatus::ACTIVE, null);
    }

    /**
     * Deactivate an employer (and block their login).
     */
    public function deactivate(int $id, ?string $notes = null): Employer
    {
        return $this->changeStatus($id, UserStatus::DEACTIVATED, $notes);
    }

    /**
     * Soft-delete an employer and deactivate their user account.
     */
    public function destroy(int $id): void
    {
        $employer = $this->find($id);

        DB::transaction(function () use ($employer) {
            $employer->user?->update(['status' => UserStatus::DEACTIVATED]);
            $employer->delete();
        });
    }

    /**
     * Update both the employer status and the paired user status so that
     * login gating (which checks the user's status) stays in sync.
     */
    private function changeStatus(int $id, UserStatus $status, ?string $notes): Employer
    {
        $employer = $this->find($id);

        DB::transaction(function () use ($employer, $status, $notes) {
            $employer->update([
                'status'      => $status->value,
                'admin_notes' => $notes,
            ]);

            $employer->user?->update(['status' => $status]);
        });

        return $employer->fresh(['user'])->loadCount('jobPosts');
    }
}
