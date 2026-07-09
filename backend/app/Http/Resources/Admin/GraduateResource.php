<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GraduateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $course = $this->whenLoaded('course', $this->course);
        $dept = $course?->department ?? ($this->whenLoaded('department', $this->getRelationValue('department')));

        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'suffix' => $this->suffix,
            'full_name' => $this->full_name,
            'education_level' => $this->education_level?->value ?? $this->attributes['education_level'] ?? null,
            'education_level_label' => $this->education_level?->label() ?? ucfirst($this->attributes['education_level'] ?? ''),
            'graduation_year' => $this->graduation_year,
            'alumni_id_number' => $this->alumni_id_number,
            'course' => $course ? [
                'id' => $course->id,
                'name' => $course->name,
                'code' => $course->code,
                'is_board_program' => $course->is_board_program,
            ] : null,
            'department' => $dept ? [
                'id' => $dept->id,
                'name' => $dept->name,
                'code' => $dept->code,
            ] : null,
            // Backward compat: frontend can still use department.code
            'has_alumni_account' => $this->user_id !== null,
            'profile_picture' => $this->user?->profile_picture,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            // Null for active records; set for trashed records (Trash screen).
            'deleted_at' => $this->deleted_at?->toISOString(),
        ];
    }
}
