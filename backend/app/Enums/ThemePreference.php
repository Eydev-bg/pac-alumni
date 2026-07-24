<?php

namespace App\Enums;

enum ThemePreference: string
{
    case LIGHT  = 'light';
    case DARK   = 'dark';
    case SYSTEM = 'system';

    public function label(): string
    {
        return match ($this) {
            self::LIGHT  => 'Light',
            self::DARK   => 'Dark',
            self::SYSTEM => 'System',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
