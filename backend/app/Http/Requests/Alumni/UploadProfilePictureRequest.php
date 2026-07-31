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
                'file',
                'mimes:jpeg,jpg,png,webp,heic,heif',
                'max:5120', // 5MB max
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'profile_picture.required' => 'Please select an image to upload.',
            'profile_picture.file'     => 'The upload must be a valid file.',
            'profile_picture.mimes'    => 'Only JPEG, PNG, WebP, or iPhone (HEIC) images are accepted.',
            'profile_picture.max'      => 'Image must not exceed 5MB.',
        ];
    }
}
