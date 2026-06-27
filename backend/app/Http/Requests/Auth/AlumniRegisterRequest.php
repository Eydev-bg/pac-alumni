<?php

namespace App\Http\Requests\Auth;

use App\Rules\StrongPassword;
use Illuminate\Foundation\Http\FormRequest;

class AlumniRegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    public function rules(): array
    {
        return [
            'alumni_id'  => ['required', 'string', 'max:50'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name'  => ['required', 'string', 'max:100'],
            'email'      => ['required', 'string', 'email', 'max:255'],
            'password'   => ['required', 'string', 'confirmed', new StrongPassword()],
        ];
    }

    public function messages(): array
    {
        return [
            'alumni_id.required'  => 'Alumni ID is required.',
            'first_name.required' => 'First name is required.',
            'last_name.required'  => 'Last name is required.',
            'email.required'      => 'Email is required.',
            'email.email'         => 'Please provide a valid email address.',
            'password.confirmed'  => 'Password confirmation does not match.',
        ];
    }
}
