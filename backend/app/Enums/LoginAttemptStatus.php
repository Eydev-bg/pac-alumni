<?php

namespace App\Enums;

enum LoginAttemptStatus: string
{
    case SUCCESS = 'success';
    case FAILED = 'failed';
    case BLOCKED = 'blocked';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
