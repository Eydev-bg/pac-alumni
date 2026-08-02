<?php

use Illuminate\Support\Str;

return [

    /*
    |----------------------------------------------------------------------
    | Reverb Servers
    |----------------------------------------------------------------------
    |
    | Single "reverb" server, standalone mode — no Redis / scaling driver.
    | This matches current scale: one Railway service running
    | `php artisan reverb:start`, no horizontal replicas. If concurrent
    | WebSocket connections grow enough to need multiple Reverb instances,
    | add a Redis service and set 'scaling.enabled' => true +
    | 'scaling.channel' below — nothing else in this file changes.
    |
    */

    'default' => env('REVERB_SERVER', 'reverb'),

    'servers' => [

        'reverb' => [
            // Railway injects PORT — Reverb must bind to it, same pattern as
            // the web service's `php artisan serve --port=${PORT}`.
            'host' => env('REVERB_SERVER_HOST', '0.0.0.0'),
            'port' => env('REVERB_SERVER_PORT', env('PORT', 8080)),
            'hostname' => env('REVERB_HOST'),
            'options' => [
                'tls' => [],
            ],
            'max_request_size' => env('REVERB_MAX_REQUEST_SIZE', 10_000),
            'scaling' => [
                'enabled' => env('REVERB_SCALING_ENABLED', false),
                'channel' => env('REVERB_SCALING_CHANNEL', 'reverb'),
                'server' => [
                    'url' => env('REDIS_URL'),
                ],
            ],
            'pulse_ingest_interval' => env('REVERB_PULSE_INGEST_INTERVAL', 15),
            'telescope_ingest_interval' => env('REVERB_TELESCOPE_INGEST_INTERVAL', 15),
        ],

    ],

    /*
    |----------------------------------------------------------------------
    | Reverb Applications
    |----------------------------------------------------------------------
    |
    | Single application ("PAC Alumni"), credentials from env. Mirrors the
    | broadcasting.php 'reverb' connection block — REVERB_APP_KEY /
    | REVERB_APP_SECRET / REVERB_APP_ID must match on both sides.
    |
    */

    'apps' => [

        'provider' => 'config',

        'apps' => [
            [
                'app_id' => env('REVERB_APP_ID'),
                'app_key' => env('REVERB_APP_KEY'),
                'app_secret' => env('REVERB_APP_SECRET'),
                'options' => [
                    'host' => env('REVERB_HOST'),
                    'port' => env('REVERB_PORT', 443),
                    'scheme' => env('REVERB_SCHEME', 'https'),
                    'useTLS' => env('REVERB_SCHEME', 'https') === 'https',
                ],
                'allowed_origins' => array_filter(explode(',', env('REVERB_ALLOWED_ORIGINS', env('CORS_ALLOWED_ORIGINS', '')))),
                'ping_interval' => env('REVERB_APP_PING_INTERVAL', 60),
                'activity_timeout' => env('REVERB_APP_ACTIVITY_TIMEOUT', 30),
                'max_message_size' => env('REVERB_APP_MAX_MESSAGE_SIZE', 10_000),
            ],
        ],

    ],

];
