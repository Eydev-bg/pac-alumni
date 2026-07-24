<?php

namespace App\Services\Admin;

use App\Enums\AuditAction;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\Audit\AuditLogService;
use App\Services\Auth\PasswordResetService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class UserService
{
    public function __construct(
        protected UserRepositoryInterface $userRepo,
        protected AuditLogService $auditLog,
        protected PasswordResetService $passwordResetService,
        protected DashboardCacheService $dashboardCache,
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
            throw \App\Exceptions\DomainException::notFound('User not found.');
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

        $user = $this->userRepo->create($data);

        $this->auditLog->record(AuditAction::USER_CREATED, $user, [
            'email' => $user->email,
            'role' => $user->role->value,
        ]);

        return $user;
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

        $updated = $this->userRepo->update($user, $data);

        // Record which fields were touched — never the values (avoids logging
        // passwords or PII into the audit trail).
        $this->auditLog->record(AuditAction::USER_UPDATED, $updated, [
            'fields' => array_values(array_diff(array_keys($data), ['password'])),
        ]);

        return $updated;
    }

    /**
     * Change user status (activate/suspend/deactivate).
     */
    public function updateStatus(User $user, string $status): User
    {
        $newStatus = UserStatus::from($status);

        // SECURITY: Cannot suspend/deactivate yourself
        if ($user->id === auth()->id()) {
            throw \App\Exceptions\DomainException::forbidden('You cannot change your own account status.');
        }

        // SECURITY: Cannot suspend other admins (only super-admin logic, optional)
        if ($user->isAdmin() && $newStatus !== UserStatus::ACTIVE) {
            throw \App\Exceptions\DomainException::forbidden('Cannot suspend or deactivate an admin account.');
        }

        $previousStatus = $user->status;
        $updated = $this->userRepo->updateStatus($user, $newStatus);

        $this->auditLog->record(AuditAction::USER_STATUS_CHANGED, $updated, [
            'from' => $previousStatus->value,
            'to' => $newStatus->value,
        ]);

        // Activating/suspending/deactivating a user changes the admin dashboard
        // active/inactive alumni counts, which are served from a short-TTL cache.
        $this->dashboardCache->flush();

        return $updated;
    }

    /**
     * Admin-initiated password reset.
     *
     * SECURITY: Emails the user a one-time reset link instead of returning a
     * plaintext temporary password. The admin never sees the user's password.
     */
    public function resetPassword(User $user): void
    {
        // SECURITY: Cannot reset your own password through this endpoint
        if ($user->id === auth()->id()) {
            throw \App\Exceptions\DomainException::forbidden('Use the change password feature to update your own password.');
        }

        $this->passwordResetService->sendAdminResetLink($user);

        $this->auditLog->record(AuditAction::USER_PASSWORD_RESET, $user);
    }
}
