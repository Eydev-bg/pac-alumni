<?php

namespace App\Repositories\Eloquent;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UserRepository implements UserRepositoryInterface
{
    public function __construct(
        protected User $model
    ) {}

    public function paginate(
        int $perPage = 15,
        ?string $search = null,
        ?UserRole $role = null,
        ?UserStatus $status = null,
        string $sortBy = 'created_at',
        string $sortDir = 'desc',
        ?UserRole $excludeRole = null
    ): LengthAwarePaginator {
        // SECURITY: Whitelist sortable columns to prevent SQL injection
        $allowedSorts = ['created_at', 'first_name', 'last_name', 'email', 'role', 'status'];
        $sortBy = in_array($sortBy, $allowedSorts) ? $sortBy : 'created_at';
        $sortDir = in_array($sortDir, ['asc', 'desc']) ? $sortDir : 'desc';

        return $this->model->newQuery()
            ->search($search)
            ->when($role, fn($q) => $q->byRole($role))
            ->when($excludeRole, fn($q) => $q->where('role', '!=', $excludeRole))
            ->when($status, fn($q) => $q->where('status', $status))
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function findByUuid(string $uuid): ?User
    {
        return $this->model->where('uuid', $uuid)->first();
    }

    public function findByEmail(string $email): ?User
    {
        return $this->model->where('email', $email)->first();
    }

    public function create(array $data): User
    {
        return $this->model->create($data);
    }

    public function update(User $user, array $data): User
    {
        $user->update($data);
        return $user->fresh();
    }

    public function updateStatus(User $user, UserStatus $status): User
    {
        $user->update(['status' => $status]);
        return $user->fresh();
    }

    public function updateLastLogin(User $user, string $ip): void
    {
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $ip,
        ]);
    }
}
