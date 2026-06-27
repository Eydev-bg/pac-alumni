<?php

namespace App\Http\Requests\Admin;

use App\Enums\BlacklistIdentifierType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBlacklistRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'identifier' => ['required', 'string', 'max:255'],
            'identifier_type' => ['required', 'string', Rule::in(BlacklistIdentifierType::values())],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
