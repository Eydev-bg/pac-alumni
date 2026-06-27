<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'education_level' => $this->education_level ?? 'college',
            'is_board_program' => $this->is_board_program,
            'board_exam_name' => $this->board_exam_name,
            'status' => $this->status?->value ?? $this->attributes['status'] ?? 'active',
            'status_label' => $this->status?->label() ?? ucfirst($this->attributes['status'] ?? 'active'),
            'courses' => $this->when($this->relationLoaded('courses'), function () {
                return $this->courses->map(fn($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'code' => $c->code,
                    'is_board_program' => $c->is_board_program,
                    'board_exam_name' => $c->board_exam_name,
                    'status' => $c->status,
                    'graduates_count' => $c->graduates_count ?? $c->graduates()->count(),
                ]);
            }),
            'courses_count' => $this->when(isset($this->courses_count), $this->courses_count ?? 0),
            'graduates_count' => $this->getTotalGraduatesCount(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }

    /**
     * Combine graduates through courses + direct department_id graduates.
     * College depts: mostly through courses
     * Elementary/JHS/SHS: mostly direct department_id
     */
    private function getTotalGraduatesCount(): int
    {
        $throughCourses = $this->graduates_count ?? 0;
        $direct = $this->direct_graduates_count ?? 0;
        return $throughCourses + $direct;
    }
}
