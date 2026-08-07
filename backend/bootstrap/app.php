<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\ThrottleRequestsException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        // Loads Broadcast::channel() authorization callbacks (routes/channels.php).
        // NOTE: this does NOT register Laravel's default session-based
        // /broadcasting/auth route — this app is JWT-only (auth:api), so
        // that endpoint is registered manually in routes/api/*.php instead,
        // pointed at App\Http\Controllers\Api\BroadcastAuthController.
        channels: __DIR__ . '/../routes/channels.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {

        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'account.status' => \App\Http\Middleware\CheckAccountStatus::class,
            'maintenance' => \App\Http\Middleware\CheckMaintenanceMode::class,
        ]);

        // SECURITY: Trust the configured reverse proxy / load balancer so
        // $request->ip() reflects the real client (accurate login logs +
        // brute-force throttle keys). Driven by TRUSTED_PROXIES env — note the
        // config service is not yet bound at this bootstrap stage, so env() is
        // the correct source here. In production set TRUSTED_PROXIES as a real
        // environment variable so it resolves even under `config:cache`.
        $proxies = (string) env('TRUSTED_PROXIES', '');
        if ($proxies !== '') {
            $middleware->trustProxies(
                at: $proxies === '*' ? '*' : array_map('trim', explode(',', $proxies)),
            );
        }

        // SECURITY: Attach hardening headers to every response and reject JWTs
        // whose password fingerprint is stale (invalidated after a password change).
        // TrackLastActive: best-effort "online status" heartbeat (throttled
        // write, see the middleware itself) — powers the simple green-dot /
        // "Active X ago" chat presence indicator without a WebSocket
        // presence channel.
        $middleware->append([
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\EnsureTokenPasswordIsCurrent::class,
            \App\Http\Middleware\TrackLastActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {

        $exceptions->render(function (AuthenticationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please login.',
            ], 401);
        });

        $exceptions->render(function (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        });

        $exceptions->render(function (NotFoundHttpException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Resource not found.',
            ], 404);
        });

        $exceptions->render(function (MethodNotAllowedHttpException $e) {
            return response()->json([
                'success' => false,
                'message' => 'HTTP method not allowed.',
            ], 405);
        });

        $exceptions->render(function (AccessDeniedHttpException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Access denied.',
            ], 403);
        });

        $exceptions->render(function (ThrottleRequestsException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Too many requests. Please slow down.',
            ], 429);
        });

        $exceptions->render(function (\App\Exceptions\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $e->status());
        });

        $exceptions->render(function (\Throwable $e) {
            if (app()->environment('production')) {
                return response()->json([
                    'success' => false,
                    'message' => 'An unexpected error occurred.',
                ], 500);
            }
            return null;
        });
    })->create();
