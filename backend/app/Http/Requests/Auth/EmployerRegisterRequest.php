<?php

namespace App\Http\Requests\Auth;

use App\Rules\StrongPassword;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmployerRegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    public function rules(): array
    {
        return [
            // ─── Account credentials ─────────────────────
            'email'    => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'confirmed', new StrongPassword()],

            // ─── Company details ─────────────────────────
            'company_name'           => ['required', 'string', 'max:300'],
            'company_email'          => ['required', 'string', 'email', 'max:255'],
            'company_address'        => ['required', 'string', 'max:1000'],
            'company_contact_number' => ['required', 'string', 'max:50'],
            'company_website'        => ['nullable', 'url', 'max:300'],

            // ─── HR representative ────────────────────────
            'hr_full_name' => ['required', 'string', 'max:200'],
            'hr_position'  => ['required', 'string', 'max:200'],

            // ─── Documents (auto-approval requires business permit) ──
            // business_permit: pdf/jpg/png, max 5MB
            'business_permit_document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            // logo: jpg/png, max 2MB
            'company_logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required'                    => 'Email is required.',
            'email.email'                       => 'Please provide a valid email address.',
            'email.unique'                      => 'This email address is already registered.',
            'password.confirmed'                => 'Password confirmation does not match.',
            'company_name.required'             => 'Company name is required.',
            'company_email.required'            => 'Company email is required.',
            'company_address.required'          => 'Company address is required.',
            'company_contact_number.required'   => 'Company contact number is required.',
            'company_website.url'               => 'Please provide a valid company website URL.',
            'hr_full_name.required'             => 'HR representative full name is required.',
            'hr_position.required'              => 'HR representative position is required.',
            'business_permit_document.required' => 'A business permit document is required for verification.',
            'business_permit_document.mimes'    => 'The business permit must be a PDF, JPG, or PNG file.',
            'business_permit_document.max'      => 'The business permit may not be larger than 5MB.',
            'company_logo.image'                => 'The company logo must be an image.',
            'company_logo.max'                  => 'The company logo may not be larger than 2MB.',
        ];
    }
}
