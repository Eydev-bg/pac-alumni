<?php

namespace App\Enums;

enum RsvpStatus: string
{
    case GOING = 'going';
    case INTERESTED = 'interested';

    public function label(): string
    {
        return match ($this) {
            self::GOING => 'Going',
            self::INTERESTED => 'Interested',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
