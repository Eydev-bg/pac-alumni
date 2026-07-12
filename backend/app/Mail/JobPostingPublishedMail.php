<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent to alumni when a job posting is published (bulk email-on-publish).
 */
class JobPostingPublishedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @param  string       $recipientName   Recipient's display name.
     * @param  string       $jobPosition     Position / job title.
     * @param  string       $companyName     Hiring company.
     * @param  string       $jobLocation     Where the job is based.
     * @param  string       $employmentType  Employment type label (plain string).
     * @param  string|null  $actionUrl       Optional link to view the job posting.
     */
    public function __construct(
        public string $recipientName,
        public string $jobPosition,
        public string $companyName,
        public string $jobLocation,
        public string $employmentType,
        public ?string $actionUrl = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Job Opportunity: ' . $this->jobPosition . ' at ' . $this->companyName,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.job-posting-published',
        );
    }
}
