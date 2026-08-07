<?php

use App\Http\Controllers\Api\Admin\AdminJobPostingController;
use App\Http\Controllers\Api\Admin\AnnouncementController;
use App\Http\Controllers\Api\Admin\GraduateTracerController;
use App\Http\Controllers\Api\Admin\AlumniSearchController;
use App\Http\Controllers\Api\Admin\AnalyticsController;
use App\Http\Controllers\Api\Admin\CourseController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\DepartmentController;
use App\Http\Controllers\Api\Admin\EmailLogController;
use App\Http\Controllers\Api\Admin\EventController;
use App\Http\Controllers\Api\Admin\GraduateController;
use App\Http\Controllers\Api\Admin\LoginActivityLogController;
use App\Http\Controllers\Api\Admin\NotificationController;
use App\Http\Controllers\Api\Admin\ReminderController;
use App\Http\Controllers\Api\Admin\ReportController;
use App\Http\Controllers\Api\Admin\SettingsController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\VerificationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| SECURITY: All routes protected by:
| 1. auth:api — Must have valid JWT
| 2. account.status — Account must be active
| 3. role:admin — Must have admin role
|
*/

Route::prefix('admin')
    ->middleware(['auth:api', 'account.status', 'role:admin', \App\Http\Middleware\TrackLastActive::class])
    ->name('admin.')
    ->group(function () {

        // ─── Dashboard (Aggregated Data) ─────────────────
        Route::get('/dashboard', [DashboardController::class, 'index'])
            ->name('dashboard');

        // ─── User Management ─────────────────────────────
        Route::apiResource('users', UserController::class)
            ->parameters(['users' => 'user'])
            ->names('users');

        Route::patch('/users/{user}/status', [UserController::class, 'updateStatus'])
            ->name('users.update-status');

        Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword'])
            ->name('users.reset-password');

        // ─── Login Activity Logs ─────────────────────────
        Route::get('/login-logs', [LoginActivityLogController::class, 'index'])
            ->name('login-logs.index');

        // ─── Department Management (Phase 2) ─────────────
        Route::get('/departments/all', [DepartmentController::class, 'all'])
            ->name('departments.all');

        Route::apiResource('departments', DepartmentController::class)
            ->names('departments');

        Route::patch('/departments/{department}/status', [DepartmentController::class, 'updateStatus'])
            ->name('departments.update-status');

        Route::get('/departments/{department}/stats', [DepartmentController::class, 'stats'])
            ->name('departments.stats');

        // ─── Course Management (Hybrid Restructure) ─────
        Route::get('/courses/all', [CourseController::class, 'all'])
            ->name('courses.all');

        Route::get('/courses', [CourseController::class, 'index'])
            ->name('courses.index');

        Route::post('/courses', [CourseController::class, 'store'])
            ->name('courses.store');

        Route::put('/courses/{id}', [CourseController::class, 'update'])
            ->name('courses.update');

        Route::delete('/courses/{id}', [CourseController::class, 'destroy'])
            ->name('courses.destroy');

        Route::patch('/courses/{id}/status', [CourseController::class, 'updateStatus'])
            ->name('courses.update-status');

        // ─── Graduate Management (Phase 3) ───────────────
        Route::get('/graduates/years', [GraduateController::class, 'graduationYears'])
            ->name('graduates.years');

        Route::post('/graduates/import', [GraduateController::class, 'import'])
            ->name('graduates.import');

        Route::get('/graduates/import-history', [GraduateController::class, 'importHistory'])
            ->name('graduates.import-history');

        Route::get('/graduates/import-history/{id}', [GraduateController::class, 'importDetail'])
            ->name('graduates.import-detail');

        Route::post('/graduates/check-duplicates', [GraduateController::class, 'checkDuplicates'])
            ->name('graduates.check-duplicates');

        Route::patch('/graduates/batch-update', [GraduateController::class, 'batchUpdate'])
            ->name('graduates.batch-update');

        // ─── Graduate Trash / Soft-delete (Phase 5) ──────
        Route::get('/graduates/trashed', [GraduateController::class, 'trashed'])
            ->name('graduates.trashed');

        Route::post('/graduates/{id}/restore', [GraduateController::class, 'restore'])
            ->whereNumber('id')->name('graduates.restore');

        Route::delete('/graduates/{id}/force', [GraduateController::class, 'forceDelete'])
            ->whereNumber('id')->name('graduates.force-delete');

        Route::apiResource('graduates', GraduateController::class)
            ->only(['index', 'show', 'update', 'destroy'])
            ->names('graduates');

        // ─── System Settings — Maintenance Mode ──────────
        Route::get('/settings/maintenance', [SettingsController::class, 'getMaintenance'])
            ->name('settings.maintenance.show');

        Route::put('/settings/maintenance', [SettingsController::class, 'updateMaintenance'])
            ->name('settings.maintenance.update');

        // ─── Verification & Registration (Phase 4) ───────
        Route::get('/registration/settings', [VerificationController::class, 'getSettings'])
            ->name('registration.settings.show');

        Route::put('/registration/settings', [VerificationController::class, 'updateSettings'])
            ->name('registration.settings.update');

        Route::get('/verification/logs', [VerificationController::class, 'logs'])
            ->name('verification.logs');

        Route::get('/verification/verified', [VerificationController::class, 'verified'])
            ->name('verification.verified');

        Route::get('/verification/rejected', [VerificationController::class, 'rejected'])
            ->name('verification.rejected');

        Route::get('/verification/stats', [VerificationController::class, 'stats'])
            ->name('verification.stats');

        Route::get('/blacklist', [VerificationController::class, 'blacklist'])
            ->name('blacklist.index');

        Route::post('/blacklist', [VerificationController::class, 'addToBlacklist'])
            ->name('blacklist.store');

        Route::delete('/blacklist/{id}', [VerificationController::class, 'removeFromBlacklist'])
            ->name('blacklist.destroy');



        // ─── Graduate Tracer Analytics ───────────────────
        Route::prefix('tracer')->name('tracer.')->group(function () {
            Route::get('/summary', [GraduateTracerController::class, 'summary'])
                ->name('summary');

            Route::get('/by-course', [GraduateTracerController::class, 'byCourse'])
                ->name('by-course');

            Route::get('/employment-trend', [GraduateTracerController::class, 'employmentTrend'])
                ->name('employment-trend');

            Route::get('/export', [GraduateTracerController::class, 'export'])
                ->name('export')
                ->middleware('throttle:10,1'); // Rate limit: 10 exports per minute
        });

        // ─── Analytics Dashboard (Phase 5) ───────────────
        Route::prefix('analytics')->name('analytics.')->group(function () {
            Route::get('/overview', [AnalyticsController::class, 'overview'])->name('overview');
            Route::get('/elementary', [AnalyticsController::class, 'elementary'])->name('elementary');
            Route::get('/jhs', [AnalyticsController::class, 'jhs'])->name('jhs');
            Route::get('/shs', [AnalyticsController::class, 'shs'])->name('shs');
            Route::get('/college', [AnalyticsController::class, 'college'])->name('college');
            Route::get('/college/board-exams', [AnalyticsController::class, 'boardExams'])->name('college.board-exams');
            Route::get('/college/employment', [AnalyticsController::class, 'employment'])->name('college.employment');
        });

        // ─── Alumni Search Directory (Phase 6) ───────────
        Route::get('/alumni/search', [AlumniSearchController::class, 'search'])
            ->name('alumni.search');

        Route::get('/alumni/{graduate_id}/profile', [AlumniSearchController::class, 'profile'])
            ->name('alumni.profile');

        // ─── Notifications (Phase 6) ─────────────────────
        Route::get('/notifications', [NotificationController::class, 'index'])
            ->name('notifications.index');

        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])
            ->name('notifications.unread-count');

        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead'])
            ->name('notifications.mark-read');

        Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead'])
            ->name('notifications.read-all');

        // ─── Reminder Stats (Phase 4.3) ──────────────────
        Route::get('/reminders/stats', [ReminderController::class, 'stats'])
            ->name('reminders.stats');

        // ─── Email Logs (Phase 6) ────────────────────────
        Route::get('/email-logs', [EmailLogController::class, 'index'])
            ->name('email-logs.index');

        // ─── Reports & Export (Phase 6) ──────────────────
        Route::prefix('reports')->name('reports.')->group(function () {
            // ─── Consolidated exports (xlsx/csv/pdf) ─────────
            Route::get('/board-passing/export', [ReportController::class, 'exportBoardPassing'])->name('board-passing.export')->middleware('throttle:10,1');
            Route::get('/employment/export', [ReportController::class, 'exportEmployment'])->name('employment.export')->middleware('throttle:10,1');
            Route::get('/alumni-id-list/export', [ReportController::class, 'exportAlumniIdList'])->name('alumni-id-list.export')->middleware('throttle:10,1');
        });

        // ─── Announcement Module (Phase 2) ───────────────
        Route::get('/announcements', [AnnouncementController::class, 'index'])
            ->name('announcements.index');
        Route::post('/announcements', [AnnouncementController::class, 'store'])
            ->name('announcements.store');
        Route::get('/announcements/{id}', [AnnouncementController::class, 'show'])
            ->whereNumber('id')->name('announcements.show');
        Route::put('/announcements/{id}', [AnnouncementController::class, 'update'])
            ->whereNumber('id')->name('announcements.update');
        Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy'])
            ->whereNumber('id')->name('announcements.destroy');
        Route::patch('/announcements/{id}/publish', [AnnouncementController::class, 'publish'])
            ->whereNumber('id')->name('announcements.publish');
        Route::patch('/announcements/{id}/archive', [AnnouncementController::class, 'archive'])
            ->whereNumber('id')->name('announcements.archive');
        Route::patch('/announcements/{id}/pin', [AnnouncementController::class, 'togglePin'])
            ->whereNumber('id')->name('announcements.pin');

        // ─── Event Module (Phase 2) ──────────────────────
        Route::get('/events', [EventController::class, 'index'])
            ->name('events.index');
        Route::post('/events', [EventController::class, 'store'])
            ->name('events.store');
        Route::get('/events/{id}', [EventController::class, 'show'])
            ->whereNumber('id')->name('events.show');
        Route::put('/events/{id}', [EventController::class, 'update'])
            ->whereNumber('id')->name('events.update');
        Route::delete('/events/{id}', [EventController::class, 'destroy'])
            ->whereNumber('id')->name('events.destroy');
        Route::patch('/events/{id}/publish', [EventController::class, 'publish'])
            ->whereNumber('id')->name('events.publish');
        Route::patch('/events/{id}/archive', [EventController::class, 'archive'])
            ->whereNumber('id')->name('events.archive');
        Route::patch('/events/{id}/pin', [EventController::class, 'togglePin'])
            ->whereNumber('id')->name('events.pin');

        // ─── Job Postings Module (Phase 3) ───────────────
        // Admin-managed postings; alumni apply via an external link.
        Route::get('/job-postings', [AdminJobPostingController::class, 'index'])
            ->name('job-postings.index');
        Route::post('/job-postings', [AdminJobPostingController::class, 'store'])
            ->name('job-postings.store');
        Route::get('/job-postings/{id}', [AdminJobPostingController::class, 'show'])
            ->whereNumber('id')->name('job-postings.show');
        Route::match(['put', 'patch'], '/job-postings/{id}', [AdminJobPostingController::class, 'update'])
            ->whereNumber('id')->name('job-postings.update');
        Route::delete('/job-postings/{id}', [AdminJobPostingController::class, 'destroy'])
            ->whereNumber('id')->name('job-postings.destroy');
        Route::patch('/job-postings/{id}/publish', [AdminJobPostingController::class, 'publish'])
            ->whereNumber('id')->name('job-postings.publish');
        Route::patch('/job-postings/{id}/mark-expired', [AdminJobPostingController::class, 'markExpired'])
            ->whereNumber('id')->name('job-postings.mark-expired');
    });
