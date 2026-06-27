<?php

namespace App\Models;

use App\Enums\BlacklistIdentifierType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistrationBlacklist extends Model
{
    public $timestamps = false;

    protected $table = 'registration_blacklist';

    protected $fillable = [
        'identifier',
        'identifier_type',
        'reason',
        'blacklisted_by',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'identifier_type' => BlacklistIdentifierType::class,
            'created_at' => 'datetime',
        ];
    }

    public function blacklistedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blacklisted_by');
    }

    /**
     * Check if an identifier is blacklisted.
     */
    public static function isBlacklisted(string $identifier, BlacklistIdentifierType $type): bool
    {
        return static::where('identifier', $identifier)
            ->where('identifier_type', $type)
            ->exists();
    }
}
