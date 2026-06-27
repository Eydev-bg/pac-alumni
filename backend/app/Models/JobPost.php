<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Models/JobPost.php
// ═══════════════════════════════════════════════════════════

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobPost extends Model
{
    protected $fillable = [
        'posted_by',
        'job_title',
        'company_name',
        'job_type',
        'industry',
        'location_type',
        'location_detail',
        'description',
        'how_to_apply',
        'department_id',
        'status',
    ];

    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(JobReport::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
    public function scopeSearch($query, ?string $s)
    {
        if (empty($s)) return $query;
        return $query->where(fn($q) => $q->where('job_title', 'LIKE', "%{$s}%")->orWhere('company_name', 'LIKE', "%{$s}%"));
    }
}
