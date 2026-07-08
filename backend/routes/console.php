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
Schedule::command('reminder:profile')->weeklyOn(3, '09:00');     // Wednesday
