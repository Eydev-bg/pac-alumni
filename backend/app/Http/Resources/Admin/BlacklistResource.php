<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BlacklistResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'identifier' => $this->identifier,
            'identifier_type' => $this->identifier_type?->value ?? $this->attributes['identifier_type'] ?? null,
            'identifier_type_label' => $this->identifier_type?->label() ?? ucfirst($this->attributes['identifier_type'] ?? ''),
            'reason' => $this->reason,
            'blacklisted_by' => $this->when($this->relationLoaded('blacklistedByUser'), [
                'uuid' => $this->blacklistedByUser?->uuid,
                'full_name' => $this->blacklistedByUser?->full_name,
            ]),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
