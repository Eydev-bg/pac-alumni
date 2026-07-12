<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Models/ContentEmailLog.php
//  Bulk email-on-publish — per-item idempotency log. Tracks
//  which specific event / announcement / job posting has been
//  emailed to which user (no time window, unlike EmailReminderLog).
// ═══════════════════════════════════════════════════════════

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentEmailLog extends Model
{
    protected $table = 'content_email_logs';

    // ─── Content type constants (mirror the `content_type` values) ──
    public const TYPE_EVENT = 'event';
    public const TYPE_ANNOUNCEMENT = 'announcement';
    public const TYPE_JOB_POSTING = 'job_posting';

    protected $fillable = [
        'user_id',
        'content_type',
        'content_id',
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
     * Whether this specific content item was already emailed to the user.
     * No time window: a new item always sends, regardless of when the
     * previous item of the same type was emailed.
     */
    public static function alreadySent(int $userId, string $contentType, int $contentId): bool
    {
        return static::where('user_id', $userId)
            ->where('content_type', $contentType)
            ->where('content_id', $contentId)
            ->exists();
    }

    /**
     * Record that the content item was emailed to the user.
     */
    public static function record(int $userId, string $contentType, int $contentId): self
    {
        return static::create([
            'user_id' => $userId,
            'content_type' => $contentType,
            'content_id' => $contentId,
            'sent_at' => now(),
        ]);
    }
}
