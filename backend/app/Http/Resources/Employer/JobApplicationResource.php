<?php

namespace App\Http\Resources\Employer;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JobApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'job_post_id'    => $this->job_post_id,
            'status'         => $this->status,
            'employer_notes' => $this->employer_notes,
            'applied_at'     => $this->applied_at?->toISOString(),
            'reviewed_at'    => $this->reviewed_at?->toISOString(),
            'created_at'     => $this->created_at?->toISOString(),

            // The alumni profile IS the application (no resume upload).
            'alumni'         => $this->when(
                $this->relationLoaded('alumniProfile') && $this->alumniProfile,
                fn () => $this->alumniSnapshot()
            ),
        ];
    }

    /**
     * Build the alumni snapshot sent to the employer as the "application".
     */
    private function alumniSnapshot(): array
    {
        $profile  = $this->alumniProfile;
        $user     = $profile->relationLoaded('user') ? $profile->user : $profile->user;
        $graduate = $profile->graduate;

        // Current employment (if any) — eager-loaded via graduate.employmentRecords.
        $current = $graduate
            ? $graduate->employmentRecords->firstWhere('is_current', true)
            : null;

        return [
            'full_name'         => $graduate?->full_name ?? $user?->full_name,
            'email'             => $user?->email,
            'contact_number'    => $user?->phone,
            'current_location'  => $profile->current_location,
            'course'            => $graduate?->course?->name,
            'course_code'       => $graduate?->course_code,
            'department'        => $graduate?->department_name,
            'graduation_year'   => $graduate?->graduation_year,
            'employment_status' => $profile->employment_status?->value ?? $profile->employment_status,
            'current_employment' => $current ? [
                'company_name' => $current->company_name,
                'job_title'    => $current->job_title,
                'industry'     => $current->industry,
            ] : null,
        ];
    }
}
