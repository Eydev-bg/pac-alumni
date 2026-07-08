<?php

namespace App\Http\Resources\Alumni;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Set by the controller so we can resolve "the other participant".
        $authUserId = $request->attributes->get('auth_user_id');

        $other = $this->participant_one_id === $authUserId
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
            ],
            'last_message' => $this->whenLoaded('latestMessage', function () use ($authUserId) {
                if (!$this->latestMessage) {
                    return null;
                }

                return [
                    'content'    => $this->latestMessage->content,
                    'is_mine'    => $this->latestMessage->sender_id === $authUserId,
                    'created_at' => $this->latestMessage->created_at?->toISOString(),
                ];
            }),
            'unread_count'    => $this->unread_count ?? 0,
            'last_message_at' => $this->last_message_at?->toISOString(),
        ];
    }
}
