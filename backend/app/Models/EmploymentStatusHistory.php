<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmploymentStatusHistory extends Model
{
    public $timestamps = false;

    protected $table = 'employment_status_history';

    protected $fillable = [
        'graduate_id',
        'old_status',
        'new_status',
        'changed_at',
        'changed_by',
    ];

    protected function casts(): array
    {
        return [
            'changed_at' => 'datetime',
        ];
    }

    // ─── Relationships ───────────────────────────────────

    public function graduate(): BelongsTo
    {
        return $this->belongsTo(Graduate::class);
    }

    public function changedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    // ─── Convenience Logger ──────────────────────────────

    /**
     * Log an employment status transition.
     *
     * Follows the same static::create() pattern used by
     * ProfileActivityLog::log() in the existing codebase.
     */
    public static function log(
        int $graduateId,
        ?string $oldStatus,
        string $newStatus,
        ?int $changedBy = null
    ): self {
        return static::create([
            'graduate_id' => $graduateId,
            'old_status'  => $oldStatus,
            'new_status'  => $newStatus,
            'changed_at'  => now(),
            'changed_by'  => $changedBy,
        ]);
    }
}
