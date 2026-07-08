<?php

namespace App\Http\Resources\Alumni;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AchievementFeedResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $profile = $this->alumniProfile;
        $user = $profile?->user;
        $graduate = $profile?->graduate;

        // Set by the controller so ownership is resolved without a per-row query.
        $ownProfileId = $request->attributes->get('own_profile_id');

        return [
            'id'          => $this->id,
            'type'        => $this->type->value,
            'type_label'  => $this->type->label(),
            'title'       => $this->title,
            'description' => $this->description,
            'is_public'   => $this->is_public,
            'is_own'      => $this->alumni_profile_id === $ownProfileId,
            'created_at'  => $this->created_at?->toISOString(),
            'alumni'      => [
                'name'            => $user?->full_name ?? 'PAC Alumnus',
                'profile_picture' => $user?->profile_picture,
                'course_code'     => $graduate?->course?->code,
                'graduation_year' => $graduate?->graduation_year,
            ],
        ];
    }
}
