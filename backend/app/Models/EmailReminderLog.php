<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Models/EmailReminderLog.php
//  Phase 4.1 — Log of automated re-engagement reminder emails.
// ═══════════════════════════════════════════════════════════

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailReminderLog extends Model
{
    protected $table = 'email_reminders_log';

    // ─── Reminder type constants (mirror the `type` enum values) ──
    public const TYPE_LOGIN = 'login_reminder';
    public const TYPE_EMPLOYMENT = 'employment_update';
    public const TYPE_PROFILE = 'profile_completion';
    public const TYPE_ANNOUNCEMENT = 'announcement';

    protected $fillable = [
        'user_id',
        'type',
        'sent_at',
    ];

    protected function casts(): array
    {
        return ['sent_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Whether a reminder of the given type was already sent to the user
     * within the last $days days. Used by the scheduled commands to avoid
     * re-sending the same nudge too often.
     */
    public static function sentRecently(int $userId, string $type, int $days): bool
    {
        return static::where('user_id', $userId)
            ->where('type', $type)
            ->where('sent_at', '>=', now()->subDays($days))
            ->exists();
    }

    /**
     * Record that a reminder of the given type was sent to the user.
     */
    public static function record(int $userId, string $type): self
    {
        return static::create([
            'user_id' => $userId,
            'type' => $type,
            'sent_at' => now(),
        ]);
    }
}
