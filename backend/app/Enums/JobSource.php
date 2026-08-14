<?php

namespace App\Enums;

/**
 * Who authored a job posting. Admin-posted jobs are the historical default;
 * alumni-posted jobs go live immediately (alumni are verified against the
 * master graduate list at registration) but auto-expire after 60 days when
 * no explicit deadline was set.
 */
enum JobSource: string
{
    case ADMIN = 'admin';
    case ALUMNI = 'alumni';

    /** Days an alumni-posted job stays visible when it has no deadline. */
    public const ALUMNI_AUTO_EXPIRE_DAYS = 60;

    /** Maximum active postings a single alumni may have at once. */
    public const ALUMNI_MAX_ACTIVE_POSTS = 3;

    public function label(): string
    {
        return match ($this) {
            self::ADMIN => 'Admin',
            self::ALUMNI => 'Alumni',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
