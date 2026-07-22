<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Http/Requests/Alumni/UpdateProfileRequest.php
//  Validates alumni profile update fields.
//  SECURITY: All inputs sanitized and size-limited.
// ═══════════════════════════════════════════════════════════

namespace App\Http\Requests\Alumni;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth handled by middleware
    }

    public function rules(): array
    {
        return [
            'phone'                => ['nullable', 'string', 'max:20'],
            'current_location'     => ['nullable', 'string', 'max:300'],
            // Alumni Directory opt-out. Optional so existing profile updates
            // that don't touch visibility keep working unchanged.
            'is_directory_visible' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.max'                    => 'Phone number must not exceed 20 characters.',
            'current_location.max'         => 'Location must not exceed 300 characters.',
            'is_directory_visible.boolean' => 'Directory visibility must be true or false.',
        ];
    }
}
