<?php

namespace App\Http\Requests\Alumni\Settings;

use App\Enums\ThemePreference;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAppearanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'theme' => ['required', 'string', Rule::enum(ThemePreference::class)],
        ];
    }
}
