<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Http/Requests/Alumni/SendMessageRequest.php
//  Phase 3.3 — Async Alumni Messaging
// ═══════════════════════════════════════════════════════════

namespace App\Http\Requests\Alumni;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            // Optional quoted parent. Scoped to the route's conversation so a
            // message from another thread can never be quoted into this one.
            'reply_to_id' => [
                'nullable',
                'integer',
                Rule::exists('messages', 'id')
                    ->where('conversation_id', $this->route('id')),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'content.required' => 'Message cannot be empty.',
            'content.max'      => 'Message must not exceed 1000 characters.',
            'reply_to_id.exists' => 'The message you are replying to could not be found in this conversation.',
        ];
    }
}
