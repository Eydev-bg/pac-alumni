<?php

use App\Http\Controllers\Api\Public\LandingStatsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes (No auth required)
|--------------------------------------------------------------------------
|
| Non-sensitive, aggregate-only endpoints safe to expose without a token.
| Throttled to prevent abuse.
|
*/

// ─── Landing page statistics ─────────────────────────────
// Uses the named 'landing-stats' limiter (120/min per IP, defined in
// AppServiceProvider) so its throttle counter is isolated from the shared
// anonymous bucket used by other unauthenticated routes on the same IP.
Route::get('/landing/stats', LandingStatsController::class)
    ->middleware('throttle:landing-stats')
    ->name('landing.stats');
