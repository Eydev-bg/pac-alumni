<?php

namespace App\Http\Resources\Employer;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JobPostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'employer_id'       => $this->employer_id,
            'title'             => $this->title,
            'description'       => $this->description,
            'company_name'      => $this->company_name,
            'location'          => $this->location,
            'job_type'          => $this->job_type,
            'salary_range_min'  => $this->salary_range_min,
            'salary_range_max'  => $this->salary_range_max,
            'qualifications'    => $this->qualifications,
            'is_open'           => $this->is_open,
            'status'            => $this->status,
            'admin_notes'       => $this->admin_notes,
            'expires_at'        => $this->expires_at?->toISOString(),
            'applications_count' => $this->whenCounted('applications'),
            'employer'          => $this->whenLoaded('employer', fn () => [
                'id'           => $this->employer->id,
                'company_name' => $this->employer->company_name,
                'status'       => $this->employer->status,
            ]),
            'created_at'        => $this->created_at?->toISOString(),
            'updated_at'        => $this->updated_at?->toISOString(),
        ];
    }
}
