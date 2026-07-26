<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Http/Requests/Alumni/UploadProfilePictureRequest.php
//  Validates profile picture upload.
//  SECURITY: File type, size, and mime type restricted.
// ═══════════════════════════════════════════════════════════

namespace App\Http\Requests\Alumni;

use Illuminate\Foundation\Http\FormRequest;

class UploadProfilePictureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'profile_picture' => [
                'required',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:5120', // 5MB max
                'dimensions:min_width=50,min_height=50,max_width=5000,max_height=5000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'profile_picture.required'   => 'Please select an image to upload.',
            'profile_picture.image'      => 'The file must be an image.',
            'profile_picture.mimes'      => 'Only JPEG, JPG, PNG, and WebP images are accepted.',
            'profile_picture.max'        => 'Image must not exceed 5MB.',
            'profile_picture.dimensions' => 'Image must be between 50x50 and 5000x5000 pixels.',
        ];
    }
}
