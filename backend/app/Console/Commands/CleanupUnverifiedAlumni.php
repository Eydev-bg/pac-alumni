<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Console/Commands/CleanupUnverifiedAlumni.php
//  Phase 3 — Auto-delete alumni accounts that never verified their
//  email within the grace period. Unlinks the graduate master-list
//  record so the same Alumni ID can be used to register again.
//  Scheduled daily (see routes/console.php).
// ═══════════════════════════════════════════════════════════

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\EmailVerificationToken;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CleanupUnverifiedAlumni extends Command
{
    protected $signature = 'alumni:cleanup-unverified';

    protected $description = 'Delete alumni accounts that have not verified their email within the grace period.';

    // Grace period before an unverified account is auto-deleted.
    private const GRACE_PERIOD_DAYS = 7;

    public function handle(): int
    {
        $cutoff = now()->subDays(self::GRACE_PERIOD_DAYS);

        // Only alumni self-registrations are in scope — admin-created
        // accounts are verified up front (see UserService::create) and
        // should never be swept up here.
        $users = User::where('role', UserRole::ALUMNI)
            ->whereNull('email_verified_at')
            ->where('created_at', '<', $cutoff)
            ->with('alumniProfile.graduate')
            ->get();

        $this->info("Unverified alumni cleanup: {$users->count()} account(s) found.");

        $deleted = 0;
        foreach ($users as $user) {
            try {
                DB::transaction(function () use ($user) {
                    // Unlink the graduate master-list record so the same
                    // Alumni ID can be used to register again.
                    $graduate = $user->alumniProfile?->graduate;
                    $graduate?->update(['user_id' => null]);

                    $user->alumniProfile?->delete();
                    EmailVerificationToken::where('email', $user->email)->delete();

                    // VerificationLog entries are kept intentionally — they're
                    // an audit trail of the original registration attempt, not
                    // account state, so deleting the account shouldn't erase them.
                    $user->delete();
                });

                $deleted++;
            } catch (\Throwable $e) {
                Log::error("Unverified alumni cleanup failed for user {$user->id}: {$e->getMessage()}");
                $this->warn("  ! Failed for {$user->email}: {$e->getMessage()}");
            }
        }

        $this->info("Unverified alumni cleanup: {$deleted} account(s) deleted.");

        return self::SUCCESS;
    }
}
