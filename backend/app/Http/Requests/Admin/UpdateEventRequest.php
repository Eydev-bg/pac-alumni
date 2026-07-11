<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route is already protected by auth:api + role:admin
    }

    public function rules(): array
    {
        return [
            'title'          => ['sometimes', 'required', 'string', 'max:200'],
            'content'        => ['sometimes', 'required', 'string'],
            'image'          => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:4096'],
            'target_type'    => ['sometimes', 'required', 'string', Rule::in(StoreEventRequest::TARGET_TYPES)],
            'target_value'   => ['nullable', 'required_unless:target_type,all', 'string', 'max:100'],
            'start_datetime' => ['sometimes', 'required', 'date'],
            'end_datetime'   => ['sometimes', 'required', 'date', 'after_or_equal:start_datetime'],
            'location'       => ['sometimes', 'required', 'string', 'max:255'],
            'is_pinned'      => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'target_type.in'               => 'Invalid target type.',
            'target_value.required_unless' => 'A target value is required for the selected audience.',
            'end_datetime.after_or_equal'  => 'The event end must be on or after the start.',
            'location.required'            => 'Event location is required.',
            'image.image'                  => 'The banner must be an image file.',
            'image.max'                    => 'The banner image may not be larger than 4 MB.',
        ];
    }
}
