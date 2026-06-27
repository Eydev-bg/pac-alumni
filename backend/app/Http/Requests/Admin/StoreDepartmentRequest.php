<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:200',
                Rule::unique('departments', 'name'),
            ],
            'code' => [
                'required',
                'string',
                'max:20',
                'alpha_num',
                Rule::unique('departments', 'code'),
            ],
            'education_level' => [
                'required',
                'string',
                Rule::in(['college', 'elementary', 'jhs', 'shs']),
            ],
            'is_board_program' => ['sometimes', 'boolean'],
            'board_exam_name' => [
                'nullable',
                'string',
                'max:200',
                'required_if:is_board_program,true',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'A department with this name already exists.',
            'code.unique' => 'This department code is already in use.',
            'code.alpha_num' => 'Department code must contain only letters and numbers.',
            'board_exam_name.required_if' => 'Board exam name is required for board programs.',
            'education_level.required' => 'Please select an education level.',
            'education_level.in' => 'Invalid education level.',
        ];
    }
}
