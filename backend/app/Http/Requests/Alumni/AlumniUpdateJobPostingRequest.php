<?php

namespace App\Http\Requests\Alumni;

use App\Enums\JobEmploymentType;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Alumni-authored job posting (update).
 *
 * Same field set as {@see AlumniStoreJobPostingRequest}; `status` and
 * `is_pinned` are deliberately absent so alumni cannot pin their own posts
 * or resurrect an expired one. Ownership is enforced in the service layer.
 */
class AlumniUpdateJobPostingRequest extends FormRequest
{
    /**
     * Defence in depth: the route group already applies auth:api + role:alumni,
     * but re-checking here means the rule travels with the request if it is
     * ever mounted on another route. Per-post ownership is enforced separately
     * in AlumniJobPostingService.
     */
    public function authorize(): bool
    {
        return $this->user('api')?->role === UserRole::ALUMNI;
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
            // The form always submits both keys, so required_without sees the
            // complete pair; omitting both leaves the stored values untouched.
            'application_link'     => ['sometimes', 'nullable', 'required_without:company_email', 'url', 'max:500'],
            'company_email'        => ['sometimes', 'nullable', 'required_without:application_link', 'email', 'max:200'],
            'application_deadline' => ['nullable', 'date', 'after_or_equal:today'],
        ];
    }

    public function messages(): array
    {
        return [
            'employment_type.in'                  => 'Invalid employment type.',
            'application_link.required_without'   => 'Provide an application link, or a company email so alumni can apply by email.',
            'application_link.url'                => 'The application link must be a valid URL.',
            'company_email.required_without'      => 'A company email is required when no application link is provided.',
            'company_email.email'                 => 'Enter a valid company email address.',
            'application_deadline.after_or_equal' => 'The application deadline must be today or later.',
            'company_logo.image'                  => 'The company logo must be an image file.',
            'company_logo.max'                    => 'The company logo may not be larger than 4 MB.',
        ];
    }
}
