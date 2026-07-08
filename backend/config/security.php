<?php

/*
|--------------------------------------------------------------------------
| Security Headers Configuration
|--------------------------------------------------------------------------
|
| Values consumed by App\Http\Middleware\SecurityHeaders. Everything is
| env-driven so policies can be tightened per environment without code
| changes. This API returns JSON (the React SPA is served separately), so a
| restrictive default Content-Security-Policy is safe.
|
*/

return [

    // Static response headers applied to every response.
    'headers' => [
        'X-Frame-Options' => env('SECURITY_X_FRAME_OPTIONS', 'DENY'),
        'X-Content-Type-Options' => 'nosniff',
        'Referrer-Policy' => env('SECURITY_REFERRER_POLICY', 'no-referrer'),
        'Content-Security-Policy' => env(
            'SECURITY_CSP',
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
        ),
    ],

    /*
    | HTTP Strict Transport Security.
    | Only emitted over HTTPS in the production environment so local/HTTP
    | development is never pinned to HTTPS by an accidental cached header.
    */
    'hsts' => [
        'enabled' => (bool) env('SECURITY_HSTS_ENABLED', true),
        'max_age' => (int) env('SECURITY_HSTS_MAX_AGE', 31536000), // 1 year
        'include_subdomains' => (bool) env('SECURITY_HSTS_INCLUDE_SUBDOMAINS', true),
        'preload' => (bool) env('SECURITY_HSTS_PRELOAD', false),
    ],

];
