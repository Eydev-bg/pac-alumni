<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PasswordReset extends Model
{
    public $timestamps = false;

    protected $table = 'password_resets';

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
     * Check if token is expired (1 hour validity).
     */
    public function isExpired(): bool
    {
        return $this->created_at->addHour()->isPast();
    }
}
