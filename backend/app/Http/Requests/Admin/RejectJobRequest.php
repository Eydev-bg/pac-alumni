<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class RejectJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route is already protected by role:admin
    }

    public function rules(): array
    {
        return [
            'admin_notes' => ['required', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'admin_notes.required' => 'A reason is required when rejecting a job post.',
        ];
    }
}
