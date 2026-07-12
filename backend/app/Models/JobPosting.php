<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Models/JobPosting.php
//  Phase 3 — Job Postings Module (admin-managed, no employer accounts)
// ═══════════════════════════════════════════════════════════

namespace App\Models;

use App\Enums\JobEmploymentType;
use App\Enums\JobStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobPosting extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'posted_by',
        'company_name',
        'company_logo',
        'job_position',
        'location',
        'employment_type',
        'salary',
        'benefits',
        'description',
        'requirements',
        'application_link',
        'company_email',
        'application_deadline',
        'status',
        'is_pinned',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'application_deadline' => 'date',
            'published_at'         => 'datetime',
            'status'               => JobStatus::class,
            'employment_type'      => JobEmploymentType::class,
            'is_pinned'            => 'boolean',
        ];
    }

    // ─── Relationships ───────────────────────────────────────
    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    // ─── Query Scopes ────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('status', JobStatus::ACTIVE->value);
    }

    public function scopeSearch($query, ?string $search)
    {
        if (empty($search)) {
            return $query;
        }

        return $query->where(function ($q) use ($search) {
            $q->where('company_name', 'LIKE', "%{$search}%")
                ->orWhere('job_position', 'LIKE', "%{$search}%")
                ->orWhere('location', 'LIKE', "%{$search}%");
        });
    }

    /**
     * Restrict to postings alumni may see: active, and either without a
     * deadline or with a deadline that has not yet passed.
     */
    public function scopeVisibleToAlumni($query)
    {
        return $query->active()
            ->where(function ($q) {
                $q->whereNull('application_deadline')
                    ->orWhereDate('application_deadline', '>=', today());
            });
    }
}
