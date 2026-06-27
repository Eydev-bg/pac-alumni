<?php

namespace App\Services\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class UserService
{
    public function __construct(
        protected UserRepositoryInterface $userRepo,
    ) {}

    /**
     * Get paginated users with filters.
     * IMPORTANT: Alumni are excluded by default from this list.
     * Alumni accounts are managed via the Alumni Search page (/admin/alumni).
     * This prevents the Users page from being flooded when thousands
     * of alumni register — staff management stays clean and fast.
     */
    public function list(
        int $perPage = 15,
        ?string $search = null,
        ?string $role = null,
        ?string $status = null,
        string $sortBy = 'created_at',
        string $sortDir = 'desc'
    ): LengthAwarePaginator {
        // Only exclude alumni when no specific role filter is applied.
        // If admin explicitly filters by 'alumni', they can still see them.
        $excludeRole = null;
        if (!$role || $role !== UserRole::ALUMNI->value) {
            $excludeRole = UserRole::ALUMNI;
        }

        return $this->userRepo->paginate(
            $perPage,
            $search,
            $role ? UserRole::from($role) : null,
            $status ? UserStatus::from($status) : null,
            $sortBy,
            $sortDir,
            $role ? null : $excludeRole // Don't exclude if specific role is requested
        );
    }

    /**
     * Find user by UUID or fail.
     */
    public function findByUuid(string $uuid): User
    {
        $user = $this->userRepo->findByUuid($uuid);

        if (!$user) {
            throw new \Exception('User not found.', 404);
        }

        return $user;
    }

    /**
     * Create a new user (admin-created accounts).
     */
    public function create(array $data): User
    {
        // Generate a temporary password if not provided
        if (empty($data['password'])) {
            $data['password'] = Str::random(16);
        }

        return $this->userRepo->create($data);
    }

    /**
     * Update user details.
     */
    public function update(User $user, array $data): User
    {
        // SECURITY: Don't allow changing role to admin unless current user is admin
        // This is also enforced in the FormRequest, but defense in depth
        if (isset($data['role']) && $data['role'] === UserRole::ADMIN->value) {
            unset($data['role']);
        }

        // Remove password if empty (don't overwrite)
        if (empty($data['password'])) {
            unset($data['password']);
        }

        return $this->userRepo->update($user, $data);
    }

    /**
     * Change user status (activate/suspend/deactivate).
     */
    public function updateStatus(User $user, string $status): User
    {
        $newStatus = UserStatus::from($status);

        // SECURITY: Cannot suspend/deactivate yourself
        if ($user->id === auth()->id()) {
            throw new \Exception('You cannot change your own account status.', 403);
        }

        // SECURITY: Cannot suspend other admins (only super-admin logic, optional)
        if ($user->isAdmin() && $newStatus !== UserStatus::ACTIVE) {
            throw new \Exception('Cannot suspend or deactivate an admin account.', 403);
        }

        return $this->userRepo->updateStatus($user, $newStatus);
    }

    /**
     * Admin-initiated password reset.
     */
    public function resetPassword(User $user): string
    {
        // SECURITY: Cannot reset your own password through this endpoint
        if ($user->id === auth()->id()) {
            throw new \Exception('Use the change password feature to update your own password.', 403);
        }

        $newPassword = Str::random(12);

        $this->userRepo->update($user, [
            'password' => $newPassword, // Model auto-hashes via cast
        ]);

        return $newPassword;
    }
}
