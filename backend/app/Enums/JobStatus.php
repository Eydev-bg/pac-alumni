<?php

namespace App\Enums;

enum JobStatus: string
{
    case DRAFT = 'draft';
    case ACTIVE = 'active';
    case EXPIRED = 'expired';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::ACTIVE => 'Active',
            self::EXPIRED => 'Expired',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
