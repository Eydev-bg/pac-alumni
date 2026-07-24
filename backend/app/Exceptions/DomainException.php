<?php

namespace App\Exceptions;

/**
 * Base for expected, user-facing service-layer failures.
 *
 * Only exceptions of this type may have their message and status code
 * surfaced to the client. Every other Throwable falls through to the
 * handler in bootstrap/app.php, which redacts messages in production.
 */
class DomainException extends \Exception
{
    public function __construct(
        string $message,
        protected int $status = 400,
    ) {
        // Pass the status through as the exception code too, so the few
        // controllers that deliberately keep a catch block and read
        // getCode() (AuthController::login, RegistrationController::verify)
        // continue to map the correct HTTP status.
        parent::__construct($message, $status);
    }

    public function status(): int
    {
        return $this->status;
    }

    public static function notFound(string $message): self
    {
        return new self($message, 404);
    }

    public static function forbidden(string $message): self
    {
        return new self($message, 403);
    }

    public static function unprocessable(string $message): self
    {
        return new self($message, 422);
    }
}
