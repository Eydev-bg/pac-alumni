<?php

namespace App\Http\Requests\Alumni;

use App\Enums\RsvpStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RsvpEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route is already protected by auth:api + role:alumni
    }

    public function rules(): array
    {
        return [
            // Allowed values sourced from the RsvpStatus enum (going, interested).
            'status' => ['required', 'string', Rule::in(RsvpStatus::values())],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'An RSVP status is required.',
            'status.in'       => 'Invalid RSVP status.',
        ];
    }
}
