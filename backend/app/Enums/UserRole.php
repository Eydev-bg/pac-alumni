<?php

namespace App\Enums;

enum UserRole: string
{
    case ADMIN = 'admin';
    case ALUMNI = 'alumni';
    case EMPLOYER = 'employer';

    /**
     * Get human-readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::ADMIN => 'Administrator',
            self::ALUMNI => 'Alumni',
            self::EMPLOYER => 'Employer',
        };
    }

    /**
     * Get all values as array (for validation rules).
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Roles an admin may directly assign when creating/updating users.
     *
     * Excludes ADMIN (cannot create another admin through the user endpoint —
     * see StoreUserRequest/UserService) and EMPLOYER (self-registers through the
     * employer flow, which also creates a paired Employer record).
     */
    public static function assignableByAdmin(): array
    {
        return [self::ALUMNI->value];
    }

    /**
     * Check if role is a staff role (admin only).
     */
    public function isStaff(): bool
    {
        return $this === self::ADMIN;
    }
}
