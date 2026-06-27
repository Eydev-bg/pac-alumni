<?php

namespace App\Http\Requests\Admin;

use App\Enums\EducationLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ImportGraduatesRequest extends FormRequest
{
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
