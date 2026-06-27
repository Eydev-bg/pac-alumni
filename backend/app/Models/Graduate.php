<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Models/Graduate.php
//  Now linked to Course (not directly to Department)
//  graduates → course → department
// ═══════════════════════════════════════════════════════════

namespace App\Models;

use App\Enums\EducationLevel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Graduate extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'education_level',
        'graduation_year',
        'department_id',
        'course_id',
        'alumni_id_number',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'education_level' => EducationLevel::class,
            'graduation_year' => 'integer',
        ];
    }

    // ─── Relationships ───────────────────────────────────
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Department via course (preferred) or direct fallback.
     */
    public function department(): BelongsTo
    {
        // If course exists, get department through course
        // Otherwise fallback to direct department_id
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the actual department (through course if available).
     */
    public function getDepartmentAttribute(): ?Department
    {
        if ($this->course) {
            return $this->course->department;
        }
        return $this->getRelationValue('department');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ─── Accessors ───────────────────────────────────────
    public function getFullNameAttribute(): string
    {
        return implode(' ', array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
            $this->suffix,
        ]));
    }

    /**
     * Get course code (e.g., BSIT).
     */
    public function getCourseCodeAttribute(): ?string
    {
        return $this->course?->code;
    }

    /**
     * Get department name through course.
     */
    public function getDepartmentNameAttribute(): ?string
    {
        return $this->course?->department?->name;
    }

    // ─── Scopes ──────────────────────────────────────────
    public function scopeByLevel($query, $level)
    {
        return $query->where('education_level', $level);
    }

    public function scopeByYear($query, ?int $year)
    {
        return $year ? $query->where('graduation_year', $year) : $query;
    }

    public function scopeByDepartment($query, ?int $departmentId)
    {
        if (!$departmentId) return $query;
        $courseIds = Course::where('department_id', $departmentId)->pluck('id')->toArray();

        return $query->where(function ($q) use ($courseIds, $departmentId) {
            // Direct department_id match (elementary/jhs/shs graduates)
            $q->where('department_id', $departmentId);
            // Also include graduates linked via course (college graduates)
            if (!empty($courseIds)) {
                $q->orWhereIn('course_id', $courseIds);
            }
        });
    }

    public function scopeByCourse($query, ?int $courseId)
    {
        return $courseId ? $query->where('course_id', $courseId) : $query;
    }

    public function scopeSearch($query, ?string $search)
    {
        if (empty($search)) return $query;
        return $query->where(
            fn($q) => $q
                ->where('first_name', 'LIKE', "%{$search}%")
                ->orWhere('last_name', 'LIKE', "%{$search}%")
                ->orWhere('alumni_id_number', 'LIKE', "%{$search}%")
                ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"])
                ->orWhereRaw("CONCAT(first_name, ' ', middle_name, ' ', last_name) LIKE ?", ["%{$search}%"])
        );
    }

    public function scopeCollegeOnly($query)
    {
        return $query->where('education_level', EducationLevel::COLLEGE);
    }

    // ─── Helpers ─────────────────────────────────────────
    public function isCollege(): bool
    {
        return $this->education_level === EducationLevel::COLLEGE;
    }
    public function hasAlumniId(): bool
    {
        return !empty($this->alumni_id_number);
    }

    /**
     * Generate the next Alumni ID for a given graduation year.
     *
     * Format: PAC-{YEAR}-{4-digit sequence}
     * Example: PAC-2023-0001, PAC-2023-0002
     *
     * The sequence auto-increments per graduation year by inspecting the
     * highest existing trailing number for that year and adding 1. This
     * preserves continuity even if some IDs were imported manually.
     */
    public static function generateAlumniId(int $graduationYear): string
    {
        $prefix = sprintf('PAC-%d-', $graduationYear);

        // Find the highest existing sequence number for this year.
        // We extract the numeric suffix from any alumni_id_number that
        // matches our format and use the max as the basis for the next one.
        $lastNumber = static::where('alumni_id_number', 'LIKE', $prefix . '%')
            ->selectRaw("MAX(CAST(SUBSTRING_INDEX(alumni_id_number, '-', -1) AS UNSIGNED)) as last_num")
            ->value('last_num') ?? 0;

        return sprintf('%s%04d', $prefix, $lastNumber + 1);
    }
}
