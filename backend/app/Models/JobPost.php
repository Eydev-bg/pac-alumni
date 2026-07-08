<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Models/JobPost.php
// ═══════════════════════════════════════════════════════════

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobPost extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'employer_id',
        'title',
        'description',
        'company_name',
        'location',
        'job_type',
        'salary_range_min',
        'salary_range_max',
        'qualifications',
        'is_open',
        'status',
        'admin_notes',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'is_open' => 'boolean',
            'salary_range_min' => 'decimal:2',
            'salary_range_max' => 'decimal:2',
            'expires_at' => 'datetime',
        ];
    }

    // ─── Relationships ───────────────────────────────────────
    public function employer(): BelongsTo
    {
        return $this->belongsTo(Employer::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    // ─── Query Scopes ────────────────────────────────────────
    public function scopeOpen($query)
    {
        return $query->where('is_open', true);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeSearch($query, ?string $search)
    {
        if (empty($search)) {
            return $query;
        }

        return $query->where(function ($q) use ($search) {
            $q->where('title', 'LIKE', "%{$search}%")
                ->orWhere('company_name', 'LIKE', "%{$search}%")
                ->orWhere('location', 'LIKE', "%{$search}%");
        });
    }
}
