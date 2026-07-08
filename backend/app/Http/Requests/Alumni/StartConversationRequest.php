<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Http/Requests/Alumni/StartConversationRequest.php
//  Phase 3.3 — Async Alumni Messaging
// ═══════════════════════════════════════════════════════════

namespace App\Http\Requests\Alumni;

use Illuminate\Foundation\Http\FormRequest;

class StartConversationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Recipient identified by UUID (numeric ids are never exposed).
            'recipient_id' => ['required', 'string', 'exists:users,uuid'],
        ];
    }

    public function messages(): array
    {
        return [
            'recipient_id.required' => 'A recipient is required.',
            'recipient_id.exists'   => 'The selected recipient does not exist.',
        ];
    }
}
