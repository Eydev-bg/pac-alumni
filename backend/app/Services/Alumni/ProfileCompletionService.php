<?php

namespace App\Services\Alumni;

use App\Models\AlumniProfile;
use App\Models\BoardExamRecord;
use App\Models\EmploymentRecord;

class ProfileCompletionService
{
    /**
     * Compute profile completion for an alumni from existing data (no new
     * table). Returns the overall percentage plus a per-item breakdown the
     * frontend uses to render actionable nudges with deep links.
     *
     * The board-exam item is only included for board programs; non-board
     * alumni are scored against the remaining items so they can still reach
     * 100%.
     */
    public function compute(AlumniProfile $profile): array
    {
        $profile->loadMissing(['user', 'graduate.course']);

        $user = $profile->user;
        $graduate = $profile->graduate;
        $graduateId = $graduate?->id;
        $isBoardProgram = (bool) $graduate?->course?->is_board_program;

        // Each item: key, human label, completion flag, nudge text, deep link.
        $items = [
            [
                'key'   => 'profile_picture',
                'label' => 'Profile Photo',
                'done'  => !empty($user?->profile_picture),
                'hint'  => 'Add a profile photo',
                'link'  => '/alumni/profile#section-personal',
            ],
            [
                'key'   => 'contact_number',
                'label' => 'Contact Number',
                'done'  => !empty($user?->phone),
                'hint'  => 'Add your contact number',
                'link'  => '/alumni/profile#section-personal-info',
            ],
            [
                'key'   => 'address',
                'label' => 'Current Location',
                'done'  => !empty($profile->current_location),
                'hint'  => 'Add your current location',
                'link'  => '/alumni/profile#section-personal-info',
            ],
            [
                'key'   => 'employment_status',
                'label' => 'Employment Information',
                'done'  => $graduateId
                    ? EmploymentRecord::where('graduate_id', $graduateId)->exists()
                    : false,
                'hint'  => 'Update your employment status',
                'link'  => '/alumni/employment',
            ],
        ];

        if ($isBoardProgram) {
            $items[] = [
                'key'   => 'board_exam',
                'label' => 'Board Exam Result',
                'done'  => $graduateId
                    ? BoardExamRecord::where('graduate_id', $graduateId)->exists()
                    : false,
                'hint'  => 'Record your board exam result',
                'link'  => '/alumni/board-exam',
            ];
        }

        $total = count($items);
        $completed = count(array_filter($items, fn($i) => $i['done']));
        $percentage = $total > 0 ? (int) round(($completed / $total) * 100) : 0;

        $missing = array_values(array_filter($items, fn($i) => !$i['done']));

        return [
            'percentage'  => $percentage,
            'completed'   => $completed,
            'total'       => $total,
            'is_complete' => $completed === $total,
            'items'       => $items,
            'missing'     => $missing,
        ];
    }

    /**
     * Whether the alumni's profile is 100% complete. Single source of truth
     * for profile-completion checks across the app.
     */
    public function isComplete(AlumniProfile $profile): bool
    {
        return $this->compute($profile)['is_complete'];
    }
}
