<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Models/EmploymentRecord.php
// ═══════════════════════════════════════════════════════════

namespace App\Models;

use App\Enums\EmploymentType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmploymentRecord extends Model
{
    protected $fillable = [
        'graduate_id',
        'company_name',
        'job_title',
        'industry',
        'employment_type',
        'start_date',
        'end_date',
        'is_current',
    ];

    protected function casts(): array
    {
        return [
            'employment_type' => EmploymentType::class,
            'start_date' => 'date',
            'end_date' => 'date',
            'is_current' => 'boolean',
        ];
    }

    public function graduate(): BelongsTo
    {
        return $this->belongsTo(Graduate::class);
    }

    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }
}
