<?php

namespace App\Http\Resources\Alumni;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AlumniApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'status'         => $this->status,
            'employer_notes' => $this->employer_notes,
            'applied_at'     => $this->applied_at?->toISOString(),
            'reviewed_at'    => $this->reviewed_at?->toISOString(),
            'created_at'     => $this->created_at?->toISOString(),

            'job' => $this->whenLoaded('jobPost', fn () => [
                'id'           => $this->jobPost->id,
                'title'        => $this->jobPost->title,
                'company_name' => $this->jobPost->company_name,
                'location'     => $this->jobPost->location,
                'job_type'     => $this->jobPost->job_type,
                'is_open'      => $this->jobPost->is_open,
                'status'       => $this->jobPost->status,
            ]),
        ];
    }
}
