<?php

namespace App\Http\Requests\Admin;

use App\Enums\EducationLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ImportGraduatesRequest extends FormRequest
{
    /**
     * Real (finfo-sniffed) MIME types accepted per file extension. A file whose
     * detected content type is not in the list for its extension is rejected
     * before PhpSpreadsheet ever parses it — this catches renamed/hostile files
     * (e.g. a .txt renamed to .xlsx) that pass an extension-only check.
     */
    private const CONTENT_TYPES_BY_EXTENSION = [
        'xlsx' => [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/zip', // xlsx is a zip container; some environments report this
        ],
        'xls' => [
            'application/vnd.ms-excel',
            'application/x-ole-storage',      // OLE2 compound document (legacy .xls)
            'application/CDFV2',              // finfo variant for OLE2 files
        ],
        'csv' => [
            'text/csv',
            'text/plain',
            'application/csv',
            'application/vnd.ms-excel',
        ],
    ];

    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'], // Max 10MB
            'education_level' => ['required', 'string', Rule::in(EducationLevel::values())],
        ];
    }

    /**
     * Content-level hardening: after the extension/size rules pass, verify the
     * file's actual sniffed MIME type matches an allowed spreadsheet/CSV type
     * for its extension.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            // Skip if the base rules already flagged the file — avoids duplicate
            // messaging and a redundant sniff on an invalid upload.
            if ($validator->errors()->has('file')) {
                return;
            }

            $file = $this->file('file');
            if (!$file || !$file->isValid()) {
                return;
            }

            $extension = strtolower($file->getClientOriginalExtension());
            $allowed = self::CONTENT_TYPES_BY_EXTENSION[$extension] ?? null;

            // Unknown extensions are already rejected by the 'mimes' rule.
            if ($allowed === null) {
                return;
            }

            $detectedMime = $file->getMimeType(); // finfo content sniff, not the client header

            if (!in_array($detectedMime, $allowed, true)) {
                $validator->errors()->add(
                    'file',
                    'File content does not match a valid Excel (.xlsx, .xls) or CSV file. The file may be corrupted or renamed.'
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Please select a file to upload.',
            'file.mimes' => 'File must be an Excel (.xlsx, .xls) or CSV file.',
            'file.max' => 'File size must not exceed 10MB.',
            'education_level.required' => 'Education level is required.',
            'education_level.in' => 'Invalid education level.',
        ];
    }
}
