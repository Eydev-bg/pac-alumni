<?php

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use App\Rules\StrongPassword;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Only admin can create users — enforced here AND in middleware
        return $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
            ],
            'password' => [
                'required',
                'string',
                new StrongPassword(),
            ],
            'role' => [
                'required',
                'string',
                // SECURITY: Cannot create another admin through this endpoint
                Rule::in(UserRole::assignableByAdmin()),
            ],
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'suffix' => ['nullable', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'This email address is already registered.',
            'role.in' => 'Invalid role. Allowed: dept_head, elem_principal, jhs_shs_principal.',
        ];
    }
}
