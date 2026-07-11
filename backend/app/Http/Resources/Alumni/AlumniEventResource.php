<?php

namespace App\Http\Resources\Alumni;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AlumniEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'title'          => $this->title,
            'content'        => $this->content,
            'image'          => $this->image,
            'is_pinned'      => $this->is_pinned,
            'start_datetime' => $this->start_datetime?->toISOString(),
            'end_datetime'   => $this->end_datetime?->toISOString(),
            'location'       => $this->location,
            'published_at'   => $this->published_at?->toISOString(),

            // The requesting alumni's own RSVP status — set via the my_rsvp subselect.
            'my_rsvp'        => $this->my_rsvp,
            'going_count'    => $this->whenCounted('going_count'),

            'posted_by'      => $this->whenLoaded('admin', fn () => $this->admin->full_name),
        ];
    }
}
