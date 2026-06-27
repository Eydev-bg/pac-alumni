<?php

namespace App\Enums;

enum EmploymentStatus: string
{
    case EMPLOYED = 'employed';
    case UNEMPLOYED = 'unemployed';
    case UNKNOWN = 'unknown';

    public function label(): string
    {
        return match ($this) {
            self::EMPLOYED => 'Employed',
            self::UNEMPLOYED => 'Unemployed',
            self::UNKNOWN => 'Unknown',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
