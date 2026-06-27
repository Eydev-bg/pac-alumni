<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Models/Course.php
//  A course belongs to a department. Graduates belong to a course.
//  Example: BSIT (course) → Computer Department (department)
// ═══════════════════════════════════════════════════════════

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $fillable = [
        'name',
        'code',
        'department_id',
        'is_board_program',
        'board_exam_name',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'is_board_program' => 'boolean',
        ];
    }

    // ─── Relationships ───────────────────────────────────
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function graduates(): HasMany
    {
        return $this->hasMany(Graduate::class);
    }

    // ─── Scopes ──────────────────────────────────────────
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeBoardPrograms($query)
    {
        return $query->where('is_board_program', true);
    }

    public function scopeSearch($query, ?string $search)
    {
        if (empty($search)) return $query;
        return $query->where(fn($q) => $q->where('name', 'LIKE', "%{$search}%")->orWhere('code', 'LIKE', "%{$search}%"));
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
