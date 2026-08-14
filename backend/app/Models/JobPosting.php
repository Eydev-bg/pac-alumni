<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Models/JobPosting.php
//  Phase 3 — Job Postings Module (admin-managed, no employer accounts)
// ═══════════════════════════════════════════════════════════

namespace App\Models;

use App\Enums\JobEmploymentType;
use App\Enums\JobSource;
use App\Enums\JobStatus;
use App\Models\Concerns\ResolvesStorageUrl;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobPosting extends Model
{
    use SoftDeletes;
    use ResolvesStorageUrl;

    protected $fillable = [
        'posted_by',
        'source',
        'posted_by_alumni',
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
            'source'               => JobSource::class,
            'employment_type'      => JobEmploymentType::class,
            'is_pinned'            => 'boolean',
        ];
    }

    // ─── Accessors ───────────────────────────────────────────

    /**
     * Resolve the stored company logo path to a servable URL at read time.
     * See ResolvesStorageUrl for why this can't just be the raw DB value.
     */
    protected function companyLogo(): Attribute
    {
        return $this->storageUrlAttribute();
    }

    // ─── Relationships ───────────────────────────────────────
    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    /**
     * The alumni who authored this posting — null for admin-posted jobs.
     * Separate from postedBy so admin-side attribution stays untouched.
     */
    public function postedByAlumni(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by_alumni');
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
     *
     * Alumni-posted jobs with no deadline additionally auto-expire 60 days
     * after publication — nobody prunes them otherwise, and an alumni who
     * filled the role is unlikely to come back and delete the post.
     * Admin-posted jobs keep the original open-until-filled behaviour.
     */
    public function scopeVisibleToAlumni($query)
    {
        $alumniCutoff = now()->subDays(JobSource::ALUMNI_AUTO_EXPIRE_DAYS);

        return $query
            // status = active
            ->active()
            // AND (deadline IS NULL OR deadline >= today)
            //
            // Compared directly rather than via whereDate(): application_deadline
            // is a DATE column, so wrapping it in DATE() would make the
            // application_deadline index unusable for no benefit.
            ->where(function ($byDeadline) {
                $byDeadline->whereNull('application_deadline')
                    ->orWhere('application_deadline', '>=', today()->toDateString());
            })
            // AND (source = admin OR (source = alumni AND (deadline IS NOT NULL
            //                                              OR published_at >= cutoff)))
            ->where(function ($bySource) use ($alumniCutoff) {
                $bySource
                    ->where('source', '!=', JobSource::ALUMNI->value)
                    ->orWhere(function ($alumniPosted) use ($alumniCutoff) {
                        $alumniPosted->where('source', JobSource::ALUMNI->value)
                            ->where(function ($stillFresh) use ($alumniCutoff) {
                                // An explicit deadline overrides the 60-day
                                // rule; without one the post ages out.
                                $stillFresh->whereNotNull('application_deadline')
                                    ->orWhere('published_at', '>=', $alumniCutoff);
                            });
                    });
            });
    }
}
