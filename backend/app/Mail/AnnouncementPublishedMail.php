<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent to alumni when an announcement is published (bulk email-on-publish).
 * Distinct from the legacy App\Mail\AnnouncementMail.
 */
class AnnouncementPublishedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @param  string       $recipientName      Recipient's display name.
     * @param  string       $announcementTitle  Announcement headline.
     * @param  string       $announcementBody   Announcement content (plain text).
     * @param  string|null  $actionUrl          Optional link to view the announcement.
     */
    public function __construct(
        public string $recipientName,
        public string $announcementTitle,
        public string $announcementBody,
        public ?string $actionUrl = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Announcement: ' . $this->announcementTitle,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.announcement-published',
        );
    }
}
