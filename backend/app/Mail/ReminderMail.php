<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Base mailable for automated re-engagement reminders (Phase 4).
 * Used by the scheduled reminder commands (login, employment, profile).
 */
class ReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @param  string       $recipientName  Recipient's display name.
     * @param  string       $subjectLine    Email subject.
     * @param  string       $bodyMessage    Reminder message (plain text).
     * @param  string|null  $actionUrl      Optional call-to-action link.
     * @param  string       $actionLabel    Label for the call-to-action button.
     */
    public function __construct(
        public string $recipientName,
        public string $subjectLine,
        public string $bodyMessage,
        public ?string $actionUrl = null,
        public string $actionLabel = 'Visit the Alumni Portal',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectLine,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.reminder',
        );
    }
}
