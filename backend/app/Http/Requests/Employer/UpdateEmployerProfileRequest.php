<?php

namespace App\Http\Requests\Employer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployerProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route is already protected by auth:api + role:employer
    }

    public function rules(): array
    {
        return [
            'company_name'           => ['sometimes', 'required', 'string', 'max:300'],
            'company_email'          => ['sometimes', 'required', 'string', 'email', 'max:255'],
            'company_address'        => ['sometimes', 'required', 'string', 'max:1000'],
            'company_contact_number' => ['sometimes', 'required', 'string', 'max:50'],
            'company_website'        => ['nullable', 'url', 'max:300'],
            'hr_full_name'           => ['sometimes', 'required', 'string', 'max:200'],
            'hr_position'            => ['sometimes', 'required', 'string', 'max:200'],
            'company_logo'           => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'company_email.email' => 'Please provide a valid company email address.',
            'company_website.url' => 'Please provide a valid company website URL.',
            'company_logo.image'  => 'The company logo must be an image.',
            'company_logo.max'    => 'The company logo may not be larger than 2MB.',
        ];
    }
}
