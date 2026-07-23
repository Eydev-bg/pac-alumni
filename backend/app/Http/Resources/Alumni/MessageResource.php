<?php

namespace App\Http\Resources\Alumni;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Resolve the viewer directly from the auth guard — robust across every
        // path (a FormRequest on the POST route is a different instance than the
        // request the Resource receives, so a request attribute would be null).
        $authUserId = auth('api')->id();

        return [
            'id'         => $this->id,
            'content'    => $this->content,
            'is_mine'    => (int) $this->sender_id === (int) $authUserId,
            'is_read'    => $this->is_read,
            'sender'     => [
                'uuid' => $this->sender?->uuid,
                'name' => $this->sender?->full_name ?? 'PAC Alumnus',
            ],
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
