<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ─── Phase 4.2: Automated Reminder System ───────────────────
// Requires the system scheduler to be running:
//   * * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
Schedule::command('reminder:login')->dailyAt('09:00');
Schedule::command('reminder:employment')->weeklyOn(1, '09:00');  // Monday

// ─── Phase 3: Auto-delete unverified alumni accounts ────────
// Sweeps alumni self-registrations whose email was never verified within
// the grace period (see CleanupUnverifiedAlumni for the 7-day cutoff).
Schedule::command('alumni:cleanup-unverified')->dailyAt('02:00');
