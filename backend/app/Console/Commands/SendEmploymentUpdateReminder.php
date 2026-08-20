<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Console/Commands/SendEmploymentUpdateReminder.php
//  Phase 4.2 — Nudge alumni whose current job has been on record
//  for 3+ months to confirm/refresh their employment status.
//  Scheduled weekly on Monday at 09:00 (see routes/console.php).
// ═══════════════════════════════════════════════════════════

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\EmailReminderLog;
use App\Models\EmploymentRecord;

class SendEmploymentUpdateReminder extends AbstractReminderCommand
{
    protected $signature = 'reminder:employment';

    protected $description = 'Email alumni whose current employment has not changed in 3+ months to refresh it.';

    // Current employment older than this (months) is considered stale.
    private const STALE_MONTHS = 3;
    // Do not send another employment reminder within this many days (~3 months).
    private const THROTTLE_DAYS = 90;

    public function handle(): int
    {
        $cutoff = now()->subMonths(self::STALE_MONTHS);

        // Current employment records whose start date is older than the cutoff.
        // A newer job would have created a fresh record and marked this one
        // not-current, so a stale start_date means "no update in 3 months".
        $records = EmploymentRecord::where('is_current', true)
            ->whereNotNull('start_date')
            ->whereDate('start_date', '<', $cutoff)
            ->with('graduate.user')
            ->get();

        $this->info("Employment reminder: {$records->count()} stale current job(s) found.");

        $sent = 0;
        $processedUsers = [];

        foreach ($records as $record) {
            $user = $record->graduate?->user;

            // Only active alumni accounts; skip graduates without a linked user.
            if (!$user
                || $user->role !== UserRole::ALUMNI
                || $user->status !== UserStatus::ACTIVE) {
                continue;
            }

            // Guard against multiple current records for the same person.
            if (isset($processedUsers[$user->id])) {
                continue;
            }
            $processedUsers[$user->id] = true;

            if ($this->alreadyReminded($user->id, EmailReminderLog::TYPE_EMPLOYMENT, self::THROTTLE_DAYS)) {
                continue;
            }

            $body = "Have your career details changed? Our records show your employment information "
                . "has not been updated in a while. Keeping it current helps us track alumni success "
                . "and keeps your profile accurate. It only takes a minute to update.";

            if ($this->dispatchReminder(
                user: $user,
                type: EmailReminderLog::TYPE_EMPLOYMENT,
                subject: 'Time to update your employment status',
                body: $body,
                actionPath: '/alumni/employment',
                actionLabel: 'Update Employment',
            )) {
                $sent++;
            }
        }

        $this->info("Employment reminder: {$sent} email(s) sent.");

        return self::SUCCESS;
    }
}
