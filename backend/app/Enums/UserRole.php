<?php

namespace App\Enums;

enum UserRole: string
{
    case ADMIN = 'admin';
    case ALUMNI = 'alumni';

    /**
     * Get human-readable label.
     */
    public function label(): string
    {
        return match ($this) {
            self::ADMIN => 'Administrator',
            self::ALUMNI => 'Alumni',
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
     * see StoreUserRequest/UserService).
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
