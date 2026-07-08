<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAnnouncementRequest extends FormRequest
{
    /** Allowed target types (mirrors the announcements.target_type column). */
    public const TARGET_TYPES = ['all', 'education_level', 'department', 'course', 'batch'];

    public function authorize(): bool
    {
        return true; // Route is already protected by auth:api + role:admin
    }

    public function rules(): array
    {
        return [
            'title'        => ['required', 'string', 'max:200'],
            'content'      => ['required', 'string'],
            'image'        => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:4096'],
            'target_type'  => ['required', 'string', Rule::in(self::TARGET_TYPES)],
            // Required for every target type except "all".
            'target_value' => ['nullable', 'required_unless:target_type,all', 'string', 'max:100'],
            'is_pinned'    => ['sometimes', 'boolean'],
            // Optionally publish immediately on creation.
            'is_published' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'          => 'Announcement title is required.',
            'content.required'        => 'Announcement content is required.',
            'target_type.in'          => 'Invalid target type.',
            'target_value.required_unless' => 'A target value is required for the selected audience.',
            'image.image'             => 'The banner must be an image file.',
            'image.max'               => 'The banner image may not be larger than 4 MB.',
        ];
    }
}
