<?php

/*
|--------------------------------------------------------------------------
| Broadcasting Configuration
|--------------------------------------------------------------------------
|
| This app is API-only (JWT via auth:api, no sessions/cookies — see
| config/cors.php). Laravel's default broadcasting auth route relies on
| the 'web' guard, so we do NOT use it. Instead, a custom
| POST /api/broadcasting/auth route (auth:api protected) is registered in
| routes/api/alumni.php and routes/api/admin.php equivalents, using the
| same Bearer-token pattern as every other authenticated API call.
|
| BROADCAST_CONNECTION=reverb in production. 'log' locally lets you develop
| without running the Reverb server. Default here is 'null' so the test
| suite and any environment without BROADCAST_CONNECTION set never attempts
| a real network call — broadcast() calls become no-ops.
|
*/

return [

    'default' => env('BROADCAST_CONNECTION', 'null'),

    'connections' => [

        'reverb' => [
            'driver' => 'reverb',
            'key' => env('REVERB_APP_KEY'),
            'secret' => env('REVERB_APP_SECRET'),
            'app_id' => env('REVERB_APP_ID'),
            'options' => [
                'host' => env('REVERB_HOST'),
                'port' => env('REVERB_PORT', 443),
                'scheme' => env('REVERB_SCHEME', 'https'),
                'useTLS' => env('REVERB_SCHEME', 'https') === 'https',
            ],
            'client_options' => [
                // Guzzle options for server -> Reverb HTTP calls (event publish).
            ],
        ],

        'log' => [
            'driver' => 'log',
        ],

        'null' => [
            'driver' => 'null',
        ],

    ],

];
