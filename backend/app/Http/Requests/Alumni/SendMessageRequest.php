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
            // Capped at 1000 characters (see Phase 3.3 constraints). Optional
            // only when a file is attached — a message must carry text, an
            // attachment, or both.
            'content' => ['nullable', 'required_without:attachment', 'string', 'max:1000'],
            // Optional quoted parent. Scoped to the route's conversation so a
            // message from another thread can never be quoted into this one.
            'reply_to_id' => [
                'nullable',
                'integer',
                Rule::exists('messages', 'id')
                    ->where('conversation_id', $this->route('id')),
            ],
            // One optional image or PDF per message.
            'attachment' => [
                'nullable',
                'required_without:content',
                'file',
                'max:10240', // 10 MB, in kilobytes
                'mimes:jpg,jpeg,png,webp,heic,heif,pdf',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'content.required_without' => 'Message cannot be empty unless a file is attached.',
            'content.max'      => 'Message must not exceed 1000 characters.',
            'attachment.required_without' => 'Attach a file or type a message.',
            'attachment.max'   => 'The file must not be larger than 10 MB.',
            'attachment.mimes' => 'Only images (JPG, PNG, WEBP, HEIC) and PDF files are allowed.',
            'reply_to_id.exists' => 'The message you are replying to could not be found in this conversation.',
        ];
    }
}
