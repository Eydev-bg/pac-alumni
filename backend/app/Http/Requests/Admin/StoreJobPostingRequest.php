<?php

namespace App\Http\Requests\Admin;

use App\Enums\JobEmploymentType;
use App\Enums\JobStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJobPostingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route is already protected by auth:api + role:admin
    }

    public function rules(): array
    {
        return [
            'company_name'         => ['required', 'string', 'max:200'],
            'company_logo'         => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:4096'],
            'job_position'         => ['required', 'string', 'max:200'],
            'location'             => ['required', 'string', 'max:200'],
            'employment_type'      => ['required', Rule::in(JobEmploymentType::values())],
            'salary'               => ['nullable', 'string', 'max:100'],
            'benefits'             => ['nullable', 'string'],
            'description'          => ['required', 'string'],
            'requirements'         => ['nullable', 'string'],
            // At least one route to apply must exist: an external link OR a
            // company email (some partner companies have no website at all).
            'application_link'     => ['nullable', 'required_without:company_email', 'url', 'max:500'],
            'company_email'        => ['nullable', 'required_without:application_link', 'email', 'max:200'],
            'application_deadline' => ['nullable', 'date', 'after_or_equal:today'],
            'status'               => ['required', Rule::in(JobStatus::values())],
            'is_pinned'            => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'company_name.required'                 => 'Company name is required.',
            'job_position.required'                 => 'Job position is required.',
            'location.required'                     => 'Job location is required.',
            'employment_type.in'                    => 'Invalid employment type.',
            'description.required'                  => 'Job description is required.',
            'application_link.required_without'      => 'Provide an application link, or a company email so alumni can apply by email.',
            'application_link.url'                  => 'The application link must be a valid URL.',
            'company_email.required_without'        => 'A company email is required when no application link is provided.',
            'company_email.email'                   => 'Enter a valid company email address.',
            'application_deadline.after_or_equal'   => 'The application deadline must be today or later.',
            'status.in'                             => 'Invalid status.',
            'company_logo.image'                    => 'The company logo must be an image file.',
            'company_logo.max'                      => 'The company logo may not be larger than 4 MB.',
        ];
    }
}
