<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Http/Resources/Alumni/DirectoryCardResource.php
//  Alumni Directory list-card shape. PRIVACY: professional/academic
//  info only — NO email, NO phone (they are never loaded or emitted).
//  Input is a User (role=alumni) with alumniProfile.graduate.course
//  .department and the current employment record eager-loaded.
// ═══════════════════════════════════════════════════════════

namespace App\Http\Resources\Alumni;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DirectoryCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $profile  = $this->alumniProfile;
        $graduate = $profile?->graduate;
        $course   = $graduate?->course;
        $dept     = $course?->department;
        // employmentRecords is eager-loaded constrained to the current record.
        $current  = $graduate?->employmentRecords?->first();

        return [
            // user UUID — wires "Send Message" (POST /conversations recipient_id).
            'uuid'              => $this->uuid,
            'full_name'         => $this->full_name,
            'profile_picture'   => $this->profile_picture,
            'course' => $course ? [
                'name' => $course->name,
                'code' => $course->code,
            ] : null,
            'department' => $dept ? [
                'name' => $dept->name,
            ] : null,
            'graduation_year'   => $graduate?->graduation_year,
            'employment_status' => $profile?->employment_status?->value,
            'employment_label'  => $profile?->employment_status?->label(),
            'position'          => $current?->job_title,
            'company'           => $current?->company_name,
            'current_location'  => $profile?->current_location,
        ];
    }
}
