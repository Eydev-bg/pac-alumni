<?php

namespace App\Models;

use App\Enums\VerificationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerificationLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'alumni_id_input',
        'name_input',
        'email_input',
        'ip_address',
        'status',
        'matched_graduate_id',
        'rejection_reason',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => VerificationStatus::class,
            'created_at' => 'datetime',
        ];
    }

    public function matchedGraduate(): BelongsTo
    {
        return $this->belongsTo(Graduate::class, 'matched_graduate_id');
    }

    // ─── Scopes ──────────────────────────────────────────
    public function scopeVerified($query)
    {
        return $query->where('status', VerificationStatus::VERIFIED);
    }

    public function scopeRejected($query)
    {
        return $query->where('status', VerificationStatus::REJECTED);
    }

    public function scopeDateRange($query, ?string $from, ?string $to)
    {
        if ($from) $query->where('created_at', '>=', $from);
        if ($to) $query->where('created_at', '<=', $to . ' 23:59:59');
        return $query;
    }

    public function scopeSearch($query, ?string $search)
    {
        if (empty($search)) return $query;

        return $query->where(function ($q) use ($search) {
            $q->where('name_input', 'LIKE', "%{$search}%")
                ->orWhere('alumni_id_input', 'LIKE', "%{$search}%")
                ->orWhere('email_input', 'LIKE', "%{$search}%");
        });
    }
}
