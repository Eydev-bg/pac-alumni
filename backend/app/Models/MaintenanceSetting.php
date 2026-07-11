<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceSetting extends Model
{
    /**
     * Default message shown to blocked (non-admin) users when maintenance mode
     * is on and no custom message has been set. Centralised here so the
     * middleware and any consumer share one source of truth (no hardcoded copy).
     */
    public const DEFAULT_MESSAGE = 'The system is currently under maintenance. Please check back later.';

    protected $fillable = [
        'is_enabled',
        'message',
        'enabled_at',
        'enabled_by',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'enabled_at' => 'datetime',
        ];
    }

    public function enabledByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'enabled_by');
    }

    /**
     * Get or create the singleton settings row.
     */
    public static function getSettings(): self
    {
        return static::firstOrCreate([], [
            'is_enabled' => false,
        ]);
    }
}
