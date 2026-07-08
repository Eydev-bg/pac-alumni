<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnnouncementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'title'        => $this->title,
            'content'      => $this->content,
            'image'        => $this->image,
            'target_type'  => $this->target_type,
            'target_value' => $this->target_value,
            'is_published' => $this->is_published,
            'is_pinned'    => $this->is_pinned,
            'published_at' => $this->published_at?->toISOString(),
            'archived_at'  => $this->archived_at?->toISOString(),
            'reads_count'  => $this->whenCounted('reads'),
            'admin'        => $this->whenLoaded('admin', fn () => [
                'uuid'      => $this->admin->uuid,
                'full_name' => $this->admin->full_name,
            ]),
            'created_at'   => $this->created_at?->toISOString(),
            'updated_at'   => $this->updated_at?->toISOString(),
        ];
    }
}
