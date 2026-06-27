<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class TracerSummaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'course_id'  => ['required', 'integer', 'exists:courses,id'],
            'batch_year' => ['required', 'integer', 'digits:4', 'min:1990', 'max:' . (date('Y') + 1)],
        ];
    }

    public function messages(): array
    {
        return [
            'course_id.required'  => 'Please select a course.',
            'course_id.exists'    => 'The selected course does not exist.',
            'batch_year.required' => 'Please select a batch year.',
            'batch_year.digits'   => 'Batch year must be a 4-digit year.',
        ];
    }
}
