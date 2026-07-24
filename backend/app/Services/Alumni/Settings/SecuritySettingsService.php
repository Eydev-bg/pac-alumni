<?php

namespace App\Services\Alumni\Settings;

use App\Enums\AuditAction;
use App\Models\User;
use App\Services\Audit\AuditLogService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

/**
 * Alumni self-service security settings — currently just change-password.
 */
class SecuritySettingsService
{
    public function __construct(
        protected AuditLogService $auditLog,
    ) {}

    /**
     * Change the authenticated alumni's password and return a fresh token.
     *
     * @throws ValidationException 422 (keyed to current_password) if the
     *         supplied current password is wrong.
     */
    public function changePassword(User $user, string $currentPassword, string $newPassword): array
    {
        // ─── Step 1: Verify the current password ─────────────
        if (!Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        return DB::transaction(function () use ($user, $newPassword) {
            // ─── Step 2: Persist the new password ────────────
            // The User model's 'password' => 'hashed' cast hashes on set —
            // calling Hash::make() here would double-hash.
            $user->update(['password' => $newPassword]);

            // ─── Step 3: Audit-log — NEVER any password metadata ──
            $this->auditLog->record(AuditAction::SETTINGS_PASSWORD_CHANGED, $user);

            // ─── Step 4: Issue a fresh token ─────────────────
            // Changing the password rotates the user's password fingerprint,
            // which EnsureTokenPasswordIsCurrent uses to reject every
            // previously-issued JWT. Without a fresh token the user would log
            // themselves out. Mirrors AuthController::changePassword.
            $token = JWTAuth::fromUser($user);

            return [
                'token' => $token,
                'token_type' => 'bearer',
                'expires_in' => JWTAuth::factory()->getTTL() * 60,
            ];
        });
    }
}
