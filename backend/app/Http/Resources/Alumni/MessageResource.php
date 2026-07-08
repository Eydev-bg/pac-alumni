<?php

namespace App\Http\Resources\Alumni;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Set by the controller so each message knows if the viewer sent it.
        $authUserId = $request->attributes->get('auth_user_id');

        return [
            'id'         => $this->id,
            'content'    => $this->content,
            'is_mine'    => $this->sender_id === $authUserId,
            'is_read'    => $this->is_read,
            'sender'     => [
                'uuid' => $this->sender?->uuid,
                'name' => $this->sender?->full_name ?? 'PAC Alumnus',
            ],
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
