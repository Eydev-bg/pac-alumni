<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent to alumni when an event is published (bulk email-on-publish).
 */
class EventPublishedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @param  string       $recipientName  Recipient's display name.
     * @param  string       $eventTitle     Event headline.
     * @param  string       $eventBody      Event description (plain text, HTML already stripped).
     * @param  string       $eventLocation  Where the event takes place.
     * @param  string       $startDatetime  Event start, already formatted for display.
     * @param  string|null  $actionUrl      Optional link to view the event.
     */
    public function __construct(
        public string $recipientName,
        public string $eventTitle,
        public string $eventBody,
        public string $eventLocation,
        public string $startDatetime,
        public ?string $actionUrl = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Event: ' . $this->eventTitle,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.event-published',
        );
    }
}
