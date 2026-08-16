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
            'read_at'    => $this->read_at?->toISOString(),
            // Compact snapshot of the quoted parent, or null when this isn't a
            // reply (or the parent was deleted — nullOnDelete leaves this null).
            'reply_to' => $this->reply_to_id && $this->relationLoaded('replyTo') && $this->replyTo
                ? [
                    'id'          => $this->replyTo->id,
                    'content'     => $this->replyTo->content,
                    'sender_name' => $this->replyTo->sender?->full_name ?? 'PAC Alumnus',
                    'is_mine'     => (int) $this->replyTo->sender_id === (int) $authUserId,
                ]
                : null,
            // One optional image or PDF. `url` is resolved by the model
            // accessor (short-lived signed URL on a cloud disk).
            'attachment' => $this->attachment_path
                ? [
                    'url'  => $this->attachment_url,
                    'type' => $this->attachment_type,  // 'image' | 'pdf'
                    'name' => $this->attachment_name,
                    'size' => $this->attachment_size,
                ]
                : null,
            'sender'     => [
                'uuid' => $this->sender?->uuid,
                'name' => $this->sender?->full_name ?? 'PAC Alumnus',
            ],
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
