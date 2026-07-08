<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Console/Commands/SendLoginReminder.php
//  Phase 4.2 — "We miss you" re-engagement reminder.
//  Scheduled daily at 09:00 (see routes/console.php).
// ═══════════════════════════════════════════════════════════

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\EmailReminderLog;
use App\Models\User;

class SendLoginReminder extends AbstractReminderCommand
{
    protected $signature = 'reminder:login';

    protected $description = 'Email alumni who have not logged in for 30+ days, nudging them to return.';

    // Alumni inactive for this many days are eligible.
    private const INACTIVE_DAYS = 30;
    // Do not send another login reminder within this many days.
    private const THROTTLE_DAYS = 30;

    public function handle(): int
    {
        $cutoff = now()->subDays(self::INACTIVE_DAYS);

        $users = User::where('role', UserRole::ALUMNI)
            ->where('status', UserStatus::ACTIVE)
            ->whereNotNull('last_login_at')
            ->where('last_login_at', '<', $cutoff)
            ->get();

        $this->info("Login reminder: {$users->count()} inactive alumni found.");

        $sent = 0;
        foreach ($users as $user) {
            if ($this->alreadyReminded($user->id, EmailReminderLog::TYPE_LOGIN, self::THROTTLE_DAYS)) {
                continue;
            }

            $body = "We miss you! It's been a while since you last logged in to the PAC Alumni "
                . "Portal. Log in to see what's new — fresh job posts, announcements, and messages "
                . "from your fellow alumni are waiting for you.";

            if ($this->dispatchReminder(
                user: $user,
                type: EmailReminderLog::TYPE_LOGIN,
                subject: 'We miss you at the PAC Alumni Portal',
                body: $body,
                actionPath: '/login',
                actionLabel: 'Log In Now',
            )) {
                $sent++;
            }
        }

        $this->info("Login reminder: {$sent} email(s) sent.");

        return self::SUCCESS;
    }
}
