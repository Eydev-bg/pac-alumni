<?php

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use App\Rules\StrongPassword;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    public function rules(): array
    {
        // Get the user being updated via route model binding (UUID)
        $userUuid = $this->route('user');

        return [
            'email' => [
                'sometimes',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->where(function ($query) use ($userUuid) {
                    // Exclude the current user from unique check
                    $query->where('uuid', '!=', $userUuid);
                }),
            ],
            'password' => [
                'nullable',
                'string',
                new StrongPassword(),
            ],
            'role' => [
                'sometimes',
                'string',
                Rule::in(UserRole::assignableByAdmin()),
            ],
            'first_name' => ['sometimes', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['sometimes', 'string', 'max:100'],
            'suffix' => ['nullable', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:20'],
        ];
    }
}
