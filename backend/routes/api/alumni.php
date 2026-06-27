<?php

use App\Http\Controllers\Api\Alumni\AlumniController;
use App\Http\Controllers\Api\Alumni\BoardExamController;
use App\Http\Controllers\Api\Alumni\EmploymentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Alumni Routes (Protected: auth + role:alumni)
|--------------------------------------------------------------------------
|
| All routes prefixed with /api/alumni
| Requires JWT authentication + alumni role.
|
*/

Route::prefix('alumni')->middleware(['auth:api', 'account.status', 'role:alumni'])->group(function () {

    // ─── Dashboard ────────────────────────────────────────
    Route::get('/dashboard', [AlumniController::class, 'dashboard'])
        ->name('alumni.dashboard');

    // ─── Profile Management (Features 5-8) ────────────────
    Route::get('/profile', [AlumniController::class, 'profile'])
        ->name('alumni.profile');

    Route::put('/profile', [AlumniController::class, 'updateProfile'])
        ->name('alumni.profile.update');

    Route::post('/profile/picture', [AlumniController::class, 'uploadPicture'])
        ->name('alumni.profile.picture.upload');

    Route::delete('/profile/picture', [AlumniController::class, 'removePicture'])
        ->name('alumni.profile.picture.remove');

    // ─── Board Exam Module (Features 9-12) ────────────────
    Route::get('/board-exam', [BoardExamController::class, 'index'])
        ->name('alumni.board-exam.index');

    Route::post('/board-exam', [BoardExamController::class, 'store'])
        ->name('alumni.board-exam.store');

    // ─── Employment Module (Features 13-18) ───────────────
    Route::get('/employment', [EmploymentController::class, 'index'])
        ->name('alumni.employment.index');

    Route::post('/employment', [EmploymentController::class, 'store'])
        ->name('alumni.employment.store');
});
