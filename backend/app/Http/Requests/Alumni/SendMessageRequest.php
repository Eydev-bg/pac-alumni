<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Http/Requests/Alumni/SendMessageRequest.php
//  Phase 3.3 — Async Alumni Messaging
// ═══════════════════════════════════════════════════════════

namespace App\Http\Requests\Alumni;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;
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
            // One optional image or PDF per message. HEIC/HEIF are absent by
            // design: the composer transcodes them to JPEG before upload (see
            // convertHeicToJpeg in ConversationThread.jsx), so only jpg, png,
            // webp and pdf ever reach this rule.
            'attachment' => [
                'nullable',
                'required_without:content',
                'file',
                'max:10240', // 10 MB, in kilobytes
                'mimes:jpg,jpeg,png,webp,pdf',
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
            'attachment.mimes' => 'Only images (JPG, PNG, WEBP) and PDF files are allowed.',
            'reply_to_id.exists' => 'The message you are replying to could not be found in this conversation.',
        ];
    }

    /**
     * TEMPORARY DIAGNOSTIC — remove once the Hostinger attachment failures are
     * pinned down. The 422 body only carries a generic "Validation failed."
     * message, so this records which rule actually fired and what PHP saw of
     * the upload: the client-supplied MIME, the server-detected MIME, the
     * guessed extension, and the PHP upload error code (a non-zero code means
     * the file was rejected by upload_max_filesize/post_max_size before any
     * rule ran). Look for "Message attachment rejected" in storage/logs.
     */
    protected function failedValidation(Validator $validator): void
    {
        $file = $this->file('attachment');

        $context = [
            'errors'              => $validator->errors()->toArray(),
            'has_file'            => $file !== null,
            'content_length'      => $this->header('Content-Length'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size'       => ini_get('post_max_size'),
            'fileinfo_loaded'     => extension_loaded('fileinfo'),
        ];

        if ($file !== null) {
            $context['client_name']      = $file->getClientOriginalName();
            $context['client_mime']      = $file->getClientMimeType();
            $context['client_extension'] = $file->getClientOriginalExtension();
            $context['php_upload_error'] = $file->getError(); // 0 = OK
            $context['is_valid']         = $file->isValid();

            // Both of these read the file from disk and can throw when the
            // host has no MIME guesser (fileinfo off and exec() disabled) or
            // when the upload was discarded — never let the probe itself turn
            // a 422 into a 500.
            try {
                $context['size_bytes'] = $file->getSize();
            } catch (\Throwable $e) {
                $context['size_bytes'] = 'error: ' . $e->getMessage();
            }

            try {
                $context['detected_mime']     = $file->getMimeType();
                $context['guessed_extension'] = $file->guessExtension();
            } catch (\Throwable $e) {
                $context['detection_error'] = $e->getMessage();
            }
        }

        Log::warning('Message attachment rejected', $context);

        parent::failedValidation($validator);
    }
}
