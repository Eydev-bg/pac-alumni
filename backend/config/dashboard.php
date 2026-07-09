<?php

/*
|--------------------------------------------------------------------------
| Admin Dashboard
|--------------------------------------------------------------------------
|
| The dashboard aggregates ~20 queries into a single payload. It is cached
| with a short TTL and explicitly invalidated after graduate imports/edits
| (see App\Services\Admin\DashboardCacheService). Values are env-driven so
| the cache key/TTL can be tuned per environment without code changes.
|
*/

return [

    'cache' => [
        'key' => env('DASHBOARD_CACHE_KEY', 'admin:dashboard'),
        // Short TTL: stale-tolerant metrics (alumni-side changes surface within
        // this window); admin graduate imports/edits invalidate immediately.
        'ttl' => (int) env('DASHBOARD_CACHE_TTL', 300), // seconds
    ],

];
