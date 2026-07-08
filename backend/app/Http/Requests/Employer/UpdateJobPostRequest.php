<?php

namespace App\Http\Requests\Employer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJobPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route is already protected by auth:api + role:employer
    }

    public function rules(): array
    {
        return [
            'title'            => ['sometimes', 'required', 'string', 'max:200'],
            'description'      => ['sometimes', 'required', 'string'],
            'location'         => ['sometimes', 'required', 'string', 'max:300'],
            'job_type'         => ['sometimes', 'required', 'string', Rule::in(StoreJobPostRequest::JOB_TYPES)],
            'salary_range_min' => ['nullable', 'numeric', 'min:0'],
            'salary_range_max' => ['nullable', 'numeric', 'min:0', 'gte:salary_range_min'],
            'qualifications'   => ['nullable', 'string'],
            'is_open'          => ['sometimes', 'boolean'],
            'expires_at'       => ['nullable', 'date', 'after:today'],
        ];
    }

    public function messages(): array
    {
        return [
            'job_type.in'          => 'Invalid job type.',
            'salary_range_max.gte' => 'Maximum salary must be greater than or equal to the minimum salary.',
            'expires_at.after'     => 'The expiry date must be in the future.',
        ];
    }
}
