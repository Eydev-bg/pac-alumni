<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Http/Requests/Alumni/StoreBoardExamRequest.php
//  Validates alumni board exam submission.
// ═══════════════════════════════════════════════════════════

namespace App\Http\Requests\Alumni;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBoardExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status'     => ['required', 'string', Rule::in(['passed'])],
            'exam_year'  => ['required', 'integer', 'min:1990', 'max:' . (date('Y') + 1)],
            'proof_file' => ['nullable', 'file', 'mimes:jpeg,jpg,png,pdf', 'max:5120'], // 5MB max
        ];
    }

    public function messages(): array
    {
        return [
            'status.required'    => 'Board exam status is required.',
            'status.in'          => 'Board exam status must be Passed.',
            'exam_year.required' => 'Exam year is required.',
            'exam_year.min'      => 'Exam year must be 1990 or later.',
            'exam_year.max'      => 'Exam year cannot be in the future.',
            'proof_file.mimes'   => 'Proof must be a JPEG, PNG, or PDF file.',
            'proof_file.max'     => 'Proof file must not exceed 5MB.',
        ];
    }
}
