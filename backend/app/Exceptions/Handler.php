<?php

/*
|--------------------------------------------------------------------------
| Exception Handling — bootstrap/app.php configuration
|--------------------------------------------------------------------------
|
| Add this to your bootstrap/app.php withExceptions() callback.
| This ensures ALL errors return consistent JSON — never HTML.
|
| In bootstrap/app.php:
|
| ->withExceptions(function (Exceptions $exceptions) {
|     // Paste the handlers below
| })
|
*/

// ─── Add these inside withExceptions callback ────────────────

/*

use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ThrottleRequestsException;

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

// Catch-all for any other exception (only in production)
$exceptions->render(function (\Throwable $e) {
    if (app()->environment('production')) {
        return response()->json([
            'success' => false,
            'message' => 'An unexpected error occurred.',
        ], 500);
    }
    // In dev, let Laravel show the full error
    return null;
});

*/