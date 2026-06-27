<?php

namespace App\Repositories\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface LoginActivityLogRepositoryInterface
{
    public function paginate(
        int $perPage = 20,
        ?string $status = null,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        ?string $ip = null,
        ?string $search = null,
        string $sortDir = 'desc'
    ): LengthAwarePaginator;

    public function log(
        ?int $userId,
        string $email,
        string $ip,
        ?string $userAgent,
        string $status
    ): void;

    public function getRecentFailedAttempts(string $email, int $minutes = 15): int;

    public function getRecentFailedByIp(string $ip, int $minutes = 15): int;
}
