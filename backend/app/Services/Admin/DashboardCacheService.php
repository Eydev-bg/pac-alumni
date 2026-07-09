<?php

namespace App\Services\Admin;

use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * Single owner of the admin dashboard cache (key + TTL + invalidation), so the
 * controller that reads it and the writers that invalidate it share one source
 * of truth. Key/TTL are config-driven (config/dashboard.php).
 */
class DashboardCacheService
{
    /**
     * Return the cached dashboard payload, computing + storing it on a miss.
     */
    public function remember(Closure $callback): array
    {
        return Cache::remember($this->key(), $this->ttl(), $callback);
    }

    /**
     * Invalidate the cached dashboard payload (call after relevant writes).
     */
    public function flush(): void
    {
        Cache::forget($this->key());
    }

    private function key(): string
    {
        return (string) config('dashboard.cache.key');
    }

    private function ttl(): int
    {
        return (int) config('dashboard.cache.ttl');
    }
}
