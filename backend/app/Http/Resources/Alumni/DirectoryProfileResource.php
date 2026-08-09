<?php
// ═══════════════════════════════════════════════════════════
//  FILE: backend/app/Http/Resources/Alumni/DirectoryProfileResource.php
//  Alumni Directory PUBLIC profile shape. Based on the structure of
//  AlumniService::getProfile() (personal / academic / employment /
//  location / status) but PRIVACY-SCRUBBED:
//    • NO email, NO phone (the only sensitive fields that exist).
//    • alumni_id_number is intentionally OMITTED — it is the matching
//      key used in the registration/verification flow, so exposing
//      another alumnus's ID to peers is a mild impersonation risk.
//      It's not contact info, but we err safe (the spec left this to
//      our judgement).
//  Board status is computed from the SOURCE OF TRUTH (course board-
//  program flag + a passed board_exam_record), not the derived
//  alumni_profiles.board_status column.
// ═══════════════════════════════════════════════════════════

namespace App\Http\Resources\Alumni;

use App\Enums\BoardStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DirectoryProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $profile  = $this->alumniProfile;
        $graduate = $profile?->graduate;
        $course   = $graduate?->course;
        $dept     = $course?->department;
        $current  = $graduate?->employmentRecords?->first();

        $board = $this->resolveBoardStatus($course, $graduate);

        return [
            // Target's user UUID — wires "Send Message" on the frontend.
            'uuid' => $this->uuid,

            'personal' => [
                'first_name'      => $this->first_name,
                'middle_name'     => $this->middle_name,
                'last_name'       => $this->last_name,
                'suffix'          => $this->suffix,
                'full_name'       => $this->full_name,
                'profile_picture' => $this->profile_picture,
                'last_active_at'  => $this->last_active_at?->toISOString(),
                // NO email, NO phone.
            ],

            'academic' => [
                'graduation_year'       => $graduate?->graduation_year,
                'education_level'       => $graduate?->education_level?->value,
                'education_level_label' => $graduate?->education_level?->label(),
                'course_name'           => $course?->name,
                'course_code'           => $course?->code,
                'department_name'       => $dept?->name,
                'department_code'       => $dept?->code,
                'is_board_program'      => (bool) ($course?->is_board_program ?? false),
            ],

            'employment' => [
                'employment_status' => $profile?->employment_status?->value,
                'employment_label'  => $profile?->employment_status?->label(),
                'company'           => $current?->company_name,
                'position'          => $current?->job_title,
                'industry'          => $current?->industry,
            ],

            'location' => [
                'current_location' => $profile?->current_location,
            ],

            'status' => [
                'board_status' => $board->value,
                'board_label'  => $board->label(),
            ],
        ];
    }

    /**
     * Derive board status from the source of truth rather than the (unreliable)
     * alumni_profiles.board_status column:
     *   • course is not a board program      → NOT_APPLICABLE
     *   • has a PASSED board_exam_record      → PASSED
     *   • otherwise (board program, no pass)  → NOT_TAKEN
     */
    private function resolveBoardStatus($course, $graduate): BoardStatus
    {
        if (!($course?->is_board_program)) {
            return BoardStatus::NOT_APPLICABLE;
        }

        $passed = $graduate?->boardExamRecords
            ?->contains(fn($record) => $record->status === BoardStatus::PASSED);

        return $passed ? BoardStatus::PASSED : BoardStatus::NOT_TAKEN;
    }
}
