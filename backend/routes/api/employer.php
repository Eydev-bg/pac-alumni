<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Employer\EmployerController;
use App\Http\Controllers\Api\Employer\EmployerDashboardController;
use App\Http\Controllers\Api\Employer\EmployerJobController;
use App\Http\Controllers\Api\Employer\EmployerRegistrationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Employer (HR) Routes
|--------------------------------------------------------------------------
|
| Public registration + login, plus employer-scoped authenticated routes.
| Login/logout/me reuse the shared AuthController (same JWT flow as auth.php).
|
*/

Route::prefix('employer')->group(function () {

    // ─── Public (No auth required) ───────────────────────
    Route::post('/register', [EmployerRegistrationController::class, 'register'])
        ->middleware('throttle:5,1')
        ->name('employer.register');

    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1')
        ->name('employer.login');

    // ─── Protected (JWT + active account + employer role) ─
    Route::middleware(['auth:api', 'account.status', 'role:employer'])->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('employer.logout');
        Route::get('/me', [AuthController::class, 'me'])->name('employer.me');

        // ─── Dashboard ────────────────────────────────────
        Route::get('/dashboard', [EmployerDashboardController::class, 'index'])
            ->name('employer.dashboard');

        // ─── Company profile ──────────────────────────────
        Route::get('/profile', [EmployerController::class, 'profile'])
            ->name('employer.profile');
        Route::put('/profile', [EmployerController::class, 'updateProfile'])
            ->name('employer.profile.update');

        // ─── Job management ───────────────────────────────
        Route::get('/jobs', [EmployerJobController::class, 'index'])
            ->name('employer.jobs.index');
        Route::post('/jobs', [EmployerJobController::class, 'store'])
            ->name('employer.jobs.store');
        Route::get('/jobs/{id}', [EmployerJobController::class, 'show'])
            ->whereNumber('id')->name('employer.jobs.show');
        Route::put('/jobs/{id}', [EmployerJobController::class, 'update'])
            ->whereNumber('id')->name('employer.jobs.update');
        Route::delete('/jobs/{id}', [EmployerJobController::class, 'destroy'])
            ->whereNumber('id')->name('employer.jobs.destroy');
        Route::patch('/jobs/{id}/close', [EmployerJobController::class, 'close'])
            ->whereNumber('id')->name('employer.jobs.close');

        // ─── Applicant management ─────────────────────────
        Route::get('/jobs/{id}/applicants', [EmployerJobController::class, 'applicants'])
            ->whereNumber('id')->name('employer.jobs.applicants');
        Route::patch('/applications/{id}/status', [EmployerJobController::class, 'updateApplicationStatus'])
            ->whereNumber('id')->name('employer.applications.status');
    });
});
