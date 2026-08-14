<?php

namespace App\Http\Resources\Admin;

use App\Enums\JobSource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JobPostingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $poster = $this->source === JobSource::ALUMNI ? $this->postedByAlumni : null;

        return [
            'id'                   => $this->id,
            'company_name'         => $this->company_name,
            'company_logo'         => $this->company_logo,
            'job_position'         => $this->job_position,
            'location'             => $this->location,
            'employment_type'      => [
                'value' => $this->employment_type?->value,
                'label' => $this->employment_type?->label(),
            ],
            'salary'               => $this->salary,
            'benefits'             => $this->benefits,
            'description'          => $this->description,
            'requirements'         => $this->requirements,
            'application_link'     => $this->application_link,
            'company_email'        => $this->company_email,
            'application_deadline' => $this->application_deadline?->toDateString(),
            'status'               => [
                'value' => $this->status?->value,
                'label' => $this->status?->label(),
            ],
            'is_pinned'            => $this->is_pinned,
            'published_at'         => $this->published_at?->toISOString(),
            // Who authored it — admins manage both admin- and alumni-posted jobs.
            'source'               => $this->source?->value,
            'posted_by_alumni_name' => $poster
                ? trim($poster->first_name . ' ' . $poster->last_name)
                : null,
            'posted_by'            => $this->whenLoaded('postedBy', fn () => [
                'uuid'      => $this->postedBy->uuid,
                'full_name' => $this->postedBy->full_name,
            ]),
            'created_at'           => $this->created_at?->toISOString(),
            'updated_at'           => $this->updated_at?->toISOString(),
        ];
    }
}
