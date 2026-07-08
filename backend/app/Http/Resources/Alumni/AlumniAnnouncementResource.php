<?php

namespace App\Http\Resources\Alumni;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AlumniAnnouncementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'title'        => $this->title,
            'content'      => $this->content,
            'image'        => $this->image,
            'is_pinned'    => $this->is_pinned,
            'published_at' => $this->published_at?->toISOString(),

            // Read state for the requesting alumni — set via withCount alias.
            'is_read'      => $this->when(isset($this->is_read), fn () => (bool) $this->is_read),

            'posted_by'    => $this->whenLoaded('admin', fn () => $this->admin->full_name),
        ];
    }
}
