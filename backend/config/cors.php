<?php

/*
|--------------------------------------------------------------------------
| CORS Configuration
|--------------------------------------------------------------------------
|
| SECURITY: Only allow requests from your React frontend domain.
| In production, change allowed_origins to your actual domain.
|
*/

return [

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    // SECURITY: Restrict to your frontend domain only
    'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],

    'exposed_headers' => [],

    'max_age' => 86400, // 24 hours — browsers cache preflight

    'supports_credentials' => false, // No cookies — we use JWT in Authorization header

];
