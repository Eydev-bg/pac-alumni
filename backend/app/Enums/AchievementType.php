<?php

namespace App\Enums;

enum AchievementType: string
{
    case EMPLOYMENT_UPDATE = 'employment_update';
    case BOARD_EXAM_PASSED = 'board_exam_passed';
    case PROFILE_COMPLETED = 'profile_completed';
    case NEW_REGISTRATION = 'new_registration';

    public function label(): string
    {
        return match ($this) {
            self::EMPLOYMENT_UPDATE => 'Employment Update',
            self::BOARD_EXAM_PASSED => 'Board Exam Passed',
            self::PROFILE_COMPLETED => 'Profile Completed',
            self::NEW_REGISTRATION => 'New Alumni',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
