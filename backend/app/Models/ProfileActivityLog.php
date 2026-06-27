<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfileActivityLog extends Model
{
    public $timestamps = false; // Only has created_at

    protected $fillable = [
        'graduate_id',
        'user_id',
        'action',
        'description',
        'changes',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'changes' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function graduate(): BelongsTo
    {
        return $this->belongsTo(Graduate::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Log a profile activity.
     */
    public static function log(int $graduateId, ?int $userId, string $action, string $description, ?array $changes = null): self
    {
        return static::create([
            'graduate_id' => $graduateId,
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
            'changes' => $changes,
            'created_at' => now(),
        ]);
    }
}
