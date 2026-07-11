<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEventRequest extends FormRequest
{
    /** Allowed target types (mirrors the events.target_type column). */
    public const TARGET_TYPES = ['all', 'education_level', 'department', 'course', 'batch'];

    public function authorize(): bool
    {
        return true; // Route is already protected by auth:api + role:admin
    }

    public function rules(): array
    {
        return [
            'title'          => ['required', 'string', 'max:200'],
            'content'        => ['required', 'string'],
            'image'          => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:4096'],
            'target_type'    => ['required', 'string', Rule::in(self::TARGET_TYPES)],
            // Required for every target type except "all".
            'target_value'   => ['nullable', 'required_unless:target_type,all', 'string', 'max:100'],
            'start_datetime' => ['required', 'date'],
            'end_datetime'   => ['required', 'date', 'after_or_equal:start_datetime'],
            'location'       => ['required', 'string', 'max:255'],
            'is_pinned'      => ['sometimes', 'boolean'],
            // Optionally publish immediately on creation.
            'is_published'   => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'               => 'Event title is required.',
            'content.required'             => 'Event content is required.',
            'target_type.in'               => 'Invalid target type.',
            'target_value.required_unless' => 'A target value is required for the selected audience.',
            'start_datetime.required'      => 'Event start date and time is required.',
            'end_datetime.required'        => 'Event end date and time is required.',
            'end_datetime.after_or_equal'  => 'The event end must be on or after the start.',
            'location.required'            => 'Event location is required.',
            'image.image'                  => 'The banner must be an image file.',
            'image.max'                    => 'The banner image may not be larger than 4 MB.',
        ];
    }
}
