<?php

namespace App\Http\Resources\Alumni;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AlumniJobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'title'            => $this->title,
            'description'      => $this->description,
            'company_name'     => $this->company_name,
            'location'         => $this->location,
            'job_type'         => $this->job_type,
            'salary_range_min' => $this->salary_range_min,
            'salary_range_max' => $this->salary_range_max,
            'qualifications'   => $this->qualifications,
            'is_open'          => $this->is_open,
            'expires_at'       => $this->expires_at?->toISOString(),
            'created_at'       => $this->created_at?->toISOString(),

            // Whether the current alumni has already applied (set via withCount alias).
            'has_applied'          => $this->when(isset($this->has_applied), fn () => (bool) $this->has_applied),
            'my_application_status' => $this->whenNotNull($this->my_application_status ?? null),

            'employer' => $this->whenLoaded('employer', fn () => [
                'id'              => $this->employer->id,
                'company_name'    => $this->employer->company_name,
                'company_logo'    => $this->employer->company_logo,
                'company_website' => $this->employer->company_website,
            ]),
        ];
    }
}
