<?php
// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: backend/app/Http/Resources/Admin/VerificationLogResource.php
// ═══════════════════════════════════════════════════════════

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VerificationLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'alumni_id_input' => $this->alumni_id_input,
            'name_input' => $this->name_input,
            'email_input' => $this->email_input,
            'ip_address' => $this->ip_address,
            'status' => $this->status?->value ?? $this->attributes['status'] ?? null,
            'status_label' => $this->status?->label() ?? ucfirst($this->attributes['status'] ?? ''),
            'rejection_reason' => $this->rejection_reason,
            'matched_graduate' => $this->when($this->relationLoaded('matchedGraduate') && $this->matchedGraduate, [
                'id' => $this->matchedGraduate?->id,
                'full_name' => $this->matchedGraduate?->full_name,
                'alumni_id' => $this->matchedGraduate?->alumni_id_number,
            ]),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
