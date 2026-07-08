<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Console/Commands/SendProfileCompletionReminder.php
//  Phase 4.2 — Nudge alumni whose profile is less than 80%
//  complete, listing exactly what is missing.
//  Scheduled weekly on Wednesday at 09:00 (see routes/console.php).
// ═══════════════════════════════════════════════════════════

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\AlumniProfile;
use App\Models\EmailReminderLog;
use App\Services\Alumni\ProfileCompletionService;

class SendProfileCompletionReminder extends AbstractReminderCommand
{
    protected $signature = 'reminder:profile';

    protected $description = 'Email alumni whose profile is under 80% complete with the items still missing.';

    // Profiles below this completion percentage are eligible.
    private const THRESHOLD = 80;
    // Do not send another profile reminder within this many days.
    private const THROTTLE_DAYS = 30;

    public function __construct(
        private readonly ProfileCompletionService $completion,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $profiles = AlumniProfile::with(['user', 'graduate.course'])
            ->whereHas('user', function ($q) {
                $q->where('role', UserRole::ALUMNI)
                    ->where('status', UserStatus::ACTIVE);
            })
            ->get();

        $this->info("Profile reminder: scanning {$profiles->count()} alumni profile(s).");

        $sent = 0;
        foreach ($profiles as $profile) {
            $user = $profile->user;
            if (!$user) {
                continue;
            }

            if ($this->alreadyReminded($user->id, EmailReminderLog::TYPE_PROFILE, self::THROTTLE_DAYS)) {
                continue;
            }

            $result = $this->completion->compute($profile);
            if ($result['percentage'] >= self::THRESHOLD) {
                continue;
            }

            // Build a human list of the still-missing items for the email body.
            $missingHints = array_map(fn ($item) => $item['hint'], $result['missing']);
            $missingList = empty($missingHints)
                ? ''
                : ' Still to do: ' . implode('; ', $missingHints) . '.';

            $body = "Your alumni profile is {$result['percentage']}% complete. A complete profile helps "
                . "you get noticed by employers and unlocks the full PAC Alumni experience.{$missingList}";

            if ($this->dispatchReminder(
                user: $user,
                type: EmailReminderLog::TYPE_PROFILE,
                subject: "Your profile is {$result['percentage']}% complete",
                body: $body,
                actionPath: '/alumni/profile',
                actionLabel: 'Complete Your Profile',
            )) {
                $sent++;
            }
        }

        $this->info("Profile reminder: {$sent} email(s) sent.");

        return self::SUCCESS;
    }
}
