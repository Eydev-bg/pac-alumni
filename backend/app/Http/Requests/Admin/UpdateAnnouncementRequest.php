<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route is already protected by auth:api + role:admin
    }

    public function rules(): array
    {
        return [
            'title'        => ['sometimes', 'required', 'string', 'max:200'],
            'content'      => ['sometimes', 'required', 'string'],
            'image'        => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:4096'],
            'target_type'  => ['sometimes', 'required', 'string', Rule::in(StoreAnnouncementRequest::TARGET_TYPES)],
            'target_value' => ['nullable', 'required_unless:target_type,all', 'string', 'max:100'],
            'is_pinned'    => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'target_type.in'               => 'Invalid target type.',
            'target_value.required_unless' => 'A target value is required for the selected audience.',
            'image.image'                  => 'The banner must be an image file.',
            'image.max'                    => 'The banner image may not be larger than 4 MB.',
        ];
    }
}
