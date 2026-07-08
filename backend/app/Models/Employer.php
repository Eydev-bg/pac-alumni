<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'company_name',
        'company_email',
        'company_address',
        'company_contact_number',
        'company_website',
        'company_logo',
        'business_permit_document',
        'hr_full_name',
        'hr_position',
        'is_verified',
        'status',
        'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
        ];
    }

    // ─── Relationships ───────────────────────────────────────
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function jobPosts(): HasMany
    {
        return $this->hasMany(JobPost::class);
    }

    // ─── Query Scopes ────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeSearch($query, ?string $search)
    {
        if (empty($search)) {
            return $query;
        }

        return $query->where(function ($q) use ($search) {
            $q->where('company_name', 'LIKE', "%{$search}%")
                ->orWhere('company_email', 'LIKE', "%{$search}%")
                ->orWhere('hr_full_name', 'LIKE', "%{$search}%");
        });
    }
}
