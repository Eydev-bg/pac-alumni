<?php

namespace App\Http\Requests\Employer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJobPostRequest extends FormRequest
{
    /** Allowed job types (mirrors the job_posts.job_type column). */
    public const JOB_TYPES = ['full_time', 'part_time', 'contract', 'freelance', 'internship'];

    public function authorize(): bool
    {
        return true; // Route is already protected by auth:api + role:employer
    }

    public function rules(): array
    {
        return [
            'title'            => ['required', 'string', 'max:200'],
            'description'      => ['required', 'string'],
            'location'         => ['required', 'string', 'max:300'],
            'job_type'         => ['required', 'string', Rule::in(self::JOB_TYPES)],
            'salary_range_min' => ['nullable', 'numeric', 'min:0'],
            'salary_range_max' => ['nullable', 'numeric', 'min:0', 'gte:salary_range_min'],
            'qualifications'   => ['nullable', 'string'],
            'expires_at'       => ['nullable', 'date', 'after:today'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'         => 'Job title is required.',
            'description.required'   => 'Job description is required.',
            'location.required'      => 'Job location is required.',
            'job_type.required'      => 'Job type is required.',
            'job_type.in'            => 'Invalid job type.',
            'salary_range_max.gte'   => 'Maximum salary must be greater than or equal to the minimum salary.',
            'expires_at.after'       => 'The expiry date must be in the future.',
        ];
    }
}
