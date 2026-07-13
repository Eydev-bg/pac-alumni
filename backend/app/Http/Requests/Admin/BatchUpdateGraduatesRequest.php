<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class BatchUpdateGraduatesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:graduates,id'],
            'data' => ['required', 'array'],
            'data.graduation_year' => ['sometimes', 'integer', 'min:1950', 'max:2099'],
            'data.department_id' => ['sometimes', 'nullable', 'integer', 'exists:departments,id'],
            'data.course_id' => ['sometimes', 'nullable', 'integer', 'exists:courses,id'],
            'data.education_level' => ['sometimes', 'string', 'in:elementary,jhs,shs,college'],
        ];
    }
}
