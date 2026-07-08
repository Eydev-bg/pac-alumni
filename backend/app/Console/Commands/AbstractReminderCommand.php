<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Console/Commands/AbstractReminderCommand.php
//  Phase 4.2 — Shared plumbing for the automated reminder
//  commands. Handles sending the ReminderMail, logging to
//  email_reminders_log, and skip/throttle bookkeeping so each
//  concrete command only declares WHO to remind and WHAT to say.
// ═══════════════════════════════════════════════════════════

namespace App\Console\Commands;

use App\Mail\ReminderMail;
use App\Models\EmailReminderLog;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

abstract class AbstractReminderCommand extends Command
{
    /**
     * Send a reminder email to the user and record it in
     * email_reminders_log. Failures are logged but never abort the
     * batch — one bad recipient must not block the rest.
     *
     * @return bool  True when the reminder was sent and logged.
     */
    protected function dispatchReminder(
        User $user,
        string $type,
        string $subject,
        string $body,
        string $actionPath = '/login',
        string $actionLabel = 'Visit the Alumni Portal',
    ): bool {
        try {
            $actionUrl = rtrim((string) config('app.frontend_url'), '/') . $actionPath;

            // sendNow() (not send()) so the email is delivered synchronously
            // during this scheduled command. ReminderMail is ShouldQueue, so a
            // plain send() would enqueue it and only record() it here as "sent"
            // — if no queue worker is running the mail is stranded in the jobs
            // table forever while the recipient gets throttled for 30 days.
            // Delivering now also means the throttle log is only written after
            // a genuinely successful send.
            Mail::to($user->email)->sendNow(new ReminderMail(
                recipientName: $user->full_name ?: 'Alumnus',
                subjectLine: $subject,
                bodyMessage: $body,
                actionUrl: $actionUrl,
                actionLabel: $actionLabel,
            ));

            EmailReminderLog::record($user->id, $type);

            return true;
        } catch (\Throwable $e) {
            Log::error("Reminder [{$type}] failed for user {$user->id}: {$e->getMessage()}");
            $this->warn("  ! Failed for {$user->email}: {$e->getMessage()}");

            return false;
        }
    }

    /**
     * Whether the user was already sent this reminder type within the
     * given window (in days) — used to avoid re-nudging too often.
     */
    protected function alreadyReminded(int $userId, string $type, int $days): bool
    {
        return EmailReminderLog::sentRecently($userId, $type, $days);
    }
}
