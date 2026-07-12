<?php

namespace App\Http\Resources\Alumni;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AlumniJobPostingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
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
        ];
    }
}
