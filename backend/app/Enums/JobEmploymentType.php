<?php

namespace App\Enums;

enum JobEmploymentType: string
{
    case FULL_TIME = 'full_time';
    case PART_TIME = 'part_time';
    case CONTRACT = 'contract';
    case INTERNSHIP = 'internship';
    case REMOTE = 'remote';

    public function label(): string
    {
        return match ($this) {
            self::FULL_TIME => 'Full-time',
            self::PART_TIME => 'Part-time',
            self::CONTRACT => 'Contract',
            self::INTERNSHIP => 'Internship',
            self::REMOTE => 'Remote',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
