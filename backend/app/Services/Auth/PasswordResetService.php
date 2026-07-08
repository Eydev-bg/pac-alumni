<?php

namespace App\Services\Auth;

use App\Mail\AdminResetPasswordMail;
use App\Mail\ResetPasswordMail;
use App\Models\PasswordReset;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Owns the one-time password-reset token lifecycle.
 *
 * Both the public "forgot password" flow and the admin-initiated reset flow
 * funnel through here so token generation/storage lives in exactly one place.
 * Only the hash of the token is persisted; the plain token travels in the email.
 */
class PasswordResetService
{
    // Plain token length (the hashed copy is what we store).
    private const TOKEN_LENGTH = 64;

    /**
     * User-initiated reset (public "forgot password").
     */
    public function sendResetLink(User $user): void
    {
        $token = $this->createToken($user->email);

        Mail::to($user->email)->queue(
            new ResetPasswordMail($user->full_name, $user->email, $token)
        );
    }

    /**
     * Admin-initiated reset — emails a one-time link instead of exposing a
     * plaintext temporary password in the API response.
     */
    public function sendAdminResetLink(User $user): void
    {
        $token = $this->createToken($user->email);

        Mail::to($user->email)->queue(
            new AdminResetPasswordMail($user->full_name, $user->email, $token)
        );
    }

    /**
     * Replace any existing token for the email with a fresh single-use token.
     * Returns the plain token so the caller can embed it in the outgoing email.
     */
    private function createToken(string $email): string
    {
        PasswordReset::where('email', $email)->delete();

        $token = Str::random(self::TOKEN_LENGTH);

        PasswordReset::create([
            'email' => $email,
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        return $token;
    }
}
