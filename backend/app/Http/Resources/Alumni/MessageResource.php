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

        // An unsent message keeps its row (so replies quoting it and cursor
        // pagination stay intact) but must never ship its text or attachment
        // again — the frontend renders the placeholder off `is_unsent` alone.
        $isUnsent = $this->unsent_at !== null;
        $replyToUnsent = $this->replyTo && $this->replyTo->unsent_at !== null;

        return [
            'id'         => $this->id,
            'content'    => $isUnsent ? null : $this->content,
            'is_unsent'  => $isUnsent,
            'is_mine'    => (int) $this->sender_id === (int) $authUserId,
            'is_read'    => $this->is_read,
            'read_at'    => $this->read_at?->toISOString(),
            // Compact snapshot of the quoted parent, or null when this isn't a
            // reply (or the parent was deleted — nullOnDelete leaves this null).
            // A quote of an unsent message is stripped the same way.
            'reply_to' => $this->reply_to_id && $this->relationLoaded('replyTo') && $this->replyTo
                ? [
                    'id'          => $this->replyTo->id,
                    'content'     => $replyToUnsent ? null : $this->replyTo->content,
                    'is_unsent'   => $replyToUnsent,
                    'sender_name' => $this->replyTo->sender?->full_name ?? 'PAC Alumnus',
                    'is_mine'     => (int) $this->replyTo->sender_id === (int) $authUserId,
                ]
                : null,
            // One optional image or PDF. `url` is resolved by the model
            // accessor (short-lived signed URL on a cloud disk). The stored
            // file is deleted on unsend, so this is null from then on.
            'attachment' => !$isUnsent && $this->attachment_path
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
