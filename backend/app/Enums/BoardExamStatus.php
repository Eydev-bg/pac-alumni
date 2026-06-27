<?php

namespace App\Enums;

enum BoardExamStatus: string
{
    case PASSER = 'passer';
    case FAILED = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::PASSER => 'Passer',
            self::FAILED => 'Failed',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
