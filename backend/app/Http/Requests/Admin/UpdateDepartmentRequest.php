<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    public function rules(): array
    {
        $departmentId = $this->route('department');

        return [
            'name' => [
                'sometimes',
                'string',
                'max:200',
                Rule::unique('departments', 'name')->ignore($departmentId),
            ],
            'code' => [
                'sometimes',
                'string',
                'max:20',
                'alpha_num',
                Rule::unique('departments', 'code')->ignore($departmentId),
            ],
            'education_level' => [
                'sometimes',
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
}
