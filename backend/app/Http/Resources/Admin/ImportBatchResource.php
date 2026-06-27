<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ImportBatchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'file_name' => $this->file_name,
            'education_level' => $this->education_level?->value ?? $this->attributes['education_level'] ?? null,
            'education_level_label' => $this->education_level?->label() ?? ucfirst($this->attributes['education_level'] ?? ''),
            'total_records' => $this->total_records,
            'imported_count' => $this->imported_count,
            'duplicate_count' => $this->duplicate_count,
            'error_count' => $this->error_count,
            'status' => $this->status?->value ?? $this->attributes['status'] ?? 'processing',
            'status_label' => $this->status?->label() ?? ucfirst($this->attributes['status'] ?? 'processing'),
            'error_details' => $this->error_details,
            'uploaded_by' => $this->when($this->relationLoaded('uploadedBy'), [
                'uuid' => $this->uploadedBy?->uuid,
                'full_name' => $this->uploadedBy?->full_name,
            ]),
            'created_at' => $this->created_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
        ];
    }
}
