<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoginActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => $this->when($this->user, [
                'uuid' => $this->user?->uuid,
                'full_name' => $this->user?->full_name,
                'email' => $this->user?->email,
                'role' => $this->user?->role?->value,
            ]),
            'email_attempted' => $this->email_attempted,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'status' => $this->status->value,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
