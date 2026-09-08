<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Http/Requests/Alumni/DeleteMessageRequest.php
//  Two delete modes, matching Messenger:
//    self     — hide from my view only (any message, any age)
//    everyone — unsend for both sides (own messages only, no time limit)
//  The sender check itself lives in MessageService::deleteMessage(),
//  which owns the 403 — this request only validates the shape.
// ═══════════════════════════════════════════════════════════

namespace App\Http\Requests\Alumni;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DeleteMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'scope' => ['required', 'string', Rule::in(['self', 'everyone'])],
        ];
    }

    public function messages(): array
    {
        return [
            'scope.required' => 'Choose whether to remove this message for you or for everyone.',
            'scope.in'       => 'Delete scope must be either "self" or "everyone".',
        ];
    }
}
