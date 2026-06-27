<?php

namespace App\Enums;

enum BlacklistIdentifierType: string
{
    case IP = 'ip';
    case ALUMNI_ID = 'alumni_id';

    public function label(): string
    {
        return match ($this) {
            self::IP => 'IP Address',
            self::ALUMNI_ID => 'Alumni ID',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
