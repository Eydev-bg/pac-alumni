<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\RegistrationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication & Registration Routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {

    // ─── Public (No auth required) ───────────────────────
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1')
        ->name('auth.login');

    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
        ->middleware('throttle:3,1')
        ->name('auth.forgot-password');

    Route::post('/reset-password', [AuthController::class, 'resetPassword'])
        ->middleware('throttle:5,1')
        ->name('auth.reset-password');

    // ─── Protected (JWT required) ────────────────────────
    // Logout must stay reachable during maintenance: CheckMaintenanceMode 503s
    // non-admins, so a logged-in alumnus would otherwise be unable to end their
    // session. It is deliberately kept OUT of the 'maintenance' group.
    Route::middleware(['auth:api', 'account.status'])->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
    });

    Route::middleware(['auth:api', 'account.status', 'maintenance'])->group(function () {
        Route::post('/refresh', [AuthController::class, 'refresh'])->name('auth.refresh');
        Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
        Route::put('/profile', [AuthController::class, 'updateProfile'])
            ->name('auth.update-profile');
        Route::put('/change-password', [AuthController::class, 'changePassword'])
            ->name('auth.change-password');
    });
});

// ─── Alumni Registration (Public, Phase 4) ───────────────
Route::prefix('registration')->group(function () {
    Route::get('/status', [RegistrationController::class, 'status'])
        ->name('registration.status');

    Route::post('/verify', [RegistrationController::class, 'verify'])
        ->middleware('throttle:5,1') // SECURITY: 5 attempts per minute
        ->name('registration.verify');
});
