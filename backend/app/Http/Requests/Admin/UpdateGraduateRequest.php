<?php

namespace App\Http\Requests\Admin;

use App\Enums\EducationLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGraduateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'first_name' => ['sometimes', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['sometimes', 'string', 'max:100'],
            'suffix' => ['nullable', 'string', 'max:20'],
            'education_level' => ['sometimes', 'string', Rule::in(EducationLevel::values())],
            'graduation_year' => ['sometimes', 'integer', 'min:1950', 'max:2099'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
        ];
    }
}
