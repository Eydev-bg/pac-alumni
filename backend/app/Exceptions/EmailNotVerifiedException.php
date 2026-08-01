<?php

namespace App\Exceptions;

/**
 * Thrown by AuthService::login() when the account's email address has not
 * yet been verified. Kept as a distinct subclass (rather than a generic
 * DomainException::forbidden()) so AuthController can attach a machine
 * readable `errors.code` to the response — the frontend uses this to show
 * a "Resend verification email" action instead of a plain error message.
 */
class EmailNotVerifiedException extends DomainException
{
    public function __construct(string $message = 'Please verify your email address before logging in.')
    {
        parent::__construct($message, 403);
    }
}
