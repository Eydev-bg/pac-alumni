<?php

namespace App\Enums;

enum BoardStatus: string
{
    case NOT_TAKEN = 'not_taken';
    case PASSED = 'passed';
    case NOT_APPLICABLE = 'not_applicable';

    public function label(): string
    {
        return match ($this) {
            self::NOT_TAKEN => 'Not Yet Taken',
            self::PASSED => 'Passed',
            self::NOT_APPLICABLE => 'Not Applicable',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
