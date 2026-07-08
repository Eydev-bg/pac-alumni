<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReportExportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'format'        => ['required', Rule::in(['xlsx', 'csv', 'pdf'])],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'course_id'     => ['nullable', 'integer', 'exists:courses,id'],
            'batch_year'    => ['nullable', 'integer', 'digits:4', 'min:1990', 'max:' . (date('Y') + 1)],
        ];
    }

    public function messages(): array
    {
        return [
            'format.required' => 'Please select an export format.',
            'format.in'       => 'Export format must be xlsx, csv, or pdf.',
        ];
    }
}
