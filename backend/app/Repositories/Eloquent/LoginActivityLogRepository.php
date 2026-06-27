<?php

namespace App\Repositories\Eloquent;

use App\Enums\LoginAttemptStatus;
use App\Models\LoginActivityLog;
use App\Repositories\Contracts\LoginActivityLogRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class LoginActivityLogRepository implements LoginActivityLogRepositoryInterface
{
    public function __construct(
        protected LoginActivityLog $model
    ) {}

    public function paginate(
        int $perPage = 20,
        ?string $status = null,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        ?string $ip = null,
        ?string $search = null,
        string $sortDir = 'desc'
    ): LengthAwarePaginator {
        $sortDir = in_array($sortDir, ['asc', 'desc']) ? $sortDir : 'desc';

        return $this->model->newQuery()
            ->with('user:id,uuid,first_name,last_name,email,role')
            ->when($status, fn($q) => $q->where('status', $status))
            ->dateRange($dateFrom, $dateTo)
            ->byIp($ip)
            ->when($search, fn($q) => $q->where('email_attempted', 'LIKE', "%{$search}%"))
            ->orderBy('created_at', $sortDir)
            ->paginate($perPage);
    }

    public function log(
        ?int $userId,
        string $email,
        string $ip,
        ?string $userAgent,
        string $status
    ): void {
        $this->model->create([
            'user_id' => $userId,
            'email_attempted' => $email,
            'ip_address' => $ip,
            'user_agent' => $userAgent ? substr($userAgent, 0, 500) : null, // Truncate
            'status' => $status,
            'created_at' => now(),
        ]);
    }

    /**
     * Count recent failed attempts for an email (brute force detection).
     */
    public function getRecentFailedAttempts(string $email, int $minutes = 15): int
    {
        return $this->model
            ->where('email_attempted', $email)
            ->where('status', LoginAttemptStatus::FAILED)
            ->where('created_at', '>=', now()->subMinutes($minutes))
            ->count();
    }

    /**
     * Count recent failed attempts from an IP (distributed brute force detection).
     */
    public function getRecentFailedByIp(string $ip, int $minutes = 15): int
    {
        return $this->model
            ->where('ip_address', $ip)
            ->where('status', LoginAttemptStatus::FAILED)
            ->where('created_at', '>=', now()->subMinutes($minutes))
            ->count();
    }
}
