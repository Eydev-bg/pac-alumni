<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent when an administrator initiates a password reset for a user account.
 *
 * Mirrors the public ResetPasswordMail token flow — the plain token lives only
 * in the emailed link; the hashed copy lives in the database. This replaces the
 * previous behaviour of returning a plaintext temporary password in the API.
 */
class AdminResetPasswordMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $resetUrl;

    /**
     * @param  string  $userName  Recipient's display name.
     * @param  string  $email     Recipient email (embedded in the reset link).
     * @param  string  $token     Plain reset token (the hashed copy lives in DB).
     */
    public function __construct(
        public string $userName,
        public string $email,
        public string $token,
    ) {
        $base = rtrim(config('app.frontend_url'), '/');
        $this->resetUrl = $base . '/reset-password/' . $token . '?email=' . urlencode($email);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Password Reset Requested by Administrator',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.admin-reset-password',
        );
    }
}
