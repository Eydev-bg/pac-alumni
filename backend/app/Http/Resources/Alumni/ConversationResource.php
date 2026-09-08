<?php

namespace App\Http\Resources\Alumni;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Resolve the viewer directly from the auth guard (see MessageResource) —
        // works on every path regardless of the Request instance.
        $authUserId = auth('api')->id();

        $other = (int) $this->participant_one_id === (int) $authUserId
            ? $this->participantTwo
            : $this->participantOne;

        $graduate = $other?->alumniProfile?->graduate;

        return [
            'id'               => $this->id,
            'other_participant' => [
                'uuid'            => $other?->uuid,
                'name'            => $other?->full_name ?? 'PAC Alumnus',
                'profile_picture' => $other?->profile_picture,
                'course_code'     => $graduate?->course?->code,
                'graduation_year' => $graduate?->graduation_year,
                'last_active_at'  => $other?->last_active_at?->toISOString(),
            ],
            'last_message' => $this->whenLoaded('latestMessage', function () use ($authUserId) {
                if (!$this->latestMessage) {
                    return null;
                }

                // Same stripping as MessageResource — an unsent message must
                // not leak its text through the inbox preview either.
                $isUnsent = $this->latestMessage->unsent_at !== null;

                return [
                    'content'         => $isUnsent ? null : $this->latestMessage->content,
                    'is_unsent'       => $isUnsent,
                    // Lets the inbox show "📷 Photo" / "📄 PDF" for an
                    // attachment-only message, which has no text to preview.
                    // Already a column on messages — no extra query.
                    'attachment_type' => $isUnsent ? null : $this->latestMessage->attachment_type, // 'image' | 'pdf' | null
                    'is_mine'         => (int) $this->latestMessage->sender_id === (int) $authUserId,
                    'created_at'      => $this->latestMessage->created_at?->toISOString(),
                ];
            }),
            'unread_count'    => $this->unread_count ?? 0,
            'last_message_at' => $this->last_message_at?->toISOString(),
        ];
    }
}
