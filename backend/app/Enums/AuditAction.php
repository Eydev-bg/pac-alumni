<?php

namespace App\Enums;

/**
 * Privileged / destructive admin actions that are recorded in the audit log.
 *
 * Centralising the action identifiers here keeps them out of the call sites
 * (no hardcoded strings) and gives every consumer a single source of truth.
 */
enum AuditAction: string
{
    // ─── User management ─────────────────────────────────────
    case USER_CREATED = 'user.created';
    case USER_UPDATED = 'user.updated';
    case USER_STATUS_CHANGED = 'user.status_changed';
    case USER_PASSWORD_RESET = 'user.password_reset';

    // ─── Graduate records ────────────────────────────────────
    case GRADUATE_DELETED = 'graduate.deleted';
    case GRADUATE_RESTORED = 'graduate.restored';
    case GRADUATE_FORCE_DELETED = 'graduate.force_deleted';
    case GRADUATE_BATCH_UPDATED = 'graduate.batch_updated';

    // ─── Registration blacklist ──────────────────────────────
    case BLACKLIST_ADDED = 'blacklist.added';
    case BLACKLIST_REMOVED = 'blacklist.removed';

    // ─── System settings ─────────────────────────────────────
    case MAINTENANCE_MODE_TOGGLED = 'maintenance.toggled';

    // ─── Alumni self-service settings ────────────────────────
    case SETTINGS_PASSWORD_CHANGED = 'settings.password_changed';
    case SETTINGS_APPEARANCE_UPDATED = 'settings.appearance_updated';

    public function label(): string
    {
        return match ($this) {
            self::USER_CREATED => 'User created',
            self::USER_UPDATED => 'User updated',
            self::USER_STATUS_CHANGED => 'User status changed',
            self::USER_PASSWORD_RESET => 'User password reset',
            self::GRADUATE_DELETED => 'Graduate deleted',
            self::GRADUATE_RESTORED => 'Graduate restored',
            self::GRADUATE_FORCE_DELETED => 'Graduate permanently deleted',
            self::GRADUATE_BATCH_UPDATED => 'Graduates batch updated',
            self::BLACKLIST_ADDED => 'Added to blacklist',
            self::BLACKLIST_REMOVED => 'Removed from blacklist',
            self::MAINTENANCE_MODE_TOGGLED => 'Maintenance mode toggled',
            self::SETTINGS_PASSWORD_CHANGED => 'Password changed',
            self::SETTINGS_APPEARANCE_UPDATED => 'Appearance updated',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
