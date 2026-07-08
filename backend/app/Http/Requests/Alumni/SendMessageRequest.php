<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Http/Requests/Alumni/SendMessageRequest.php
//  Phase 3.3 — Async Alumni Messaging
// ═══════════════════════════════════════════════════════════

namespace App\Http\Requests\Alumni;

use Illuminate\Foundation\Http\FormRequest;

class SendMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Text only, capped at 1000 characters (see Phase 3.3 constraints).
            'content' => ['required', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'content.required' => 'Message cannot be empty.',
            'content.max'      => 'Message must not exceed 1000 characters.',
        ];
    }
}
