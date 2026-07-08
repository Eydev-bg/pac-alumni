<?php

namespace App\Http\Resources\Employer;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                       => $this->id,
            'company_name'             => $this->company_name,
            'company_email'            => $this->company_email,
            'company_address'          => $this->company_address,
            'company_contact_number'   => $this->company_contact_number,
            'company_website'          => $this->company_website,
            'company_logo'             => $this->company_logo,
            'business_permit_document' => $this->business_permit_document,
            'hr_full_name'             => $this->hr_full_name,
            'hr_position'              => $this->hr_position,
            'is_verified'              => $this->is_verified,
            'status'                   => $this->status,
            'admin_notes'              => $this->admin_notes,
            'jobs_count'               => $this->whenCounted('jobPosts'),
            'user'                     => $this->whenLoaded('user', fn () => [
                'uuid'   => $this->user->uuid,
                'email'  => $this->user->email,
                'status' => $this->user->status?->value ?? $this->user->status,
            ]),
            'created_at'               => $this->created_at?->toISOString(),
            'updated_at'               => $this->updated_at?->toISOString(),
        ];
    }
}
