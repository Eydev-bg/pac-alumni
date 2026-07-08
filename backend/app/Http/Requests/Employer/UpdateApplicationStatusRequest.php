<?php

namespace App\Http\Requests\Employer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApplicationStatusRequest extends FormRequest
{
    /** Statuses an employer may set on an application. */
    public const STATUSES = ['pending', 'reviewed', 'accepted', 'rejected'];

    public function authorize(): bool
    {
        return true; // Route is already protected by auth:api + role:employer
    }

    public function rules(): array
    {
        return [
            'status'         => ['required', 'string', Rule::in(self::STATUSES)],
            'employer_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Application status is required.',
            'status.in'       => 'Invalid application status.',
        ];
    }
}
