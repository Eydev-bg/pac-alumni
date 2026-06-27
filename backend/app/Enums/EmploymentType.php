<?php

namespace App\Enums;

enum EmploymentType: string
{
    case LOCAL = 'local';
    case INTERNATIONAL = 'international';
    case SELF_EMPLOYED = 'self_employed';

    public function label(): string
    {
        return match ($this) {
            self::LOCAL => 'Local',
            self::INTERNATIONAL => 'International',
            self::SELF_EMPLOYED => 'Self-employed',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
