<?php

namespace App\Models;

use App\Enums\LoginAttemptStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginActivityLog extends Model
{
    public $timestamps = false; // Only has created_at

    protected $fillable = [
        'user_id',
        'email_attempted',
        'ip_address',
        'user_agent',
        'status',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => LoginAttemptStatus::class,
            'created_at' => 'datetime',
        ];
    }

    // ─── Relationships ───────────────────────────────────────
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ─── Scopes ──────────────────────────────────────────────
    public function scopeSuccessful($query)
    {
        return $query->where('status', LoginAttemptStatus::SUCCESS);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', LoginAttemptStatus::FAILED);
    }

    public function scopeDateRange($query, ?string $from, ?string $to)
    {
        if ($from) {
            $query->where('created_at', '>=', $from);
        }
        if ($to) {
            $query->where('created_at', '<=', $to . ' 23:59:59');
        }

        return $query;
    }

    public function scopeByIp($query, ?string $ip)
    {
        if (empty($ip)) {
            return $query;
        }

        return $query->where('ip_address', $ip);
    }
}
