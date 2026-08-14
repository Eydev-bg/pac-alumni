<?php

namespace App\Http\Requests\Alumni;

use App\Enums\JobEmploymentType;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Alumni-authored job posting (create).
 *
 * Mirrors the admin StoreJobPostingRequest minus the fields alumni are not
 * allowed to set: `status` (always active) and `is_pinned` (always false)
 * are forced by the service, never read from input.
 */
class AlumniStoreJobPostingRequest extends FormRequest
{
    /**
     * Defence in depth: the route group already applies auth:api + role:alumni,
     * but re-checking here means the rule travels with the request if it is
     * ever mounted on another route.
     */
    public function authorize(): bool
    {
        return $this->user('api')?->role === UserRole::ALUMNI;
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
            // company email (some companies have no website at all).
            'application_link'     => ['nullable', 'required_without:company_email', 'url', 'max:500'],
            'company_email'        => ['nullable', 'required_without:application_link', 'email', 'max:200'],
            'application_deadline' => ['nullable', 'date', 'after_or_equal:today'],
        ];
    }

    public function messages(): array
    {
        return [
            'company_name.required'               => 'Company name is required.',
            'job_position.required'               => 'Job position is required.',
            'location.required'                   => 'Job location is required.',
            'employment_type.in'                  => 'Invalid employment type.',
            'description.required'                => 'Job description is required.',
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
