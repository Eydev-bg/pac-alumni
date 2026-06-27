<?php

namespace App\Repositories\Contracts;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface UserRepositoryInterface
{
    public function paginate(
        int $perPage = 15,
        ?string $search = null,
        ?UserRole $role = null,
        ?UserStatus $status = null,
        string $sortBy = 'created_at',
        string $sortDir = 'desc',
        ?UserRole $excludeRole = null
    ): LengthAwarePaginator;

    public function findByUuid(string $uuid): ?User;

    public function findByEmail(string $email): ?User;

    public function create(array $data): User;

    public function update(User $user, array $data): User;

    public function updateStatus(User $user, UserStatus $status): User;

    public function updateLastLogin(User $user, string $ip): void;
}
