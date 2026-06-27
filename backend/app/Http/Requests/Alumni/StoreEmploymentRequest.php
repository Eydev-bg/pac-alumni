<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Http/Requests/Alumni/StoreEmploymentRequest.php
//  Validates alumni employment submission.
//  Handles both employed and unemployed status.
// ═══════════════════════════════════════════════════════════

namespace App\Http\Requests\Alumni;

use App\Enums\EmploymentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmploymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'employment_status' => ['required', 'string', Rule::in(['employed', 'unemployed'])],
        ];

        // Additional fields required only when employed
        if ($this->input('employment_status') === 'employed') {
            $rules['company_name']     = ['required', 'string', 'max:300'];
            $rules['job_title']        = ['required', 'string', 'max:200'];
            $rules['industry']         = ['required', 'string', 'max:200'];
            $rules['employment_type']  = ['required', 'string', Rule::in(EmploymentType::values())];
            $rules['start_date']       = ['nullable', 'date', 'before_or_equal:today'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'employment_status.required' => 'Employment status is required.',
            'employment_status.in'       => 'Status must be either employed or unemployed.',
            'company_name.required'      => 'Company name is required when employed.',
            'company_name.max'           => 'Company name must not exceed 300 characters.',
            'job_title.required'         => 'Job title is required when employed.',
            'job_title.max'              => 'Job title must not exceed 200 characters.',
            'industry.required'          => 'Industry is required when employed.',
            'industry.max'              => 'Industry must not exceed 200 characters.',
            'employment_type.required'   => 'Employment type is required when employed.',
            'employment_type.in'         => 'Invalid employment type.',
            'start_date.date'            => 'Invalid date format.',
            'start_date.before_or_equal' => 'Start date cannot be in the future.',
        ];
    }
}
