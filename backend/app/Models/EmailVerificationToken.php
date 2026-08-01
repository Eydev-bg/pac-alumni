<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailVerificationToken extends Model
{
    public $timestamps = false;

    protected $table = 'email_verification_tokens';

    protected $fillable = [
        'email',
        'token',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    /**
     * Check if token is expired (24 hour validity).
     */
    public function isExpired(): bool
    {
        return $this->created_at->addHours(24)->isPast();
    }
}
