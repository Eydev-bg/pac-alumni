<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'title'            => $this->title,
            'content'          => $this->content,
            'image'            => $this->image,
            'target_type'      => $this->target_type,
            'target_value'     => $this->target_value,
            'start_datetime'   => $this->start_datetime?->toISOString(),
            'end_datetime'     => $this->end_datetime?->toISOString(),
            'location'         => $this->location,
            'is_published'     => $this->is_published,
            'is_pinned'        => $this->is_pinned,
            'published_at'     => $this->published_at?->toISOString(),
            'archived_at'      => $this->archived_at?->toISOString(),
            'going_count'      => $this->whenCounted('going_count'),
            'interested_count' => $this->whenCounted('interested_count'),
            'admin'            => $this->whenLoaded('admin', fn () => [
                'uuid'      => $this->admin->uuid,
                'full_name' => $this->admin->full_name,
            ]),
            'created_at'       => $this->created_at?->toISOString(),
            'updated_at'       => $this->updated_at?->toISOString(),
        ];
    }
}
