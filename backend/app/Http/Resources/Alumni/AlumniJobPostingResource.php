<?php

namespace App\Http\Resources\Alumni;

use App\Enums\JobSource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AlumniJobPostingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isAlumniPosted = $this->source === JobSource::ALUMNI;
        $poster = $isAlumniPosted ? $this->postedByAlumni : null;
        $graduate = $poster?->alumniProfile?->graduate;

        // Public fields only — no posted_by admin identity or internal status.
        return [
            'id'                    => $this->id,
            'company_name'          => $this->company_name,
            'company_logo'          => $this->company_logo,
            'job_position'          => $this->job_position,
            'location'              => $this->location,
            'employment_type'       => $this->employment_type?->value,
            'employment_type_label' => $this->employment_type?->label(),
            'salary'                => $this->salary,
            'benefits'              => $this->benefits,
            'description'           => $this->description,
            'requirements'          => $this->requirements,
            'application_link'      => $this->application_link,
            'company_email'         => $this->company_email,
            'application_deadline'  => $this->application_deadline?->toDateString(),
            'is_pinned'             => $this->is_pinned,
            'published_at'          => $this->published_at?->toISOString(),

            // Attribution — only alumni-posted jobs carry a poster identity.
            // Admin-posted jobs are the default and show nothing extra.
            'source'                => $this->source?->value,
            'posted_by_alumni_name' => $poster
                ? trim($poster->first_name . ' ' . $poster->last_name)
                : null,
            'posted_by_alumni_course'     => $graduate?->course?->code
                ?? $graduate?->course?->name,
            'posted_by_alumni_batch_year' => $graduate?->graduation_year,

            // Lets the Career Center render edit/delete only on own posts.
            'is_mine' => $isAlumniPosted
                && $this->posted_by_alumni === $request->user('api')?->id,
        ];
    }
}
