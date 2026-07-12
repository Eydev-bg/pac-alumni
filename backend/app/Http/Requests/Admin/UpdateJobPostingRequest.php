<?php

namespace App\Http\Requests\Admin;

use App\Enums\JobEmploymentType;
use App\Enums\JobStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJobPostingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route is already protected by auth:api + role:admin
    }

    public function rules(): array
    {
        return [
            'company_name'         => ['sometimes', 'required', 'string', 'max:200'],
            'company_logo'         => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:4096'],
            'job_position'         => ['sometimes', 'required', 'string', 'max:200'],
            'location'             => ['sometimes', 'required', 'string', 'max:200'],
            'employment_type'      => ['sometimes', 'required', Rule::in(JobEmploymentType::values())],
            'salary'               => ['nullable', 'string', 'max:100'],
            'benefits'             => ['nullable', 'string'],
            'description'          => ['sometimes', 'required', 'string'],
            'requirements'         => ['nullable', 'string'],
            'application_link'     => ['sometimes', 'required', 'url', 'max:500'],
            'company_email'        => ['nullable', 'email', 'max:200'],
            // NOTE: after_or_equal:today rejects re-saving a posting whose
            // deadline has already passed even when the deadline field is
            // unchanged. Acceptable for now (admin can clear or bump the
            // date) — revisit if it becomes a workflow problem.
            'application_deadline' => ['nullable', 'date', 'after_or_equal:today'],
            'status'               => ['sometimes', 'required', Rule::in(JobStatus::values())],
            'is_pinned'            => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'employment_type.in'                  => 'Invalid employment type.',
            'application_link.url'                => 'The application link must be a valid URL.',
            'application_deadline.after_or_equal' => 'The application deadline must be today or later.',
            'status.in'                           => 'Invalid status.',
            'company_logo.image'                  => 'The company logo must be an image file.',
            'company_logo.max'                    => 'The company logo may not be larger than 4 MB.',
        ];
    }
}
