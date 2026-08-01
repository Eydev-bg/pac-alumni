<?php

namespace App\Services\Auth;

use App\Mail\VerifyEmailMail;
use App\Models\EmailVerificationToken;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Owns the one-time email-verification token lifecycle.
 *
 * Mirrors PasswordResetService: only the hash of the token is persisted,
 * the plain token travels in the email, and any previous token for the
 * same email is invalidated whenever a fresh one is issued.
 */
class EmailVerificationService
{
    // Plain token length (the hashed copy is what we store).
    private const TOKEN_LENGTH = 64;

    /**
     * Send (or re-send) a verification email to the given user.
     */
    public function sendVerificationEmail(User $user): void
    {
        $token = $this->createToken($user->email);

        Mail::to($user->email)->queue(
            new VerifyEmailMail($user->full_name, $user->email, $token)
        );
    }

    /**
     * Resend a verification email for a given address.
     *
     * SECURITY: Callers should always show a generic "check your email"
     * message regardless of the boolean returned here, so this endpoint
     * cannot be used to enumerate registered emails or verification status.
     *
     * @return bool  True only when an email was actually queued.
     */
    public function resend(string $email): bool
    {
        $user = User::where('email', $email)->first();

        if (!$user || $user->email_verified_at !== null) {
            return false;
        }

        $this->sendVerificationEmail($user);

        return true;
    }

    /**
     * Verify a user's email using the token from the verification link.
     *
     * @throws \App\Exceptions\DomainException
     */
    public function verify(string $email, string $token): User
    {
        $record = EmailVerificationToken::where('email', $email)
            ->latest('created_at')
            ->first();

        if (!$record || !Hash::check($token, $record->token)) {
            throw \App\Exceptions\DomainException::unprocessable('Invalid or expired verification link.');
        }

        if ($record->isExpired()) {
            $record->delete();
            throw \App\Exceptions\DomainException::unprocessable('Verification link has expired. Please request a new one.');
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            throw \App\Exceptions\DomainException::notFound('Account not found.');
        }

        if ($user->email_verified_at === null) {
            $user->update(['email_verified_at' => now()]);
        }

        // Delete every outstanding token for this email (not just the one used).
        EmailVerificationToken::where('email', $email)->delete();

        return $user;
    }

    /**
     * Replace any existing token for the email with a fresh single-use token.
     * Returns the plain token so the caller can embed it in the outgoing email.
     */
    private function createToken(string $email): string
    {
        EmailVerificationToken::where('email', $email)->delete();

        $token = Str::random(self::TOKEN_LENGTH);

        EmailVerificationToken::create([
            'email' => $email,
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        return $token;
    }
}
