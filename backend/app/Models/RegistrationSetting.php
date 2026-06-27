<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistrationSetting extends Model
{
    protected $fillable = [
        'is_open',
        'open_from',
        'open_until',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_open' => 'boolean',
            'open_from' => 'datetime',
            'open_until' => 'datetime',
        ];
    }

    public function updatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Check if registration is currently open (date-aware).
     */
    public function isCurrentlyOpen(): bool
    {
        if (!$this->is_open) {
            return false;
        }

        $now = now();

        if ($this->open_from && $now->lt($this->open_from)) {
            return false;
        }

        if ($this->open_until && $now->gt($this->open_until)) {
            return false;
        }

        return true;
    }

    /**
     * Get or create the singleton settings row.
     */
    public static function getSettings(): self
    {
        return static::firstOrCreate([], [
            'is_open' => false,
        ]);
    }
}
