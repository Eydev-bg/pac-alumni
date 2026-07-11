<?php

use App\Http\Controllers\Api\Alumni\AchievementFeedController;
use App\Http\Controllers\Api\Alumni\AlumniAnnouncementController;
use App\Http\Controllers\Api\Alumni\AlumniController;
use App\Http\Controllers\Api\Alumni\AlumniJobController;
use App\Http\Controllers\Api\Alumni\BoardExamController;
use App\Http\Controllers\Api\Alumni\AlumniEventController;
use App\Http\Controllers\Api\Alumni\EmploymentController;
use App\Http\Controllers\Api\Alumni\MessageController;
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

Route::prefix('alumni')->middleware(['auth:api', 'account.status', 'role:alumni', 'maintenance'])->group(function () {

    // ─── Dashboard ────────────────────────────────────────
    Route::get('/dashboard', [AlumniController::class, 'dashboard'])
        ->name('alumni.dashboard');

    // ─── Profile Management (Features 5-8) ────────────────
    Route::get('/profile', [AlumniController::class, 'profile'])
        ->name('alumni.profile');

    Route::get('/profile/completion', [AlumniController::class, 'profileCompletion'])
        ->name('alumni.profile.completion');

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

    // ─── Job Board (Phase 1.6) ────────────────────────────
    Route::get('/jobs', [AlumniJobController::class, 'index'])
        ->name('alumni.jobs.index');
    Route::get('/my-applications', [AlumniJobController::class, 'myApplications'])
        ->name('alumni.my-applications');
    Route::get('/jobs/{id}', [AlumniJobController::class, 'show'])
        ->whereNumber('id')->name('alumni.jobs.show');
    Route::post('/jobs/{id}/apply', [AlumniJobController::class, 'apply'])
        ->whereNumber('id')->name('alumni.jobs.apply');

    // ─── Announcements (Phase 2) ──────────────────────────
    Route::get('/announcements', [AlumniAnnouncementController::class, 'index'])
        ->name('alumni.announcements.index');
    Route::get('/announcements/unread-count', [AlumniAnnouncementController::class, 'unreadCount'])
        ->name('alumni.announcements.unread-count');
    Route::get('/announcements/{id}', [AlumniAnnouncementController::class, 'show'])
        ->whereNumber('id')->name('alumni.announcements.show');
    Route::post('/announcements/{id}/read', [AlumniAnnouncementController::class, 'markAsRead'])
        ->whereNumber('id')->name('alumni.announcements.read');

    // ─── Events (Phase 2) ─────────────────────────────────
    Route::get('/events', [AlumniEventController::class, 'index'])
        ->name('alumni.events.index');
    Route::get('/events/{id}', [AlumniEventController::class, 'show'])
        ->whereNumber('id')->name('alumni.events.show');
    Route::post('/events/{id}/rsvp', [AlumniEventController::class, 'rsvp'])
        ->whereNumber('id')->name('alumni.events.rsvp');
    Route::delete('/events/{id}/rsvp', [AlumniEventController::class, 'cancelRsvp'])
        ->whereNumber('id')->name('alumni.events.rsvp.cancel');

    // ─── Achievement Feed (Phase 3.1) ────────────────────
    Route::get('/achievement-feed', [AchievementFeedController::class, 'index'])
        ->name('alumni.achievement-feed.index');
    Route::patch('/achievement-feed/{id}/visibility', [AchievementFeedController::class, 'toggleVisibility'])
        ->whereNumber('id')->name('alumni.achievement-feed.visibility');

    // ─── Messaging (Phase 3.3) ────────────────────────────
    // Static segments declared before the parameterized {id} routes so they
    // are not swallowed by the wildcard.
    Route::get('/messages/unread-count', [MessageController::class, 'unreadCount'])
        ->name('alumni.messages.unread-count');
    Route::get('/messages/recipients', [MessageController::class, 'recipients'])
        ->name('alumni.messages.recipients');

    Route::get('/conversations', [MessageController::class, 'conversations'])
        ->name('alumni.conversations.index');
    Route::post('/conversations', [MessageController::class, 'startConversation'])
        ->name('alumni.conversations.start');
    Route::get('/conversations/{id}/messages', [MessageController::class, 'messages'])
        ->whereNumber('id')->name('alumni.conversations.messages');
    // Rate limited: max 20 messages per hour per user (spam prevention).
    Route::post('/conversations/{id}/messages', [MessageController::class, 'sendMessage'])
        ->whereNumber('id')->middleware('throttle:20,60')->name('alumni.conversations.send');
});
