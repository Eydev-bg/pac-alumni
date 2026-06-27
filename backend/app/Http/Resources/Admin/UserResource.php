<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'email' => $this->email,
            'role' => $this->role?->value ?? $this->attributes['role'] ?? null,
            'role_label' => $this->role?->label() ?? ucfirst($this->attributes['role'] ?? ''),
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'suffix' => $this->suffix,
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'profile_picture' => $this->profile_picture,
            'status' => $this->status?->value ?? $this->attributes['status'] ?? 'active',
            'status_label' => $this->status?->label() ?? ucfirst($this->attributes['status'] ?? 'active'),
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'last_login_at' => $this->last_login_at?->toISOString(),
            'last_login_ip' => $this->when(
                $request->user()?->isAdmin(),
                $this->last_login_ip
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
