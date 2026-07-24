<?php

namespace App\Http\Requests\Alumni\Settings;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string'],
            'password'         => [
                'required', 'string', 'confirmed',
                'different:current_password',
                new \App\Rules\StrongPassword(),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'password.different' => 'Your new password must be different from your current password.',
        ];
    }
}
