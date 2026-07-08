<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class EmployerStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route is already protected by role:admin
    }

    public function rules(): array
    {
        return [
            // Optional reason recorded on the employer (suspend/deactivate).
            'admin_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
