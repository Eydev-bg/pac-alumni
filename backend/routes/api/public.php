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
Route::get('/landing/stats', LandingStatsController::class)
    ->middleware('throttle:30,1')
    ->name('landing.stats');
