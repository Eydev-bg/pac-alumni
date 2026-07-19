<?php

namespace App\Models;

use App\Enums\DepartmentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'education_level',
        'is_board_program',
        'board_exam_name',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => DepartmentStatus::class,
            'is_board_program' => 'boolean',
        ];
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    public function graduates(): HasManyThrough
    {
        return $this->hasManyThrough(Graduate::class, Course::class);
    }

    /**
     * Direct graduates (linked via department_id, not through courses).
     * Used by Elementary/JHS/SHS departments that have no courses.
     */
    public function directGraduates(): HasMany
    {
        return $this->hasMany(Graduate::class, 'department_id');
    }

    /**
     * Get total graduate count — checks both paths:
     * 1. Through courses (college departments)
     * 2. Direct department_id (elementary/jhs/shs)
     */
    public function getAllGraduatesCountAttribute(): int
    {
        $throughCourses = $this->graduates()->count();
        $direct = $this->directGraduates()
            ->whereNull('course_id')
            ->count();
        return $throughCourses + $direct;
    }

    public function scopeActive($query)
    {
        return $query->where('status', DepartmentStatus::ACTIVE);
    }

    public function scopeSearch($query, ?string $search)
    {
        if (empty($search)) return $query;
        return $query->where(fn($q) => $q->where('name', 'LIKE', "%{$search}%")->orWhere('code', 'LIKE', "%{$search}%"));
    }

    public function scopeByLevel($query, ?string $level)
    {
        if (empty($level)) return $query;
        return $query->where('education_level', $level);
    }

    public function isActive(): bool
    {
        return $this->status === DepartmentStatus::ACTIVE;
    }
    public function hasGraduates(): bool
    {
        return $this->graduates()->exists() || $this->directGraduates()->exists();
    }
    public function hasBoardProgram(): bool
    {
        return $this->courses()->where('is_board_program', true)->exists();
    }
    public function getCourseIds(): array
    {
        return $this->courses()->pluck('id')->toArray();
    }
}
