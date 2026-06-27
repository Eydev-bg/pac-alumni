<?php

namespace App\Enums;

enum EducationLevel: string
{
    case ELEMENTARY = 'elementary';
    case JHS = 'jhs';
    case SHS = 'shs';
    case COLLEGE = 'college';

    public function label(): string
    {
        return match ($this) {
            self::ELEMENTARY => 'Elementary',
            self::JHS => 'Junior High School',
            self::SHS => 'Senior High School',
            self::COLLEGE => 'College',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get the next education level (for continuation tracking).
     */
    public function nextLevel(): ?self
    {
        return match ($this) {
            self::ELEMENTARY => self::JHS,
            self::JHS => self::SHS,
            self::SHS => self::COLLEGE,
            self::COLLEGE => null,
        };
    }
}
