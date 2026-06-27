<?php

namespace App\Enums;

enum BoardStatus: string
{
    case NOT_APPLICABLE = 'not_applicable';
    case NOT_TAKEN = 'not_taken';
    case PASSER = 'passer';
    case FAILED = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::NOT_APPLICABLE => 'Not Applicable',
            self::NOT_TAKEN => 'Not Yet Taken',
            self::PASSER => 'Passer',
            self::FAILED => 'Failed',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
